import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

const clearAndAddProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear all products
    await Product.deleteMany({});
    console.log('Cleared all existing products');

    // Add Buffalo Milk
    const buffaloMilk = new Product({
      nameEn: 'Buffalo Milk',
      nameMr: 'म्हशीचे दूध',
      slug: 'buffalo-milk',
      category: 'Milk',
      price: 65, // default price
      unit: '1 Litre',
      stock: 100,
      isAvailable: true,
      description: 'Fresh Buffalo Milk',
      // imageUrl: '' // User will upload this
    });

    await buffaloMilk.save();
    console.log('Added Buffalo Milk product successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearAndAddProduct();
