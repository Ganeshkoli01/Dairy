import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['farmer', 'dairyOwner', 'admin'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      default: '', // optional, primarily for farmer
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Role-specific nested profiles
    farmerProfile: {
      farmerCode: { type: String, trim: true },
      farmerName: { type: String, trim: true },
      milkType: { type: String, enum: ['cow', 'buffalo', 'both'] },
      branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    },

    dairyOwnerProfile: {
      ownerName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      branchNumber: { type: String, trim: true },
      branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    },

    adminProfile: {
      name: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
