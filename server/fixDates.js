import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const collections = mongoose.connection.collection('milkcollections');
        const result = await collections.updateMany(
            { date: new Date('2026-08-06T00:00:00.000Z') },
            { $set: { date: new Date('2026-08-05T00:00:00.000Z') } }
        );
        console.log('Updated entries:', result.modifiedCount);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
