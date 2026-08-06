import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const farmer = await User.findOne({ email: 'ruturajbhoi9739@gmail.com' });
  if (farmer) {
    console.log('Farmer found:', farmer.email);
    console.log('Stored Hashed password:', farmer.password);
    
    // I don't know the password the user used, so I can't compare it.
    // Wait, let's create a new farmer programmatically and see if it works.
  } else {
    console.log('Farmer not found');
  }
  process.exit(0);
};

run();
