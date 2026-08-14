const mongoose = require('mongoose');
const uri = 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    
    // Find farmer by name
    const user = await db.collection('users').findOne({ 
        role: 'farmer', 
        name: { $regex: /ganesh patil/i } 
    });
    
    if (user) {
        console.log('Farmer Email: ' + user.email);
    } else {
        const userByCode = await db.collection('users').findOne({ 
            role: 'farmer', 
            'farmerProfile.farmerCode': 6 
        });
        if (userByCode) {
            console.log('Farmer Email: ' + userByCode.email);
        } else {
            console.log('Farmer not found in users collection.');
        }
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
