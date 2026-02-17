import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyPersistence() {
    console.log('🧪 VERIFICATION TEST: Supabase Persistence\n');
    console.log('Testing tasks 4.1 and 4.2 from tasks.md\n');
    console.log('═'.repeat(60));

    const testClaimId = `TEST_${Date.now()}`;

    try {
        // Step 1: Create a test claim
        console.log('\n📝 Step 1: Creating test claim...');
        const testClaim = {
            id_softseguros: testClaimId,
            numero_siniestro: 'TEST-001',
            poliza: 'POL-TEST',
            asegurado: 'Test User',
            placa_bien: 'ABC-123',
            monto_reclamo: 1000,
            valor_deducible: 100,
            valor_indemnizacion: 900,
            prioridad: 'Media',
            estado_softseguros: 'Abierto',
            estado_interno: 'AVISO SINIESTRO',
            usuario_registro: 'test@example.com',
            fecha_ocurrencia: new Date().toISOString(),
            ultimo_seguimiento_raw: 'Test',
            lastStateChangeDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ramo: 'Autos',
            aseguradora: 'Test Insurance',
            vendedor: 'Test Seller',
            tecnico_asignado: 'Test Tech',
            aliado_origen: 'Test Ally'
        };

        const { error: insertError } = await supabase
            .from('claims')
            .insert(testClaim);

        if (insertError) {
            console.error('❌ Failed to create test claim:', insertError);
            return;
        }
        console.log('✅ Test claim created:', testClaimId);

        // Step 2: Simulate state change (like ClaimsContext.changeClaimState)
        console.log('\n🔄 Step 2: Changing claim state...');
        const newState = 'OBTENCIÓN SOPORTES';
        const now = new Date();

        // Update claim
        const { error: updateError } = await supabase
            .from('claims')
            .update({
                estado_interno: newState,
                lastStateChangeDate: now.toISOString(),
                updatedAt: now.toISOString()
            })
            .eq('id_softseguros', testClaimId);

        if (updateError) {
            console.error('❌ Failed to update claim:', updateError);
            return;
        }

        // Insert state history
        const historyEntry = {
            claim_id: testClaimId,
            state: 'AVISO SINIESTRO',
            startDate: testClaim.lastStateChangeDate,
            endDate: now.toISOString(),
            daysDuration: 1,
            author: 'Test Tech'
        };

        const { error: historyError } = await supabase
            .from('state_history')
            .insert(historyEntry);

        if (historyError) {
            console.error('❌ Failed to insert state history:', historyError);
            return;
        }

        // Insert timeline event
        const timelineEntry = {
            claim_id: testClaimId,
            date: now.toISOString(),
            author: 'Sistema',
            text: `Estado cambiado de AVISO SINIESTRO a ${newState} por Test Tech`,
            isSystem: true
        };

        const { error: timelineError } = await supabase
            .from('timeline')
            .insert(timelineEntry);

        if (timelineError) {
            console.error('❌ Failed to insert timeline:', timelineError);
            return;
        }

        console.log('✅ State changed to:', newState);
        console.log('✅ State history recorded');
        console.log('✅ Timeline event created');

        // Step 3: Simulate page refresh - fetch data fresh
        console.log('\n🔄 Step 3: Simulating page refresh (re-fetching data)...');

        const { data: refreshedClaims, error: fetchError } = await supabase
            .from('claims')
            .select('*, state_history(*), timeline(*)')
            .eq('id_softseguros', testClaimId);

        if (fetchError) {
            console.error('❌ Failed to fetch after refresh:', fetchError);
            return;
        }

        const refreshedClaim = refreshedClaims?.[0];

        if (!refreshedClaim) {
            console.error('❌ Claim not found after refresh!');
            return;
        }

        // Verification
        console.log('\n✅ VERIFICATION RESULTS:');
        console.log('═'.repeat(60));

        // Task 4.1: Verify state change persisted
        const stateMatches = refreshedClaim.estado_interno === newState;
        console.log(`\n[Task 4.1] State change persisted: ${stateMatches ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Expected: ${newState}`);
        console.log(`  Got: ${refreshedClaim.estado_interno}`);

        // Task 4.2: Verify dashboard data reflects Supabase
        const hasHistory = refreshedClaim.state_history?.length > 0;
        const hasTimeline = refreshedClaim.timeline?.length > 0;

        console.log(`\n[Task 4.2] Dashboard reflects Supabase data:`);
        console.log(`  State history loaded: ${hasHistory ? '✅ PASS' : '❌ FAIL'} (${refreshedClaim.state_history?.length || 0} entries)`);
        console.log(`  Timeline loaded: ${hasTimeline ? '✅ PASS' : '❌ FAIL'} (${refreshedClaim.timeline?.length || 0} entries)`);

        if (hasHistory) {
            console.log(`\n  Latest history entry:`);
            console.log(`    State: ${refreshedClaim.state_history[0].state}`);
            console.log(`    Duration: ${refreshedClaim.state_history[0].daysDuration} days`);
            console.log(`    Author: ${refreshedClaim.state_history[0].author}`);
        }

        if (hasTimeline) {
            console.log(`\n  Latest timeline event:`);
            console.log(`    Text: ${refreshedClaim.timeline[0].text}`);
            console.log(`    Author: ${refreshedClaim.timeline[0].author}`);
            console.log(`    System: ${refreshedClaim.timeline[0].isSystem}`);
        }

        // Overall result
        const allPassed = stateMatches && hasHistory && hasTimeline;
        console.log('\n' + '═'.repeat(60));
        console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);

        if (allPassed) {
            console.log('\n✨ Supabase persistence is working correctly!');
            console.log('   - State changes persist after refresh ✅');
            console.log('   - Dashboard data reflects Supabase ✅');
            console.log('   - Related data (history, timeline) loads correctly ✅');
        }

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('state_history').delete().eq('claim_id', testClaimId);
        await supabase.from('timeline').delete().eq('claim_id', testClaimId);
        await supabase.from('claims').delete().eq('id_softseguros', testClaimId);
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    }
}

verifyPersistence().catch(console.error);
