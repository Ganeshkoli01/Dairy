import mongoose from 'mongoose';

const rateChartSchema = new mongoose.Schema(
  {
    milkType: {
      type: String,
      enum: ['cow', 'buffalo'],
      required: [true, 'Milk type (cow/buffalo) is required'],
    },
    fat: {
      type: Number,
      required: [true, 'FAT percentage is required'],
      min: 0,
      max: 20,
    },
    snf: {
      type: Number,
      required: [true, 'SNF percentage is required'],
      min: 0,
      max: 20,
    },
    rate: {
      type: Number,
      required: [true, 'Rate (₹ per liter) is required'],
      min: 0,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null, // null means global rate chart applicable to all branches
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup and matrix uniqueness
rateChartSchema.index(
  { milkType: 1, fat: 1, snf: 1, branch: 1, effectiveFrom: -1 },
  { name: 'rate_chart_lookup_idx' }
);

export const RateChart = mongoose.model('RateChart', rateChartSchema);
