import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const fCode = '7';
    const branch = '6a76eb234aed0de89173a750'; 

    const farmerUsers = await User.find({
      role: 'farmer',
      'farmerProfile.farmerCode': fCode,
      'farmerProfile.branch': branch
    });
    
    console.log(`Found ${farmerUsers.length} users with fCode 7 on this branch.`);
    farmerUsers.forEach(u => console.log('Email:', u.email, 'ID:', u._id, 'milkType:', u.farmerProfile.milkType));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}
testQuery();
