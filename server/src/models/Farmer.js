import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema(
  {
    farmerCode: {
      type: String,
      required: [true, 'Farmer code is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required'],
    },
    defaultMilkType: {
      type: String,
      enum: ['cow', 'buffalo', 'both'],
      default: 'cow',
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: farmerCode must be unique per branch AND milkType
farmerSchema.index({ branch: 1, farmerCode: 1, defaultMilkType: 1 }, { unique: true });

export const Farmer = mongoose.model('Farmer', farmerSchema);
