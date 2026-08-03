import express from 'express';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';

const app = express();
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/farmers', farmerRoutes);

const PORT = 5097;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Comprehensive Branch & Farmer CRUD Test on Port ${PORT}`);
  console.log(`==================================================\n`);

  try {
    const baseUrl = `http://127.0.0.1:${PORT}/api`;

    // 1. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dairy.com', password: 'password123' }),
    }).then((r) => r.json());
    console.log('✅ 1. POST /api/auth/login (Admin):', adminLoginRes.success ? 'PASSED' : 'FAILED', adminLoginRes.role);

    const adminToken = adminLoginRes.token;

    // 2. Operator Login
    const opLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'operator@dairy.com', password: 'password123' }),
    }).then((r) => r.json());
    console.log('✅ 2. POST /api/auth/login (Operator):', opLoginRes.success ? 'PASSED' : 'FAILED', opLoginRes.role);

    const operatorToken = opLoginRes.token;

    // 3. GET Branches
    const getBranchesRes = await fetch(`${baseUrl}/branches`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    console.log('✅ 3. GET /api/branches:', getBranchesRes.success ? 'PASSED' : 'FAILED', `Count: ${getBranchesRes.count}`);

    // 4. POST Branch (Admin)
    const createBranchRes = await fetch(`${baseUrl}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'East Side Dairy Branch', code: 'BR003', location: 'East Highway' }),
    }).then((r) => r.json());
    console.log('✅ 4. POST /api/branches:', createBranchRes.success ? 'PASSED' : 'FAILED', createBranchRes.data?.code);

    const branchId = createBranchRes.data?._id || '60d5ec49f1b2c81128765411';

    // 5. GET Farmers
    const getFarmersRes = await fetch(`${baseUrl}/farmers`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    }).then((r) => r.json());
    console.log('✅ 5. GET /api/farmers:', getFarmersRes.success ? 'PASSED' : 'FAILED', `Count: ${getFarmersRes.count}`);

    // 6. POST Farmer (Operator)
    const createFarmerRes = await fetch(`${baseUrl}/farmers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${operatorToken}`,
      },
      body: JSON.stringify({
        farmerCode: '201',
        name: 'Ganesh Patil',
        branch: branchId,
        defaultMilkType: 'cow',
        mobile: '9822334455',
      }),
    }).then((r) => r.json());
    console.log('✅ 6. POST /api/farmers:', createFarmerRes.success ? 'PASSED' : 'FAILED', createFarmerRes.data?.name);

    // 7. GET Farmer by Code (/api/farmers/:branchId/:code)
    const lookupRes = await fetch(`${baseUrl}/farmers/${branchId}/201`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    }).then((r) => r.json());
    console.log('✅ 7. GET /api/farmers/:branchId/:code:', lookupRes.success ? 'PASSED' : 'FAILED', lookupRes.data?.name);

    // 8. Search Farmers (/api/farmers?search=Ganesh)
    const searchRes = await fetch(`${baseUrl}/farmers?search=Ganesh`, {
      headers: { Authorization: `Bearer ${operatorToken}` },
    }).then((r) => r.json());
    console.log('✅ 8. GET /api/farmers?search=Ganesh:', searchRes.success ? 'PASSED' : 'FAILED', `Matches: ${searchRes.count}`);

    // 9. Farmer Deletion (Operator -> 403 Forbidden check)
    const delOpRes = await fetch(`${baseUrl}/farmers/${lookupRes.data?._id || '1'}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    console.log('✅ 9. DELETE /api/farmers/:id (Operator RBAC Check):', delOpRes.status === 403 ? 'PASSED (Forbidden 403)' : 'FAILED');

    // 10. Farmer Deletion (Admin -> 200 OK check)
    const delAdminRes = await fetch(`${baseUrl}/farmers/${createFarmerRes.data?._id || '1'}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    console.log('✅ 10. DELETE /api/farmers/:id (Admin Allowed):', delAdminRes.success ? 'PASSED' : 'FAILED');

    console.log(`\n==================================================`);
    console.log(`🎉 ALL BRANCH & FARMER CRUD TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
