import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createProcurement } from './src/controllers/procurementController.js';
import { User } from './src/models/User.js';
import Product from './src/models/Product.js';
import { Branch } from './src/models/Branch.js';

dotenv.config({ path: './.env' });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const admin = await User.findOne({ role: 'admin' });
  const product = await Product.findOne();
  const branch = await Branch.findOne();

  const req = {
    user: admin,
    body: {
      product: product._id,
      quantity: 1,
      plantTransferPrice: 32,
      cogs: 26,
      branch: branch._id
    }
  };

  const res = {
    status: (code) => {
      console.log('STATUS:', code);
      return {
        json: (data) => {
          console.log('JSON:', JSON.stringify(data, null, 2));
        }
      };
    }
  };

  try {
    await createProcurement(req, res);
  } catch (err) {
    console.error('UNCAUGHT ERROR:', err);
  }

  process.exit(0);
};

run();
