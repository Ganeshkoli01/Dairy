import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const migration = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;

    // 1. Migrate Products
    console.log('Migrating Products...');
    const productUpdateResult = await db.collection('products').updateMany(
      { purchasePrice: { $exists: true } },
      {
        $rename: { purchasePrice: 'plantTransferPrice' },
        $set: { cogs: 0 }
      }
    );
    console.log(`Updated ${productUpdateResult.modifiedCount} products.`);

    // Set cogs to 0 for products that didn't have purchasePrice
    await db.collection('products').updateMany(
      { cogs: { $exists: false } },
      { $set: { cogs: 0, plantTransferPrice: 0 } }
    );

    // 2. Migrate Procurements
    console.log('Migrating Procurements...');
    const procurementUpdateResult = await db.collection('procurements').updateMany(
      {},
      {
        $rename: { 
          purchasePrice: 'plantTransferPrice',
          totalCost: 'totalTransferValue'
        },
        $set: { source: 'GK Dairy Main Plant' },
        $unset: { supplierName: "" }
      }
    );
    console.log(`Updated ${procurementUpdateResult.modifiedCount} procurements.`);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migration();
