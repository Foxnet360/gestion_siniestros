// ============================================================================
// DIAGNÓSTICO DE CONEXIÓN A SUPABASE
// ============================================================================
// Ejecutar en el navegador: Abre DevTools (F12) → Console → pega este código
// ============================================================================

const SUPABASE_URL = 'https://yxjeuyouhhhptwrllvzh.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4amV1eW91aGhocHR3cmxsdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDkxNjgsImV4cCI6MjA4NjMyNTE2OH0.B5DcmzmGu5cUavVvhzPgGPVukqrj56jKs28fATdy-e8';

async function diagnosticarSupabase() {
  console.log('🔍 INICIANDO DIAGNÓSTICO...\n');

  // Test 1: Verificar que las variables están cargadas
  console.log('✅ Test 1: Variables de entorno');
  console.log('   URL:', SUPABASE_URL);
  console.log('   Key:', SUPABASE_KEY.substring(0, 20) + '...');

  // Test 2: Verificar conexión básica
  console.log('\n✅ Test 2: Conexión básica a Supabase');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/claims?select=id_softseguros&limit=1`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.status === 200) {
      const data = await response.json();
      console.log('   ✅ Conexión exitosa');
      console.log('   Datos recibidos:', data);
    } else if (response.status === 401) {
      console.log('   ❌ Error 401: Problema de autenticación');
      console.log('   Posibles causas:');
      console.log('   - RLS está activo');
      console.log('   - La API key no tiene permisos');
      console.log('   - La tabla no existe');
    } else if (response.status === 404) {
      console.log('   ❌ Error 404: Tabla no encontrada');
    } else {
      console.log('   ❌ Error:', response.status);
      const text = await response.text();
      console.log('   Respuesta:', text);
    }
  } catch (error) {
    console.log('   ❌ Error de red:', error.message);
  }

  // Test 3: Verificar estructura de tablas
  console.log('\n✅ Test 3: Verificar tablas disponibles');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      console.log('   Tablas disponibles:', Object.keys(data.definitions || {}));
    }
  } catch (e) {
    console.log('   No se pudo obtener lista de tablas');
  }

  // Test 4: Verificar RLS
  console.log('\n✅ Test 4: Verificar permisos');
  console.log('   Para desactivar RLS, ejecuta en Supabase SQL Editor:');
  console.log('   ALTER TABLE claims DISABLE ROW LEVEL SECURITY;');

  console.log('\n🔍 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar
diagnosticarSupabase();
