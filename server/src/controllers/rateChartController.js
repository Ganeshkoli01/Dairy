import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RateChart } from '../models/RateChart.js';
import { getRate, matchFromList, memoryRateCharts } from '../utils/rateLookup.js';
import { calculateSnfFromClr } from '../utils/snfFromClr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Memory rate charts are now exported and loaded from rateLookup.js

// @desc    Get rate chart entries
// @route   GET /api/rate-chart?milkType=xxx&branch=xxx
// @access  Private (Admin & Operator)
export const getRateCharts = async (req, res) => {
  try {
    const { milkType, branch } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (milkType) filter.milkType = milkType;
      if (branch !== undefined) filter.branch = branch === 'null' || !branch ? null : branch;

      let charts = await RateChart.find(filter)
        .populate('branch', 'name code')
        .sort({ fat: 1, snf: 1 })
        .catch(() => null);

      // Fallback to global (owner) rate chart if branch-specific chart is empty
      if ((!charts || charts.length === 0) && filter.branch !== null) {
        charts = await RateChart.find({ milkType: filter.milkType, branch: null })
          .populate('branch', 'name code')
          .sort({ fat: 1, snf: 1 })
          .catch(() => null);
      }

      if (charts && charts.length > 0) {
        return res.json({
          success: true,
          count: charts.length,
          data: charts,
        });
      }
    }

    let filtered = memoryRateCharts;
    if (milkType) {
      filtered = filtered.filter((r) => r.milkType === milkType);
    }
    
    let branchFiltered = filtered;
    if (branch !== undefined) {
      const bId = branch === 'null' || !branch ? null : String(branch);
      branchFiltered = filtered.filter((r) => {
        const rBranch = r.branch?._id || r.branch || null;
        return String(rBranch) === String(bId);
      });
      
      // Fallback to global (owner) rate chart if branch-specific chart is empty
      if (branchFiltered.length === 0 && bId !== null) {
        branchFiltered = filtered.filter((r) => {
          const rBranch = r.branch?._id || r.branch || null;
          return rBranch === null || rBranch === 'null';
        });
      }
    } else {
      branchFiltered = filtered;
    }

    return res.json({
      success: true,
      count: branchFiltered.length,
      data: branchFiltered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching rate chart entries',
    });
  }
};

// @desc    Create or bulk upload rate chart entries
// @route   POST /api/rate-chart
// @access  Private (Admin & Owner)
export const saveRateChart = async (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rate chart data provided',
      });
    }

    const savedEntries = [];

    for (const item of items) {
      const { milkType, fat, snf, rate, branch, effectiveFrom } = item;

      if (!milkType || fat === undefined || snf === undefined || rate === undefined) {
        continue;
      }

      const branchVal = branch && branch !== 'null' ? branch : null;
      const effectiveFromVal = effectiveFrom ? new Date(effectiveFrom) : new Date();

      if (mongoose.connection.readyState === 1) {
        const entry = await RateChart.findOneAndUpdate(
          {
            milkType,
            fat: Number(fat),
            snf: Number(snf),
            branch: branchVal,
          },
          {
            rate: Number(rate),
            effectiveFrom: effectiveFromVal,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        savedEntries.push(entry);
      } else {
        const existingIdx = memoryRateCharts.findIndex(
          (m) =>
            m.milkType === milkType &&
            m.fat === Number(fat) &&
            m.snf === Number(snf) &&
            String(m.branch) === String(branchVal)
        );

        const newDoc = {
          _id: existingIdx >= 0 ? memoryRateCharts[existingIdx]._id : `rc_${Date.now()}_${Math.random()}`,
          milkType,
          fat: Number(fat),
          snf: Number(snf),
          rate: Number(rate),
          branch: branchVal,
          effectiveFrom: effectiveFromVal.toISOString(),
        };

        if (existingIdx >= 0) {
          memoryRateCharts[existingIdx] = newDoc;
        } else {
          memoryRateCharts.push(newDoc);
        }
        savedEntries.push(newDoc);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully saved ${savedEntries.length} rate chart entries`,
      count: savedEntries.length,
      data: savedEntries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error saving rate chart entries',
    });
  }
};

// @desc    Perform rate lookup for milk entry (FAT x SNF matrix lookup)
// @route   POST /api/rate-chart/lookup
// @access  Private (Admin & Operator)
export const lookupRate = async (req, res) => {
  try {
    const { milkType, fat, snf, branchId, date } = req.body;

    if (!milkType || fat === undefined || snf === undefined) {
      return res.status(400).json({
        success: false,
        message: 'milkType, fat, and snf parameters are required for rate lookup',
      });
    }

    const fatNum = Number(fat);
    const snfNum = Number(snf);
    const targetDate = date ? new Date(date) : new Date();

    if (mongoose.connection.readyState === 1) {
      const dbResult = await getRate({
        milkType,
        fat: fatNum,
        snf: snfNum,
        branchId: branchId || null,
        date: targetDate,
      });

      if (dbResult.success && dbResult.rate !== null) {
        return res.json({
          success: true,
          milkType,
          fat: fatNum,
          snf: snfNum,
          result: {
            success: true,
            rate: dbResult.rate,
            matchedFat: dbResult.matchedFat,
            matchedSnf: dbResult.matchedSnf,
            effectiveFrom: dbResult.effectiveFrom,
            isBranchSpecific: dbResult.isBranchSpecific,
            message: dbResult.message,
          },
        });
      }
    }

    // In-Memory Fallback lookup using matchFromList
    const memoryResult = matchFromList(
      memoryRateCharts,
      milkType,
      fatNum,
      snfNum,
      branchId || null,
      targetDate
    );

    if (memoryResult.success && memoryResult.rate !== null) {
      return res.json({
        success: true,
        milkType,
        fat: fatNum,
        snf: snfNum,
        result: {
          success: true,
          rate: memoryResult.rate,
          matchedFat: memoryResult.matchedFat,
          matchedSnf: memoryResult.matchedSnf,
          effectiveFrom: memoryResult.effectiveFrom,
          isBranchSpecific: memoryResult.isBranchSpecific,
          message: memoryResult.message,
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: `No matching rate chart entry found for ${milkType.toUpperCase()} (FAT: ${fatNum}, SNF: ${snfNum})`,
      result: { success: false, rate: null },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error looking up milk rate',
    });
  }
};

export const lookupRateController = lookupRate;

// @desc    Calculate SNF from FAT & CLR (degree)
// @route   POST /api/rate-chart/calculate-snf
// @access  Private
export const calculateSnfController = (req, res) => {
  try {
    const { fat, clr } = req.body;

    if (fat === undefined || clr === undefined) {
      return res.status(400).json({
        success: false,
        message: 'FAT and CLR (degree) parameters are required',
      });
    }

    const snf = calculateSnfFromClr(Number(fat), Number(clr));

    return res.json({
      success: true,
      fat: Number(fat),
      clr: Number(clr),
      snf,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error calculating SNF',
    });
  }
};

// @desc    Clear / Delete rate chart entries
// @route   DELETE /api/rate-chart?milkType=xxx&branch=xxx
// @access  Private (Admin & Owner)
export const deleteRateChart = async (req, res) => {
  try {
    const { milkType, branch } = req.query;
    const filter = {};
    if (milkType) filter.milkType = milkType;
    if (branch !== undefined) filter.branch = branch === 'null' || !branch ? null : branch;

    if (mongoose.connection.readyState === 1) {
      const deleted = await RateChart.deleteMany(filter);
      return res.json({
        success: true,
        message: `Deleted ${deleted.deletedCount} rate chart entries from database`,
      });
    }

    const prevCount = memoryRateCharts.length;
    const keptCharts = memoryRateCharts.filter((r) => {
      if (milkType && r.milkType !== milkType) return true;
      if (branch !== undefined && String(r.branch) !== String(branch)) return true;
      return false;
    });
    memoryRateCharts.length = 0;
    memoryRateCharts.push(...keptCharts);

    return res.json({
      success: true,
      message: `Deleted ${prevCount - memoryRateCharts.length} in-memory rate chart entries`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error clearing rate chart entries',
    });
  }
};

export const clearRateChartMatrix = deleteRateChart;
