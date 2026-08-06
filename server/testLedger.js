import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const collections = mongoose.connection.collection('milkcollections');
        const docs = await collections.find({ 
            farmerCode: '101', 
            date: { 
                $gte: new Date('2026-08-05T00:00:00.000Z'), 
                $lte: new Date('2026-08-05T23:59:59.999Z') 
            } 
        }).toArray();
        console.log('Ledger matches:', docs.length);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
