import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: claims } = await supabase.from('claims').select('*');
  if (!claims) return;
  
  const normalize = (text: string) => {
    return (
      text
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase() || ''
    );
  };

  const activeClaims = claims.filter(c => {
    const estado = normalize(c.estado_softseguros);
    return (
      !estado.includes('FINALIZADO') && 
      !estado.includes('PAGADO') && 
      c.finalizado !== true &&
      c.fecha_finalizacion == null
    );
  });
  
  console.log(`Total claims: ${claims.length}`);
  console.log(`Active claims after filter: ${activeClaims.length}`);
  
  const finalizedByEstado = claims.filter(c => normalize(c.estado_softseguros).includes('FINALIZADO') || normalize(c.estado_softseguros).includes('PAGADO')).length;
  const finalizedByFinalizado = claims.filter(c => c.finalizado === true).length;
  const finalizedByFecha = claims.filter(c => c.fecha_finalizacion != null).length;
  
  console.log(`finalizedByEstado: ${finalizedByEstado}`);
  console.log(`finalizedByFinalizado: ${finalizedByFinalizado}`);
  console.log(`finalizedByFecha: ${finalizedByFecha}`);
}

run();
