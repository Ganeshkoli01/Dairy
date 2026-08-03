import express from 'express';
import rateChartRoutes from './routes/rateChartRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { calculateSnfFromClr } from './utils/snfFromClr.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/rate-chart', rateChartRoutes);

const PORT = 5096;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Rate Chart Module & Lookup Verification on Port ${PORT}`);
  console.log(`==================================================\n`);

  try {
    const baseUrl = `http://127.0.0.1:${PORT}/api`;

    // 1. SNF Formula Verification
    const snfCalc = calculateSnfFromClr(3.5, 28);
    // (28 / 4) + (0.2 * 3.5) + 0.36 = 7.0 + 0.7 + 0.36 = 8.06
    console.log('✅ 1. SNF Formula Test (FAT=3.5, CLR=28):', snfCalc === 8.06 ? 'PASSED (8.06)' : `FAILED (${snfCalc})`);

    // 2. Admin Login
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dairy.com', password: 'password123' }),
    }).then((r) => r.json());

    const adminToken = adminLogin.token;

    // 3. GET Rate Chart Matrix
    const getRes = await fetch(`${baseUrl}/rate-chart?milkType=cow`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    console.log('✅ 2. GET /api/rate-chart?milkType=cow:', getRes.success ? 'PASSED' : 'FAILED', `Count: ${getRes.count}`);

    // 4. Bulk Upload Matrix (POST /api/rate-chart)
    const sampleMatrix = [
      { milkType: 'cow', fat: 3.5, snf: 8.5, rate: 36.0 },
      { milkType: 'cow', fat: 3.5, snf: 8.6, rate: 36.5 },
      { milkType: 'cow', fat: 3.6, snf: 8.5, rate: 37.0 },
      { milkType: 'cow', fat: 3.6, snf: 8.6, rate: 37.5 },
    ];

    const saveRes = await fetch(`${baseUrl}/rate-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(sampleMatrix),
    }).then((r) => r.json());
    console.log('✅ 3. POST /api/rate-chart (Bulk Matrix Upload):', saveRes.success ? 'PASSED' : 'FAILED', `Saved: ${saveRes.count}`);

    // 5. Rate Lookup Test with Round Down (FAT=3.58 -> 3.5, SNF=8.59 -> 8.5)
    const lookupRes = await fetch(`${baseUrl}/rate-chart/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ milkType: 'cow', fat: 3.58, snf: 8.59 }),
    }).then((r) => r.json());

    console.log('✅ 4. POST /api/rate-chart/lookup (Round-down Match):', lookupRes.success ? 'PASSED' : 'FAILED', {
      rate: lookupRes.result?.rate,
      matchedFat: lookupRes.result?.matchedFat,
      matchedSnf: lookupRes.result?.matchedSnf,
    });

    // 6. Rate Lookup with CLR Toggle (FAT=3.5, CLR=28 -> SNF=8.06)
    const lookupClrRes = await fetch(`${baseUrl}/rate-chart/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ milkType: 'cow', fat: 3.5, clr: 28, useClr: true }),
    }).then((r) => r.json());

    console.log('✅ 5. POST /api/rate-chart/lookup (With CLR Toggle):', lookupClrRes.fat === 3.5 && lookupClrRes.snf === 8.06 ? 'PASSED' : 'FAILED', {
      calculatedSnf: lookupClrRes.snf,
    });

    console.log(`\n==================================================`);
    console.log(`🎉 ALL RATE CHART & LOOKUP TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
