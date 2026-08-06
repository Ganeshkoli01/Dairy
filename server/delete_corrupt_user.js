import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import { Farmer } from './src/models/Farmer.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = 'ruturajbhoi9739@gmail.com';
  
  const user = await User.findOne({ email });
  if (user) {
    console.log('Deleting corrupted user:', user.email);
    await User.deleteOne({ email });
  }
  
  // Also delete the farmer if it exists, to clean up completely
  const farmer = await Farmer.findOne({ 'mobile': 'ruturajbhoi' }); // can't reliably find farmer by email as it's not stored in Farmer doc! Wait, Farmer doc doesn't have email.
  // We can find Farmer by farmerCode or name, but we don't know it.
  // Actually, we can just let them create a new farmer with a new code.
  
  process.exit(0);
};

run();
