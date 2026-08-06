import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const collections = mongoose.connection.collection('milkcollections');
        
        const branchId = new mongoose.Types.ObjectId('6a71eceb03db6f7f54a6070a');
        const farmerId = new mongoose.Types.ObjectId('6a71ed3403db6f7f54a6072a');
        const enteredById = new mongoose.Types.ObjectId('6a71eceb03db6f7f54a6070c');
        
        let newDocs = [];
        
        for (let i = 1; i <= 13; i++) {
            const d = new Date('2026-08-05T00:00:00.000Z');
            d.setDate(d.getDate() - i);
            
            // Randomize volume based on a sine wave pattern for realism
            const baseLiters = 40 + Math.sin(i) * 15;
            
            newDocs.push({
                branch: branchId,
                date: d,
                session: 'morning',
                farmer: farmerId,
                farmerCode: '101',
                farmerName: 'raju',
                milkType: 'cow',
                weight: Math.round(baseLiters * 0.7),
                fat: 4.5,
                snf: 8.5,
                degree: 28,
                rate: 35,
                amount: Math.round(baseLiters * 0.7) * 35,
                autoFat: false,
                autoWeight: false,
                enteredBy: enteredById,
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0
            });
            
            newDocs.push({
                branch: branchId,
                date: d,
                session: 'evening',
                farmer: farmerId,
                farmerCode: '101',
                farmerName: 'raju',
                milkType: 'buffalo',
                weight: Math.round(baseLiters * 0.3),
                fat: 7.5,
                snf: 9.0,
                degree: 28,
                rate: 55,
                amount: Math.round(baseLiters * 0.3) * 55,
                autoFat: false,
                autoWeight: false,
                enteredBy: enteredById,
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0
            });
        }
        
        await collections.insertMany(newDocs);
        console.log('Inserted historical records:', newDocs.length);
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
