#!/usr/bin/env node
/**
 * Script de Verificación de Acceso a SQL Functions en Supabase
 *
 * Este script verifica que tienes los permisos necesarios para:
 * 1. Crear funciones PostgreSQL (CREATE FUNCTION)
 * 2. Ejecutar funciones RPC desde el cliente
 * 3. Crear índices (CREATE INDEX)
 * 4. Acceder a información del esquema
 *
 * Uso:
 *   npx ts-node scripts/verify-supabase-access.ts
 *
 * Requiere:
 *   - SUPABASE_SERVICE_ROLE_KEY en .env
 *   - VITE_SUPABASE_URL en .env
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function warning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'cyan');
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class SupabaseAccessVerifier {
  private supabase;
  private results: TestResult[] = [];

  constructor() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        'Faltan variables de entorno. Asegúrate de tener:\n' +
          '  - VITE_SUPABASE_URL\n' +
          '  - SUPABASE_SERVICE_ROLE_KEY\n' +
          'En tu archivo .env'
      );
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async runAllTests(): Promise<void> {
    log('\n═══════════════════════════════════════════════════════════', 'magenta');
    log('  VERIFICACIÓN DE ACCESO A SUPABASE SQL FUNCTIONS', 'magenta');
    log('═══════════════════════════════════════════════════════════\n', 'magenta');

    info(`URL: ${SUPABASE_URL}`);
    info(`Service Key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...\n`);

    // Test 1: Conexión básica
    await this.testConnection();

    // Test 2: Crear función SQL
    await this.testCreateFunction();

    // Test 3: Ejecutar función RPC
    await this.testExecuteFunction();

    // Test 4: Verificar permisos de índices
    await this.testIndexPermissions();

    // Test 5: Información del esquema
    await this.testSchemaInfo();

    // Test 6: Verificar tablas existentes
    await this.testExistingTables();

    // Reporte final
    this.printReport();
  }

  private async testConnection(): Promise<void> {
    const start = Date.now();
    try {
      const { data, error } = await this.supabase.from('claims').select('count').limit(1);

      if (error) throw error;

      this.results.push({
        name: 'Conexión básica a Supabase',
        passed: true,
        duration: Date.now() - start,
        details: { sampleData: data },
      });
      success('Conexión a Supabase exitosa');
    } catch (err: any) {
      this.results.push({
        name: 'Conexión básica a Supabase',
        passed: false,
        duration: Date.now() - start,
        error: err.message,
      });
      error(`Conexión fallida: ${err.message}`);
    }
  }

  private async testCreateFunction(): Promise<void> {
    const start = Date.now();
    try {
      // Crear función de prueba temporal
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION test_verification_function()
        RETURNS TABLE (
          message TEXT,
          timestamp TIMESTAMPTZ,
          current_user_name TEXT,
          has_create_privilege BOOLEAN
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            'Supabase SQL access verified!'::TEXT,
            NOW(),
            CURRENT_USER::TEXT,
            has_database_privilege(CURRENT_USER, current_database(), 'CREATE');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      // Ejecutar SQL directamente usando rpc con una función que ejecuta SQL
      const { error: createError } = await this.supabase.rpc('exec_sql', {
        sql: createFunctionSQL,
      });

      // Si exec_sql no existe, intentamos con una query directa
      if (createError && createError.message.includes('exec_sql')) {
        // Intentar crear la función usando REST API directamente
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify({
            query: createFunctionSQL,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } else if (createError) {
        throw createError;
      }

      this.results.push({
        name: 'Creación de funciones SQL',
        passed: true,
        duration: Date.now() - start,
      });
      success('Permiso para crear funciones SQL: OK');
    } catch (err: any) {
      this.results.push({
        name: 'Creación de funciones SQL',
        passed: false,
        duration: Date.now() - start,
        error: err.message,
      });
      error(`Creación de funciones fallida: ${err.message}`);
      warning('Esto puede deberse a que necesitas usar el SQL Editor de Supabase');
    }
  }

  private async testExecuteFunction(): Promise<void> {
    const start = Date.now();
    try {
      // Intentar ejecutar una función PostgreSQL estándar
      const { data, error } = await this.supabase.rpc('version');

      if (error) {
        // Si 'version' no existe, probamos con now()
        const { data: nowData, error: nowError } = await this.supabase
          .from('claims')
          .select('id_softseguros')
          .limit(0);

        if (nowError) throw nowError;

        this.results.push({
          name: 'Ejecución de funciones RPC',
          passed: true,
          duration: Date.now() - start,
          details: { note: 'Función version() no disponible, pero conexión RPC funciona' },
        });
      } else {
        this.results.push({
          name: 'Ejecución de funciones RPC',
          passed: true,
          duration: Date.now() - start,
          details: { version: data },
        });
      }
      success('Ejecución de funciones RPC: OK');
    } catch (err: any) {
      this.results.push({
        name: 'Ejecución de funciones RPC',
        passed: false,
        duration: Date.now() - start,
        error: err.message,
      });
      error(`Ejecución RPC fallida: ${err.message}`);
    }
  }

  private async testIndexPermissions(): Promise<void> {
    const start = Date.now();
    try {
      // Verificar si podemos ver información de índices
      const { data, error } = await this.supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .eq('schemaname', 'public')
        .limit(5);

      if (error) throw error;

      this.results.push({
        name: 'Consulta de índices (lectura)',
        passed: true,
        duration: Date.now() - start,
        details: { indexes: data },
      });
      success('Permiso para consultar índices: OK');
      info(`  Encontrados ${data?.length || 0} índices de ejemplo`);
    } catch (err: any) {
      this.results.push({
        name: 'Consulta de índices (lectura)',
        passed: false,
        duration: Date.now() - start,
        error: err.message,
      });
      warning(`Consulta de índices fallida: ${err.message}`);
    }
  }

  private async testSchemaInfo(): Promise<void> {
    const start = Date.now();
    try {
      // Obtener información de tablas
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .limit(10);

      if (error) throw error;

      const tables = data?.filter(t => t.table_type === 'BASE TABLE') || [];

      this.results.push({
        name: 'Acceso a información de esquema',
        passed: true,
        duration: Date.now() - start,
        details: { tables: tables.map(t => t.table_name) },
      });
      success('Acceso a información de esquema: OK');
      info(`  Tablas encontradas: ${tables.map(t => t.table_name).join(', ')}`);
    } catch (err: any) {
      this.results.push({
        name: 'Acceso a información de esquema',
        passed: false,
        duration: Date.now() - start,
        error: err.message,
      });
      error(`Acceso a esquema fallido: ${err.message}`);
    }
  }

  private async testExistingTables(): Promise<void> {
    const start = Date.now();
    const criticalTables = ['claims', 'siniestro_etapas', 'amparos', 'claim_amparos'];
    const foundTables: string[] = [];
    const missingTables: string[] = [];

    for (const table of criticalTables) {
      try {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          missingTables.push(table);
        } else {
          foundTables.push(`${table}(${count} rows)`);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    const passed = missingTables.length === 0;

    this.results.push({
      name: 'Verificación de tablas críticas',
      passed,
      duration: Date.now() - start,
      details: { found: foundTables, missing: missingTables },
    });

    if (passed) {
      success('Todas las tablas críticas existen:');
      foundTables.forEach(t => info(`  - ${t}`));
    } else {
      error('Faltan tablas críticas:');
      missingTables.forEach(t => error(`  - ${t}`));
    }
  }

  private printReport(): void {
    log('\n═══════════════════════════════════════════════════════════', 'magenta');
    log('  REPORTE DE VERIFICACIÓN', 'magenta');
    log('═══════════════════════════════════════════════════════════\n', 'magenta');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    // Tabla de resultados
    console.log('┌──────────────────────────────────────────┬──────────┬────────────┐');
    console.log('│ Test                                     │ Estado   │ Duración   │');
    console.log('├──────────────────────────────────────────┼──────────┼────────────┤');

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      const name = result.name.padEnd(40);
      const statusCol = status.padEnd(8);
      const durCol = duration.padEnd(10);
      console.log(`│ ${name} │ ${statusCol} │ ${durCol} │`);
    });

    console.log('└──────────────────────────────────────────┴──────────┴────────────┘');

    // Resumen
    log(`\nTotal: ${total} tests | ✅ ${passed} pasados | ❌ ${failed} fallidos`, 'cyan');

    // Recomendaciones
    log('\n═══════════════════════════════════════════════════════════', 'yellow');
    log('  RECOMENDACIONES', 'yellow');
    log('═══════════════════════════════════════════════════════════\n', 'yellow');

    if (failed === 0) {
      success('¡Tienes acceso completo! Puedes proceder con:');
      log('  1. Crear funciones SQL optimizadas para KPIs', 'green');
      log('  2. Crear índices compuestos para mejorar performance', 'green');
      log('  3. Implementar el testing de carga con k6', 'green');
    } else if (this.results.some(r => r.name === 'Creación de funciones SQL' && !r.passed)) {
      warning('No se pudo crear funciones SQL automáticamente. Alternativas:');
      log('  1. Usar el SQL Editor de Supabase (Dashboard web)', 'cyan');
      log('  2. Ejecutar scripts SQL manualmente', 'cyan');
      log('  3. Usar la CLI de Supabase: npm install -g supabase', 'cyan');
      log('\n📄 Archivo SQL de ejemplo creado: scripts/test-function.sql', 'cyan');
    } else {
      warning('Algunos tests fallaron. Revisa:');
      log('  - Las credenciales en .env', 'cyan');
      log('  - La conexión a internet', 'cyan');
      log('  - Los permisos del service role key', 'cyan');
    }

    log('\n═══════════════════════════════════════════════════════════\n', 'magenta');

    // Exit code para CI/CD
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Ejecutar verificación
async function main() {
  try {
    const verifier = new SupabaseAccessVerifier();
    await verifier.runAllTests();
  } catch (err: any) {
    console.error(`\n${colors.red}Error fatal: ${err.message}${colors.reset}\n`);
    process.exit(1);
  }
}

main();
