import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({ email: 'ruturajbhoi9739@gmail.com' });
  if (user) {
    console.log('User found:', user.email);
    console.log('Created at:', user.createdAt);
  }
  process.exit(0);
};

run();
