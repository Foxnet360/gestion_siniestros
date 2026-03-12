import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function start() {
    console.log('🚀 Starting population with pathToFileURL...');
    
    const servicePath = resolve(__dirname, '../src/services/MetricasEtapasService.ts');
    const serviceUrl = pathToFileURL(servicePath).href;
    console.log('Importing from:', serviceUrl);
    
    const { MetricasEtapasService } = await import(serviceUrl);
    const service = new MetricasEtapasService();

    const { data: items, error } = await supabase.from('siniestro_etapas').select('claim_id');
    if (error) { console.error(error); return; }
    console.log(`📊 Found ${items.length} records.`);

    let ok = 0, skip = 0, err = 0;
    for (const item of items) {
        const claimId = item.claim_id;
        if (!claimId) continue;
        try {
            const res = await service.calcularMetricasSiniestro(claimId);
            if (res.exito && res.metricas.length > 0) {
                const { error: saveError } = await supabase.from('metricas_etapas').upsert(
                    res.metricas.map(m => ({
                        claim_id: m.claimId,
                        etapa_num: m.etapaNum,
                        fecha_entrada: m.fechaEntrada,
                        fecha_salida: m.fechaSalida,
                        dias_habiles: m.diasHabiles,
                        dias_calendario: m.diasCalendario,
                        cantidad_seguimientos: m.cantidadSeguimientos,
                        frecuencia_dias: m.frecuenciaDias,
                        dias_sla: m.diasSLA,
                        cumple_sla: m.cumpleSLA,
                        desviacion_sla: m.desviacionSLA,
                        paso_a_siguiente_etapa: m.pasoASiguienteEtapa,
                        etapa_siguiente: m.etapaSiguiente,
                        datos_completos: m.datosCompletos,
                        razon_incompleto: m.razonIncompleto,
                        aseguradora_id: m.aseguradoraId,
                        ramo_id: m.ramoId,
                        tecnico_id: m.tecnicoId,
                        tipo_proceso: m.tipoProceso,
                    })),
                    { onConflict: 'claim_id,etapa_num' }
                );
                if (!saveError) ok++; else err++;
            } else skip++;
        } catch (e) { err++; }
        if ((ok + skip + err) % 100 === 0 || (ok+skip+err) === items.length) {
            console.log(`Progress: ${ok + skip + err}/${items.length} (OK: ${ok}, Skip: ${skip}, Err: ${err})`);
        }
    }
    console.log('Done.');
}
start().catch(console.error);
