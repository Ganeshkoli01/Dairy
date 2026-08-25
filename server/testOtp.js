import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { Otp } from './src/models/Otp.js';

async function testOtp() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dairy_db');
  
  const email = 'testuser@example.com';
  
  // First time
  let otpCode = '111111';
  await Otp.findOneAndUpdate(
    { email: email },
    { otp: otpCode, createdAt: Date.now() },
    { upsert: true, new: true }
  );
  
  let record1 = await Otp.findOne({ email });
  console.log('Record after first update:', record1);
  
  // Second time
  otpCode = '222222';
  await Otp.findOneAndUpdate(
    { email: email },
    { otp: otpCode, createdAt: Date.now() },
    { upsert: true, new: true }
  );
  
  let record2 = await Otp.findOne({ email });
  console.log('Record after second update:', record2);

  await Otp.deleteMany({ email });
  process.exit(0);
}
testOtp();
