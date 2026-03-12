#!/usr/bin/env node
/**
 * Script de prueba para la Edge Function de auto-closures
 *
 * Uso:
 *   npx ts-node scripts/test-auto-closures.ts [--verbose]
 *
 * Este script invoca la Edge Function manualmente para probar su funcionamiento
 */

import { config } from 'dotenv';

config();

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Se requieren las variables de entorno:');
  console.error('   - VITE_SUPABASE_URL o SUPABASE_URL');
  console.error('   - SUPABASE_ANON_KEY o VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function testEdgeFunction() {
  console.log('🧪 Probando Edge Function: auto-closures\n');
  console.log(`🌐 URL: ${supabaseUrl}`);
  console.log('🔧 Entorno: development\n');

  const startTime = Date.now();

  try {
    // Invocar la Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/auto-closures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ Error HTTP ${response.status}:`);
      console.error(errorText);
      process.exit(1);
    }

    const result = await response.json();

    console.log('✅ Edge Function ejecutada exitosamente\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 RESULTADOS');
    console.log('═══════════════════════════════════════\n');

    // Mostrar resultados
    console.log('🔍 Evaluación de Alertas:');
    console.log(`   • Siniestros evaluados: ${result.result.alerts.evaluated}`);
    console.log(`   • Alertas actualizadas: ${result.result.alerts.updated}`);
    console.log(`   • Errores: ${result.result.alerts.errors}`);

    console.log('\n🔒 Cierres por Prescripción:');
    console.log(`   • Procesados: ${result.result.prescriptionClosures.processed}`);
    console.log(`   • Cerrados automáticamente: ${result.result.prescriptionClosures.autoClosed}`);
    console.log(
      `   • Pendientes de aprobación: ${result.result.prescriptionClosures.pendingApproval}`
    );
    console.log(`   • Errores: ${result.result.prescriptionClosures.errors}`);

    console.log('\n⚖️  Estancamiento Jurídico:');
    console.log(`   • Procesados: ${result.result.legalStagnation.processed}`);
    console.log(`   • Alertas generadas: ${result.result.legalStagnation.warnings}`);
    console.log(`   • Cerrados por estancamiento: ${result.result.legalStagnation.autoClosed}`);
    console.log(`   • Errores: ${result.result.legalStagnation.errors}`);

    console.log('\n📧 Notificaciones:');
    console.log(`   • Alertas críticas enviadas: ${result.result.emails.criticalAlertsSent}`);
    console.log(`   • Resúmenes diarios enviados: ${result.result.emails.digestsSent}`);
    console.log(`   • Errores: ${result.result.emails.errors}`);

    console.log(`\n⏱️  Duración: ${result.result.duration}ms`);
    console.log(`📅 Timestamp: ${result.result.timestamp}`);

    // Verificar si hay errores
    const totalErrors =
      result.result.alerts.errors +
      result.result.prescriptionClosures.errors +
      result.result.legalStagnation.errors +
      result.result.emails.errors;

    if (totalErrors > 0) {
      console.log(`\n⚠️  Se encontraron ${totalErrors} errores durante el procesamiento`);
    } else {
      console.log('\n✅ Sin errores durante el procesamiento');
    }

    // Mostrar logs detallados si se solicitó
    if (verbose) {
      console.log('\n═══════════════════════════════════════');
      console.log('📝 RESPUESTA COMPLETA');
      console.log('═══════════════════════════════════════\n');
      console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n✨ Prueba completada exitosamente');
  } catch (error) {
    console.error('\n❌ Error ejecutando la prueba:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Ejecutar prueba
testEdgeFunction();
