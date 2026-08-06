import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = 'ruturajbhoi9739@gmail.com';
  
  const user = await User.findOne({ email });
  if (user) {
    console.log('User found:', user.email);
    console.log('Hashed pass:', user.password);
    
    // Check if the hash starts with $2a$
    // Is it double hashed? We can't know for sure, but we can test if it matches a known password.
    // If the user's screenshot shows password length 7 dots, they might have typed something specific.
  }
  
  // Let's create a test user
  await User.deleteOne({ email: 'test_farmer_123@gmail.com' });
  const testUser = await User.create({
    email: 'test_farmer_123@gmail.com',
    password: 'password123',
    role: 'farmer'
  });
  
  console.log('Test User created. Hash:', testUser.password);
  const match = await testUser.matchPassword('password123');
  console.log('Match?', match);
  
  // Clean up
  await User.deleteOne({ email: 'test_farmer_123@gmail.com' });
  
  process.exit(0);
};

run();
