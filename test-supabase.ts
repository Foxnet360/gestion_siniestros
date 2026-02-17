import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


async function testConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Test 1: Check claims table
    console.log('1️⃣ Testing claims table...');
    const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .limit(1);

    if (claimsError) {
        console.error('❌ Claims query failed:', claimsError);
    } else {
        console.log('✅ Claims table accessible');
        console.log('Sample claim columns:', claims?.[0] ? Object.keys(claims[0]) : 'No data');
    }

    // Test 2: Check state_history table
    console.log('\n2️⃣ Testing state_history table...');
    const { data: history, error: historyError } = await supabase
        .from('state_history')
        .select('*')
        .limit(1);

    if (historyError) {
        console.error('❌ State history query failed:', historyError);
    } else {
        console.log('✅ State history table accessible');
        console.log('Sample history columns:', history?.[0] ? Object.keys(history[0]) : 'No data');
    }

    // Test 3: Check timeline table
    console.log('\n3️⃣ Testing timeline table...');
    const { data: timeline, error: timelineError } = await supabase
        .from('timeline')
        .select('*')
        .limit(1);

    if (timelineError) {
        console.error('❌ Timeline query failed:', timelineError);
    } else {
        console.log('✅ Timeline table accessible');
        console.log('Sample timeline columns:', timeline?.[0] ? Object.keys(timeline[0]) : 'No data');
    }

    // Test 4: Try inserting a test state_history record
    console.log('\n4️⃣ Testing state_history INSERT with camelCase...');
    const testHistory = {
        claim_id: 'TEST_ID',
        state: 'TEST_STATE',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        daysDuration: 1,
        author: 'Test'
    };

    const { error: insertError } = await supabase
        .from('state_history')
        .insert(testHistory);

    if (insertError) {
        console.error('❌ INSERT failed (camelCase):', insertError.message);
        console.log('   This confirms column name mismatch!');
    } else {
        console.log('✅ INSERT succeeded with camelCase');
        // Clean up
        await supabase.from('state_history').delete().eq('claim_id', 'TEST_ID');
    }

    // Test 5: Try with snake_case
    console.log('\n5️⃣ Testing state_history INSERT with snake_case...');
    const testHistorySnake = {
        claim_id: 'TEST_ID',
        state: 'TEST_STATE',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        days_duration: 1,
        author: 'Test'
    };

    const { error: insertErrorSnake } = await supabase
        .from('state_history')
        .insert(testHistorySnake);

    if (insertErrorSnake) {
        console.error('❌ INSERT failed (snake_case):', insertErrorSnake.message);
    } else {
        console.log('✅ INSERT succeeded with snake_case');
        console.log('   This confirms DB uses snake_case!');
        // Clean up
        await supabase.from('state_history').delete().eq('claim_id', 'TEST_ID');
    }

    console.log('\n✅ Connection test complete!');
}

testConnection().catch(console.error);
