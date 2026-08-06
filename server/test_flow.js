async function testFullFlow() {
  try {
    const randomNum = Math.floor(Math.random() * 10000);
    
    // 1. Register Owner (creates Branch)
    const ownerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'dairyOwner',
        email: `owner${randomNum}@dairy.com`,
        password: 'password123',
        ownerName: `Owner ${randomNum}`,
        branchName: `Branch ${randomNum}`,
        branchNumber: `BR${randomNum}`
      })
    });
    const ownerData = await ownerRes.json();
    console.log('Owner Register:', ownerData.success);

    // 2. Fetch Branches to get the new branch ID
    const branchesRes = await fetch('http://localhost:5000/api/branches');
    const branchesData = await branchesRes.json();
    const newBranch = branchesData.data.find(b => b.code === `BR${randomNum}`);
    console.log('Found Auto-Created Branch:', newBranch?.name);

    if (!newBranch) return;

    // 3. Register Farmer in that Branch
    const farmerCode = `F${randomNum}`;
    const farmerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'farmer',
        email: `farmer${randomNum}@dairy.com`,
        password: 'password123',
        farmerCode: farmerCode,
        farmerName: `Farmer ${randomNum}`,
        milkType: 'cow',
        branch: newBranch._id
      })
    });
    const farmerData = await farmerRes.json();
    console.log('Farmer Register:', farmerData.success);

    // 4. Verify Farmer List for the Branch
    // We can just call /api/farmers?branch=newBranch._id
    // But since the route is protected, we need to pass a token. 
    // Wait, the API routes for farmers might require token authentication.
    const token = ownerData.token; 
    const farmersRes = await fetch(`http://localhost:5000/api/farmers`, { // branch is fetched from token for dairyOwner!
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const farmersListData = await farmersRes.json();
    console.log(`Farmers in Owner's Branch:`, farmersListData.count);
    
    const found = farmersListData.data.find(f => f.farmerCode === farmerCode);
    if (found) {
      console.log('SUCCESS: Farmer was correctly added to the Farmer Collection and appeared in the list!');
    } else {
      console.log('ERROR: Farmer NOT found in the list.');
    }

  } catch (err) {
    console.error(err);
  }
}

testFullFlow();
