import mongoose from 'mongoose';
import { MilkCollection } from '../models/MilkCollection.js';
import { Farmer } from '../models/Farmer.js';
import { getRate } from '../utils/rateLookup.js';
import { calculateSnfFromClr } from '../utils/snfFromClr.js';

// In-memory store for development & instant tests when MongoDB Atlas is unpopulated or offline
let memoryCollections = [
  {
    _id: 'col_sample_1',
    branch: '60d5ec49f1b2c81128765411',
    date: new Date().toISOString().split('T')[0],
    session: 'morning',
    farmer: '60d5ec49f1b2c81128765991',
    farmerCode: '101',
    farmerName: 'Ramesh Patil',
    milkType: 'cow',
    weight: 12.5,
    fat: 3.8,
    snf: 8.5,
    degree: 28,
    rate: 36.5,
    amount: 456.25,
    autoFat: false,
    autoWeight: false,
    enteredBy: '60d5ec49f1b2c81128765432',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'col_sample_2',
    branch: '60d5ec49f1b2c81128765411',
    date: new Date().toISOString().split('T')[0],
    session: 'morning',
    farmer: '60d5ec49f1b2c81128765992',
    farmerCode: '102',
    farmerName: 'Suresh Deshmukh',
    milkType: 'buffalo',
    weight: 8.0,
    fat: 6.5,
    snf: 9.0,
    degree: 30,
    rate: 58.0,
    amount: 464.0,
    autoFat: false,
    autoWeight: false,
    enteredBy: '60d5ec49f1b2c81128765432',
    createdAt: new Date().toISOString(),
  },
];

// Helper to format date string to start and end of day for querying
const getStartAndEndOfDay = (dateStr) => {
  const target = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return { start, end, formatted: start.toISOString().split('T')[0] };
};

// @desc    Create new milk collection entry
// @route   POST /api/milk-collection
// @access  Private (Admin & Operator)
export const createMilkCollection = async (req, res) => {
  try {
    const {
      branch,
      date,
      session,
      farmerCode,
      farmerId,
      farmerName,
      milkType,
      weight,
      fat,
      snf,
      degree,
      useClr,
      autoFat,
      autoWeight,
    } = req.body;

    if (!branch || !farmerCode || !milkType || weight === undefined || fat === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Branch, farmer code, milk type, weight, and FAT are required',
      });
    }

    const numWeight = Number(weight);
    const numFat = Number(fat);
    let numSnf = Number(snf);

    if (useClr && degree !== undefined) {
      numSnf = calculateSnfFromClr(numFat, degree);
    }

    if (isNaN(numWeight) || numWeight <= 0 || isNaN(numFat) || isNaN(numSnf)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid weight, FAT, or SNF values',
      });
    }

    // Lookup Farmer name & ID if not directly supplied
    let fId = farmerId;
    let fName = farmerName;
    let fCode = String(farmerCode).trim();

    if ((!fId || !fName) && mongoose.connection.readyState === 1) {
      const farmerObj = await Farmer.findOne({ branch, farmerCode: fCode }).catch(() => null);
      if (farmerObj) {
        fId = farmerObj._id;
        fName = farmerObj.name;
      }
    }

    if (!fName) fName = farmerName || `Farmer #${fCode}`;
    if (!fId) fId = farmerId || `farmer_${fCode}`;

    // Perform Rate Lookup via server-side getRate
    const targetDate = date ? new Date(date) : new Date();
    const rateLookupResult = await getRate({
      milkType,
      fat: numFat,
      snf: numSnf,
      branchId: branch,
      date: targetDate,
    });

    const rate = rateLookupResult.success && rateLookupResult.rate !== null ? rateLookupResult.rate : 0;
    const amount = Math.round(numWeight * rate * 100) / 100;

    let newEntry = null;

    if (mongoose.connection.readyState === 1) {
      newEntry = await MilkCollection.create({
        branch,
        date: targetDate,
        session: session || 'morning',
        farmer: fId,
        farmerCode: fCode,
        farmerName: fName,
        milkType,
        weight: numWeight,
        fat: numFat,
        snf: numSnf,
        degree: Number(degree) || 0,
        rate,
        amount,
        autoFat: !!autoFat,
        autoWeight: !!autoWeight,
        enteredBy: req.user?._id || req.user?.id || '60d5ec49f1b2c81128765432',
      }).catch(() => null);
    }

    if (!newEntry) {
      newEntry = {
        _id: `col_${Date.now()}_${Math.random()}`,
        branch,
        date: targetDate.toISOString().split('T')[0],
        session: session || 'morning',
        farmer: fId,
        farmerCode: fCode,
        farmerName: fName,
        milkType,
        weight: numWeight,
        fat: numFat,
        snf: numSnf,
        degree: Number(degree) || 0,
        rate,
        amount,
        autoFat: !!autoFat,
        autoWeight: !!autoWeight,
        enteredBy: req.user?.id || '60d5ec49f1b2c81128765432',
        createdAt: new Date().toISOString(),
      };
      memoryCollections.unshift(newEntry);
    }

    return res.status(201).json({
      success: true,
      message: 'Milk collection entry recorded successfully',
      data: newEntry,
      rateMatched: rateLookupResult.success,
      rateMessage: rateLookupResult.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating collection entry',
    });
  }
};

// @desc    Get milk collections list & previous session reference for farmer
// @route   GET /api/milk-collection?branch=&date=&session=&farmer=
// @access  Private (Admin & Operator)
export const getMilkCollections = async (req, res) => {
  try {
    const { branch, date, session, farmer, isPreviousSession } = req.query;

    // Special Query: Fetch previous session reference for specific farmer
    if (farmer && (isPreviousSession === 'true' || session === 'previous')) {
      if (mongoose.connection.readyState === 1) {
        const prevEntry = await MilkCollection.findOne({ farmerCode: farmer })
          .sort({ createdAt: -1 })
          .catch(() => null);
        if (prevEntry) {
          return res.json({ success: true, data: prevEntry });
        }
      }

      const prevMem = memoryCollections.find((c) => String(c.farmerCode) === String(farmer));
      return res.json({
        success: !!prevMem,
        data: prevMem || null,
      });
    }

    const { start, end, formatted } = getStartAndEndOfDay(date);

    if (mongoose.connection.readyState === 1) {
      const filter = {
        date: { $gte: start, $lte: end },
      };
      if (branch) filter.branch = branch;
      if (session && session !== 'previous') filter.session = session;
      if (farmer) filter.farmerCode = farmer;

      const collections = await MilkCollection.find(filter)
        .sort({ createdAt: -1 })
        .catch(() => null);

      if (collections) {
        return res.json({
          success: true,
          count: collections.length,
          data: collections,
        });
      }
    }

    // In-memory fallback filtering
    let filtered = memoryCollections;
    if (branch) {
      filtered = filtered.filter((c) => String(c.branch) === String(branch));
    }
    if (session && session !== 'previous') {
      filtered = filtered.filter((c) => c.session === session);
    }
    if (farmer) {
      filtered = filtered.filter((c) => String(c.farmerCode) === String(farmer));
    }

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching milk collections',
    });
  }
};

// @desc    Update a milk collection entry
// @route   PUT /api/milk-collection/:id
// @access  Private (Admin & Operator)
export const updateMilkCollection = async (req, res) => {
  try {
    const { milkType, weight, fat, snf, degree, session } = req.body;

    if (mongoose.connection.readyState === 1) {
      const entry = await MilkCollection.findById(req.params.id).catch(() => null);
      if (entry) {
        if (milkType) entry.milkType = milkType;
        if (weight !== undefined) entry.weight = Number(weight);
        if (fat !== undefined) entry.fat = Number(fat);
        if (snf !== undefined) entry.snf = Number(snf);
        if (degree !== undefined) entry.degree = Number(degree);
        if (session) entry.session = session;

        // Re-evaluate rate & amount
        const rateLookupResult = await getRate({
          milkType: entry.milkType,
          fat: entry.fat,
          snf: entry.snf,
          branchId: entry.branch,
          date: entry.date,
        });

        entry.rate = rateLookupResult.success && rateLookupResult.rate !== null ? rateLookupResult.rate : entry.rate;
        entry.amount = Math.round(entry.weight * entry.rate * 100) / 100;

        await entry.save();
        return res.json({ success: true, message: 'Collection updated', data: entry });
      }
    }

    const idx = memoryCollections.findIndex((c) => c._id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Collection entry not found' });
    }

    const existing = memoryCollections[idx];
    const newMilkType = milkType || existing.milkType;
    const newWeight = weight !== undefined ? Number(weight) : existing.weight;
    const newFat = fat !== undefined ? Number(fat) : existing.fat;
    const newSnf = snf !== undefined ? Number(snf) : existing.snf;

    const rateResult = await getRate({
      milkType: newMilkType,
      fat: newFat,
      snf: newSnf,
      branchId: existing.branch,
    });

    const newRate = rateResult.success && rateResult.rate !== null ? rateResult.rate : existing.rate;
    const newAmount = Math.round(newWeight * newRate * 100) / 100;

    memoryCollections[idx] = {
      ...existing,
      milkType: newMilkType,
      weight: newWeight,
      fat: newFat,
      snf: newSnf,
      degree: degree !== undefined ? Number(degree) : existing.degree,
      session: session || existing.session,
      rate: newRate,
      amount: newAmount,
    };

    return res.json({
      success: true,
      message: 'Collection updated successfully',
      data: memoryCollections[idx],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating collection entry',
    });
  }
};

// @desc    Delete a milk collection entry
// @route   DELETE /api/milk-collection/:id
// @access  Private (Admin & Operator)
export const deleteMilkCollection = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const entry = await MilkCollection.findById(req.params.id).catch(() => null);
      if (entry) {
        await MilkCollection.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'Collection entry deleted successfully' });
      }
    }

    const initialLen = memoryCollections.length;
    memoryCollections = memoryCollections.filter((c) => c._id !== req.params.id);

    if (memoryCollections.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Collection entry not found' });
    }

    return res.json({ success: true, message: 'Collection entry deleted successfully' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting collection entry',
    });
  }
};

// @desc    Get live collection summary with MongoDB aggregation pipeline (cow, buffalo, combined weighted averages)
// @route   GET /api/milk-collection/summary?branch=&date=&session=
// @access  Private (Admin & Operator)
export const getMilkCollectionSummary = async (req, res) => {
  try {
    const { branch, date, session } = req.query;
    const { start, end } = getStartAndEndOfDay(date);

    if (mongoose.connection.readyState === 1) {
      const matchStage = {
        date: { $gte: start, $lte: end },
      };
      if (branch) matchStage.branch = new mongoose.Types.ObjectId(branch);
      if (session) matchStage.session = session;

      const pipelineResult = await MilkCollection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$milkType',
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            fatWeightSum: { $sum: { $multiply: ['$fat', '$weight'] } },
            snfWeightSum: { $sum: { $multiply: ['$snf', '$weight'] } },
            entryCount: { $sum: 1 },
          },
        },
      ]).catch(() => null);

      if (pipelineResult) {
        return res.json({
          success: true,
          data: formatSummaryOutput(pipelineResult),
        });
      }
    }

    // In-memory aggregation fallback
    let filtered = memoryCollections;
    if (branch) {
      filtered = filtered.filter((c) => String(c.branch) === String(branch));
    }
    if (session) {
      filtered = filtered.filter((c) => c.session === session);
    }

    const inMemorySummary = computeInMemorySummary(filtered);
    return res.json({
      success: true,
      data: inMemorySummary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error computing collection summary',
    });
  }
};

// Helper: Format aggregation pipeline result
const formatSummaryOutput = (pipelineItems) => {
  const result = {
    cow: { totalLiters: 0, totalAmount: 0, weightedAvgFat: 0, weightedAvgSnf: 0, weightedAvgRate: 0, entryCount: 0 },
    buffalo: { totalLiters: 0, totalAmount: 0, weightedAvgFat: 0, weightedAvgSnf: 0, weightedAvgRate: 0, entryCount: 0 },
    combined: { totalLiters: 0, totalAmount: 0, weightedAvgFat: 0, weightedAvgSnf: 0, weightedAvgRate: 0, entryCount: 0 },
  };

  let combinedFatSum = 0;
  let combinedSnfSum = 0;

  pipelineItems.forEach((item) => {
    const type = item._id; // 'cow' or 'buffalo'
    const liters = item.totalLiters || 0;
    const amount = item.totalAmount || 0;
    const count = item.entryCount || 0;
    const fatSum = item.fatWeightSum || 0;
    const snfSum = item.snfWeightSum || 0;

    const avgFat = liters > 0 ? Math.round((fatSum / liters) * 100) / 100 : 0;
    const avgSnf = liters > 0 ? Math.round((snfSum / liters) * 100) / 100 : 0;
    const avgRate = liters > 0 ? Math.round((amount / liters) * 100) / 100 : 0;

    if (result[type]) {
      result[type] = {
        totalLiters: Math.round(liters * 100) / 100,
        totalAmount: Math.round(amount * 100) / 100,
        weightedAvgFat: avgFat,
        weightedAvgSnf: avgSnf,
        weightedAvgRate: avgRate,
        entryCount: count,
      };
    }

    result.combined.totalLiters += liters;
    result.combined.totalAmount += amount;
    result.combined.entryCount += count;
    combinedFatSum += fatSum;
    combinedSnfSum += snfSum;
  });

  const totalLit = result.combined.totalLiters;
  result.combined.totalLiters = Math.round(totalLit * 100) / 100;
  result.combined.totalAmount = Math.round(result.combined.totalAmount * 100) / 100;
  result.combined.weightedAvgFat = totalLit > 0 ? Math.round((combinedFatSum / totalLit) * 100) / 100 : 0;
  result.combined.weightedAvgSnf = totalLit > 0 ? Math.round((combinedSnfSum / totalLit) * 100) / 100 : 0;
  result.combined.weightedAvgRate = totalLit > 0 ? Math.round((result.combined.totalAmount / totalLit) * 100) / 100 : 0;

  return result;
};

// Helper: Compute in-memory summary for fallback
const computeInMemorySummary = (entries) => {
  const pipelineFormat = [
    { _id: 'cow', totalLiters: 0, totalAmount: 0, fatWeightSum: 0, snfWeightSum: 0, entryCount: 0 },
    { _id: 'buffalo', totalLiters: 0, totalAmount: 0, fatWeightSum: 0, snfWeightSum: 0, entryCount: 0 },
  ];

  entries.forEach((e) => {
    const target = pipelineFormat.find((p) => p._id === e.milkType);
    if (target) {
      target.totalLiters += Number(e.weight);
      target.totalAmount += Number(e.amount);
      target.fatWeightSum += Number(e.fat) * Number(e.weight);
      target.snfWeightSum += Number(e.snf) * Number(e.weight);
      target.entryCount += 1;
    }
  });

  return formatSummaryOutput(pipelineFormat);
};
