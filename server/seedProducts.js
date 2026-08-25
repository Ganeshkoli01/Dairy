import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';
import { connectDB } from './src/config/db.js';

dotenv.config();

const products = [
  // 1. MILK
  { nameEn: 'Cow Milk', nameMr: 'गाईचे दूध', category: 'Milk', price: 60, unit: '1 Litre', slug: 'cow-milk' },
  { nameEn: 'Buffalo Milk', nameMr: 'म्हशीचे दूध', category: 'Milk', price: 70, unit: '1 Litre', slug: 'buffalo-milk' },
  { nameEn: 'Full Cream Milk', nameMr: 'फुल क्रीम दूध', category: 'Milk', price: 75, unit: '1 Litre', slug: 'full-cream-milk' },
  { nameEn: 'Toned Milk', nameMr: 'टोन्ड दूध', category: 'Milk', price: 55, unit: '1 Litre', slug: 'toned-milk' },

  // 2. FRESH DAIRY
  { nameEn: 'Curd', nameMr: 'दही', category: 'Fresh Dairy', price: 40, unit: '500g', slug: 'curd' },
  { nameEn: 'Buttermilk', nameMr: 'ताक', category: 'Fresh Dairy', price: 15, unit: '200ml', slug: 'buttermilk' },
  { nameEn: 'Paneer', nameMr: 'पनीर', category: 'Fresh Dairy', price: 90, unit: '200g', slug: 'paneer' },
  { nameEn: 'Butter', nameMr: 'लोणी', category: 'Fresh Dairy', price: 250, unit: '500g', slug: 'butter' },
  { nameEn: 'Cream', nameMr: 'साय / क्रीम', category: 'Fresh Dairy', price: 100, unit: '200g', slug: 'cream' },
  { nameEn: 'Ghee', nameMr: 'तूप', category: 'Fresh Dairy', price: 600, unit: '1 kg', slug: 'ghee' },

  // 3. SPECIALTY
  { nameEn: 'Shrikhand', nameMr: 'श्रीखंड', category: 'Specialty', price: 120, unit: '500g', slug: 'shrikhand' },
  { nameEn: 'Amrakhand', nameMr: 'आम्रखंड', category: 'Specialty', price: 130, unit: '500g', slug: 'amrakhand' },
  { nameEn: 'Basundi', nameMr: 'बासुंदी', category: 'Specialty', price: 150, unit: '500g', slug: 'basundi' },
  { nameEn: 'Rabri', nameMr: 'रबडी', category: 'Specialty', price: 160, unit: '500g', slug: 'rabri' },
  { nameEn: 'Khoya / Mawa', nameMr: 'खवा / मावा', category: 'Specialty', price: 300, unit: '1 kg', slug: 'khoya-mawa' },

  // 4. BEVERAGES
  { nameEn: 'Lassi', nameMr: 'लस्सी', category: 'Beverages', price: 25, unit: '200ml', slug: 'lassi' },
  { nameEn: 'Flavored Milk', nameMr: 'फ्लेवर्ड दूध', category: 'Beverages', price: 30, unit: '200ml', slug: 'flavored-milk' },
  { nameEn: 'Badam Milk', nameMr: 'बदाम दूध', category: 'Beverages', price: 40, unit: '200ml', slug: 'badam-milk' },
  { nameEn: 'Kesar Milk', nameMr: 'केसर दूध', category: 'Beverages', price: 45, unit: '200ml', slug: 'kesar-milk' },
  { nameEn: 'Milkshake', nameMr: 'मिल्कशेक', category: 'Beverages', price: 50, unit: '250ml', slug: 'milkshake' },

  // 5. CHEESE
  { nameEn: 'Cheddar Cheese', nameMr: 'चेडर चीज', category: 'Cheese', price: 150, unit: '200g', slug: 'cheddar-cheese' },
  { nameEn: 'Mozzarella Cheese', nameMr: 'मोझरेला चीज', category: 'Cheese', price: 180, unit: '200g', slug: 'mozzarella-cheese' },
  { nameEn: 'Cheese Slices', nameMr: 'चीज स्लाइस', category: 'Cheese', price: 120, unit: '200g', slug: 'cheese-slices' },
  { nameEn: 'Cheese Cubes', nameMr: 'चीज क्यूब्स', category: 'Cheese', price: 130, unit: '200g', slug: 'cheese-cubes' },
  { nameEn: 'Cheese Spread', nameMr: 'चीज स्प्रेड', category: 'Cheese', price: 140, unit: '200g', slug: 'cheese-spread' },
];

const seedProducts = async () => {
  try {
    await connectDB();
    console.log('Database connected. Starting seed...');

    let insertedCount = 0;
    for (const productData of products) {
      const existingProduct = await Product.findOne({ slug: productData.slug });
      if (!existingProduct) {
        await Product.create({
          ...productData,
          description: `Fresh and pure ${productData.nameEn} directly from the farm.`,
          stock: 100,
          isAvailable: true,
          imageUrl: `https://via.placeholder.com/300x200?text=${productData.nameEn.replace(/ /g, '+')}`,
        });
        insertedCount++;
        console.log(`Added: ${productData.nameEn}`);
      } else {
        console.log(`Skipped (already exists): ${productData.nameEn}`);
      }
    }

    console.log(`Seed completed. Inserted ${insertedCount} new products.`);
    process.exit();
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedProducts();
