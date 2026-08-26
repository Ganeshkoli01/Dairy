
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const procurementSchema = new mongoose.Schema({}, { strict: false });
const Procurement = mongoose.model('Procurement', procurementSchema);

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/dairy_first');
  const result = await Procurement.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'Received' } }
  );
  console.log('Updated:', result.modifiedCount);
  process.exit(0);
};
run();

