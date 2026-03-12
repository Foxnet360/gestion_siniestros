import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  let allClaims: any[] = [];
  let from = 0;
  let hasMore = true;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    const { data, error } = await supabase
      .from('claims')
      .select('id_softseguros, estado_softseguros, fecha_finalizacion, finalizado')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error:", error);
      break;
    }

    allClaims = allClaims.concat(data || []);
    if ((data?.length || 0) < PAGE_SIZE) {
      hasMore = false;
    } else {
      from += PAGE_SIZE;
    }
  }

  const normalize = (text: string) => {
    return (
      text
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase() || ''
    );
  };
  
  if (allClaims.length > 0) {
    // Current Logic (Old)
    const oldFinalizadosCount = allClaims.filter((c: any) => {
      const estado = normalize(c.estado_softseguros);
      return (
        estado.includes('FINALIZADO') ||
        estado.includes('PAGADO') ||
        estado.includes('PAGO') ||
        c.fecha_finalizacion != null
      );
    }).length;

    const oldActivosCount = allClaims.filter((c: any) => {
      const estado = normalize(c.estado_softseguros);
      return (
        !estado.includes('FINALIZADO') &&
        !estado.includes('PAGADO') &&
        !estado.includes('PAGO') &&
        c.fecha_finalizacion == null
      );
    }).length;

    // Fixed Logic
    const fixedFinalizadosCount = allClaims.filter((c: any) => {
      const estado = normalize(c.estado_softseguros);
      return (
        estado.includes('FINALIZADO') ||
        estado.includes('PAGADO') ||
        estado.includes('PAGO') ||
        c.fecha_finalizacion != null ||
        c.finalizado === true
      );
    }).length;

    const fixedActivosCount = allClaims.filter((c: any) => {
      const estado = normalize(c.estado_softseguros);
      return (
        !estado.includes('FINALIZADO') &&
        !estado.includes('PAGADO') &&
        !estado.includes('PAGO') &&
        c.fecha_finalizacion == null &&
        c.finalizado !== true
      );
    }).length;

    console.log("Total Claims Fetched:", allClaims.length);
    console.log("--- OLD LOGIC (INCORRECT) ---");
    console.log("Finalizados:", oldFinalizadosCount);
    console.log("Activos:", oldActivosCount);
    console.log("--- FIXED LOGIC ---");
    console.log("Finalizados:", fixedFinalizadosCount);
    console.log("Activos:", fixedActivosCount);
  }
}

run();
