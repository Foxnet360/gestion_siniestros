#!/usr/bin/env node
/**
 * Script de migración para el sistema de cálculo automático de seguimiento
 *
 * Este script calcula:
 * 1. Fechas de prescripción para siniestros existentes
 * 2. Inicializa niveles de alerta
 *
 * Uso:
 *   npx ts-node scripts/migrate-auto-followup.ts [--dry-run] [--batch-size=100]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { addYears, differenceInDays } from 'date-fns';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Error: Se requieren las variables de entorno VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MigrationResult {
  prescriptions: {
    processed: number;
    withOrdinary: number;
    withExtraordinary: number;
    errors: number;
  };
  alerts: {
    evaluated: number;
    warning: number;
    critical: number;
    normal: number;
    errors: number;
  };
  duration: number;
}

async function migrateAutoFollowUp(options: {
  dryRun: boolean;
  batchSize: number;
}): Promise<MigrationResult> {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN - SISTEMA DE CÁLCULO AUTOMÁTICO            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-CO')}`);
  console.log(`🔧 Modo: ${options.dryRun ? 'SIMULACIÓN (dry-run)' : 'PRODUCCIÓN'}`);
  console.log(`📦 Tamaño de lote: ${options.batchSize}`);
  console.log();

  const startTime = Date.now();

  const result: MigrationResult = {
    prescriptions: { processed: 0, withOrdinary: 0, withExtraordinary: 0, errors: 0 },
    alerts: { evaluated: 0, warning: 0, critical: 0, normal: 0, errors: 0 },
    duration: 0,
  };

  try {
    // Paso 1: Calcular prescripciones
    console.log('📋 PASO 1: Calculando fechas de prescripción...\n');
    result.prescriptions = await migratePrescriptions(options);

    // Paso 2: Inicializar alertas
    console.log('\n📋 PASO 2: Inicializando niveles de alerta...\n');
    result.alerts = await initializeAlerts(options);

    result.duration = Date.now() - startTime;

    // Generar reporte
    await generateReport(result, options.dryRun);

    return result;
  } catch (err) {
    console.error('\n❌ Error fatal:', err);
    throw err;
  }
}

async function migratePrescriptions(options: { dryRun: boolean; batchSize: number }) {
  let processed = 0,
    withOrdinary = 0,
    withExtraordinary = 0,
    errors = 0;
  let hasMore = true,
    lastId: string | null = null,
    batchCount = 0;

  const extraordinaryRamos = ['Responsabilidad Civil'];

  while (hasMore) {
    batchCount++;

    let query = supabase
      .from('claims')
      .select('id_softseguros, fecha_ocurrencia, ramo')
      .not('fecha_ocurrencia', 'is', null)
      .order('id_softseguros')
      .limit(options.batchSize);

    if (lastId) query = query.gt('id_softseguros', lastId);

    const { data: claims, error } = await query;

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
      break;
    }

    if (!claims || claims.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`   📦 Lote ${batchCount}: ${claims.length} siniestros...`);

    for (const claim of claims) {
      try {
        lastId = claim.id_softseguros;
        processed++;

        if (!claim.fecha_ocurrencia) continue;

        const fechaOcurrencia = new Date(claim.fecha_ocurrencia);
        const fechaOrdinaria = addYears(fechaOcurrencia, 2);

        const isExtraordinary = extraordinaryRamos.some(r =>
          claim.ramo?.toLowerCase().includes(r.toLowerCase())
        );

        const fechaExtraordinaria = isExtraordinary ? addYears(fechaOcurrencia, 5) : null;

        if (options.dryRun) {
          if (fechaExtraordinaria) withExtraordinary++;
          else withOrdinary++;
        } else {
          const updateData: any = { fecha_prescripcion_ordinaria: fechaOrdinaria.toISOString() };
          if (fechaExtraordinaria) {
            updateData.fecha_prescripcion_extraordinaria = fechaExtraordinaria.toISOString();
            withExtraordinary++;
          } else {
            withOrdinary++;
          }

          const { error: updateError } = await supabase
            .from('claims')
            .update(updateData)
            .eq('id_softseguros', claim.id_softseguros);

          if (updateError) {
            console.error(`      ❌ Error ${claim.id_softseguros}: ${updateError.message}`);
            errors++;
          }
        }
      } catch (err) {
        console.error(`      ❌ Error ${claim.id_softseguros}:`, err);
        errors++;
      }
    }

    if (batchCount % 5 === 0) {
      console.log(
        `   📊 Progreso: ${processed} procesados, ${withOrdinary} ordinarias, ${withExtraordinary} extraordinarias, ${errors} errores`
      );
    }
  }

  console.log(`\n   ✅ Completado: ${processed} siniestros`);
  console.log(`      - Ordinarias: ${withOrdinary}`);
  console.log(`      - Extraordinarias: ${withExtraordinary}`);
  console.log(`      - Errores: ${errors}`);

  return { processed, withOrdinary, withExtraordinary, errors };
}

async function initializeAlerts(options: { dryRun: boolean; batchSize: number }) {
  let evaluated = 0,
    warning = 0,
    critical = 0,
    normal = 0,
    errors = 0;
  let hasMore = true,
    lastId: string | null = null,
    batchCount = 0;
  const today = new Date();

  while (hasMore) {
    batchCount++;

    let query = supabase
      .from('claims')
      .select('*')
      .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO'])
      .order('id_softseguros')
      .limit(options.batchSize);

    if (lastId) query = query.gt('id_softseguros', lastId);

    const { data: claims, error } = await query;

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
      break;
    }

    if (!claims || claims.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`   📦 Lote ${batchCount}: Evaluando ${claims.length} siniestros...`);

    for (const claim of claims) {
      try {
        lastId = claim.id_softseguros;
        evaluated++;

        const prescriptionDate = claim.fecha_prescripcion_extraordinaria
          ? new Date(claim.fecha_prescripcion_extraordinaria)
          : claim.fecha_prescripcion_ordinaria
            ? new Date(claim.fecha_prescripcion_ordinaria)
            : null;

        let alertLevel = 'normal';

        if (prescriptionDate) {
          const daysRemaining = differenceInDays(prescriptionDate, today);

          if (daysRemaining <= 30) {
            alertLevel = 'critical';
            critical++;
          } else if (daysRemaining <= 90) {
            alertLevel = 'warning';
            warning++;
          } else {
            normal++;
          }
        } else {
          normal++;
        }

        if (!options.dryRun) {
          const { error: updateError } = await supabase
            .from('claims')
            .update({ alert_level: alertLevel })
            .eq('id_softseguros', claim.id_softseguros);

          if (updateError) {
            console.error(`      ❌ Error ${claim.id_softseguros}: ${updateError.message}`);
            errors++;
          }
        }
      } catch (err) {
        console.error(`      ❌ Error ${claim.id_softseguros}:`, err);
        errors++;
      }
    }

    if (batchCount % 5 === 0) {
      console.log(
        `   📊 Progreso: ${evaluated} evaluados, ${critical} críticas, ${warning} advertencias`
      );
    }
  }

  console.log(`\n   ✅ Completado: ${evaluated} siniestros`);
  console.log(`      - Críticas: ${critical}`);
  console.log(`      - Advertencias: ${warning}`);
  console.log(`      - Normales: ${normal}`);
  console.log(`      - Errores: ${errors}`);

  return { evaluated, warning, critical, normal, errors };
}

async function generateReport(result: MigrationResult, dryRun: boolean) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  REPORTE DE MIGRACIÓN                                 ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Modo: ${(dryRun ? 'SIMULACIÓN' : 'PRODUCCIÓN').padEnd(46)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  PRESCRIPCIONES                                       ║');
  console.log(`║    Procesados: ${result.prescriptions.processed.toString().padStart(32)} ║`);
  console.log(`║    Ordinarias: ${result.prescriptions.withOrdinary.toString().padStart(32)} ║`);
  console.log(
    `║    Extraordinarias: ${result.prescriptions.withExtraordinary.toString().padStart(27)} ║`
  );
  console.log(`║    Errores: ${result.prescriptions.errors.toString().padStart(35)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  ALERTAS                                              ║');
  console.log(`║    Evaluados: ${result.alerts.evaluated.toString().padStart(33)} ║`);
  console.log(`║    Críticas: ${result.alerts.critical.toString().padStart(34)} ║`);
  console.log(`║    Advertencias: ${result.alerts.warning.toString().padStart(30)} ║`);
  console.log(`║    Normales: ${result.alerts.normal.toString().padStart(33)} ║`);
  console.log(`║    Errores: ${result.alerts.errors.toString().padStart(35)} ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Duración: ${(result.duration / 1000).toFixed(2).padStart(36)}s ║`);
  console.log('╚════════════════════════════════════════════════════════╝');

  if (!dryRun) {
    await supabase.from('migration_reports').insert({
      migration_type: 'AUTO_FOLLOWUP',
      timestamp: new Date().toISOString(),
      prescriptions_processed: result.prescriptions.processed,
      prescriptions_ordinary: result.prescriptions.withOrdinary,
      prescriptions_extraordinary: result.prescriptions.withExtraordinary,
      alerts_evaluated: result.alerts.evaluated,
      alerts_critical: result.alerts.critical,
      alerts_warning: result.alerts.warning,
      alerts_normal: result.alerts.normal,
      total_errors: result.prescriptions.errors + result.alerts.errors,
      duration_ms: result.duration,
    });
    console.log('\n✅ Reporte guardado en base de datos');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100;

  try {
    const result = await migrateAutoFollowUp({ dryRun, batchSize });

    if (dryRun) {
      console.log('\n⚠️  Simulación completada. No se realizaron cambios.');
      console.log('   Ejecute sin --dry-run para aplicar cambios reales.\n');
    } else {
      console.log('\n✅ Migración completada exitosamente.\n');
    }
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migración fallida:', err);
    process.exit(1);
  }
}

main();
