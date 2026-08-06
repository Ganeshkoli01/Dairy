import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const owners = await User.find({ role: 'dairyOwner' }).lean();
  console.log(JSON.stringify(owners, null, 2));
  
  process.exit(0);
};

run();
