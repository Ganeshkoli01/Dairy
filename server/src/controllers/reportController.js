import mongoose from 'mongoose';
import { MilkCollection } from '../models/MilkCollection.js';
import { Branch } from '../models/Branch.js';
import { Farmer } from '../models/Farmer.js';

// Helper to convert JSON array to CSV format
const jsonToCsv = (data, fields) => {
  if (!data || data.length === 0) return fields.map((f) => f.label).join(',') + '\n';
  const header = fields.map((f) => `"${f.label}"`).join(',');
  const rows = data.map((row) =>
    fields
      .map((f) => {
        const val = f.value(row);
        return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ''}"`;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
};

// Helper for Date range parsing
const parseDateRange = (fromStr, toStr) => {
  let from;
  if (fromStr) {
    from = new Date(`${fromStr}T00:00:00.000Z`);
  } else {
    from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    from.setUTCHours(0, 0, 0, 0);
  }

  let to;
  if (toStr) {
    to = new Date(`${toStr}T23:59:59.999Z`);
  } else {
    to = new Date();
    to.setUTCHours(23, 59, 59, 999);
  }

  return { from, to };
};

// @desc    Farmer Ledger Report across a date range
// @route   GET /api/reports/farmer-ledger?farmerId=&from=&to=
// @access  Private (Admin & Operator)
export const getFarmerLedgerReport = async (req, res) => {
  try {
    const { farmerId, farmerCode, from, to, export: exportFormat } = req.query;
    const code = farmerCode || farmerId;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Farmer ID or Farmer Code parameter is required for ledger',
      });
    }

    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    let entries = [];
    if (mongoose.connection.readyState === 1) {
      const orCondition = [{ farmerCode: String(code).trim() }];
      if (mongoose.Types.ObjectId.isValid(code)) {
        orCondition.push({ farmer: code });
      }

      entries = await MilkCollection.find({
        $or: orCondition,
        date: { $gte: fromDate, $lte: toDate },
      })
        .sort({ date: 1, createdAt: 1 })
        .catch((err) => {
          console.error('Ledger query error:', err);
          return [];
        });
    }

    // Removed dummy data fallback for entries

    let totalLiters = 0;
    let totalAmount = 0;
    let fatSum = 0;
    let snfSum = 0;

    const formattedEntries = entries.map((e) => {
      totalLiters += Number(e.weight || 0);
      totalAmount += Number(e.amount || 0);
      fatSum += Number(e.fat || 0) * Number(e.weight || 0);
      snfSum += Number(e.snf || 0) * Number(e.weight || 0);

      return {
        _id: e._id,
        date: new Date(e.date).toISOString().split('T')[0],
        session: e.session,
        farmerCode: e.farmerCode,
        farmerName: e.farmerName,
        milkType: e.milkType,
        weight: Number(e.weight),
        fat: Number(e.fat),
        snf: Number(e.snf),
        rate: Number(e.rate),
        amount: Number(e.amount),
        runningTotalLiters: Math.round(totalLiters * 100) / 100,
        runningTotalAmount: Math.round(totalAmount * 100) / 100,
      };
    });

    const summary = {
      totalLiters: Math.round(totalLiters * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      weightedAvgFat: totalLiters > 0 ? Math.round((fatSum / totalLiters) * 100) / 100 : 0,
      weightedAvgSnf: totalLiters > 0 ? Math.round((snfSum / totalLiters) * 100) / 100 : 0,
      weightedAvgRate: totalLiters > 0 ? Math.round((totalAmount / totalLiters) * 100) / 100 : 0,
      entryCount: formattedEntries.length,
    };

    if (exportFormat === 'csv') {
      const csv = jsonToCsv(formattedEntries, [
        { label: 'Date', value: (row) => row.date },
        { label: 'Session', value: (row) => row.session },
        { label: 'Farmer Code', value: (row) => row.farmerCode },
        { label: 'Farmer Name', value: (row) => row.farmerName },
        { label: 'Milk Type', value: (row) => row.milkType },
        { label: 'Weight (L)', value: (row) => row.weight },
        { label: 'FAT %', value: (row) => row.fat },
        { label: 'SNF %', value: (row) => row.snf },
        { label: 'Rate (₹)', value: (row) => row.rate },
        { label: 'Amount (₹)', value: (row) => row.amount },
        { label: 'Running Liters', value: (row) => row.runningTotalLiters },
        { label: 'Running Amount', value: (row) => row.runningTotalAmount },
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=farmer_ledger_${code}.csv`);
      return res.status(200).send(csv);
    }

    return res.json({
      success: true,
      farmerCode: code,
      farmerName: formattedEntries[0]?.farmerName || `Farmer #${code}`,
      period: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
      summary,
      data: formattedEntries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating farmer ledger',
    });
  }
};

// @desc    Branch Summary Report (Day-wise totals over range)
// @route   GET /api/reports/branch-summary?branch=&from=&to=
// @access  Private (Admin & Operator)
export const getBranchSummaryReport = async (req, res) => {
  try {
    const { branch, from, to, export: exportFormat } = req.query;
    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    let dayGroups = [];
    if (mongoose.connection.readyState === 1) {
      const matchStage = {
        date: { $gte: fromDate, $lte: toDate },
      };
      if (branch) matchStage.branch = new mongoose.Types.ObjectId(branch);

      dayGroups = await MilkCollection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            cowLiters: {
              $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$weight', 0] },
            },
            buffaloLiters: {
              $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$weight', 0] },
            },
            fatWeightSum: { $sum: { $multiply: ['$fat', '$weight'] } },
            snfWeightSum: { $sum: { $multiply: ['$snf', '$weight'] } },
            entryCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []);
    }

    // Removed dummy data fallback

    const data = dayGroups.map((d) => {
      const liters = d.totalLiters || 0;
      const amount = d.totalAmount || 0;
      return {
        date: d._id,
        totalLiters: Math.round(liters * 100) / 100,
        totalAmount: Math.round(amount * 100) / 100,
        cowLiters: Math.round((d.cowLiters || 0) * 100) / 100,
        buffaloLiters: Math.round((d.buffaloLiters || 0) * 100) / 100,
        weightedAvgFat: liters > 0 ? Math.round(((d.fatWeightSum || 0) / liters) * 100) / 100 : 0,
        weightedAvgSnf: liters > 0 ? Math.round(((d.snfWeightSum || 0) / liters) * 100) / 100 : 0,
        entryCount: d.entryCount || 0,
      };
    });

    if (exportFormat === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Date', value: (row) => row.date },
        { label: 'Total Liters', value: (row) => row.totalLiters },
        { label: 'Cow Liters', value: (row) => row.cowLiters },
        { label: 'Buffalo Liters', value: (row) => row.buffaloLiters },
        { label: 'Avg FAT %', value: (row) => row.weightedAvgFat },
        { label: 'Avg SNF %', value: (row) => row.weightedAvgSnf },
        { label: 'Total Amount (₹)', value: (row) => row.totalAmount },
        { label: 'Entries', value: (row) => row.entryCount },
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=branch_summary.csv`);
      return res.status(200).send(csv);
    }

    return res.json({
      success: true,
      period: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating branch summary',
    });
  }
};

// @desc    Payment Due Report (Per-farmer totals over period for payout register)
// @route   GET /api/reports/payment-due?branch=&from=&to=
// @access  Private (Admin & Operator)
export const getPaymentDueReport = async (req, res) => {
  try {
    const { branch, from, to, export: exportFormat } = req.query;
    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    let farmerTotals = [];
    if (mongoose.connection.readyState === 1) {
      const matchStage = {
        date: { $gte: fromDate, $lte: toDate },
      };
      if (branch) matchStage.branch = new mongoose.Types.ObjectId(branch);

      farmerTotals = await MilkCollection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$farmerCode',
            farmerName: { $first: '$farmerName' },
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            cowLiters: {
              $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$weight', 0] },
            },
            buffaloLiters: {
              $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$weight', 0] },
            },
            fatWeightSum: { $sum: { $multiply: ['$fat', '$weight'] } },
            snfWeightSum: { $sum: { $multiply: ['$snf', '$weight'] } },
            entryCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []);
    }

    // Removed dummy data fallback

    const data = farmerTotals.map((f) => {
      const liters = f.totalLiters || 0;
      const amount = f.totalAmount || 0;
      return {
        farmerCode: f._id,
        farmerName: f.farmerName || `Farmer #${f._id}`,
        totalLiters: Math.round(liters * 100) / 100,
        cowLiters: Math.round((f.cowLiters || 0) * 100) / 100,
        buffaloLiters: Math.round((f.buffaloLiters || 0) * 100) / 100,
        avgFat: liters > 0 ? Math.round(((f.fatWeightSum || 0) / liters) * 100) / 100 : 0,
        avgSnf: liters > 0 ? Math.round(((f.snfWeightSum || 0) / liters) * 100) / 100 : 0,
        avgRate: liters > 0 ? Math.round((amount / liters) * 100) / 100 : 0,
        totalAmount: Math.round(amount * 100) / 100,
        entryCount: f.entryCount || 0,
      };
    });

    const grandTotalLiters = data.reduce((acc, r) => acc + r.totalLiters, 0);
    const grandTotalAmount = data.reduce((acc, r) => acc + r.totalAmount, 0);

    if (exportFormat === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Farmer Code', value: (row) => row.farmerCode },
        { label: 'Farmer Name', value: (row) => row.farmerName },
        { label: 'Total Liters', value: (row) => row.totalLiters },
        { label: 'Cow Liters', value: (row) => row.cowLiters },
        { label: 'Buffalo Liters', value: (row) => row.buffaloLiters },
        { label: 'Avg FAT %', value: (row) => row.avgFat },
        { label: 'Avg SNF %', value: (row) => row.avgSnf },
        { label: 'Avg Rate (₹)', value: (row) => row.avgRate },
        { label: 'Payout Amount (₹)', value: (row) => row.totalAmount },
        { label: 'Entries', value: (row) => row.entryCount },
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payment_due_register.csv`);
      return res.status(200).send(csv);
    }

    return res.json({
      success: true,
      period: { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] },
      summary: {
        totalFarmers: data.length,
        grandTotalLiters: Math.round(grandTotalLiters * 100) / 100,
        grandTotalAmount: Math.round(grandTotalAmount * 100) / 100,
      },
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating payment due report',
    });
  }
};

// @desc    Admin Dashboard Overview Endpoint
// @route   GET /api/reports/admin-dashboard
// @access  Private (Admin only)
export const getAdminDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    let branchFilter = {};

    if (userRole === 'dairyOwner') {
      const branchNum = req.user.dairyOwnerProfile?.branchNumber;
      if (!branchNum) {
        return res.status(400).json({ success: false, message: 'Branch info missing for owner' });
      }
      const branchDoc = await Branch.findOne({ code: branchNum });
      if (!branchDoc) {
         return res.status(400).json({ success: false, message: 'Branch not found' });
      }
      branchFilter = { branch: branchDoc._id };
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const tenDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
    tenDaysAgo.setUTCHours(0, 0, 0, 0);

    let todayTotals = {
      totalLiters: 0,
      totalAmount: 0,
      totalEntries: 0,
      cowLiters: 0,
      cowAmount: 0,
      buffaloLiters: 0,
      buffaloAmount: 0,
    };

    let branchWiseToday = [];

    let trend14Days = [];
    // Initialize last 10 days with 0
    for (let i = 9; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      trend14Days.push({
        date: dateStr,
        cowLiters: 0,
        buffaloLiters: 0,
        totalLiters: 0,
        totalAmount: 0,
      });
    }

    if (mongoose.connection.readyState === 1) {
      // 1. Today Totals
      const todayAgg = await MilkCollection.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd }, ...branchFilter } },
        {
          $group: {
            _id: null,
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            totalEntries: { $sum: 1 },
            cowLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$weight', 0] } },
            cowAmount: { $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$amount', 0] } },
            buffaloLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$weight', 0] } },
            buffaloAmount: { $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$amount', 0] } },
          },
        },
      ]).catch(() => []);

      if (todayAgg.length > 0) {
        const t = todayAgg[0];
        todayTotals = {
          totalLiters: Math.round(t.totalLiters * 100) / 100,
          totalAmount: Math.round(t.totalAmount * 100) / 100,
          totalEntries: t.totalEntries,
          cowLiters: Math.round(t.cowLiters * 100) / 100,
          cowAmount: Math.round(t.cowAmount * 100) / 100,
          buffaloLiters: Math.round(t.buffaloLiters * 100) / 100,
          buffaloAmount: Math.round(t.buffaloAmount * 100) / 100,
        };
      }

      // 2. Branch-Wise Today
      const branchAgg = await MilkCollection.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd }, ...branchFilter } },
        {
          $group: {
            _id: '$branch',
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            cowLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$weight', 0] } },
            buffaloLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$weight', 0] } },
            entryCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchDetails',
          },
        },
      ]).catch(() => []);

      if (branchAgg.length > 0) {
        branchWiseToday = branchAgg.map((b) => {
          const details = b.branchDetails?.[0] || {};
          return {
            _id: b._id,
            branchName: details.name || 'Central Branch',
            branchCode: details.code || 'BR001',
            totalLiters: Math.round(b.totalLiters * 100) / 100,
            cowLiters: Math.round(b.cowLiters * 100) / 100,
            buffaloLiters: Math.round(b.buffaloLiters * 100) / 100,
            totalAmount: Math.round(b.totalAmount * 100) / 100,
            entryCount: b.entryCount,
          };
        });
      }

      // 3. 10 Days Trend
      const trendAgg = await MilkCollection.aggregate([
        { $match: { date: { $gte: tenDaysAgo, $lte: todayEnd }, ...branchFilter } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalLiters: { $sum: '$weight' },
            totalAmount: { $sum: '$amount' },
            cowLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'cow'] }, '$weight', 0] } },
            buffaloLiters: { $sum: { $cond: [{ $eq: ['$milkType', 'buffalo'] }, '$weight', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]).catch(() => []);

      if (trendAgg.length > 0) {
        trendAgg.forEach((d) => {
          const trendIndex = trend14Days.findIndex((t) => t.date === d._id);
          if (trendIndex !== -1) {
            trend14Days[trendIndex] = {
              date: d._id,
              totalLiters: Math.round(d.totalLiters * 100) / 100,
              cowLiters: Math.round(d.cowLiters * 100) / 100,
              buffaloLiters: Math.round(d.buffaloLiters * 100) / 100,
              totalAmount: Math.round(d.totalAmount * 100) / 100,
            };
          }
        });
      }
    }

    return res.json({
      success: true,
      today: todayTotals,
      branchWiseToday,
      trend14Days,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching admin dashboard stats',
    });
  }
};
