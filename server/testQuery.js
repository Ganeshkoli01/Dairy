import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Branch = mongoose.connection.collection('branches'); 
  const waghapur = await Branch.findOne({ name: /waghapur/i }); 
  console.log('Branch ID:', waghapur._id); 
  
  const collections = await mongoose.connection.collection('milkcollections').find({ 
    branch: waghapur._id, 
    date: { $gte: new Date('2026-08-01') } 
  }).toArray(); 
  
  console.log('Collections for Waghapur:', collections.length); 
  
  let emailsSent = 0;
  if(collections.length > 0) { 
    const uniqueFarmers = [...new Set(collections.map(c => c.farmerCode))];
    for (const farmerCode of uniqueFarmers) {
      const user = await mongoose.connection.collection('users').findOne({ 
        role: 'farmer', 
        'farmerProfile.farmerCode': farmerCode, 
        'farmerProfile.branch': waghapur._id 
      }); 
      console.log(`Farmer Code ${farmerCode}: Email = ${user ? user.email : 'No user/email'}`); 
      if (user && user.email) emailsSent++;
    }
  } 
  
  console.log('Emails that would be sent:', emailsSent);
  process.exit(0); 
});
