import mongoose from 'mongoose';
import { RateChart } from './src/models/RateChart.js';

mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const fatVal = 3.5;
        const snfVal = 8.5;
        const targetDate = new Date('2026-08-05T23:59:59.999Z');
        
        const globalMatch = await RateChart.find({
            milkType: 'cow',
            branch: null,
            fat: { $lte: fatVal },
            snf: { $lte: snfVal },
            effectiveFrom: { $lte: targetDate },
        })
        .sort({ fat: -1, snf: -1, effectiveFrom: -1 })
        .limit(1);
        
        console.log('Global Match:', globalMatch);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
