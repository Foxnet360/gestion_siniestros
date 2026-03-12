import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Loaded' : 'Missing');

async function debug() {
    console.log('Importing Supabase...');
    const { supabase } = await import('../src/lib/supabase');
    console.log('Supabase imported.');

    console.log('Importing Service...');
    const { metricasEtapasService } = await import('../src/services/MetricasEtapasService');
    console.log('Service imported.');

    console.log('Fetching one claim...');
    const { data: claims, error } = await supabase
        .from('claims')
        .select('id_softseguros')
        .limit(1);

    if (error) {
        console.error('Error fetching claim:', error);
        return;
    }

    const claimId = claims[0].id_softseguros;
    console.log('Processing claim:', claimId);

    try {
        const resultado = await metricasEtapasService.calcularMetricasSiniestro(claimId);
        console.log('Result:', JSON.stringify(resultado, null, 2));
        
        if (resultado.exito) {
            console.log('Saving metrics...');
            const guardado = await metricasEtapasService.guardarMetricas(resultado.metricas);
            console.log('Saved:', guardado);
        }
    } catch (err) {
        console.error('Error in processing:', err);
    }
}

debug().catch(console.error);
