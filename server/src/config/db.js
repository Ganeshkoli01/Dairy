import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy_milk_collection';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Seed/Update Admin User in MongoDB
    let admin = await User.findOne({ email: 'ganeshkoli0149@gmail.com' });
    if (!admin) {
      await User.create({
        email: 'ganeshkoli0149@gmail.com',
        password: 'ganeshkoli@0149',
        role: 'admin',
        adminProfile: {
           name: 'Ganesh Koli (Admin)'
        }
      });
      console.log('[MongoDB Seed] Admin user ganeshkoli0149@gmail.com created successfully');
    } else {
      admin.password = 'ganeshkoli@0149';
      admin.role = 'admin';
      admin.adminProfile = { name: 'Ganesh Koli (Admin)' };
      await admin.save();
      console.log('[MongoDB Seed] Admin user ganeshkoli0149@gmail.com password resynced');
    }
  } catch (error) {
    console.error(`[MongoDB Warning] Database connection: ${error.message}`);
  }
};
