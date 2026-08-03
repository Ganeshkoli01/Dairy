import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RateChart } from './models/RateChart.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../../full_rate_entries.json');

export const seedRateChart = async () => {
  try {
    if (!fs.existsSync(jsonPath)) {
      console.log('[RateChart Seed] full_rate_entries.json not found, skipping full matrix seed.');
      return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const allEntries = JSON.parse(rawData);

    if (mongoose.connection.readyState !== 1) {
      console.log('[RateChart Seed] MongoDB not connected, skipping DB insert.');
      return;
    }

    // Wipe existing partial entries to re-populate the complete 1512-cell matrix
    await RateChart.deleteMany({ branch: null });

    const docs = allEntries.map((e) => ({
      milkType: e.milkType,
      fat: e.fat,
      snf: e.snf,
      rate: e.rate,
      effectiveFrom: new Date('2026-08-03'),
      branch: null,
    }));

    await RateChart.insertMany(docs);
    console.log(`[RateChart Seed] Successfully populated complete 100% filled rate chart matrix with ${docs.length} entries into MongoDB!`);
  } catch (err) {
    console.error('[RateChart Seed Error]', err.message);
  }
};

if (process.argv[2] === '--run') {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dairy_milk_collection';
  mongoose.connect(mongoUri).then(async () => {
    await seedRateChart();
    process.exit(0);
  });
}
