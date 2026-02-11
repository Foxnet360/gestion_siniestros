import { createClient } from '@supabase/supabase-js';
import { INITIAL_CLAIMS } from '../constants';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
    console.log('Starting Supabase seed...');

    for (const claim of INITIAL_CLAIMS) {
        console.log(`Seeding claim: ${claim.id_softseguros}`);

        const { stateHistory, timeline, ...claimData } = claim;

        // Insert Claim
        const { error: claimError } = await supabase
            .from('claims')
            .upsert(claimData);

        if (claimError) {
            console.error(`Error seeding claim ${claim.id_softseguros}:`, claimError);
            continue;
        }

        // Insert History
        if (stateHistory && stateHistory.length > 0) {
            const historyToInsert = stateHistory.map(h => ({
                claim_id: claim.id_softseguros,
                ...h
            }));
            const { error: hError } = await supabase.from('state_history').insert(historyToInsert);
            if (hError) console.error(`Error seeding history for ${claim.id_softseguros}:`, hError);
        }

        // Insert Timeline
        if (timeline && timeline.length > 0) {
            const timelineToInsert = timeline.map(t => ({
                claim_id: claim.id_softseguros,
                ...t
            }));
            const { error: tError } = await supabase.from('timeline').insert(timelineToInsert);
            if (tError) console.error(`Error seeding timeline for ${claim.id_softseguros}:`, tError);
        }
    }

    console.log('Seeding complete!');
}

seed().catch(console.error);
