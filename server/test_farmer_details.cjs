const mongoose = require('mongoose');
const uri = 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    
    // Find farmer by name or farmerCode
    const user = await db.collection('users').findOne({ 
        role: 'farmer', 
        name: { $regex: /ganesh patil/i } 
    });
    
    if (user) {
        console.log('=== FARMER PROFILE ===');
        console.log(JSON.stringify(user, null, 2));
        
        const farmerCode = user.farmerProfile ? user.farmerProfile.farmerCode : null;
        
        if (farmerCode) {
            console.log('\n=== RECENT MILK COLLECTIONS ===');
            const collections = await db.collection('milkcollections')
                .find({ 
                    $or: [
                        { farmerCode: String(farmerCode) },
                        { farmerCode: Number(farmerCode) },
                        { farmer: user._id }
                    ]
                })
                .sort({ date: -1, createdAt: -1 })
                .limit(10)
                .toArray();
                
            console.log(JSON.stringify(collections, null, 2));
        }
    } else {
        console.log('Farmer not found by name. Searching by farmerCode = 6...');
        const userByCode = await db.collection('users').findOne({ 
            role: 'farmer', 
            'farmerProfile.farmerCode': 6 
        });
        
        if (userByCode) {
             console.log('=== FARMER PROFILE ===');
             console.log(JSON.stringify(userByCode, null, 2));
             
             console.log('\n=== RECENT MILK COLLECTIONS ===');
             const collections = await db.collection('milkcollections')
                .find({ 
                    $or: [
                        { farmerCode: '6' },
                        { farmerCode: 6 },
                        { farmer: userByCode._id }
                    ]
                })
                .sort({ date: -1, createdAt: -1 })
                .limit(10)
                .toArray();
                
             console.log(JSON.stringify(collections, null, 2));
        } else {
             console.log('Farmer not found by code either.');
        }
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
