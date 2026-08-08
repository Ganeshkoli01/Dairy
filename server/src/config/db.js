import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Branch } from '../models/Branch.js';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };
      cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
        return mongoose;
      });
    }
    
    cached.conn = await cached.promise;
    console.log(`[MongoDB] Connected Successfully to Atlas: ${cached.conn.connection.host}`);


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
    console.error(`[MongoDB Error] Failed to connect to database: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};
