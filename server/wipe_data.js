import mongoose from 'mongoose';

mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        console.log('Connected to MongoDB');
        
        // 1. Delete all Branches
        const branches = mongoose.connection.collection('branches');
        const deletedBranches = await branches.deleteMany({});
        console.log(`Deleted ${deletedBranches.deletedCount} branches`);

        // 2. Delete all Farmers
        const farmers = mongoose.connection.collection('farmers');
        const deletedFarmers = await farmers.deleteMany({});
        console.log(`Deleted ${deletedFarmers.deletedCount} farmers`);

        // 3. Delete all Milk Collections
        const milkcollections = mongoose.connection.collection('milkcollections');
        const deletedMilkCollections = await milkcollections.deleteMany({});
        console.log(`Deleted ${deletedMilkCollections.deletedCount} milk collections`);

        // 4. Delete branch-specific rate charts (keeping global ones where branch = null)
        const ratecharts = mongoose.connection.collection('ratecharts');
        const deletedRateCharts = await ratecharts.deleteMany({ branch: { $ne: null } });
        console.log(`Deleted ${deletedRateCharts.deletedCount} branch-specific rate charts`);

        console.log('Successfully wiped data for dairies.');
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
