import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { subDays } from 'date-fns';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mapeo de estados internos a números de etapa (1-16)
 * Basado en los estados reales encontrados en la base de datos
 */
function mapearEstadoAEtapa(estado: string | null): number {
  if (!estado) return 0;

  const estadoUpper = estado.toUpperCase().trim();

  const mapeo: { [key: string]: number } = {
    ABIERTO: 1,
    'PRESENTACION FORMAL DE SINIESTRO A ASEGURADORA': 2,
    'PENDIENTE ASEGURADO': 5,
    'PENDIENTE ALIADO': 5,
    'ESTUDIO TECNICO CORREDORES': 6,
    'ESTUDIO TÉCNICO CORREDORES': 6,
    'PENDIENTE CORREDORES': 6,
    'PENDIENTE COMPAÑIA': 7,
    'PROCESO JURÍDICO': 8,
    'DOCUMENTOS ADICIONALES': 9,
    OBJECION: 11,
    OBJECIÓN: 11,
    'RATIFICACION OBJECION': 11,
    'RATIFICACIÓN LIQUIDACIÓN U OBJECIÓN': 11,
    'PAGO DE INDEMNIZACION': 12,
    FINALIZADO: 13,
    PAGADO: 13,
    'PROCESO CERRADO': 13,
    'DESISTIDO POR EL CLIENTE': 10,
    DESISTIMIENTO: 10,
  };

  return mapeo[estadoUpper] || 0;
}

/**
 * Determina si un estado representa un siniestro finalizado
 */
function esEstadoFinal(estado: string | null): boolean {
  if (!estado) return false;
  const estadoUpper = estado.toUpperCase().trim();
  return [
    'FINALIZADO',
    'PAGADO',
    'PROCESO CERRADO',
    'DESISTIDO POR EL CLIENTE',
    'DESISTIMIENTO',
  ].includes(estadoUpper);
}

/**
 * Calcula la fecha estimada de entrada a una etapa
 */
function calcularFechaEtapa(
  etapaNum: number,
  fechaAviso: string | null,
  fechaFinalizacion: string | null,
  esFinalizado: boolean
): string | null {
  if (!fechaAviso) return null;

  const fechaBase = new Date(fechaAviso);

  if (esFinalizado && fechaFinalizacion && etapaNum >= 13) {
    // Para etapas finales, estimar hacia atrás desde fecha_finalizacion
    const diasPorEtapa = 5;
    const etapasDesdeFinal = 16 - etapaNum;
    return subDays(new Date(fechaFinalizacion), etapasDesdeFinal * diasPorEtapa)
      .toISOString()
      .split('T')[0];
  }

  // Estimar desde fecha_aviso hacia adelante
  const diasHastaEtapa = (etapaNum - 1) * 5;
  return subDays(new Date(), diasHastaEtapa).toISOString().split('T')[0];
}

/**
 * Popula la tabla siniestro_etapas basándose en estado_interno
 */
async function popularSiniestroEtapas(
  opciones: {
    limite?: number;
    soloActivos?: boolean;
    batchSize?: number;
  } = {}
) {
  const { limite = 0, soloActivos = false, batchSize = 100 } = opciones;

  console.log('🚀 Iniciando población de siniestro_etapas...');
  console.log(
    `   Opciones: límite=${limite || 'sin límite'}, soloActivos=${soloActivos}, batchSize=${batchSize}`
  );

  // Obtener claims
  let query = supabase.from('claims').select('*');

  if (soloActivos) {
    const estadosFinales = [
      'FINALIZADO',
      'PAGADO',
      'PROCESO CERRADO',
      'DESISTIDO POR EL CLIENTE',
      'DESISTIMIENTO',
    ];
    query = query.not('estado_interno', 'in', `("${estadosFinales.join('","')}")`);
  }

  if (limite > 0) {
    query = query.limit(limite);
  }

  const { data: claims, error: errorClaims } = await query;

  if (errorClaims) {
    console.error('❌ Error obteniendo claims:', errorClaims);
    throw errorClaims;
  }

  console.log(`✅ Obtenidos ${claims?.length || 0} claims`);

  if (!claims || claims.length === 0) {
    console.log('⚠️  No hay claims para procesar');
    return;
  }

  // Estadísticas
  const stats = {
    total: claims.length,
    procesados: 0,
    insertados: 0,
    actualizados: 0,
    errores: 0,
    sinMapeo: 0,
    porEtapa: {} as { [key: number]: number },
  };

  // Procesar en batches
  for (let i = 0; i < claims.length; i += batchSize) {
    const batch = claims.slice(i, i + batchSize);
    console.log(
      `\n📦 Procesando batch ${Math.floor(i / batchSize) + 1} de ${Math.ceil(claims.length / batchSize)} (${batch.length} claims)`
    );

    for (const claim of batch) {
      try {
        const estadoInterno = claim.estado_interno;
        const etapaActual = mapearEstadoAEtapa(estadoInterno);

        if (etapaActual === 0) {
          console.warn(`⚠️  Claim ${claim.id_softseguros}: Estado "${estadoInterno}" no mapeado`);
          stats.sinMapeo++;
          continue;
        }

        const esFinalizado = esEstadoFinal(estadoInterno);
        const fechaAviso = claim.fecha_aviso;
        const fechaFinalizacion = claim.fecha_finalizacion;

        // Calcular fecha para la etapa actual
        const fechaEtapa = calcularFechaEtapa(
          etapaActual,
          fechaAviso,
          fechaFinalizacion,
          esFinalizado
        );

        if (!fechaEtapa) {
          console.warn(`⚠️  Claim ${claim.id_softseguros}: No se pudo calcular fecha`);
          continue;
        }

        // Verificar si ya existe
        const { data: existente } = await supabase
          .from('siniestro_etapas')
          .select('claim_id')
          .eq('claim_id', claim.id_softseguros)
          .maybeSingle();

        const columnName = `etapa_${etapaActual}_fecha`;
        const updateData: any = {
          [columnName]: fechaEtapa,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existente) {
          // Actualizar
          const { error: updateError } = await supabase
            .from('siniestro_etapas')
            .update(updateData)
            .eq('claim_id', claim.id_softseguros);

          if (updateError) {
            console.error(`❌ Error actualizando ${claim.id_softseguros}:`, updateError);
            stats.errores++;
            continue;
          }
          stats.actualizados++;
        } else {
          // Insertar nuevo
          const insertData: any = {
            claim_id: claim.id_softseguros,
            [columnName]: fechaEtapa,
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase.from('siniestro_etapas').insert(insertData);

          if (insertError) {
            console.error(`❌ Error insertando ${claim.id_softseguros}:`, insertError);
            stats.errores++;
            continue;
          }
          stats.insertados++;
        }

        stats.porEtapa[etapaActual] = (stats.porEtapa[etapaActual] || 0) + 1;
      } catch (error) {
        console.error(`❌ Error procesando claim ${claim.id_softseguros}:`, error);
        stats.errores++;
      }
    }

    stats.procesados += batch.length;
    console.log(`✅ Batch completado. Progreso: ${stats.procesados}/${stats.total}`);
  }

  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PROCESAMIENTO');
  console.log('='.repeat(60));
  console.log(`Total claims: ${stats.total}`);
  console.log(`Procesados: ${stats.procesados}`);
  console.log(`Insertados: ${stats.insertados}`);
  console.log(`Actualizados: ${stats.actualizados}`);
  console.log(`Sin mapeo: ${stats.sinMapeo}`);
  console.log(`Errores: ${stats.errores}`);
  console.log('\nDistribución por etapa:');
  Object.entries(stats.porEtapa)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([etapa, count]) => {
      console.log(`  Etapa ${etapa}: ${count} siniestros`);
    });
  console.log('='.repeat(60));
}

// Parsear argumentos
const args = process.argv.slice(2);
const opciones: { limite?: number; soloActivos?: boolean } = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limite' && args[i + 1]) {
    opciones.limite = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--solo-activos') {
    opciones.soloActivos = true;
  } else if (args[i] === '--help') {
    console.log(`
Uso: npx tsx scripts/popular-etapas-desde-estados.ts [opciones]

Opciones:
  --limite N          Procesar solo N claims (útil para pruebas)
  --solo-activos      Procesar solo siniestros no finalizados
  --help              Mostrar esta ayuda

Ejemplos:
  npx tsx scripts/popular-etapas-desde-estados.ts --limite 100
  npx tsx scripts/popular-etapas-desde-estados.ts --solo-activos
  npx tsx scripts/popular-etapas-desde-estados.ts
    `);
    process.exit(0);
  }
}

// Ejecutar
popularSiniestroEtapas(opciones)
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error en el proceso:', error);
    process.exit(1);
  });
