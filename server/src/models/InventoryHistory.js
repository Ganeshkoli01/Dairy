import mongoose from 'mongoose';

const inventoryHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  type: {
    type: String,
    enum: ['Procurement', 'Customer Order', 'Manual Adjustment', 'Stock Received', 'Stock Transfer'],
    required: true,
  },
  quantity: {
    type: Number, // positive or negative
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId, // Can refer to Order or Procurement
    required: false,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional if it's a customer order without a logged-in user
  }
}, { timestamps: true });

const InventoryHistory = mongoose.model('InventoryHistory', inventoryHistorySchema);
export default InventoryHistory;
