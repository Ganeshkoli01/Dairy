import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({ role: 'farmer' }).toArray();
  const collections = await mongoose.connection.collection('milkcollections').find({ 
    date: { $gte: new Date('2026-08-01') } 
  }).toArray();
  
  console.log('Farmers:');
  users.forEach(u => console.log(`- Code: ${u.farmerProfile?.farmerCode}, Email: ${u.email}`));
  
  console.log(`\nTotal Collections since Aug 1, 2026: ${collections.length}`);
  if (collections.length > 0) {
    console.log('Sample Collection:');
    console.log(`  Farmer Code: ${collections[0].farmerCode}`);
    console.log(`  Date: ${collections[0].date}`);
    console.log(`  Amount: ${collections[0].amount}`);
  }
  
  process.exit(0);
});
