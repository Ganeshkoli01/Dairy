import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/dairy_milk_collection').then(async () => {
    try {
        const { User } = await import('./src/models/User.js');
        const result = await User.updateMany(
            { isEmailVerified: { $ne: true } }, 
            { $set: { isEmailVerified: true } }
        );
        console.log('Fixed', result.modifiedCount, 'existing users to have isEmailVerified = true');
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
