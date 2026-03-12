#!/usr/bin/env node
/**
 * Script de Instalación Automática de Funciones SQL para KPIs
 *
 * Este script instala las funciones SQL directamente usando el cliente de Supabase.
 * Requiere SUPABASE_SERVICE_ROLE_KEY para permisos de creación.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function installFunctions() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  INSTALACIÓN AUTOMÁTICA: FUNCIONES SQL PARA KPIs', 'blue');
  log('═══════════════════════════════════════════════════════════\n', 'blue');

  // Verificar credenciales
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('❌ Error: Faltan credenciales de Supabase', 'red');
    log('Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env', 'yellow');
    process.exit(1);
  }

  log('✅ Credenciales encontradas\n', 'green');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Leer el archivo SQL
  let sqlContent: string;
  try {
    sqlContent = readFileSync(
      resolve(process.cwd(), 'migrations/008_optimize_kpi_queries.sql'),
      'utf-8'
    );
    log('✅ Archivo SQL cargado', 'green');
    log(`   ${sqlContent.split('\n').length} líneas de código\n`, 'gray');
  } catch (err: any) {
    log(`❌ Error leyendo archivo SQL: ${err.message}`, 'red');
    process.exit(1);
  }

  // Dividir el SQL en partes (funciones individuales)
  const functions = [
    {
      name: 'get_kpi_overview_v2',
      description: 'Calcula KPIs de overview optimizados',
    },
    {
      name: 'get_kpi_lead_time_v2',
      description: 'Calcula lead time con percentiles',
    },
    {
      name: 'get_kpi_backlog_v2',
      description: 'Calcula backlog con agrupaciones',
    },
  ];

  // Instalar cada función
  log('Instalando funciones...\n', 'cyan');

  for (const func of functions) {
    log(`Instalando: ${func.name}`, 'cyan');
    log(`   ${func.description}`, 'gray');

    try {
      // Intentar ejecutar la función para verificar si existe
      const { error: testError } = await supabase.rpc(func.name as any);

      if (testError && testError.message.includes('Could not find the function')) {
        log(`   ⚠️  La función no existe. Creándola...`, 'yellow');

        // Aquí intentaríamos crear la función, pero la API REST de Supabase
        // no permite CREATE FUNCTION directamente
        log(`   ❌ No se puede crear automáticamente vía API REST`, 'red');
        log(`   ℹ️  Requiere ejecución en SQL Editor manual\n`, 'yellow');
      } else if (testError) {
        log(`   ❌ Error: ${testError.message}`, 'red');
      } else {
        log(`   ✅ Función ya existe y funciona\n`, 'green');
      }
    } catch (err: any) {
      log(`   ❌ Error inesperado: ${err.message}\n`, 'red');
    }
  }

  // Como no podemos crear funciones automáticamente, mostrar instrucciones manuales
  log('\n═══════════════════════════════════════════════════════════', 'yellow');
  log('  INSTRUCCIONES DE INSTALACIÓN MANUAL', 'yellow');
  log('═══════════════════════════════════════════════════════════\n', 'yellow');

  log('Método 1: SQL Editor de Supabase (Recomendado)', 'cyan');
  log('───────────────────────────────────────────────────────────\n', 'gray');

  log('1. Abre el SQL Editor:', 'white');
  log('   https://supabase.com/dashboard/project/ixmeqfzxeiswstaylqbt/sql/new\n', 'cyan');

  log('2. Copia el siguiente SQL y ejecútalo:', 'white');
  log('─'.repeat(60), 'gray');

  // Mostrar solo las funciones principales
  const overviewFunction = extractFunction(sqlContent, 'get_kpi_overview_v2');
  console.log(colors.cyan + overviewFunction + colors.reset);

  log('─'.repeat(60) + '\n', 'gray');

  log('3. Para las otras funciones, abre:', 'white');
  log('   migrations/008_optimize_kpi_queries.sql', 'cyan');
  log('   y copia todo el contenido\n', 'white');

  // Ofrecer abrir el archivo automáticamente
  log('¿Deseas que abra el archivo SQL en VS Code?', 'cyan');
  log('Ejecuta: code migrations/008_optimize_kpi_queries.sql\n', 'yellow');

  // Alternativa: Mostrar todo el SQL
  log('\n═══════════════════════════════════════════════════════════', 'gray');
  log('  CONTENIDO COMPLETO SQL (Copiar todo)', 'gray');
  log('═══════════════════════════════════════════════════════════\n', 'gray');

  console.log(colors.gray + sqlContent + colors.reset);
}

function extractFunction(sql: string, functionName: string): string {
  const regex = new RegExp(
    `(CREATE OR REPLACE FUNCTION ${functionName}[\\s\\S]*?\\$\\$ LANGUAGE.*?;)`
  );
  const match = sql.match(regex);
  return match ? match[1] : '';
}

installFunctions().catch(err => {
  log(`\n❌ Error fatal: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
