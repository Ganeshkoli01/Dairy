import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = (await import('./src/models/Product.js')).default;
  const products = await Product.find({});
  let updatedCount = 0;
  
  for (const product of products) {
    if (product.plantTransferPrice) {
      const cogsVal = Math.round(product.plantTransferPrice * 0.8);
      await Product.updateOne({ _id: product._id }, { $set: { cogs: cogsVal } });
      updatedCount++;
    }
  }
  
  console.log('Successfully updated ' + updatedCount + ' products with calculated COGS (80% of Plant Transfer Price).');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
