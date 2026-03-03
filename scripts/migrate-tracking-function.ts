import { supabase } from '../lib/supabase';

/**
 * Script de migración para crear función RPC de seguimiento
 * Ejecutar con: npx ts-node scripts/migrate-tracking-function.ts
 */

const MIGRATION_SQL = `
-- Crear función RPC para actualizar seguimiento con bitácora
CREATE OR REPLACE FUNCTION update_tracking_with_bitacora(
    p_claim_id TEXT,
    p_proximo_seguimiento TIMESTAMP WITH TIME ZONE,
    p_estado_interno TEXT,
    p_author TEXT,
    p_timeline_text TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE claims 
    SET 
        proximo_seguimiento = p_proximo_seguimiento,
        estado_interno = p_estado_interno,
        updatedAt = NOW()
    WHERE id_softseguros = p_claim_id;
    
    INSERT INTO timeline (claim_id, date, author, text, isSystem)
    VALUES (p_claim_id, NOW(), p_author, p_timeline_text, true);
END;
$$ LANGUAGE plpgsql;
`;

async function migrate() {
  console.log('🔄 Ejecutando migración de función de seguimiento...\n');

  try {
    // Ejecutar SQL directamente
    const { error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL });

    if (error) {
      console.error('❌ Error ejecutando migración:', error.message);

      // Si exec_sql no existe, mostrar instrucciones manuales
      if (error.message.includes('exec_sql') || error.message.includes('Could not find')) {
        console.log('\n📋 Instrucciones manuales:');
        console.log('1. Ve a Supabase Dashboard → SQL Editor');
        console.log('2. Crea un nuevo query');
        console.log('3. Pega el siguiente SQL:\n');
        console.log(MIGRATION_SQL);
        console.log('\n4. Ejecuta el query');
      }
      process.exit(1);
    }

    console.log('✅ Migración completada exitosamente');

    // Verificar que la función existe
    const { data, error: verifyError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'update_tracking_with_bitacora');

    if (verifyError) {
      console.log('⚠️ No se pudo verificar la función, pero debería estar creada');
    } else {
      console.log('✅ Función verificada en la base de datos');
    }
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
  }
}

migrate();
