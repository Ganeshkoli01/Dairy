import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const collections = mongoose.connection.collection('ratecharts');
        const docs = await collections.find({ milkType: 'cow', fat: { $lte: 3.5 }, snf: { $lte: 8.5 } }).toArray();
        console.log('Matching global rates:', docs.length);
        if (docs.length > 0) {
            console.log(docs[0]);
        }
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
