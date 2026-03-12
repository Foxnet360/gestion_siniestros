#!/usr/bin/env node
/**
 * Script de Verificación Completo: Funciones SQL Optimizadas para KPIs
 *
 * Verifica que todas las funciones SQL creadas existen y funcionan correctamente.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    const data = await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
      data,
    });
    log(`✅ ${name}`, 'green');
  } catch (err: any) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: err.message,
    });
    log(`❌ ${name}: ${err.message}`, 'red');
  }
}

async function verifyFunctions() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  VERIFICACIÓN: FUNCIONES SQL OPTIMIZADAS PARA KPIs', 'blue');
  log('═══════════════════════════════════════════════════════════\n', 'blue');

  // Test 1: get_kpi_overview_v2 (sin filtros)
  await runTest('get_kpi_overview_v2 - Sin filtros', async () => {
    const { data, error } = await supabase.rpc('get_kpi_overview_v2');
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Respuesta inválida');

    const required = [
      'leadTimeAvg',
      'tasaDesistimiento',
      'tasaObjetados',
      'tasaPrescritos',
      'porcentajeCerradosPlazo',
      'backlogActivos',
      'totalClaims',
    ];
    const missing = required.filter(f => !(f in data));
    if (missing.length > 0) throw new Error(`Faltan campos: ${missing.join(', ')}`);

    return data;
  });

  // Test 2: get_kpi_overview_v2 (con filtros)
  await runTest('get_kpi_overview_v2 - Con filtros de fecha', async () => {
    const { data, error } = await supabase.rpc('get_kpi_overview_v2', {
      p_fecha_desde: '2024-01-01',
      p_fecha_hasta: '2024-12-31',
    });
    if (error) throw error;
    return data;
  });

  // Test 3: get_kpi_lead_time_v2 (sin percentiles)
  await runTest('get_kpi_lead_time_v2 - Sin percentiles', async () => {
    const { data, error } = await supabase.rpc('get_kpi_lead_time_v2');
    if (error) throw error;
    if (!data || !('average' in data)) throw new Error('Campo average faltante');
    return data;
  });

  // Test 4: get_kpi_lead_time_v2 (con percentiles)
  await runTest('get_kpi_lead_time_v2 - Con percentiles', async () => {
    const { data, error } = await supabase.rpc('get_kpi_lead_time_v2', {
      p_include_percentiles: true,
    });
    if (error) throw error;
    if (!data.percentiles || !('p50' in data.percentiles)) {
      throw new Error('Percentiles no incluidos');
    }
    return data;
  });

  // Test 5: get_kpi_backlog_v2 (básico)
  await runTest('get_kpi_backlog_v2 - Básico', async () => {
    const { data, error } = await supabase.rpc('get_kpi_backlog_v2');
    if (error) throw error;
    if (!data || !('total' in data)) throw new Error('Campo total faltante');
    return data;
  });

  // Test 6: get_kpi_backlog_v2 (con agrupaciones)
  await runTest('get_kpi_backlog_v2 - Con agrupaciones', async () => {
    const { data, error } = await supabase.rpc('get_kpi_backlog_v2', {
      p_group_by_age: true,
      p_group_by_stage: true,
    });
    if (error) throw error;
    if (!data.byAge || !data.byStage) {
      throw new Error('Agrupaciones no incluidas');
    }
    return data;
  });

  // Test de performance
  log('\n' + '═'.repeat(60), 'cyan');
  log('  TEST DE PERFORMANCE', 'cyan');
  log('═'.repeat(60) + '\n', 'cyan');

  const iterations = 10;
  const times: number[] = [];

  log(`Ejecutando ${iterations} iteraciones de get_kpi_overview_v2...`, 'gray');

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await supabase.rpc('get_kpi_overview_v2');
    times.push(Date.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  console.log(`\n   Promedio: ${avg.toFixed(1)}ms`);
  console.log(`   Mínimo:   ${min}ms`);
  console.log(`   Máximo:   ${max}ms`);
  console.log(`   P95:      ${p95}ms`);

  const perfTest = avg < 500;
  results.push({
    name: 'Performance - Promedio < 500ms',
    passed: perfTest,
    duration: avg,
  });

  if (perfTest) {
    log(`\n✅ Performance excelente (${avg.toFixed(0)}ms promedio)`, 'green');
  } else {
    log(`\n⚠️  Performance aceptable (${avg.toFixed(0)}ms promedio)`, 'yellow');
  }

  // Reporte final
  printReport();
}

function printReport() {
  log('\n' + '═'.repeat(60), 'blue');
  log('  REPORTE FINAL', 'blue');
  log('═'.repeat(60) + '\n', 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log('┌──────────────────────────────────────────────┬──────────┬──────────┐');
  console.log('│ Test                                         │ Estado   │ Duración │');
  console.log('├──────────────────────────────────────────────┼──────────┼──────────┤');

  results.forEach(result => {
    const name = result.name.substring(0, 44).padEnd(44);
    const status = (result.passed ? '✅ PASS' : '❌ FAIL').padEnd(8);
    const duration = result.passed ? `${Math.round(result.duration)}ms`.padEnd(8) : 'N/A'.padEnd(8);
    console.log(`│ ${name} │ ${status} │ ${duration} │`);
  });

  console.log('└──────────────────────────────────────────────┴──────────┴──────────┘');

  log(
    `\nTotal: ${total} tests | ${colors.green}✅ ${passed} pasados${colors.reset} | ${failed > 0 ? colors.red : colors.gray}❌ ${failed} fallidos${colors.reset}`,
    'cyan'
  );

  // Detalles de funciones exitosas
  const successResults = results.filter(r => r.passed && r.data);
  if (successResults.length > 0) {
    log('\n' + '─'.repeat(60), 'gray');
    log('  DATOS OBTENIDOS (último test exitoso)', 'gray');
    log('─'.repeat(60) + '\n', 'gray');

    const lastSuccess = successResults[successResults.length - 1];
    console.log(JSON.stringify(lastSuccess.data, null, 2));
  }

  // Recomendaciones
  log('\n' + '═'.repeat(60), failed === 0 ? 'green' : 'yellow');
  log(
    failed === 0 ? '  ✅ TODAS LAS FUNCIONES VERIFICADAS' : '  ⚠️  ALGUNAS FUNCIONES FALLARON',
    failed === 0 ? 'green' : 'yellow'
  );
  log('═'.repeat(60) + '\n', failed === 0 ? 'green' : 'yellow');

  if (failed === 0) {
    log('Próximos pasos:', 'cyan');
    log('  1. Actualizar KpiService.ts para usar funciones SQL', 'cyan');
    log('  2. Implementar tests de carga con k6', 'cyan');
    log('  3. Comparar métricas antes/después', 'cyan');
  } else {
    log('Para corregir errores:', 'yellow');
    log('  1. Ejecuta: ./scripts/install-kpi-functions.sh', 'cyan');
    log('  2. O manualmente en SQL Editor:', 'cyan');
    log('     migrations/008_optimize_kpi_queries.sql', 'cyan');
  }

  log('');
  process.exit(failed > 0 ? 1 : 0);
}

verifyFunctions().catch(err => {
  log(`\n❌ Error fatal: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
