import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function test() {
    console.log('Testing import from Root-relative path...');
    try {
        // En ESM + tsx, a veces la ruta debe ser absoluta o relativa al CWD
        const servicePath = resolve(process.cwd(), 'src/services/MetricasEtapasService.ts');
        console.log('Resolving:', servicePath);
        
        const { MetricasEtapasService } = await import(servicePath);
        console.log('Import successful!');
        const service = new MetricasEtapasService();
        console.log('Service instance created!');
    } catch (e) {
        console.error('Import FAILED:', e);
    }
}

test();
