import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const user = await User.findOne({ email: 'ganeshkoli23112005@gmail.com' });
    console.log('User found:', JSON.stringify(user, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}
checkUser();
