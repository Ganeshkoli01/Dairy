import mongoose from 'mongoose';

const procurementSchema = new mongoose.Schema({
  source: {
    type: String,
    default: 'GK Dairy Main Plant',
    required: true,
    trim: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  plantTransferPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  cogs: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalTransferValue: {
    type: Number,
    required: true,
    min: 0,
  },
  totalCogsValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  invoiceNumber: {
    type: String,
    trim: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false, // Optional for admin if they don't assign it
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

const Procurement = mongoose.model('Procurement', procurementSchema);
export default Procurement;
