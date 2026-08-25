import mongoose from 'mongoose';
import { MilkCollection } from '../models/MilkCollection.js';
import Order from '../models/Order.js';

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

// @desc    Get central payments list (Farmers + E-commerce)
// @route   GET /api/payments/admin/payments
// @access  Private/Admin
export const getAdminPayments = async (req, res) => {
  try {
    const { 
      type = 'all', // 'all', 'farmer', 'ecommerce'
      status = 'all', // 'Pending', 'Completed', 'Processing', 'Failed', 'Cancelled'
      branch, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      export: exportFormat
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build common date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    let queryBranch = branch;
    if (req.user && req.user.role === 'dairyOwner') {
      queryBranch = req.user.dairyOwnerProfile?.branchId;
    }

    // Build Farmer (MilkCollection) query
    let farmerQuery = {};
    if (dateFilter.$gte) farmerQuery.date = dateFilter;
    if (queryBranch && queryBranch !== 'all') farmerQuery.branch = queryBranch;
    if (status && status !== 'all') farmerQuery.paymentStatus = status;
    if (search) {
      farmerQuery.$or = [
        { farmerName: { $regex: search, $options: 'i' } },
        { farmerCode: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    // Build Ecommerce (Order) query
    let orderQuery = {};
    if (dateFilter.$gte) orderQuery.createdAt = dateFilter;
    if (queryBranch && queryBranch !== 'all') orderQuery.branch = queryBranch;
    if (status && status !== 'all') orderQuery.paymentStatus = status;
    if (search) {
      orderQuery.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } }
      ];
    }

    let farmerPayments = [];
    let ecommercePayments = [];

    const fetchFarmers = type === 'all' || type === 'farmer';
    const fetchEcommerce = type === 'all' || type === 'ecommerce';

    if (fetchFarmers) {
      farmerPayments = await MilkCollection.find(farmerQuery)
        .populate('branch', 'name code')
        .sort({ date: -1 })
        .lean();
    }

    if (fetchEcommerce) {
      ecommercePayments = await Order.find(orderQuery)
        .sort({ createdAt: -1 })
        .lean();
    }

    // Standardize and merge results
    const combinedPayments = [];

    farmerPayments.forEach(p => {
      combinedPayments.push({
        id: p._id,
        recordType: 'farmer',
        paymentId: p.transactionId || `FP-${p._id.toString().slice(-6).toUpperCase()}`,
        name: p.farmerName,
        code: p.farmerCode,
        branch: p.branch ? p.branch.name : 'N/A',
        amount: p.amount,
        date: p.date,
        method: p.paymentMethod || 'Cash',
        status: p.paymentStatus || 'Pending',
        details: {
          milkType: p.milkType,
          quantity: p.weight,
          fat: p.fat,
          snf: p.snf,
          rate: p.rate,
          session: p.session
        }
      });
    });

    ecommercePayments.forEach(o => {
      combinedPayments.push({
        id: o._id,
        recordType: 'ecommerce',
        paymentId: o.razorpayPaymentId || o.razorpayOrderId || `EC-${o._id.toString().slice(-6).toUpperCase()}`,
        name: o.customerDetails?.name || 'Unknown',
        code: 'N/A',
        branch: 'E-Commerce',
        amount: o.totalAmount,
        date: o.createdAt,
        method: o.paymentMethod || 'Online',
        status: o.paymentStatus || 'Pending',
        details: {
          phone: o.customerDetails?.phone,
          items: o.items?.length || 0,
          orderStatus: o.status,
          products: o.items // pass items array for receipt
        }
      });
    });

    // Sort combined by date descending
    combinedPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Summary Stats from COMBINED array (before pagination)
    let totalPayments = combinedPayments.length;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let failedPayments = 0;
    let todayPayments = 0;
    let thisMonthRevenue = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    combinedPayments.forEach(p => {
      if (p.status === 'Completed' || p.status === 'Paid') {
        totalPaidAmount += p.amount;
        if (p.recordType === 'ecommerce') {
           const pDate = new Date(p.date);
           if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) {
             thisMonthRevenue += p.amount;
           }
        }
      }
      if (p.status === 'Pending') {
        totalPendingAmount += p.amount;
      }
      if (p.status === 'Failed') {
        failedPayments++;
      }
      const pDateStr = new Date(p.date).toISOString().split('T')[0];
      if (pDateStr === todayStr) {
        todayPayments++;
      }
    });

    // Handle CSV Export
    if (exportFormat === 'csv') {
      const csv = jsonToCsv(combinedPayments, [
        { label: 'Type', value: (row) => row.recordType === 'farmer' ? 'Farmer Payout' : 'E-Commerce' },
        { label: 'Payment ID', value: (row) => row.paymentId },
        { label: 'Name', value: (row) => row.name },
        { label: 'Branch', value: (row) => row.branch },
        { label: 'Amount', value: (row) => row.amount },
        { label: 'Method', value: (row) => row.method },
        { label: 'Status', value: (row) => row.status },
        { label: 'Date', value: (row) => new Date(row.date).toLocaleDateString() },
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payments_export.csv`);
      return res.status(200).send(csv);
    }

    // Apply Pagination
    const paginatedPayments = combinedPayments.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      summary: {
        totalPayments,
        totalPaidAmount,
        totalPendingAmount,
        failedPayments,
        todayPayments,
        thisMonthRevenue
      },
      data: paginatedPayments,
      pagination: {
        total: totalPayments,
        page: pageNum,
        pages: Math.ceil(totalPayments / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching payments', error: error.message });
  }
};

// @desc    Delete a payment (and underlying record)
// @route   DELETE /api/payments/admin/payments/:id
// @access  Private/Admin
export const deleteAdminPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { recordType } = req.query; // 'farmer' or 'ecommerce'

    if (!recordType) {
      return res.status(400).json({ success: false, message: 'recordType is required (farmer or ecommerce)' });
    }

    if (recordType === 'farmer') {
      const milkCol = await MilkCollection.findById(id);
      if (milkCol && req.user && req.user.role === 'dairyOwner' && String(milkCol.branch) !== String(req.user.dairyOwnerProfile?.branchId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only delete payments for your branch' });
      }
      const deleted = await MilkCollection.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Milk collection record not found' });
      }
    } else if (recordType === 'ecommerce') {
      const order = await Order.findById(id);
      if (order && req.user && req.user.role === 'dairyOwner' && String(order.branch) !== String(req.user.dairyOwnerProfile?.branchId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only delete payments for your branch' });
      }
      const deleted = await Order.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Order record not found' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid recordType' });
    }

    res.status(200).json({ success: true, message: 'Payment record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: 'Server Error deleting payment', error: error.message });
  }
};
