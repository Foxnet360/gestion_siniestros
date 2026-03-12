import { kpiService } from '../src/services/kpiService';

async function testKPIs() {
  console.log('Testing KPI calculations...\n');

  try {
    const overview = await kpiService.getOverview();
    console.log('Overview:', JSON.stringify(overview, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testKPIs();
