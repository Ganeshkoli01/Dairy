import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Define Product Schema
const productSchema = new mongoose.Schema({
  nameEn: { type: String, required: true },
  nameMr: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  stock: { type: Number, default: 100 },
  isAvailable: { type: Boolean, default: true },
  description: { type: String },
  imageUrl: { type: String }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const products = [
  { file: 'Screenshot 2026-08-24 141712.png', nameEn: 'Buffalo Milk', nameMr: 'म्हशीचे दूध', category: 'Milk', price: 65, unit: '1 Litre', description: 'Fresh Buffalo Milk' },
  { file: 'Screenshot 2026-08-24 191719.png', nameEn: 'Cow Milk', nameMr: 'गाईचे दूध', category: 'Milk', price: 55, unit: '1 Litre', description: 'Pure & Fresh Cow Milk' },
  { file: 'Screenshot 2026-08-24 191738.png', nameEn: 'Curd', nameMr: 'दही', category: 'Fresh Dairy', price: 30, unit: '200g', description: 'Fresh Curd' },
  { file: 'Screenshot 2026-08-24 191748.png', nameEn: 'Buttermilk', nameMr: 'ताक', category: 'Fresh Dairy', price: 15, unit: '200ml', description: 'Refreshing Buttermilk' },
  { file: 'Screenshot 2026-08-24 191800.png', nameEn: 'Lassi', nameMr: 'लस्सी', category: 'Fresh Dairy', price: 25, unit: '200ml', description: 'Sweet Lassi' },
  { file: 'Screenshot 2026-08-24 192055.png', nameEn: 'Paneer', nameMr: 'पनीर', category: 'Fresh Dairy', price: 80, unit: '200g', description: 'Soft & Fresh Paneer' },
  { file: 'Screenshot 2026-08-24 192104.png', nameEn: 'Butter', nameMr: 'लोणी', category: 'Specialty', price: 250, unit: '500g', description: 'Fresh Butter' },
  { file: 'Screenshot 2026-08-24 192115.png', nameEn: 'Cream', nameMr: 'साय / क्रीम', category: 'Cheese & Others', price: 60, unit: '200g', description: 'Fresh Cream' },
  { file: 'Screenshot 2026-08-24 192408.png', nameEn: 'Full Cream Milk', nameMr: 'फुल क्रीम दूध', category: 'Milk', price: 70, unit: '1 Litre', description: 'Rich Full Cream Milk' },
  { file: 'Screenshot 2026-08-24 192416.png', nameEn: 'Toned Milk', nameMr: 'टोन्ड दूध', category: 'Milk', price: 50, unit: '1 Litre', description: 'Healthy Toned Milk' },
  { file: 'Screenshot 2026-08-24 192515.png', nameEn: 'Shrikhand', nameMr: 'श्रीखंड', category: 'Fresh Dairy', price: 100, unit: '250g', description: 'Sweet Shrikhand' },
  { file: 'Screenshot 2026-08-24 192526.png', nameEn: 'Amrakhand', nameMr: 'आम्रखंड', category: 'Fresh Dairy', price: 120, unit: '250g', description: 'Mango Flavored Shrikhand' },
  { file: 'Screenshot 2026-08-24 192533.png', nameEn: 'Basundi', nameMr: 'बासुंदी', category: 'Fresh Dairy', price: 150, unit: '250g', description: 'Rich Basundi' },
  { file: 'Screenshot 2026-08-24 192544.png', nameEn: 'Rabri', nameMr: 'रबडी', category: 'Fresh Dairy', price: 160, unit: '250g', description: 'Delicious Rabri' },
  { file: 'Screenshot 2026-08-24 192552.png', nameEn: 'Khoya / Mawa', nameMr: 'खवा/मावा', category: 'Fresh Dairy', price: 180, unit: '500g', description: 'Fresh Mawa' },
  { file: 'Screenshot 2026-08-24 192559.png', nameEn: 'Flavored Milk Strawberry', nameMr: 'फ्लेवर्ड दूध', category: 'Beverages', price: 35, unit: '200ml', description: 'Strawberry Flavored Milk' },
  { file: 'Screenshot 2026-08-24 192603.png', nameEn: 'Badam Milk', nameMr: 'बादाम दूध', category: 'Beverages', price: 40, unit: '200ml', description: 'Almond Flavored Milk' },
  { file: 'Screenshot 2026-08-24 192608.png', nameEn: 'Kesar Milk', nameMr: 'केसर दूध', category: 'Beverages', price: 45, unit: '200ml', description: 'Saffron Flavored Milk' },
  { file: 'Screenshot 2026-08-24 192617.png', nameEn: 'Milkshake', nameMr: 'मिल्कशेक', category: 'Beverages', price: 45, unit: '200ml', description: 'Chocolate Milkshake' },
  { file: 'Screenshot 2026-08-24 192622.png', nameEn: 'Cheddar Cheese', nameMr: 'चेडर चीज', category: 'Cheese & Others', price: 150, unit: '200g', description: 'Cheddar Cheese' },
  { file: 'Screenshot 2026-08-24 192627.png', nameEn: 'Mozzarella Cheese', nameMr: 'मोझरेला चीज', category: 'Cheese & Others', price: 180, unit: '200g', description: 'Mozzarella Cheese' },
  { file: 'Screenshot 2026-08-24 192631.png', nameEn: 'Cheese Slices', nameMr: 'चीज स्लाईस', category: 'Cheese & Others', price: 120, unit: '200g', description: 'Cheese Slices' },
  { file: 'Screenshot 2026-08-24 192637.png', nameEn: 'Cheese Cubes', nameMr: 'चीज क्यूब्स', category: 'Cheese & Others', price: 130, unit: '200g', description: 'Cheese Cubes' },
  { file: 'Screenshot 2026-08-24 192706.png', nameEn: 'Cheese Spread', nameMr: 'चीज स्प्रेड', category: 'Cheese & Others', price: 140, unit: '200g', description: 'Cheese Spread' },
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared all existing products');

    for (const item of products) {
      const filePath = path.join('d:', 'dairy_first_project', 'product', item.file);
      
      console.log(`Uploading ${item.nameEn}...`);
      let imageUrl = '';
      try {
        const result = await cloudinary.uploader.upload(filePath, { folder: 'dairy_products' });
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error(`Failed to upload image for ${item.nameEn}:`, uploadErr);
        continue;
      }

      const product = new Product({
        ...item,
        slug: item.nameEn.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, ''),
        imageUrl
      });

      await product.save();
      console.log(`Saved ${item.nameEn} to DB`);
    }

    console.log('Successfully seeded all products!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
