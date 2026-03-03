import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Necesitas la Service Role Key

// Verificar configuración
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Debes configurar VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  console.error(
    'La Service Role Key la encuentras en: Supabase Dashboard > Project Settings > API > service_role key'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de usuarios a crear
const users = [
  // ADMIN (2)
  {
    email: 'indemnizaciones@correseguros.co',
    password: 'SGS123456',
    name: 'Maryory Espinosa Sánchez',
    role: 'ADMIN',
    initials: 'MES',
  },
  {
    email: 'info@correseguros.co',
    password: 'SGS123456',
    name: 'Alejandro Cardona',
    role: 'ADMIN',
    initials: 'AC',
  },

  // TECNICO (4)
  {
    email: 'indemnizaciones1@correseguros.co',
    password: 'SGS123456',
    name: 'Sara Lucía Bedoya Velásquez',
    role: 'TECNICO',
    initials: 'SLBV',
  },
  {
    email: 'tecnico.vida@correseguros.co',
    password: 'SGS123456',
    name: 'Sandra Echeverri',
    role: 'TECNICO',
    initials: 'SE',
  },
  {
    email: 'tecnico.jfaseguros@correseguros.co',
    password: 'SGS123456',
    name: 'Gonzalo Duque Restrepo',
    role: 'TECNICO',
    initials: 'GDR',
  },
  {
    email: 'asistente.jfaseguros@correseguros.co',
    password: 'SGS123456',
    name: 'Yobani Gomez',
    role: 'TECNICO',
    initials: 'YG',
  },

  // GERENTE (7)
  {
    email: 'elenacorreseguros@gmail.com',
    password: 'SGS123456',
    name: 'Luz Elena',
    role: 'GERENTE',
    initials: 'LE',
  },
  {
    email: 'gerencia.comercial@correseguros.co',
    password: 'SGS123456',
    name: 'Manuel Antonio Velasquez León',
    role: 'GERENTE',
    initials: 'MAVL',
  },
  {
    email: 'carlosvallejo@seacompetitivo.com',
    password: 'SGS123456',
    name: 'Carlos Enrique Vallejo',
    role: 'GERENTE',
    initials: 'CEV',
  },
  {
    email: 'procesosyproyectos@correseguros.co',
    password: 'SGS123456',
    name: 'Claudia Arbelaez',
    role: 'GERENTE',
    initials: 'CA',
  },
  {
    email: 'director2jfaseguros@correseguros.co',
    password: 'SGS123456',
    name: 'Luis Alberto Gallón',
    role: 'GERENTE',
    initials: 'LAG',
  },
  {
    email: 'auribe@uvseguros.com.co',
    password: 'SGS123456',
    name: 'Alejandro Uribe Velez',
    role: 'GERENTE',
    initials: 'AUV',
  },
  {
    email: 'lisimacocorreseguros@gmail.com',
    password: 'SGS123456',
    name: 'Lisimaco Cifuentes',
    role: 'GERENTE',
    initials: 'LC',
  },
];

async function createUsers() {
  console.log('🚀 Creando usuarios en Supabase...\n');

  let created = 0;
  let errors = 0;

  for (const user of users) {
    try {
      // 1. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  ${user.email} - Ya existe`);

          // Obtener el ID del usuario existente
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (existingUser) {
            // Actualizar datos
            await supabase
              .from('users')
              .update({
                name: user.name,
                role: user.role,
                initials: user.initials,
                is_active: true,
              })
              .eq('id', existingUser.id);
            console.log(`   ✅ Datos actualizados`);
          }
          continue;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // 2. Crear perfil en public.users
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        initials: user.initials,
        is_active: true,
      });

      if (profileError) {
        console.error(`❌ Error creando perfil para ${user.email}:`, profileError.message);
        errors++;
        continue;
      }

      console.log(`✅ ${user.email} - ${user.name} (${user.role})`);
      created++;
    } catch (error) {
      console.error(`❌ Error con ${user.email}:`, error);
      errors++;
    }
  }

  console.log('\n========================================');
  console.log('RESUMEN:');
  console.log(`✅ Usuarios creados: ${created}`);
  console.log(`⚠️  Errores: ${errors}`);
  console.log(`📊 Total: ${users.length}`);
  console.log('========================================');

  if (errors === 0) {
    console.log('\n🎉 ¡Todos los usuarios creados exitosamente!');
    console.log('\nDatos de login:');
    console.log('Email: indemnizaciones@correseguros.co');
    console.log('Contraseña: SGS123456');
    console.log('Rol: ADMIN');
  }
}

createUsers().catch(console.error);
