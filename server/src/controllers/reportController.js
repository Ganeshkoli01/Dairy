import mongoose from 'mongoose';
import { MilkCollection } from '../models/MilkCollection.js';
import { Branch } from '../models/Branch.js';
import { Farmer } from '../models/Farmer.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryHistory from '../models/InventoryHistory.js';
import Procurement from '../models/Procurement.js';

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
    const { farmerId, farmerCode, from, to, branch, milkType, export: exportFormat } = req.query;
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

      const query = {
        $or: orCondition,
        date: { $gte: fromDate, $lte: toDate },
      };
      
      // Filter by branch if provided, otherwise fallback to user's branch if they are a dairy owner or farmer
      let queryBranch = branch;
      if (req.user && req.user.role === 'dairyOwner') {
        queryBranch = req.user.dairyOwnerProfile?.branchId;
      } else if (req.user && req.user.role === 'farmer') {
        queryBranch = req.user.farmerProfile?.branch;
        
        if (req.user.farmerProfile?.milkType && req.user.farmerProfile.milkType !== 'both') {
          query.milkType = req.user.farmerProfile.milkType;
        }
      }
      
      if (queryBranch) {
        query.branch = queryBranch;
      }
      
      if (milkType && milkType !== 'all') {
        query.milkType = milkType;
      }

      entries = await MilkCollection.find(query)
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
      farmerCode: formattedEntries[0]?.farmerCode || (mongoose.Types.ObjectId.isValid(code) ? 'Unknown' : code),
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
    let { branch, from, to, export: exportFormat } = req.query;
    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    if (req.user && req.user.role === 'dairyOwner') {
      branch = req.user.dairyOwnerProfile?.branchId;
    }

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
    let { branch, from, to, export: exportFormat } = req.query;
    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    if (req.user && req.user.role === 'dairyOwner') {
      branch = req.user.dairyOwnerProfile?.branchId;
    }

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
            _id: '$farmer',
            farmerCode: { $first: '$farmerCode' },
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
        { $sort: { farmerCode: 1 } },
      ]).catch(() => []);
    }

    // Removed dummy data fallback

    const data = farmerTotals.map((f) => {
      const liters = f.totalLiters || 0;
      const amount = f.totalAmount || 0;
      return {
        farmerCode: f.farmerCode || String(f._id),
        farmerName: f.farmerName || `Farmer #${f.farmerCode || f._id}`,
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
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (!branchId) {
        return res.status(400).json({ success: false, message: 'Branch info missing for owner' });
      }
      branchFilter = { branch: new mongoose.Types.ObjectId(branchId) };
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

// --- NEW COMPREHENSIVE ANALYTICS ENDPOINTS --- //

const getBranchFilter = (req, baseQuery = {}) => {
  if (req.user && req.user.role === 'dairyOwner') {
    baseQuery.branch = new mongoose.Types.ObjectId(req.user.dairyOwnerProfile.branchId);
  } else if (req.query.branch && req.query.branch !== 'all') {
    baseQuery.branch = new mongoose.Types.ObjectId(req.query.branch);
  }
  return baseQuery;
};

// @desc    Get Analytics Summary
// @route   GET /api/reports/summary?from=&to=&branch=
export const getAnalyticsSummary = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    
    // Order Sales
    const orderMatch = getBranchFilter(req, {
      createdAt: { $gte: from, $lte: to },
      paymentStatus: 'Completed',
      status: { $ne: 'Cancelled' }
    });
    
    const salesData = await Order.aggregate([
      { $match: orderMatch },
      { $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['Pending', 'Processing']] }, 1, 0] } }
      }}
    ]);

    // Payments Received vs Pending
    const paymentsReceivedData = await Order.aggregate([
      { $match: getBranchFilter(req, { createdAt: { $gte: from, $lte: to }, paymentStatus: 'Completed' }) },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const paymentsPendingData = await Order.aggregate([
      { $match: getBranchFilter(req, { createdAt: { $gte: from, $lte: to }, paymentStatus: 'Pending' }) },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Milk Collection
    const milkMatch = getBranchFilter(req, { date: { $gte: from, $lte: to } });
    const milkData = await MilkCollection.aggregate([
      { $match: milkMatch },
      { $group: { _id: null, totalMilk: { $sum: '$weight' }, totalValue: { $sum: '$amount' } } }
    ]);

    // Products Sold
    const productsData = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: '$items' },
      { $group: { _id: null, totalUnits: { $sum: '$items.quantity' } } }
    ]);

    // Stock Transfers (Procurements)
    const procurementMatch = getBranchFilter(req, {
      createdAt: { $gte: from, $lte: to },
      status: { $ne: 'Cancelled' }
    });
    
    const procurementData = await Procurement.aggregate([
      { $match: procurementMatch },
      { $group: { _id: null, totalTransferValue: { $sum: '$totalTransferValue' } } }
    ]);

    const onlineSales = salesData[0]?.totalSales || 0;
    const stockTransferSales = procurementData[0]?.totalTransferValue || 0;

    return res.json({
      success: true,
      summary: {
        onlineSales: onlineSales,
        stockTransferSales: stockTransferSales,
        totalSales: onlineSales + stockTransferSales,
        totalOrders: salesData[0]?.totalOrders || 0,
        completedOrders: salesData[0]?.completedOrders || 0,
        pendingOrders: salesData[0]?.pendingOrders || 0,
        cancelledOrders: await Order.countDocuments(getBranchFilter(req, { createdAt: { $gte: from, $lte: to }, status: 'Cancelled' })),
        paymentsReceived: paymentsReceivedData[0]?.total || 0,
        paymentsPending: paymentsPendingData[0]?.total || 0,
        milkCollected: Math.round((milkData[0]?.totalMilk || 0) * 100) / 100,
        milkValue: Math.round((milkData[0]?.totalValue || 0) * 100) / 100,
        productsSold: productsData[0]?.totalUnits || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrdersReport = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    const match = getBranchFilter(req, { createdAt: { $gte: from, $lte: to } });
    
    const orders = await Order.find(match).populate('branch', 'name').sort({ createdAt: -1 });
    
    const data = orders.map(o => ({
      orderId: o._id,
      date: new Date(o.createdAt).toISOString().split('T')[0],
      customer: o.customerDetails?.name || 'Unknown',
      branch: o.branch?.name || 'Main Plant',
      itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      itemsSummary: o.items.map(i => `${i.nameEn} x ${i.quantity}`).join(', '),
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status
    }));

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Order ID', value: row => row.orderId },
        { label: 'Date', value: row => row.date },
        { label: 'Customer', value: row => row.customer },
        { label: 'Branch', value: row => row.branch },
        { label: 'Items Count', value: row => row.itemsCount },
        { label: 'Total Amount (Rs)', value: row => row.totalAmount },
        { label: 'Payment Method', value: row => row.paymentMethod },
        { label: 'Payment Status', value: row => row.paymentStatus },
        { label: 'Order Status', value: row => row.status },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales_orders_report.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPaymentsReport = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    const match = getBranchFilter(req, { createdAt: { $gte: from, $lte: to } });
    
    const orders = await Order.find(match).populate('branch', 'name').sort({ createdAt: -1 });
    const data = orders.map(o => ({
      paymentId: o.razorpayPaymentId || 'N/A',
      orderId: o._id,
      customer: o.customerDetails?.name || 'Unknown',
      amount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      date: new Date(o.createdAt).toISOString().split('T')[0],
      branch: o.branch?.name || 'Main Plant'
    }));

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Payment ID', value: row => row.paymentId },
        { label: 'Order ID', value: row => row.orderId },
        { label: 'Date', value: row => row.date },
        { label: 'Customer', value: row => row.customer },
        { label: 'Branch', value: row => row.branch },
        { label: 'Amount (Rs)', value: row => row.amount },
        { label: 'Method', value: row => row.paymentMethod },
        { label: 'Status', value: row => row.paymentStatus },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payments_report.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getInventoryReport = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const products = await Product.find().populate('branchStock.branch', 'name');
    
    let data = [];
    const targetBranch = req.user.role === 'dairyOwner' ? req.user.dairyOwnerProfile.branchId : req.query.branch;

    products.forEach(p => {
      if (!targetBranch || targetBranch === 'all' || targetBranch === 'Main Plant') {
        data.push({
          productName: p.nameEn,
          branch: 'Main Plant',
          currentStock: p.stock,
          unit: p.unit,
          lowStockThreshold: p.lowStockThreshold,
          status: p.stock === 0 ? 'Out of Stock' : (p.stock <= p.lowStockThreshold ? 'Low Stock' : 'Available'),
          sellingPrice: p.price,
          plantTransferPrice: isAdmin ? p.plantTransferPrice : 'Hidden',
          cogs: isAdmin ? p.cogs : 'Hidden'
        });
      }
      p.branchStock.forEach(bs => {
        if (!targetBranch || targetBranch === 'all' || String(bs.branch._id) === String(targetBranch)) {
          data.push({
            productName: p.nameEn,
            branch: bs.branch?.name || 'Unknown',
            currentStock: bs.stock,
            unit: p.unit,
            lowStockThreshold: p.lowStockThreshold,
            status: bs.stock === 0 ? 'Out of Stock' : (bs.stock <= p.lowStockThreshold ? 'Low Stock' : 'Available'),
            sellingPrice: p.price,
            plantTransferPrice: isAdmin ? p.plantTransferPrice : 'Hidden',
            cogs: isAdmin ? p.cogs : 'Hidden'
          });
        }
      });
    });

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Product', value: row => row.productName },
        { label: 'Branch', value: row => row.branch },
        { label: 'Stock', value: row => row.currentStock },
        { label: 'Unit', value: row => row.unit },
        { label: 'Threshold', value: row => row.lowStockThreshold },
        { label: 'Status', value: row => row.status },
        { label: 'Selling Price', value: row => row.sellingPrice },
        { label: 'Plant Transfer Price', value: row => row.plantTransferPrice },
        { label: 'COGS', value: row => row.cogs },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_report.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockMovementsReport = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    const match = getBranchFilter(req, { createdAt: { $gte: from, $lte: to } });
    
    const history = await InventoryHistory.find(match)
      .populate('product', 'nameEn')
      .populate('branch', 'name')
      .sort({ createdAt: -1 });

    const data = history.map(h => ({
      date: new Date(h.createdAt).toISOString().split('T')[0],
      productName: h.product?.nameEn || 'Unknown',
      branch: h.branch?.name || 'Main Plant',
      type: h.movementType,
      quantity: h.quantityChange > 0 ? `+${h.quantityChange}` : `${h.quantityChange}`,
      previousStock: h.previousStock,
      newStock: h.newStock,
      reference: h.referenceId || 'N/A'
    }));

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Date', value: row => row.date },
        { label: 'Product', value: row => row.productName },
        { label: 'Branch', value: row => row.branch },
        { label: 'Type', value: row => row.type },
        { label: 'Qty Change', value: row => row.quantity },
        { label: 'Prev Stock', value: row => row.previousStock },
        { label: 'New Stock', value: row => row.newStock },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=stock_movements.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockTransfersReport = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    const match = getBranchFilter(req, { 
      createdAt: { $gte: from, $lte: to }
    });
    
    const transfers = await Procurement.find(match)
      .populate('branch', 'name')
      .populate('product', 'nameEn')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 });

    const data = [];
    const isAdmin = req.user && req.user.role === 'admin';
    transfers.forEach(t => {
      data.push({
        transferNumber: t.invoiceNumber || t._id,
        date: new Date(t.createdAt).toISOString().split('T')[0],
        from: 'GK Dairy Main Plant',
        toBranch: t.branch?.name || 'Unknown',
        productName: t.product?.nameEn || 'Unknown',
        quantity: t.quantity,
        plantTransferPrice: isAdmin ? t.plantTransferPrice : 'Hidden',
        totalValue: isAdmin ? t.totalTransferValue : 'Hidden',
        status: t.status || 'Pending',
        receivedDate: t.receivedAt ? new Date(t.receivedAt).toISOString().split('T')[0] : 'Pending',
        receivedBy: t.receivedBy?.name || 'N/A'
      });
    });

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Transfer No.', value: row => row.transferNumber },
        { label: 'Date', value: row => row.date },
        { label: 'From', value: row => row.from },
        { label: 'To', value: row => row.toBranch },
        { label: 'Product', value: row => row.productName },
        { label: 'Qty', value: row => row.quantity },
        { label: 'Transfer Price', value: row => row.plantTransferPrice },
        { label: 'Total Value', value: row => row.totalValue },
        { label: 'Status', value: row => row.status },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=stock_transfers.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getProductsReport = async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query.from, req.query.to);
    const orderMatch = getBranchFilter(req, {
      createdAt: { $gte: from, $lte: to },
      paymentStatus: 'Completed',
      status: { $ne: 'Cancelled' }
    });

    const productsData = await Order.aggregate([
      { $match: orderMatch },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product',
          name: { $first: '$items.nameEn' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { revenue: -1 } }
    ]);

    const isAdmin = req.user && req.user.role === 'admin';
    let data = [];
    if (isAdmin) {
      const products = await Product.find({ _id: { $in: productsData.map(p => p._id) } });
      data = productsData.map(pd => {
        const prod = products.find(p => p._id.toString() === pd._id.toString());
        const plantMargin = prod ? (prod.plantTransferPrice - prod.cogs) : 0;
        const branchMargin = prod ? (prod.price - prod.plantTransferPrice) : 0;
        return {
          productName: pd.name,
          unitsSold: pd.unitsSold,
          revenue: pd.revenue,
          cogs: prod?.cogs || 0,
          plantTransferPrice: prod?.plantTransferPrice || 0,
          sellingPrice: prod?.price || 0,
          plantMargin: plantMargin,
          branchMargin: branchMargin,
        };
      });
    } else {
      data = productsData.map(pd => ({
        productName: pd.name,
        unitsSold: pd.unitsSold,
        revenue: pd.revenue,
        cogs: 'Hidden',
        plantTransferPrice: 'Hidden',
        sellingPrice: 'Hidden',
        plantMargin: 'Hidden',
        branchMargin: 'Hidden',
      }));
    }

    if (req.query.export === 'csv') {
      const csv = jsonToCsv(data, [
        { label: 'Product', value: row => row.productName },
        { label: 'Units Sold', value: row => row.unitsSold },
        { label: 'Revenue (Rs)', value: row => row.revenue },
        { label: 'COGS', value: row => row.cogs },
        { label: 'Transfer Price', value: row => row.plantTransferPrice },
        { label: 'Selling Price', value: row => row.sellingPrice },
        { label: 'Plant Margin', value: row => row.plantMargin },
        { label: 'Branch Margin', value: row => row.branchMargin },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=product_sales.csv`);
      return res.status(200).send(csv);
    }
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
