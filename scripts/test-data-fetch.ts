import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataFetch() {
  console.log('🔍 Testing data fetch from claims table...\n');

  try {
    // Test 1: Count total claims
    const { data: count, error: countError } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting claims:', countError.message);
    } else {
      console.log(`✅ Total claims in database: ${count?.length || 0}`);
    }

    // Test 2: Sample claims with estado_softseguros
    const { data: sample, error: sampleError } = await supabase
      .from('claims')
      .select(
        'id_softseguros, estado_softseguros, estado_interno, fecha_ultimo_seguimiento, proximo_seguimiento'
      )
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample:', sampleError.message);
    } else {
      console.log('\n📋 Sample claims:');
      sample?.forEach((claim, i) => {
        console.log(`  ${i + 1}. ID: ${claim.id_softseguros}`);
        console.log(`     Estado SoftSeguros: ${claim.estado_softseguros || 'NULL'}`);
        console.log(`     Estado Interno: ${claim.estado_interno || 'NULL'}`);
        console.log(`     Fecha último seguimiento: ${claim.fecha_ultimo_seguimiento || 'NULL'}`);
        console.log(`     Próximo seguimiento: ${claim.proximo_seguimiento || 'NULL'}`);
        console.log('');
      });
    }

    // Test 3: Count claims with fecha_ultimo_seguimiento
    const { data: withDate, error: dateError } = await supabase
      .from('claims')
      .select('id_softseguros')
      .not('fecha_ultimo_seguimiento', 'is', null)
      .limit(100);

    if (dateError) {
      console.error('❌ Error counting with date:', dateError.message);
    } else {
      console.log(`✅ Claims with fecha_ultimo_seguimiento: ${withDate?.length || 0}`);
    }

    // Test 4: Count by estado_softseguros
    const { data: estados, error: estadosError } = await supabase
      .from('claims')
      .select('estado_softseguros');

    if (estadosError) {
      console.error('❌ Error fetching estados:', estadosError.message);
    } else {
      const counts: { [key: string]: number } = {};
      estados?.forEach(c => {
        const estado = c.estado_softseguros || 'NULL';
        counts[estado] = (counts[estado] || 0) + 1;
      });

      console.log('\n📊 Claims by estado_softseguros:');
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([estado, count]) => {
          console.log(`  ${estado}: ${count}`);
        });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDataFetch();
