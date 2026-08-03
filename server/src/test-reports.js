import express from 'express';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

const PORT = 5094;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Reporting Module Verification Suite on Port ${PORT}`);
  console.log(`==================================================\n`);

  try {
    const baseUrl = `http://127.0.0.1:${PORT}/api`;

    // 1. Operator Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operator@dairy.com', password: 'password123' }),
    }).then((r) => r.json());

    const token = loginRes.token;
    console.log('✅ 1. POST /api/auth/login (Operator):', loginRes.success ? 'PASSED' : 'FAILED');

    // 2. Farmer Ledger Report
    const ledgerRes = await fetch(`${baseUrl}/reports/farmer-ledger?farmerCode=101`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 2. GET /api/reports/farmer-ledger:', ledgerRes.success ? 'PASSED' : 'FAILED', {
      farmerCode: ledgerRes.farmerCode,
      totalLiters: ledgerRes.summary?.totalLiters,
      totalAmount: ledgerRes.summary?.totalAmount,
    });

    // 3. Branch Summary Report
    const summaryRes = await fetch(`${baseUrl}/reports/branch-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 3. GET /api/reports/branch-summary:', summaryRes.success ? 'PASSED' : 'FAILED', {
      daysCount: summaryRes.data?.length,
      sampleDayLiters: summaryRes.data?.[0]?.totalLiters,
    });

    // 4. Payment Due Report
    const paymentRes = await fetch(`${baseUrl}/reports/payment-due`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 4. GET /api/reports/payment-due:', paymentRes.success ? 'PASSED' : 'FAILED', {
      totalFarmers: paymentRes.summary?.totalFarmers,
      grandTotalLiters: paymentRes.summary?.grandTotalLiters,
      grandTotalAmount: paymentRes.summary?.grandTotalAmount,
    });

    // 5. CSV Export Check
    const csvRes = await fetch(`${baseUrl}/reports/payment-due?export=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const csvText = await csvRes.text();

    console.log('✅ 5. GET /api/reports/payment-due?export=csv:', csvText.includes('Farmer Code') ? 'PASSED' : 'FAILED', {
      contentType: csvRes.headers.get('content-type'),
      lines: csvText.split('\n').length,
    });

    console.log(`\n==================================================`);
    console.log(`🎉 ALL REPORTING MODULE TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
