import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    '❌ Error: Se requieren las variables VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Script de migración para convertir técnicos existentes en usuarios
 * Este script:
 * 1. Extrae la lista única de técnicos de la columna tecnico_asignado
 * 2. Crea usuarios en auth.users de Supabase
 * 3. Crea registros correspondientes en la tabla public.users
 * 4. Actualiza claims.tecnico_id con los UUIDs generados
 */
async function migrateTecnicos() {
  console.log('🚀 Iniciando migración de técnicos...\n');

  try {
    // 1. Obtener lista única de técnicos
    console.log('📋 Paso 1: Extrayendo técnicos únicos...');
    const { data: tecnicos, error: fetchError } = await supabase
      .from('claims')
      .select('tecnico_asignado')
      .not('tecnico_asignado', 'is', null)
      .not('tecnico_asignado', 'eq', '');

    if (fetchError) throw fetchError;

    const uniqueTecnicos = [...new Set(tecnicos?.map(t => t.tecnico_asignado))];
    console.log(`✅ Encontrados ${uniqueTecnicos.length} técnicos únicos:\n`);
    uniqueTecnicos.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
    console.log('');

    // 2. Crear usuarios
    console.log('👤 Paso 2: Creando usuarios...\n');
    const userMap: Record<string, string> = {};

    for (let i = 0; i < uniqueTecnicos.length; i++) {
      const nombre = uniqueTecnicos[i];
      const email = `tecnico${i + 1}@temp.softseguros.com`;
      const password = `TempPass${i + 1}!`;
      const initials = nombre
        .split(' ')
        .slice(0, 2)
        .map(n => n[0].toUpperCase())
        .join('');

      try {
        // Crear usuario en auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: nombre, role: 'TECNICO' },
        });

        if (authError) throw authError;

        // Crear entrada en public.users
        const { error: userError } = await supabase.from('users').insert({
          id: authUser.user.id,
          email,
          name: nombre,
          role: 'TECNICO',
          initials,
          is_active: true,
        });

        if (userError) throw userError;

        userMap[nombre] = authUser.user.id;
        console.log(`✅ Creado: ${nombre} (${email})`);
      } catch (err) {
        console.error(`❌ Error creando ${nombre}:`, err);
      }
    }

    console.log(`\n✅ ${Object.keys(userMap).length} usuarios creados exitosamente\n`);

    // 3. Actualizar claims
    console.log('📝 Paso 3: Actualizando claims con tecnico_id...\n');

    for (const [nombre, userId] of Object.entries(userMap)) {
      const { error: updateError } = await supabase
        .from('claims')
        .update({ tecnico_id: userId })
        .eq('tecnico_asignado', nombre);

      if (updateError) {
        console.error(`❌ Error actualizando claims para ${nombre}:`, updateError);
      } else {
        console.log(`✅ Actualizados claims de: ${nombre}`);
      }
    }

    console.log('\n✨ Migración completada exitosamente!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Los emails temporales deben ser actualizados manualmente');
    console.log('   - Las contraseñas temporales deben ser cambiadas por los usuarios');
    console.log('   - Revisa el archivo userMap.json generado para referencia\n');

    // Guardar mapeo para referencia
    const fs = await import('fs');
    fs.writeFileSync('userMap.json', JSON.stringify(userMap, null, 2));
    console.log('📝 Mapeo guardado en: userMap.json\n');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateTecnicos();
