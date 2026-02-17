import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env vars - manejo compatible Windows/Unix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   Asegúrate de que el archivo .env exista y contenga:');
    console.error('   VITE_SUPABASE_URL=...');
    console.error('   VITE_SUPABASE_ANON_KEY=...');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script para reiniciar/limpiar todas las tablas de la base de datos
 * Elimina todos los registros de: claims, amparos, state_history, timeline
 */
async function resetDatabase() {
  console.log('🗑️  Iniciando limpieza de tablas...\n');

  try {
    // Eliminar en orden correcto (tablas con FK primero, luego la principal)
    // Aunque tengan CASCADE DELETE, es mejor ser explícito

    console.log('1. Eliminando registros de amparos...');
    const { error: amparosError, count: amparosDeleted } = await supabase
      .from('amparos')
      .delete({ count: 'exact' })
      .neq('claim_id', 'DUMMY_NONEXISTENT_ID'); // Elimina todos

    if (amparosError) {
      console.error('❌ Error eliminando amparos:', amparosError.message);
    } else {
      console.log(`✅ Amparos eliminados: ${amparosDeleted || 0}\n`);
    }

    console.log('2. Eliminando registros de state_history...');
    const { error: stateError, count: stateDeleted } = await supabase
      .from('state_history')
      .delete({ count: 'exact' })
      .neq('claim_id', 'DUMMY_NONEXISTENT_ID');

    if (stateError) {
      console.error('❌ Error eliminando state_history:', stateError.message);
    } else {
      console.log(`✅ State history eliminados: ${stateDeleted || 0}\n`);
    }

    console.log('3. Eliminando registros de timeline...');
    const { error: timelineError, count: timelineDeleted } = await supabase
      .from('timeline')
      .delete({ count: 'exact' })
      .neq('claim_id', 'DUMMY_NONEXISTENT_ID');

    if (timelineError) {
      console.error('❌ Error eliminando timeline:', timelineError.message);
    } else {
      console.log(`✅ Timeline eliminados: ${timelineDeleted || 0}\n`);
    }

    console.log('4. Eliminando registros de claims...');
    const { error: claimsError, count: claimsDeleted } = await supabase
      .from('claims')
      .delete({ count: 'exact' })
      .neq('id_softseguros', 'DUMMY_NONEXISTENT_ID'); // Elimina todos

    if (claimsError) {
      console.error('❌ Error eliminando claims:', claimsError.message);
    } else {
      console.log(`✅ Claims eliminados: ${claimsDeleted || 0}\n`);
    }

    // Verificar resultados
    console.log('📊 Verificando estado de tablas...');
    
    const { count: claimsCount, error: cError } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true });
    
    const { count: amparosCount, error: aError } = await supabase
      .from('amparos')
      .select('*', { count: 'exact', head: true });
    
    const { count: stateCount, error: sError } = await supabase
      .from('state_history')
      .select('*', { count: 'exact', head: true });
    
    const { count: timelineCount, error: tError } = await supabase
      .from('timeline')
      .select('*', { count: 'exact', head: true });

    if (cError || aError || sError || tError) {
      console.error('⚠️  Error verificando tablas:', { cError, aError, sError, tError });
    }

    console.log('\n📈 Resumen final:');
    console.log(`   - claims: ${claimsCount} registros`);
    console.log(`   - amparos: ${amparosCount} registros`);
    console.log(`   - state_history: ${stateCount} registros`);
    console.log(`   - timeline: ${timelineCount} registros`);

    if (claimsCount === 0 && amparosCount === 0 && stateCount === 0 && timelineCount === 0) {
      console.log('\n✅ ¡Base de datos reiniciada exitosamente!');
    } else {
      console.log('\n⚠️  Algunas tablas aún contienen registros');
    }

  } catch (error) {
    console.error('\n💥 Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar
resetDatabase().then(() => {
  console.log('\n👋 Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error:', error);
  process.exit(1);
});

export { resetDatabase };
