import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  nameEn: {
    type: String,
    required: true,
    trim: true,
  },
  nameMr: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Milk', 'Fresh Dairy', 'Specialty', 'Beverages', 'Cheese', 'Frozen Dairy'],
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  cogs: {
    type: Number,
    default: 0,
    min: 0,
  },
  plantTransferPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  branchStock: [{
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  imageUrl: {
    type: String,
    default: '',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
