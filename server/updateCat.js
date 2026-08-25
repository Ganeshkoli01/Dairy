import mongoose from 'mongoose';

const uri = 'mongodb+srv://ganeshkoli809572_db_user:Vol2UIDkmoqflbST@cluster0.upnfklc.mongodb.net/dairy_db?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({nameEn: String, category: String}, {strict: false}));
  
  await Product.updateMany({ nameEn: { $in: ['Cream', 'Butter'] } }, { category: 'Fresh Dairy' });
  await Product.updateMany({ nameEn: { $in: ['Lassi', 'Shrikhand', 'Amrakhand', 'Basundi', 'Rabri', 'Khoya / Mawa'] } }, { category: 'Specialty' });
  
  console.log('Categories updated successfully!');
  process.exit(0);
}

run();
