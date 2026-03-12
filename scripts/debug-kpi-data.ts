import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testKPIData() {
  console.log('=== Test KPI Data ===\n');

  // 1. Check total claims count
  const { data: allClaims, error: countError } = await supabase
    .from('claims')
    .select('*', { count: 'exact' });

  if (countError) {
    console.error('Error fetching claims count:', countError);
    return;
  }

  console.log(`Total claims in database: ${allClaims?.length || 0}`);

  if (!allClaims || allClaims.length === 0) {
    console.log('No claims found!');
    return;
  }

  // 2. Check estado distribution
  console.log('\n--- Estado distribution ---');
  const normalize = (text: string) => {
    return (
      text
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase() || ''
    );
  };

  const counts: Record<string, number> = {};
  allClaims.forEach(c => {
    const estado = c.estado_softseguros || 'SIN_ESTADO';
    counts[estado] = (counts[estado] || 0) + 1;
  });

  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([estado, count]) => {
      console.log(`${count}: ${estado.substring(0, 60)}`);
    });

  // 3. Manual KPI calculation
  console.log('\n--- Manual KPI calculation ---');
  const finalizadosCount = allClaims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return estado.includes('FINALIZADO') || estado.includes('PAGADO');
  }).length;

  const activosCount = allClaims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return !estado.includes('FINALIZADO') && !estado.includes('PAGADO');
  }).length;

  const desistimientoCount = allClaims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return estado.includes('DESISTIMIENTO');
  }).length;

  const objetadosCount = allClaims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return estado.includes('OBJECION');
  }).length;

  const prescritosCount = allClaims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return estado.includes('PRESCRIPCION');
  }).length;

  const totalClaims = allClaims.length;

  console.log(`Total claims: ${totalClaims}`);
  console.log(`Activos: ${activosCount}`);
  console.log(`Finalizados: ${finalizadosCount}`);
  console.log(
    `Desistimiento: ${desistimientoCount} (${((desistimientoCount / totalClaims) * 100).toFixed(2)}%)`
  );
  console.log(
    `Objetados: ${objetadosCount} (${((objetadosCount / totalClaims) * 100).toFixed(2)}%)`
  );
  console.log(
    `Prescritos: ${prescritosCount} (${((prescritosCount / totalClaims) * 100).toFixed(2)}%)`
  );

  // 4. Check siniestro_etapas table
  console.log('\n--- Siniestro etapas ---');
  const { data: etapas, error: etapasError } = await supabase
    .from('siniestro_etapas')
    .select('*', { count: 'exact' });

  if (etapasError) {
    console.log(`Error fetching siniestro_etapas: ${etapasError.message}`);
  } else {
    console.log(`Total records in siniestro_etapas: ${etapas?.length || 0}`);
  }

  // 5. Sample claim fields
  console.log('\n--- Sample claim ---');
  const sample = allClaims[0];
  console.log('id_softseguros:', sample.id_softseguros);
  console.log('estado_softseguros:', sample.estado_softseguros);
  console.log('fecha_aviso:', sample.fecha_aviso);
  console.log('fecha_finalizacion:', sample.fecha_finalizacion);
  console.log('fecha_ultimo_seguimiento:', sample.fecha_ultimo_seguimiento);
  console.log('proximo_seguimiento:', sample.proximo_seguimiento);
}

testKPIData().catch(console.error);
