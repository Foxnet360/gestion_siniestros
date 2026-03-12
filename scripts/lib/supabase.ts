import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Cargar variables de entorno
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

// Cliente de Supabase para scripts Node.js (fuera de Vite)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están definidas'
  );
  console.error('Asegúrate de tener un archivo .env en la raíz del proyecto');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
