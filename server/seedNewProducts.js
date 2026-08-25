import mongoose from 'mongoose';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uri = process.env.MONGODB_URI || 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0';

const ProductSchema = new mongoose.Schema({
  nameEn: { type: String, required: true },
  nameMr: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String, required: true },
  description: { type: String },
  availability: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

async function seed() {
  await mongoose.connect(uri);
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  const newProducts = [
    // Beverages
    { file: 'Beverages/Screenshot 2026-08-24 205732.png', nameEn: 'Chocolate Milk', nameMr: 'चॉकलेट दूध', category: 'Beverages', price: 40, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205740.png', nameEn: 'Strawberry Milk', nameMr: 'स्ट्रॉबेरी दूध', category: 'Beverages', price: 40, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205743.png', nameEn: 'Rose Milk', nameMr: 'गुलाब दूध', category: 'Beverages', price: 40, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205750.png', nameEn: 'Salted Lassi', nameMr: 'खारी लस्सी', category: 'Beverages', price: 30, unit: '250 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205756.png', nameEn: 'Mango Milk', nameMr: 'आंबा दूध', category: 'Beverages', price: 40, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205800.png', nameEn: 'Pista Milk', nameMr: 'पिस्ता दूध', category: 'Beverages', price: 40, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205803.png', nameEn: 'Turmeric Milk', nameMr: 'हळदीचे दूध', category: 'Beverages', price: 35, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205810.png', nameEn: 'Cold Coffee', nameMr: 'कोल्ड कॉफी', category: 'Beverages', price: 50, unit: '200 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205817.png', nameEn: 'Mango Lassi', nameMr: 'आंबा लस्सी', category: 'Beverages', price: 45, unit: '250 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205824.png', nameEn: 'Strawberry Lassi', nameMr: 'स्ट्रॉबेरी लस्सी', category: 'Beverages', price: 45, unit: '250 ml' },
    { file: 'Beverages/Screenshot 2026-08-24 205828.png', nameEn: 'Sweet Lassi', nameMr: 'गोड लस्सी', category: 'Beverages', price: 35, unit: '250 ml' },
    
    // Frozen Dairy
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205209.png', nameEn: 'Ice Cream', nameMr: 'आईसक्रीम', category: 'Frozen Dairy', price: 150, unit: '1 Litre' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205216.png', nameEn: 'Kulfi', nameMr: 'कुल्फी', category: 'Frozen Dairy', price: 30, unit: '1 Piece' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205222.png', nameEn: 'Malai Kulfi', nameMr: 'मलाई कुल्फी', category: 'Frozen Dairy', price: 40, unit: '1 Piece' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205227.png', nameEn: 'Kesar Kulfi', nameMr: 'केसर कुल्फी', category: 'Frozen Dairy', price: 50, unit: '1 Piece' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205234.png', nameEn: 'Vanilla Ice Cream', nameMr: 'व्हॅनिला आईसक्रीम', category: 'Frozen Dairy', price: 120, unit: '1 Litre' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205240.png', nameEn: 'Chocolate Ice Cream', nameMr: 'चॉकलेट आईसक्रीम', category: 'Frozen Dairy', price: 140, unit: '1 Litre' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205246.png', nameEn: 'Mango Ice Cream', nameMr: 'आंबा आईसक्रीम', category: 'Frozen Dairy', price: 160, unit: '1 Litre' },
    { file: 'Frozen Dairy/Screenshot 2026-08-24 205251.png', nameEn: 'Pista Kulfi', nameMr: 'पिस्ता कुल्फी', category: 'Frozen Dairy', price: 45, unit: '1 Piece' },
    
    // Milk
    { file: 'Milk/Screenshot 2026-08-24 204449.png', nameEn: 'Double Toned Milk', nameMr: 'डबल टोन्ड दूध', category: 'Milk', price: 55, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204501.png', nameEn: 'Skimmed Milk', nameMr: 'स्किम्ड दूध', category: 'Milk', price: 50, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204511.png', nameEn: 'A2 Milk', nameMr: 'A2 दूध', category: 'Milk', price: 90, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204516.png', nameEn: 'Organic Milk', nameMr: 'सेंद्रिय दूध', category: 'Milk', price: 85, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204522.png', nameEn: 'Goat Milk', nameMr: 'शेळीचे दूध', category: 'Milk', price: 100, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204528.png', nameEn: 'Lactose-Free Milk', nameMr: 'लॅक्टोज-फ्री दूध', category: 'Milk', price: 80, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204534.png', nameEn: 'UHT Milk', nameMr: 'UHT दूध', category: 'Milk', price: 65, unit: '1 Litre' },
    { file: 'Milk/Screenshot 2026-08-24 204541.png', nameEn: 'Milk Powder', nameMr: 'दूध पावडर', category: 'Milk', price: 200, unit: '500 g' },
    { file: 'Milk/Screenshot 2026-08-24 204549.png', nameEn: 'Skimmed Milk Powder', nameMr: 'स्किम्ड मिल्क पावडर', category: 'Milk', price: 220, unit: '500 g' },
    { file: 'Milk/Screenshot 2026-08-24 204600.png', nameEn: 'Condensed Milk', nameMr: 'कंडेन्स्ड मिल्क', category: 'Milk', price: 150, unit: '400 g' }
  ];

  const baseDir = path.join('d:', 'dairy_first_project', 'product');

  for (const item of newProducts) {
    // Check if exists
    const exists = await Product.findOne({ nameEn: item.nameEn });
    if (exists) {
      console.log(`Skipping ${item.nameEn}, already exists`);
      continue;
    }

    const filePath = path.join(baseDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found for ${item.nameEn}: ${filePath}`);
      continue;
    }

    try {
      console.log(`Uploading ${item.nameEn}...`);
      const result = await cloudinary.v2.uploader.upload(filePath, { folder: 'dairy_products' });
      
      const prod = new Product({
        ...item,
        slug: item.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        imageUrl: result.secure_url,
        stock: 50,
        description: `Fresh and healthy ${item.nameEn}`
      });
      await prod.save();
      console.log(`Saved ${item.nameEn} to DB`);
    } catch (uploadErr) {
      console.error(`Failed to upload ${item.nameEn}:`, uploadErr);
    }
  }

  console.log('Seed completed!');
  process.exit(0);
}

seed();
