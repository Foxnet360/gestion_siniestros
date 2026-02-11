import { supabase } from './lib/supabase';
import { INITIAL_CLAIMS } from './constants';

async function seed() {
    console.log('Seeding database...');

    for (const claim of INITIAL_CLAIMS) {
        const { stateHistory, timeline, ...claimData } = claim;

        // Insert claim
        const { error: claimError } = await supabase
            .from('claims')
            .upsert(claimData);

        if (claimError) {
            console.error(`Error seeding claim ${claim.id_softseguros}:`, claimError);
            continue;
        }

        // Insert history
        if (stateHistory && stateHistory.length > 0) {
            const historyToInsert = stateHistory.map(h => ({
                ...h,
                claim_id: claim.id_softseguros
            }));
            await supabase.from('state_history').upsert(historyToInsert);
        }

        // Insert timeline
        if (timeline && timeline.length > 0) {
            const timelineToInsert = timeline.map(t => ({
                ...t,
                claim_id: claim.id_softseguros
            }));
            await supabase.from('timeline').upsert(timelineToInsert);
        }
    }

    console.log('Seeding complete!');
}

seed();
