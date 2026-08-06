
async function testFarmerRegistration() {
  try {
    // 1. Get Branches
    const branchesRes = await fetch('http://localhost:5000/api/branches');
    const branchesData = await branchesRes.json();
    if (!branchesData.success || branchesData.data.length === 0) {
      console.log('No branches available for testing.');
      return;
    }
    const branch = branchesData.data[0];

    // 2. Register Farmer
    const randomNum = Math.floor(Math.random() * 10000);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'farmer',
        email: `testfarmer${randomNum}@dairy.com`,
        password: 'password123',
        phone: '1234567890',
        farmerCode: `F${randomNum}`,
        farmerName: `Test Farmer ${randomNum}`,
        milkType: 'cow',
        branch: branch._id
      })
    });
    
    const regData = await regRes.json();
    console.log('Farmer Register:', regData);

    if (regData.success) {
      // 3. Check Farmer List for that Branch
      const farmersRes = await fetch(`http://localhost:5000/api/farmers?branch=${branch._id}`);
      const farmersData = await farmersRes.json();
      console.log(`Farmers in Branch ${branch.name}:`, farmersData.count);
      
      const found = farmersData.data.find(f => f.farmerCode === `F${randomNum}`);
      if (found) {
        console.log('SUCCESS: Farmer was found in the Farmer List!');
      } else {
        console.log('ERROR: Farmer NOT found in the Farmer List.');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

testFarmerRegistration();
