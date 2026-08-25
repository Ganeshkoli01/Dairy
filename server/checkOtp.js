import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function checkOtp() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dairy_db');
  const otps = await mongoose.connection.collection('otps').find({}).toArray();
  console.log('OTPs in DB (Atlas):', otps);
  process.exit(0);
}
checkOtp();
