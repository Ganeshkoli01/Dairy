import mongoose from 'mongoose';
import { User } from '../models/User.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy_milk_collection';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Seed/Update Owner User in MongoDB
    let admin = await User.findOne({ email: 'ganeshkoli0149@gmail.com' });
    if (!admin) {
      await User.create({
        name: 'Ganesh Koli (Owner)',
        email: 'ganeshkoli0149@gmail.com',
        password: 'ganeshkoli@0149',
        role: 'owner',
      });
      console.log('[MongoDB Seed] Owner user ganeshkoli0149@gmail.com created successfully');
    } else {
      admin.password = 'ganeshkoli@0149';
      admin.role = 'owner';
      await admin.save();
      console.log('[MongoDB Seed] Owner user ganeshkoli0149@gmail.com password resynced');
    }
  } catch (error) {
    console.error(`[MongoDB Warning] Database connection: ${error.message}`);
  }
};
