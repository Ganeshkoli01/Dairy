import mongoose from 'mongoose';
import { Branch } from '../models/Branch.js';

let memoryBranches = [
  {
    _id: '60d5ec49f1b2c81128765411',
    name: 'Central Dairy Branch',
    code: 'BR001',
    location: 'Main Market Road, District 1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: '60d5ec49f1b2c81128765412',
    name: 'North Valley Branch',
    code: 'BR002',
    location: 'North Bypass Highway',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const getBranches = async (req, res) => {
  try {
    let { isActive, branchCode } = req.query;

    if (req.user && req.user.role === 'dairyOwner') {
      branchCode = req.user.dairyOwnerProfile?.branchNumber;
    }

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (branchCode) filter.code = new RegExp('^' + branchCode + '$', 'i');
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      const branches = await Branch.find(filter).sort({ name: 1 }).catch(() => null);
      if (branches) {
        return res.json({ success: true, count: branches.length, data: branches });
      }
    }

    let filteredMemory = memoryBranches;
    if (isActive !== undefined) {
      filteredMemory = memoryBranches.filter((b) => b.isActive === (isActive === 'true'));
    }

    return res.json({ success: true, count: filteredMemory.length, data: filteredMemory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching branches' });
  }
};

export const getBranchById = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const branch = await Branch.findById(req.params.id).catch(() => null);
      if (branch) return res.json({ success: true, data: branch });
    }

    const memoryBranch = memoryBranches.find((b) => b._id === req.params.id);
    if (!memoryBranch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.json({ success: true, data: memoryBranch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching branch details' });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, code, location, isActive } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Branch name and unique branch code are required' });
    }

    const formattedCode = code.trim().toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const existingBranch = await Branch.findOne({ code: formattedCode }).catch(() => null);
      if (existingBranch) {
        return res.status(400).json({ success: false, message: `Branch code '${formattedCode}' already exists` });
      }

      const branch = await Branch.create({
        name: name.trim(),
        code: formattedCode,
        location: location?.trim() || '',
        isActive: isActive !== undefined ? isActive : true,
      }).catch(() => null);

      if (branch) {
        return res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
      }
    }

    if (memoryBranches.some((b) => b.code === formattedCode)) {
      return res.status(400).json({ success: false, message: `Branch code '${formattedCode}' already exists` });
    }

    const newMemoryBranch = {
      _id: `mem_br_${Date.now()}`,
      name: name.trim(),
      code: formattedCode,
      location: location?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString(),
    };
    memoryBranches.push(newMemoryBranch);

    return res.status(201).json({ success: true, message: 'Branch created successfully', data: newMemoryBranch });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error creating branch' });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { name, code, location, isActive } = req.body;

    if (mongoose.connection.readyState === 1) {
      const branch = await Branch.findById(req.params.id).catch(() => null);
      if (branch) {
        if (code) {
          const formattedCode = code.trim().toUpperCase();
          if (formattedCode !== branch.code) {
            const existing = await Branch.findOne({ code: formattedCode }).catch(() => null);
            if (existing) {
              return res.status(400).json({ success: false, message: `Branch code '${formattedCode}' is already in use` });
            }
            branch.code = formattedCode;
          }
        }
        if (name) branch.name = name.trim();
        if (location !== undefined) branch.location = location.trim();
        if (isActive !== undefined) branch.isActive = isActive;

        await branch.save();
        return res.json({ success: true, message: 'Branch updated successfully', data: branch });
      }
    }

    const memIndex = memoryBranches.findIndex((b) => b._id === req.params.id);
    if (memIndex === -1) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (
        formattedCode !== memoryBranches[memIndex].code &&
        memoryBranches.some((b) => b.code === formattedCode)
      ) {
        return res.status(400).json({ success: false, message: `Branch code '${formattedCode}' is already in use` });
      }
      memoryBranches[memIndex].code = formattedCode;
    }

    if (name) memoryBranches[memIndex].name = name.trim();
    if (location !== undefined) memoryBranches[memIndex].location = location.trim();
    if (isActive !== undefined) memoryBranches[memIndex].isActive = isActive;

    return res.json({ success: true, message: 'Branch updated successfully', data: memoryBranches[memIndex] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error updating branch' });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const branch = await Branch.findById(req.params.id).catch(() => null);
      if (branch) {
        await Branch.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'Branch deleted successfully' });
      }
    }

    const initialLength = memoryBranches.length;
    memoryBranches = memoryBranches.filter((b) => b._id !== req.params.id);

    if (memoryBranches.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    return res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting branch' });
  }
};
