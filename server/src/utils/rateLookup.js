import mongoose from 'mongoose';
import { RateChart } from '../models/RateChart.js';

/**
 * Rate Lookup Logic with Round-Down Matching
 * Finds the highest rate entry where entry.fat <= fat, entry.snf <= snf, and entry.effectiveFrom <= date.
 * Prefers branch-specific chart entries over global (branch = null) entries.
 */
export const getRate = async ({
  milkType,
  fat,
  snf,
  branchId = null,
  date = new Date(),
  customEntries = null,
}) => {
  const fatVal = Number(fat);
  const snfVal = Number(snf);
  const targetDate = new Date(date);
  targetDate.setHours(23, 59, 59, 999); // Include charts seeded anytime today

  if (isNaN(fatVal) || isNaN(snfVal)) {
    return {
      success: false,
      rate: null,
      message: 'Invalid FAT or SNF value provided',
    };
  }

  // If customEntries array is supplied (in-memory evaluation or test mode)
  if (customEntries && Array.isArray(customEntries)) {
    return matchFromList(customEntries, milkType, fatVal, snfVal, branchId, targetDate);
  }

  // Otherwise query MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      // Step 1: Attempt Branch-Specific lookup first if branchId is provided
      if (branchId) {
        const branchMatch = await RateChart.find({
          milkType,
          branch: branchId,
          fat: { $lte: fatVal },
          snf: { $lte: snfVal },
          effectiveFrom: { $lte: targetDate },
        })
          .sort({ fat: -1, snf: -1, effectiveFrom: -1 })
          .limit(1)
          .catch(() => null);

        if (branchMatch && branchMatch.length > 0) {
          const entry = branchMatch[0];
          return {
            success: true,
            rate: entry.rate,
            matchedFat: entry.fat,
            matchedSnf: entry.snf,
            effectiveFrom: entry.effectiveFrom,
            isBranchSpecific: true,
            message: `Matched branch rate for FAT ${entry.fat}% & SNF ${entry.snf}%`,
          };
        }
      }

      // Step 2: Fallback to Global Rate Chart (branch == null)
      const globalMatch = await RateChart.find({
        milkType,
        branch: null,
        fat: { $lte: fatVal },
        snf: { $lte: snfVal },
        effectiveFrom: { $lte: targetDate },
      })
        .sort({ fat: -1, snf: -1, effectiveFrom: -1 })
        .limit(1)
        .catch(() => null);

      if (globalMatch && globalMatch.length > 0) {
        const entry = globalMatch[0];
        return {
          success: true,
          rate: entry.rate,
          matchedFat: entry.fat,
          matchedSnf: entry.snf,
          effectiveFrom: entry.effectiveFrom,
          isBranchSpecific: false,
          message: `Matched global rate for FAT ${entry.fat}% & SNF ${entry.snf}%`,
        };
      }
    } catch (err) {
      console.error('[RateLookup DB Error]', err.message);
    }
  }

  return {
    success: false,
    rate: null,
    message: `No matching rate chart entry found for ${milkType.toUpperCase()} milk with FAT >= ${fatVal}% and SNF >= ${snfVal}%`,
  };
};

/**
 * Helper function for matching rate entries in an array (in-memory)
 */
export const matchFromList = (entries, milkType, fatVal, snfVal, branchId, targetDateRaw) => {
  const targetDate = new Date(targetDateRaw);
  targetDate.setHours(23, 59, 59, 999);

  // Filter eligible entries
  const eligible = entries.filter((e) => {
    if (e.milkType !== milkType) return false;
    if (Number(e.fat) > fatVal || Number(e.snf) > snfVal) return false;
    if (e.effectiveFrom && new Date(e.effectiveFrom) > targetDate) return false;
    return true;
  });

  if (eligible.length === 0) {
    return {
      success: false,
      rate: null,
      message: `No matching rate chart entry found for ${milkType.toUpperCase()} milk with FAT >= ${fatVal}% and SNF >= ${snfVal}%`,
    };
  }

  // Separate branch-specific vs global
  const branchEntries = branchId
    ? eligible.filter((e) => String(e.branch?._id || e.branch) === String(branchId))
    : [];

  const candidates = branchEntries.length > 0 ? branchEntries : eligible.filter((e) => !e.branch);

  if (candidates.length === 0) {
    return {
      success: false,
      rate: null,
      message: `No matching rate entry found for FAT ${fatVal}% & SNF ${snfVal}%`,
    };
  }

  // Sort descending by FAT, SNF, effectiveFrom
  candidates.sort((a, b) => {
    if (b.fat !== a.fat) return Number(b.fat) - Number(a.fat);
    if (b.snf !== a.snf) return Number(b.snf) - Number(a.snf);
    return new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime();
  });

  const best = candidates[0];
  return {
    success: true,
    rate: Number(best.rate),
    matchedFat: Number(best.fat),
    matchedSnf: Number(best.snf),
    effectiveFrom: best.effectiveFrom,
    isBranchSpecific: !!best.branch,
    message: `Matched ${best.branch ? 'branch-specific' : 'global'} rate entry`,
  };
};
