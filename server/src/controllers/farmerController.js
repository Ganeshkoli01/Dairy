import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Farmer } from '../models/Farmer.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';

let memoryFarmers = [
  {
    _id: '60d5ec49f1b2c81128765991',
    farmerCode: '101',
    name: 'Ramesh Patil',
    branch: {
      _id: '60d5ec49f1b2c81128765411',
      name: 'Central Dairy Branch',
      code: 'BR001',
    },
    defaultMilkType: 'cow',
    mobile: '9876543210',
    isActive: true,
    joinedDate: new Date().toISOString(),
  },
  {
    _id: '60d5ec49f1b2c81128765992',
    farmerCode: '102',
    name: 'Suresh Deshmukh',
    branch: {
      _id: '60d5ec49f1b2c81128765411',
      name: 'Central Dairy Branch',
      code: 'BR001',
    },
    defaultMilkType: 'buffalo',
    mobile: '9812345678',
    isActive: true,
    joinedDate: new Date().toISOString(),
  },
];

export const getFarmers = async (req, res) => {
  try {
    let { branch, search, isActive } = req.query;

    if (req.user && req.user.role === 'dairyOwner') {
      const branchCode = req.user.dairyOwnerProfile?.branchNumber;
      if (mongoose.connection.readyState === 1) {
        const ownerBranch = await Branch.findOne({ code: new RegExp('^' + branchCode + '$', 'i') }).catch(() => null);
        if (ownerBranch) {
          branch = ownerBranch._id.toString();
        } else {
          return res.json({ success: true, count: 0, data: [] }); // Owner has no valid branch yet
        }
      }
    }

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (branch) filter.branch = branch;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [{ name: searchRegex }, { farmerCode: searchRegex }];
      }

      const farmers = await Farmer.find(filter)
        .populate('branch', 'name code location')
        .sort({ farmerCode: 1 })
        .catch(() => null);

      if (farmers) {
        return res.json({ success: true, count: farmers.length, data: farmers });
      }
    }

    let result = memoryFarmers;
    if (branch) {
      result = result.filter((f) => String(f.branch._id || f.branch) === String(branch));
    }
    if (isActive !== undefined) {
      result = result.filter((f) => f.isActive === (isActive === 'true'));
    }
    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q) || f.farmerCode.toLowerCase().includes(q));
    }

    return res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching farmers' });
  }
};

export const getFarmerByBranchAndCode = async (req, res) => {
  try {
    const { branchId, code } = req.params;

    if (mongoose.connection.readyState === 1) {
      let filter = { branch: branchId, farmerCode: code.trim() };
      if (req.query.milkType) {
        filter.defaultMilkType = req.query.milkType;
      }
      
      let farmer = await Farmer.findOne(filter)
        .populate('branch', 'name code')
        .catch(() => null);
        
      // If specific milk type not found, fallback to any milk type for this code
      if (!farmer && req.query.milkType) {
        farmer = await Farmer.findOne({ branch: branchId, farmerCode: code.trim() })
          .populate('branch', 'name code')
          .catch(() => null);
      }
      
      if (farmer) return res.json({ success: true, data: farmer });
    }

    const memFarmer = memoryFarmers.find(
      (f) => String(f.branch._id || f.branch) === String(branchId) && String(f.farmerCode) === String(code).trim()
    );

    if (!memFarmer) {
      return res.status(404).json({ success: false, message: `Farmer with code '${code}' not found in this branch` });
    }

    return res.json({ success: true, data: memFarmer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error looking up farmer' });
  }
};

export const createFarmer = async (req, res) => {
  try {
    let { farmerCode, name, branch, defaultMilkType, mobile, email, password, otp, isActive, joinedDate } = req.body;

    if (req.user && req.user.role === 'dairyOwner') {
      const branchCode = req.user.dairyOwnerProfile?.branchNumber;
      if (mongoose.connection.readyState === 1) {
        const ownerBranch = await Branch.findOne({ code: new RegExp('^' + branchCode + '$', 'i') }).catch(() => null);
        if (ownerBranch) {
          branch = ownerBranch._id.toString();
        } else {
          return res.status(403).json({ success: false, message: 'You do not have a valid branch assigned.' });
        }
      }
    }

    if (!farmerCode || !name || !branch) {
      return res.status(400).json({ success: false, message: 'Farmer code, name, and branch are required' });
    }

    const formattedCode = String(farmerCode).trim();

    const targetMilkType = defaultMilkType || 'cow';

    const memExisting = memoryFarmers.find(
      (f) => String(f.branch._id || f.branch) === String(branch) && String(f.farmerCode) === formattedCode && f.defaultMilkType === targetMilkType
    );

    if (memExisting) {
      return res.status(400).json({ success: false, message: `Farmer code '${formattedCode}' with milk type '${targetMilkType}' already exists` });
    }

    if (mongoose.connection.readyState === 1) {
      const existing = await Farmer.findOne({ branch, farmerCode: formattedCode, defaultMilkType: targetMilkType }).catch(() => null);
      if (existing) {
        return res.status(400).json({ success: false, message: `Farmer code '${formattedCode}' with milk type '${targetMilkType}' already exists` });
      }

      if (email && password) {
        const cleanEmail = String(email).trim().toLowerCase();
        const userExists = await User.findOne({ email: cleanEmail }).catch(() => null);
        if (userExists) {
          return res.status(400).json({ success: false, message: 'Email already registered for a user account' });
        }
        
        if (!otp) {
          return res.status(400).json({ success: false, message: 'OTP is required when creating a farmer account with email' });
        }

        const otpRecord = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
        if (!otpRecord) {
          return res.status(400).json({ success: false, field: 'otp', message: 'No OTP found or OTP expired. Please resend.' });
        }
        if (otpRecord.otp !== String(otp).trim()) {
          return res.status(400).json({ success: false, field: 'otp', message: 'Invalid OTP' });
        }
        await Otp.deleteOne({ _id: otpRecord._id });
        
        await User.create({
          email: cleanEmail,
          password: String(password).trim(),
          role: 'farmer',
          phone: mobile?.trim() || '',
          farmerProfile: {
            farmerCode: formattedCode,
            farmerName: name.trim(),
            milkType: defaultMilkType || 'cow',
            branch: branch
          }
        }).catch((err) => console.error('Failed to create farmer user account:', err));
      }

      const farmer = await Farmer.create({
        farmerCode: formattedCode,
        name: name.trim(),
        branch,
        defaultMilkType: defaultMilkType || 'cow',
        mobile: mobile?.trim() || '',
        isActive: isActive !== undefined ? isActive : true,
        joinedDate: joinedDate || new Date(),
      }).catch(() => null);

      if (farmer) {
        return res.status(201).json({ success: true, message: 'Farmer created successfully', data: farmer });
      }
    }

    const newMemFarmer = {
      _id: `mem_fm_${Date.now()}`,
      farmerCode: formattedCode,
      name: name.trim(),
      branch: { _id: branch, name: 'Central Dairy Branch', code: 'BR001' },
      defaultMilkType: defaultMilkType || 'cow',
      mobile: mobile?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,
      joinedDate: joinedDate || new Date().toISOString(),
    };
    memoryFarmers.push(newMemFarmer);

    return res.status(201).json({ success: true, message: 'Farmer created successfully', data: newMemFarmer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error creating farmer' });
  }
};

export const updateFarmer = async (req, res) => {
  try {
    let { farmerCode, name, branch, defaultMilkType, mobile, isActive, joinedDate } = req.body;

    if (req.user && req.user.role === 'dairyOwner') {
      const branchCode = req.user.dairyOwnerProfile?.branchNumber;
      if (mongoose.connection.readyState === 1) {
        const ownerBranch = await Branch.findOne({ code: branchCode }).catch(() => null);
        if (ownerBranch) {
           // Enforce branch to be owner's branch
           branch = ownerBranch._id.toString();
        }
      }
    }

    if (mongoose.connection.readyState === 1) {
      const farmer = await Farmer.findById(req.params.id).catch(() => null);
      if (farmer) {
        // Double check owner is modifying a farmer in their own branch
        if (req.user && req.user.role === 'dairyOwner' && String(farmer.branch) !== String(branch)) {
           return res.status(403).json({ success: false, message: 'You can only update farmers in your own branch.' });
        }

        const targetBranch = branch || farmer.branch;
        const targetCode = farmerCode ? String(farmerCode).trim() : farmer.farmerCode;
        const targetMilkType = defaultMilkType || farmer.defaultMilkType;

        if (String(targetBranch) !== String(farmer.branch) || targetCode !== farmer.farmerCode || targetMilkType !== farmer.defaultMilkType) {
          const duplicate = await Farmer.findOne({ _id: { $ne: farmer._id }, branch: targetBranch, farmerCode: targetCode, defaultMilkType: targetMilkType }).catch(() => null);
          if (duplicate) {
            return res.status(400).json({ success: false, message: `Farmer code '${targetCode}' for milk type '${targetMilkType}' already exists` });
          }
        }

        if (name) farmer.name = name.trim();
        if (farmerCode) farmer.farmerCode = targetCode;
        if (branch) farmer.branch = branch;
        if (defaultMilkType) farmer.defaultMilkType = defaultMilkType;
        if (mobile !== undefined) farmer.mobile = mobile.trim();
        if (isActive !== undefined) farmer.isActive = isActive;
        if (joinedDate) farmer.joinedDate = joinedDate;

        await farmer.save();
        return res.json({ success: true, message: 'Farmer updated successfully', data: farmer });
      }
    }

    const memIndex = memoryFarmers.findIndex((f) => f._id === req.params.id);
    if (memIndex === -1) {
      return res.status(404).json({ success: false, message: 'Farmer record not found' });
    }

    const targetBranch = branch || memoryFarmers[memIndex].branch._id || memoryFarmers[memIndex].branch;
    const targetCode = farmerCode ? String(farmerCode).trim() : memoryFarmers[memIndex].farmerCode;
    const targetMilkType = defaultMilkType || memoryFarmers[memIndex].defaultMilkType;

    const duplicateMem = memoryFarmers.find(
      (f) => f._id !== req.params.id && String(f.branch._id || f.branch) === String(targetBranch) && String(f.farmerCode) === String(targetCode) && f.defaultMilkType === targetMilkType
    );

    if (duplicateMem) {
      return res.status(400).json({ success: false, message: `Farmer code '${targetCode}' for milk type '${targetMilkType}' already exists` });
    }

    if (name) memoryFarmers[memIndex].name = name.trim();
    if (farmerCode) memoryFarmers[memIndex].farmerCode = targetCode;
    if (defaultMilkType) memoryFarmers[memIndex].defaultMilkType = defaultMilkType;
    if (mobile !== undefined) memoryFarmers[memIndex].mobile = mobile.trim();
    if (isActive !== undefined) memoryFarmers[memIndex].isActive = isActive;
    if (joinedDate) memoryFarmers[memIndex].joinedDate = joinedDate;

    return res.json({ success: true, message: 'Farmer details updated successfully', data: memoryFarmers[memIndex] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating farmer' });
  }
};

export const deleteFarmer = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const farmer = await Farmer.findById(req.params.id).catch(() => null);
      if (farmer) {
        if (req.user && req.user.role === 'dairyOwner') {
          const branchCode = req.user.dairyOwnerProfile?.branchNumber;
          const ownerBranch = await Branch.findOne({ code: new RegExp('^' + branchCode + '$', 'i') }).catch(() => null);
          if (String(farmer.branch) !== String(ownerBranch?._id)) {
            return res.status(403).json({ success: false, message: 'You can only delete farmers in your own branch.' });
          }
        }
        // Attempt to delete the associated user account if one exists
        await User.findOneAndDelete({ 
          'farmerProfile.farmerCode': farmer.farmerCode, 
          'farmerProfile.branch': farmer.branch 
        }).catch((err) => console.error('Failed to delete associated user:', err));

        await Farmer.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'Farmer record deleted successfully' });
      }
    }

    const initialLength = memoryFarmers.length;
    memoryFarmers = memoryFarmers.filter((f) => f._id !== req.params.id);

    if (memoryFarmers.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Farmer record not found' });
    }

    return res.json({ success: true, message: 'Farmer record deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting farmer' });
  }
};
