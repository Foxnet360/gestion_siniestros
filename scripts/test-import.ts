import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function test() {
    console.log('Testing import...');
    try {
        const { metricasEtapasService } = await import('./src/services/MetricasEtapasService.js');
        console.log('Import successful!');
        console.log('Testing calculation method access...');
        if (metricasEtapasService.calcularMetricasSiniestro) {
            console.log('Method exists!');
        } else {
            console.log('Method MISSING!');
        }
    } catch (e) {
        console.error('Import FAILED:', e);
    }
}

test();
