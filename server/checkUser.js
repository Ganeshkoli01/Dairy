import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy_app');
    console.log('Connected to DB');
    
    const email = 'ganeshkoli0149@gmail.com';
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        role: user.role
      });
      const isMatch = await user.matchPassword('ganeshkoli@0149');
      console.log('Password match:', isMatch);
    } else {
      console.log('User NOT found for email:', email);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

checkUser();
