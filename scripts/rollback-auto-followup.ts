#!/usr/bin/env node
/**
 * Script de rollback para la migración de cálculo automático
 *
 * Uso:
 *   npx ts-node scripts/rollback-auto-followup.ts [--confirm]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Se requieren VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function rollbackMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ROLLBACK - SISTEMA DE CÁLCULO AUTOMÁTICO            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  console.log('⚠️  ADVERTENCIA: Este script revertirá:');
  console.log('   - Fechas de prescripción calculadas');
  console.log('   - Niveles de alerta asignados');
  console.log();

  try {
    // 1. Limpiar fechas de prescripción
    console.log('📋 Paso 1: Limpiando fechas de prescripción...');
    const { data: prescriptionResult, error: prescriptionError } = await supabase
      .from('claims')
      .update({
        fecha_prescripcion_ordinaria: null,
        fecha_prescripcion_extraordinaria: null,
      })
      .not('fecha_prescripcion_ordinaria', 'is', null);

    if (prescriptionError) throw prescriptionError;
    console.log('   ✅ Fechas de prescripción limpiadas');

    // 2. Resetear alertas a normal
    console.log('📋 Paso 2: Reseteando niveles de alerta...');
    const { data: alertResult, error: alertError } = await supabase
      .from('claims')
      .update({ alert_level: 'normal' })
      .not('alert_level', 'eq', 'normal');

    if (alertError) throw alertError;
    console.log('   ✅ Niveles de alerta reseteados');

    // 3. Limpiar reportes de migración
    console.log('📋 Paso 3: Limpiando reportes de migración...');
    const { error: reportError } = await supabase
      .from('migration_reports')
      .delete()
      .eq('migration_type', 'AUTO_FOLLOWUP');

    if (reportError) throw reportError;
    console.log('   ✅ Reportes de migración eliminados');

    console.log('\n✅ Rollback completado exitosamente');
    console.log('\nNota: Los cambios manuales realizados después de la migración');
    console.log('      no se verán afectados por este rollback.\n');
  } catch (err) {
    console.error('\n❌ Error durante el rollback:', err);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');

  if (!confirm) {
    console.log('⚠️  Para ejecutar el rollback, use:');
    console.log('   npx ts-node scripts/rollback-auto-followup.ts --confirm\n');
    process.exit(0);
  }

  await rollbackMigration();
}

main();
