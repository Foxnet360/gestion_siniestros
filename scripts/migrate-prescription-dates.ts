#!/usr/bin/env node
/**
 * Script de migración para calcular fechas de prescripción de siniestros existentes
 *
 * Uso:
 *   npx ts-node scripts/migrate-prescription-dates.ts [--dry-run] [--batch-size=100]
 *
 * Opciones:
 *   --dry-run: Simula la migración sin modificar datos
 *   --batch-size: Número de siniestros a procesar por lote (default: 100)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Error: Se requieren las variables de entorno VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationResult {
  processed: number;
  updated: number;
  errors: number;
  skipped: number;
  batches: number;
}

interface ClaimBatch {
  id: string;
  fecha_ocurrencia: string | null;
  ramo: string;
  fecha_prescripcion_ordinaria: string | null;
  fecha_prescripcion_extraordinaria: string | null;
}

async function migratePrescriptionDates(options: {
  dryRun: boolean;
  batchSize: number;
}): Promise<MigrationResult> {
  console.log(`🚀 Iniciando migración de fechas de prescripción...`);
  console.log(`   Modo: ${options.dryRun ? 'SIMULACIÓN (dry-run)' : 'PRODUCCIÓN'}`);
  console.log(`   Tamaño de lote: ${options.batchSize}`);
  console.log();

  const result: MigrationResult = {
    processed: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
    batches: 0,
  };

  let hasMore = true;
  let lastId: string | null = null;

  while (hasMore) {
    result.batches++;

    // Query claims without prescription dates or with fecha_ocurrencia
    let query = supabase
      .from('claims')
      .select(
        'id, fecha_ocurrencia, ramo, fecha_prescripcion_ordinaria, fecha_prescripcion_extraordinaria'
      )
      .not('fecha_ocurrencia', 'is', null)
      .order('id')
      .limit(options.batchSize);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data: claims, error } = await query;

    if (error) {
      console.error(`❌ Error al obtener siniestros: ${error.message}`);
      result.errors++;
      break;
    }

    if (!claims || claims.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`📦 Procesando lote ${result.batches} (${claims.length} siniestros)...`);

    for (const claim of claims as ClaimBatch[]) {
      result.processed++;
      lastId = claim.id;

      try {
        // Check if already has prescription dates
        if (
          claim.fecha_prescripcion_ordinaria &&
          (claim.ramo !== 'Responsabilidad Civil' || claim.fecha_prescripcion_extraordinaria)
        ) {
          result.skipped++;
          continue;
        }

        if (options.dryRun) {
          // Simulate calculation
          const fechaOcurrencia = new Date(claim.fecha_ocurrencia!);
          const ordinaria = new Date(fechaOcurrencia);
          ordinaria.setFullYear(ordinaria.getFullYear() + 2);

          let extraordinaria: Date | null = null;
          if (claim.ramo === 'Responsabilidad Civil') {
            extraordinaria = new Date(fechaOcurrencia);
            extraordinaria.setFullYear(extraordinaria.getFullYear() + 5);
          }

          console.log(`   [DRY-RUN] ${claim.id}: ${claim.ramo}`);
          console.log(`             Ordinaria: ${ordinaria.toISOString().split('T')[0]}`);
          if (extraordinaria) {
            console.log(
              `             Extraordinaria: ${extraordinaria.toISOString().split('T')[0]}`
            );
          }
          result.updated++;
        } else {
          // Call database function to update
          const { error: updateError } = await supabase.rpc('update_claim_prescription_dates', {
            claim_id: claim.id,
          });

          if (updateError) {
            console.error(`   ❌ Error actualizando ${claim.id}: ${updateError.message}`);
            result.errors++;
          } else {
            result.updated++;
          }
        }
      } catch (err) {
        console.error(
          `   ❌ Error procesando ${claim.id}: ${err instanceof Error ? err.message : 'Error desconocido'}`
        );
        result.errors++;
      }
    }

    // Progress report every 5 batches
    if (result.batches % 5 === 0) {
      console.log();
      console.log(
        `📊 Progreso: ${result.processed} procesados, ${result.updated} actualizados, ${result.errors} errores`
      );
      console.log();
    }
  }

  return result;
}

async function validateMigration(): Promise<void> {
  console.log('\n🔍 Validando migración...\n');

  // Count claims with fecha_ocurrencia but without prescription dates
  const { data: missingOrdinaria, error: error1 } = await supabase
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .not('fecha_ocurrencia', 'is', null)
    .is('fecha_prescripcion_ordinaria', null);

  const { data: missingExtraordinaria, error: error2 } = await supabase
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .eq('ramo', 'Responsabilidad Civil')
    .not('fecha_ocurrencia', 'is', null)
    .is('fecha_prescripcion_extraordinaria', null);

  if (error1 || error2) {
    console.error('❌ Error en validación:', error1?.message || error2?.message);
    return;
  }

  console.log(
    `   Siniestros SIN fecha_prescripcion_ordinaria: ${missingOrdinaria?.length ?? 'Error'}`
  );
  console.log(
    `   Siniestros RC SIN fecha_prescripcion_extraordinaria: ${missingExtraordinaria?.length ?? 'Error'}`
  );

  if ((missingOrdinaria?.length ?? 0) === 0 && (missingExtraordinaria?.length ?? 0) === 0) {
    console.log('   ✅ Todas las fechas de prescripción han sido calculadas');
  } else {
    console.log('   ⚠️  Algunos siniestros aún no tienen fechas calculadas');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN DE FECHAS DE PRESCRIPCIÓN                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();

  const startTime = Date.now();

  try {
    const result = await migratePrescriptionDates({ dryRun, batchSize });

    await validateMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN DE MIGRACIÓN                                 ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(
      `║  Total procesados:     ${result.processed.toString().padStart(6)}                    ║`
    );
    console.log(
      `║  Actualizados:         ${result.updated.toString().padStart(6)}                    ║`
    );
    console.log(
      `║  Omitidos (ya tenían): ${result.skipped.toString().padStart(6)}                    ║`
    );
    console.log(
      `║  Errores:              ${result.errors.toString().padStart(6)}                    ║`
    );
    console.log(
      `║  Lotes procesados:     ${result.batches.toString().padStart(6)}                    ║`
    );
    console.log(`║  Duración:             ${duration.padStart(6)}s                   ║`);
    console.log('╚════════════════════════════════════════════════════════╝');

    if (result.errors > 0) {
      console.log('\n⚠️  Hubo errores durante la migración. Revisa los logs arriba.');
      process.exit(1);
    }

    if (dryRun) {
      console.log('\n✅ Simulación completada. Usa sin --dry-run para ejecutar realmente.');
    } else {
      console.log('\n✅ Migración completada exitosamente.');
    }
  } catch (err) {
    console.error('\n❌ Error fatal:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
