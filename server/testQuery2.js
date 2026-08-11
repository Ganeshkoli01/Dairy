import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({ role: 'farmer' }).toArray(); 
  console.log(users.filter(u => u.email).map(u => ({ email: u.email, code: u.farmerProfile?.farmerCode, branch: u.farmerProfile?.branch })));
  
  process.exit(0); 
});
