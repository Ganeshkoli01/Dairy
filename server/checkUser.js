import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to DB');

    let user = await User.findOne({ email: 'ganeshkoli0149@gmail.com' });
    if (user) {
      console.log('User already exists:', user);
      
      // Optionally reset the password if it doesn't match
      const isMatch = await user.matchPassword('ganeshkoli@0149');
      if (!isMatch) {
        console.log('Password does not match, updating password...');
        user.password = 'ganeshkoli@0149';
        await user.save();
        console.log('Password updated.');
      } else {
        console.log('Password matches.');
      }
    } else {
      console.log('User does not exist. Creating as admin...');
      user = new User({
        email: 'ganeshkoli0149@gmail.com',
        password: 'ganeshkoli@0149',
        role: 'admin',
        adminProfile: {
          name: 'Ganesh Koli'
        }
      });
      await user.save();
      console.log('User created:', user);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

run();
