import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Loaded' : 'Missing');

async function test() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL || '',
        process.env.VITE_SUPABASE_ANON_KEY || ''
    );

    console.log('Testing connection...');
    const { data, error, count } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Connection error:', error);
    } else {
        console.log('Success! Count:', count);
    }
}

test().catch(console.error);
