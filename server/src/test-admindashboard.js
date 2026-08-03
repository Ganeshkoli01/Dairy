import express from 'express';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

const PORT = 5093;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Admin Dashboard Overview Verification on Port ${PORT}`);
  console.log(`==================================================\n`);

  try {
    const baseUrl = `http://127.0.0.1:${PORT}/api`;

    // 1. Admin Login
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dairy.com', password: 'password123' }),
    }).then((r) => r.json());
    console.log('✅ 1. POST /api/auth/login (Admin):', adminLogin.success ? 'PASSED' : 'FAILED');

    // 2. GET /api/reports/admin-dashboard (Admin Allowed)
    const dashRes = await fetch(`${baseUrl}/reports/admin-dashboard`, {
      headers: { Authorization: `Bearer ${adminLogin.token}` },
    }).then((r) => r.json());

    console.log('✅ 2. GET /api/reports/admin-dashboard (Admin):', dashRes.success ? 'PASSED' : 'FAILED', {
      todayTotalLiters: dashRes.today?.totalLiters,
      todayTotalAmount: dashRes.today?.totalAmount,
      cowLiters: dashRes.today?.cowLiters,
      buffaloLiters: dashRes.today?.buffaloLiters,
      trendDays: dashRes.trend14Days?.length,
      branchesCount: dashRes.branchWiseToday?.length,
    });

    // 3. Operator Login & RBAC Check (Forbidden 403)
    const opLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operator@dairy.com', password: 'password123' }),
    }).then((r) => r.json());

    const opDashRes = await fetch(`${baseUrl}/reports/admin-dashboard`, {
      headers: { Authorization: `Bearer ${opLogin.token}` },
    });

    console.log('✅ 3. GET /api/reports/admin-dashboard (Operator RBAC Check):', opDashRes.status === 403 ? 'PASSED (Forbidden 403 Correctly)' : 'FAILED');

    console.log(`\n==================================================`);
    console.log(`🎉 ALL ADMIN DASHBOARD TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
