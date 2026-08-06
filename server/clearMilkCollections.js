import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const collections = mongoose.connection.collection('milkcollections');
        const result = await collections.deleteMany({});
        console.log('Deleted entries:', result.deletedCount);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
