// ============================================================================
// SGS - SEED DATA FOR SUPABASE
// ============================================================================
// Script para insertar datos de prueba en Supabase
// Ejecutar con: npx ts-node seed-supabase.ts
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = async () => {
  console.log('🌱 Iniciando seed de datos...\n');

  try {
    // Datos de ejemplo para claims
    const sampleClaims = [
      {
        id_softseguros: 'SS-2024-001',
        numero_siniestro: 'SIN-001',
        numero_siniestro_compania: 'COMP-001',
        poliza: 'POL-12345',
        asegurado: 'Juan Pérez',
        aseguradora: 'Allianz',
        ramo: 'Autos',
        estado_interno: 'RADICACIÓN COMPAÑÍA',
        estado_softseguros: 'ABIERTO',
        tipo_siniestro: 'Accidente',
        fecha_ocurrencia: '2024-01-15',
        fecha_aviso: '2024-01-16',
        fecha_notificacion_aseguradora: '2024-01-17',
        proveedor_asignado: 'Taller Central',
        monto_reclamo: 5000000,
        valor_deducible: 500000,
        valor_indemnizacion: 4500000,
        descripcion: 'Colisión frontal en avenida principal',
        placa_bien: 'ABC-123',
        documento_asegurado: '1234567890',
        email_principal: 'juan.perez@email.com',
        celular_principal: '3001234567',
        usuario_registro: 'admin@softseguros.com',
        ultimo_seguimiento_raw: 'Radicación inicial recibida',
        vendedor: 'Carlos Vendedor',
        tecnico_asignado: 'Maria Técnico',
        prioridad: 'Alta',
        finalizado: false,
      },
      {
        id_softseguros: 'SS-2024-002',
        numero_siniestro: 'SIN-002',
        numero_siniestro_compania: 'COMP-002',
        poliza: 'POL-67890',
        asegurado: 'María López',
        aseguradora: 'Mapfre',
        ramo: 'Hogar',
        estado_interno: 'LIQUIDACIÓN',
        estado_softseguros: 'ABIERTO',
        tipo_siniestro: 'Incendio',
        fecha_ocurrencia: '2024-02-01',
        fecha_aviso: '2024-02-02',
        fecha_notificacion_aseguradora: '2024-02-03',
        proveedor_asignado: 'Ajustadores SAS',
        monto_reclamo: 25000000,
        valor_deducible: 1000000,
        valor_indemnizacion: 24000000,
        descripcion: 'Incendio en cocina que afectó electrodomésticos',
        placa_bien: '',
        documento_asegurado: '0987654321',
        email_principal: 'maria.lopez@email.com',
        celular_principal: '3009876543',
        usuario_registro: 'tecnico@softseguros.com',
        ultimo_seguimiento_raw: 'Documentación completa, en proceso de liquidación',
        vendedor: 'Ana Vendedora',
        tecnico_asignado: 'Pedro Técnico',
        prioridad: 'Media',
        finalizado: false,
      },
      {
        id_softseguros: 'SS-2024-003',
        numero_siniestro: 'SIN-003',
        numero_siniestro_compania: 'COMP-003',
        poliza: 'POL-11111',
        asegurado: 'Pedro Rodríguez',
        aseguradora: 'Sura',
        ramo: 'Autos',
        estado_interno: 'PAGADO',
        estado_softseguros: 'CERRADO',
        tipo_siniestro: 'Robo',
        fecha_ocurrencia: '2023-12-01',
        fecha_aviso: '2023-12-02',
        fecha_notificacion_aseguradora: '2023-12-03',
        proveedor_asignado: 'Grúas Express',
        monto_reclamo: 35000000,
        valor_deducible: 1500000,
        valor_indemnizacion: 33500000,
        descripcion: 'Robo total del vehículo',
        placa_bien: 'XYZ-789',
        documento_asegurado: '1122334455',
        email_principal: 'pedro.rodriguez@email.com',
        celular_principal: '3001122334',
        usuario_registro: 'admin@softseguros.com',
        ultimo_seguimiento_raw: 'Pago realizado exitosamente',
        vendedor: 'Carlos Vendedor',
        tecnico_asignado: 'Maria Técnico',
        prioridad: 'Alta',
        finalizado: true,
        fecha_finalizacion: '2024-01-15',
      },
    ];

    // Insertar claims
    console.log('📊 Insertando claims...');
    const { data: claimsData, error: claimsError } = await supabase
      .from('claims')
      .upsert(sampleClaims, { onConflict: 'id_softseguros' });

    if (claimsError) {
      console.error('❌ Error insertando claims:', claimsError);
    } else {
      console.log('✅ Claims insertados correctamente');
    }

    // Timeline para primer claim
    const timeline1 = [
      {
        claim_id: 'SS-2024-001',
        date: '2024-01-15T10:00:00Z',
        author: 'Sistema',
        text: 'Siniestro registrado en el sistema',
        is_system: true,
      },
      {
        claim_id: 'SS-2024-001',
        date: '2024-01-16T14:30:00Z',
        author: 'admin@softseguros.com',
        text: 'Recepción de documentos iniciales',
        is_system: false,
      },
      {
        claim_id: 'SS-2024-001',
        date: '2024-01-17T09:15:00Z',
        author: 'Sistema',
        text: 'Radicado a compañía aseguradora',
        is_system: true,
      },
    ];

    console.log('📝 Insertando timeline...');
    const { error: timelineError } = await supabase
      .from('timeline')
      .upsert(timeline1, { onConflict: 'id' });

    if (timelineError) {
      console.error('❌ Error insertando timeline:', timelineError);
    } else {
      console.log('✅ Timeline insertado correctamente');
    }

    console.log('\n🎉 Seed completado!');
    console.log('📌 Datos insertados:');
    console.log('   - 3 claims de ejemplo');
    console.log('   - 3 eventos de timeline');
    console.log('\n🔍 Ahora puedes iniciar sesión y ver los datos en el dashboard');
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedData();
