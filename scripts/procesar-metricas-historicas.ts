import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

async function start() {
    const { metricasEtapasService } = await import('../src/services/MetricasEtapasService');
    const { supabase } = await import('../src/lib/supabase');

    console.log('🚀 Iniciando procesamiento de métricas históricas...');

    // Obtener todos los IDs desde siniestro_etapas (SIN FILTRO IS_ACTIVE)
    const { data: items, error } = await supabase
        .from('siniestro_etapas')
        .select('claim_id');

    if (error) {
        console.error('Error obteniendo siniestros:', error);
        return;
    }

    if (!items || items.length === 0) {
        console.log('⚠️ No se encontraron registros en siniestro_etapas.');
        return;
    }

    const claimIds = items.map(i => i.claim_id).filter(id => !!id);
    console.log(`📊 Se encontraron ${claimIds.length} siniestros en siniestro_etapas.`);

    let procesados = 0;
    let exitosos = 0;
    let errores = 0;
    let excluidos = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < claimIds.length; i += BATCH_SIZE) {
        const batch = claimIds.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (claimId) => {
            try {
                const resultado = await metricasEtapasService.calcularMetricasSiniestro(claimId);
                
                if (resultado.exito && resultado.metricas.length > 0) {
                    const guardado = await metricasEtapasService.guardarMetricas(resultado.metricas);
                    if (guardado) {
                        exitosos++;
                    } else {
                        errores++;
                    }
                } else if (!resultado.datosCompletos) {
                    excluidos++;
                } else {
                    errores++;
                }
            } catch (err) {
                errores++;
            }
            procesados++;
        }));

        console.log(`⏳ Progresado: ${procesados}/${claimIds.length} (${exitosos} ok, ${excluidos} excl, ${errores} err)`);
    }

    console.log('\n✅ Procesamiento finalizado.');
    console.log(`Total: ${procesados}`);
    console.log(`Exitosos: ${exitosos}`);
    console.log(`Excluidos (datos incompletos): ${excluidos}`);
    console.log(`Errores: ${errores}`);
}

start().catch(console.error);
