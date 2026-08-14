const mongoose = require('mongoose');
const uri = 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    
    console.log('=== MILK COLLECTIONS FOR FARMER 6 ===');
    const collectionsByCode = await db.collection('milkcollections')
        .find({ $or: [{ farmerCode: '6' }, { farmerCode: 6 }] })
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .toArray();
        
    console.log(`Found ${collectionsByCode.length} collections by code 6.`);
    console.log(JSON.stringify(collectionsByCode, null, 2));

    if (collectionsByCode.length === 0) {
        console.log('\n=== MILK COLLECTIONS FOR ganesh patil ===');
        const collectionsByName = await db.collection('milkcollections')
            .find({ farmerName: { $regex: /ganesh patil/i } })
            .sort({ date: -1, createdAt: -1 })
            .limit(10)
            .toArray();
            
        console.log(`Found ${collectionsByName.length} collections by name.`);
        console.log(JSON.stringify(collectionsByName, null, 2));
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
