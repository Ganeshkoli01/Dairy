import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from './src/models/User.js';
import { Otp } from './src/models/Otp.js';

dotenv.config({ path: '.env' });

async function simulate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find a dairy owner
  const owner = await User.findOne({ role: 'dairyOwner' });
  if (!owner) {
    console.log("No dairy owner found.");
    process.exit(1);
  }

  console.log("Found owner:", owner.email);

  // Generate token
  const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

  // 1. Generate OTP
  const otpCode = '999999';
  await Otp.findOneAndUpdate(
    { email: owner.email },
    { otp: otpCode, createdAt: Date.now() },
    { upsert: true, new: true }
  );
  
  console.log("OTP written to DB:", otpCode);

  // 2. Call createOrder API directly (simulate)
  // We can just run the logic here
  const otpRecord = await Otp.findOne({ email: owner.email }).sort({ createdAt: -1 });
  console.log("DB OTP:", otpRecord.otp, typeof otpRecord.otp);
  console.log("Provided OTP:", otpCode, typeof otpCode);
  
  if (String(otpRecord.otp).trim() !== String(otpCode).trim()) {
    console.log("Invalid OTP");
  } else {
    console.log("OTP Matches!");
  }
  
  process.exit(0);
}

simulate();
