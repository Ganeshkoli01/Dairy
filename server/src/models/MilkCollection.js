import mongoose from 'mongoose';

const milkCollectionSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
    },
    date: {
      type: Date,
      required: [true, 'Collection date is required'],
      default: Date.now,
    },
    session: {
      type: String,
      enum: ['morning', 'evening'],
      required: [true, 'Session (morning/evening) is required'],
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer reference is required'],
    },
    farmerCode: {
      type: String,
      required: [true, 'Farmer code is required'],
      trim: true,
    },
    farmerName: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    milkType: {
      type: String,
      enum: ['cow', 'buffalo'],
      required: [true, 'Milk type is required'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight (liters) is required'],
      min: [0.1, 'Weight must be greater than 0'],
    },
    fat: {
      type: Number,
      required: [true, 'FAT percentage is required'],
      min: [0, 'FAT cannot be negative'],
    },
    snf: {
      type: Number,
      required: [true, 'SNF percentage is required'],
      min: [0, 'SNF cannot be negative'],
    },
    degree: {
      type: Number,
      default: 0, // CLR reading
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: 0,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    autoFat: {
      type: Boolean,
      default: false,
    },
    autoWeight: {
      type: Boolean,
      default: false,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on (branch, date, session) for high-speed queries
milkCollectionSchema.index(
  { branch: 1, date: 1, session: 1 },
  { name: 'collection_query_idx' }
);

// Index for farmer previous session reference lookup
milkCollectionSchema.index(
  { farmer: 1, createdAt: -1 },
  { name: 'farmer_history_idx' }
);

export const MilkCollection = mongoose.model('MilkCollection', milkCollectionSchema);
