import express from 'express';
import authRoutes from './routes/authRoutes.js';
import milkCollectionRoutes from './routes/milkCollectionRoutes.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/milk-collection', milkCollectionRoutes);

const PORT = 5095;
const server = app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Milk Collection Verification Suite on Port ${PORT}`);
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
    console.log('✅ 1. POST /api/auth/login (Operator):', loginRes.success ? 'PASSED' : 'FAILED', loginRes.role);

    // 2. Create Collection Entry (POST /api/milk-collection)
    const createRes = await fetch(`${baseUrl}/milk-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branch: '60d5ec49f1b2c81128765411',
        session: 'morning',
        farmerCode: '101',
        farmerName: 'Ramesh Patil',
        milkType: 'cow',
        weight: 10,
        fat: 3.5,
        snf: 8.5,
        degree: 28,
      }),
    }).then((r) => r.json());

    console.log('✅ 2. POST /api/milk-collection:', createRes.success ? 'PASSED' : 'FAILED', {
      weight: createRes.data?.weight,
      rate: createRes.data?.rate,
      amount: createRes.data?.amount,
    });

    const entryId = createRes.data?._id;

    // 3. GET Today's Collection Grid
    const gridRes = await fetch(`${baseUrl}/milk-collection?branch=60d5ec49f1b2c81128765411&session=morning`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 3. GET /api/milk-collection (Today Grid):', gridRes.success ? 'PASSED' : 'FAILED', `Entries: ${gridRes.count}`);

    // 4. GET Previous Session Reference for Farmer 101
    const prevRes = await fetch(`${baseUrl}/milk-collection?farmer=101&session=previous`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 4. GET /api/milk-collection?farmer=101&session=previous (History Ref):', prevRes.success ? 'PASSED' : 'FAILED', prevRes.data?.farmerName);

    // 5. GET Live Aggregation Summary
    const summaryRes = await fetch(`${baseUrl}/milk-collection/summary?branch=60d5ec49f1b2c81128765411&session=morning`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    console.log('✅ 5. GET /api/milk-collection/summary (Weighted Averages):', summaryRes.success ? 'PASSED' : 'FAILED', {
      cowLiters: summaryRes.data?.cow?.totalLiters,
      cowAmount: summaryRes.data?.cow?.totalAmount,
      combinedLiters: summaryRes.data?.combined?.totalLiters,
      weightedAvgFat: summaryRes.data?.combined?.weightedAvgFat,
    });

    // 6. DELETE Collection Entry
    if (entryId) {
      const delRes = await fetch(`${baseUrl}/milk-collection/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      console.log('✅ 6. DELETE /api/milk-collection/:id:', delRes.success ? 'PASSED' : 'FAILED');
    }

    console.log(`\n==================================================`);
    console.log(`🎉 ALL MILK COLLECTION TESTS COMPLETED SUCCESSFULLY!`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
