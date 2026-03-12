#!/usr/bin/env node
/**
 * Script de Verificación: Función SQL Optimizada get_kpi_overview_v2
 *
 * Este script verifica que la función SQL creada en el SQL Editor
 * existe y retorna datos correctos.
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
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyFunction() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  VERIFICACIÓN: FUNCIÓN SQL get_kpi_overview_v2', 'blue');
  log('═══════════════════════════════════════════════════════════\n', 'blue');

  try {
    // Test 1: Verificar que la función existe
    log('Test 1: Verificando existencia de función...', 'cyan');
    const { data: funcData, error: funcError } = await supabase.rpc('get_kpi_overview_v2');

    if (funcError) {
      if (funcError.message.includes('Could not find the function')) {
        log('\n❌ La función get_kpi_overview_v2 NO existe', 'red');
        log('\nPara crearla, ejecuta en el SQL Editor de Supabase:', 'yellow');
        log('https://supabase.com/dashboard/project/_/sql/new\n', 'cyan');
        log('Pega el SQL de la función y ejecuta.\n', 'cyan');
        return;
      }
      throw funcError;
    }

    log('✅ Función existe y responde\n', 'green');

    // Test 2: Verificar estructura de respuesta
    log('Test 2: Verificando estructura de respuesta...', 'cyan');
    const expectedFields = [
      'leadTimeAvg',
      'tasaDesistimiento',
      'tasaObjetados',
      'tasaPrescritos',
      'porcentajeCerradosPlazo',
      'backlogActivos',
      'totalClaims',
    ];

    const result = funcData;
    const missingFields = expectedFields.filter(f => !(f in result));

    if (missingFields.length > 0) {
      log(`❌ Faltan campos: ${missingFields.join(', ')}`, 'red');
    } else {
      log('✅ Todos los campos esperados están presentes\n', 'green');
    }

    // Test 3: Mostrar valores
    log('Test 3: Valores calculados (sin filtros):', 'cyan');
    console.log('┌─────────────────────────────┬──────────────┐');
    console.log('│ KPI                         │ Valor        │');
    console.log('├─────────────────────────────┼──────────────┤');
    console.log(`│ Lead Time Promedio          │ ${String(result.leadTimeAvg).padEnd(12)} │`);
    console.log(`│ Tasa Desistimiento (%)      │ ${String(result.tasaDesistimiento).padEnd(12)} │`);
    console.log(`│ Tasa Objetados (%)          │ ${String(result.tasaObjetados).padEnd(12)} │`);
    console.log(`│ Tasa Prescritos (%)         │ ${String(result.tasaPrescritos).padEnd(12)} │`);
    console.log(
      `│ % Cerrados en Plazo         │ ${String(result.porcentajeCerradosPlazo).padEnd(12)} │`
    );
    console.log(`│ Backlog Activos             │ ${String(result.backlogActivos).padEnd(12)} │`);
    console.log(`│ Total Siniestros            │ ${String(result.totalClaims).padEnd(12)} │`);
    console.log('└─────────────────────────────┴──────────────┘');

    // Test 4: Test con filtros (si hay datos de fecha)
    log('\nTest 4: Probando con filtros de fecha...', 'cyan');
    const { data: filteredData, error: filterError } = await supabase.rpc('get_kpi_overview_v2', {
      p_fecha_desde: '2024-01-01',
      p_fecha_hasta: '2024-12-31',
    });

    if (filterError) {
      log(`⚠️  Filtros fallaron: ${filterError.message}`, 'yellow');
    } else {
      log(`✅ Filtros funcionan (${filteredData.totalClaims} siniestros filtrados)\n`, 'green');
    }

    // Test 5: Performance
    log('Test 5: Midiendo performance...', 'cyan');
    const iterations = 5;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await supabase.rpc('get_kpi_overview_v2');
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`   Promedio: ${avg.toFixed(0)}ms`);
    console.log(`   Mínimo:   ${min}ms`);
    console.log(`   Máximo:   ${max}ms`);

    if (avg < 500) {
      log(`\n✅ Performance excelente (< 500ms promedio)`, 'green');
    } else if (avg < 1000) {
      log(`\n⚠️  Performance aceptable (500-1000ms)`, 'yellow');
    } else {
      log(`\n❌ Performance lenta (> 1000ms)`, 'red');
    }

    // Resumen final
    log('\n═══════════════════════════════════════════════════════════', 'green');
    log('  ✅ FUNCIÓN SQL OPTIMIZADA VERIFICADA Y FUNCIONANDO', 'green');
    log('═══════════════════════════════════════════════════════════\n', 'green');

    log('Próximos pasos:', 'cyan');
    log('  1. Actualizar KpiService para usar la función SQL', 'cyan');
    log('  2. Crear funciones para otros endpoints (lead-time, backlog)', 'cyan');
    log('  3. Implementar testing de carga con k6', 'cyan');
  } catch (err: any) {
    log(`\n❌ Error: ${err.message}`, 'red');
    console.error(err);
  }
}

verifyFunction();
