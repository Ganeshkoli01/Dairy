import Procurement from '../models/Procurement.js';
import Product from '../models/Product.js';
import InventoryHistory from '../models/InventoryHistory.js';
import { User } from '../models/User.js';
import { dispatchNotification } from '../utils/notificationService.js';
import { generateProcurementInvoicePDF } from '../utils/invoiceService.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Get all procurements
// @route   GET /api/procurements
// @access  Private/Admin/Owner
export const getProcurements = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (branchId) {
        query.branch = branchId;
      }
    }
    const procurements = await Procurement.find(query)
      .populate('product', 'nameEn nameMr')
      .populate('createdBy', 'name')
      .populate('dispatchedBy', 'name')
      .populate('receivedBy', 'name')
      .populate('branch', 'name code')
      .sort({ purchaseDate: -1, createdAt: -1 });
      
    // Mask COGS for Dairy Owners
    const isAdmin = req.user && req.user.role === 'admin';
    const sanitizedProcurements = procurements.map(p => {
      if (isAdmin) return p;
      const doc = p.toObject();
      delete doc.cogs;
      delete doc.totalCogsValue;
      return doc;
    });

    res.json({ success: true, count: sanitizedProcurements.length, data: sanitizedProcurements });
  } catch (error) {
    console.error('Error fetching procurements:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new procurement (Stock Transfer - Pending)
// @route   POST /api/procurements
// @access  Private/Admin
export const createProcurement = async (req, res) => {
  try {
    const { product: productId, quantity, plantTransferPrice, cogs, invoiceNumber, purchaseDate, notes, branch } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!branch) {
      return res.status(400).json({ success: false, message: 'Branch is required for Stock Transfer' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const actualCogs = isAdmin && cogs !== undefined ? Number(cogs) : product.cogs || 0;

    const calculatedTotalTransferValue = Number(quantity) * Number(plantTransferPrice);
    const calculatedTotalCogsValue = Number(quantity) * actualCogs;

    const procurement = new Procurement({
      source: 'GK Dairy Main Plant',
      product: productId,
      quantity,
      plantTransferPrice,
      cogs: actualCogs,
      totalTransferValue: calculatedTotalTransferValue,
      totalCogsValue: calculatedTotalCogsValue,
      invoiceNumber,
      purchaseDate,
      notes,
      branch: branch,
      createdBy: req.user._id,
      status: 'Pending'
    });

    let invNum = invoiceNumber;
    if (!invNum) {
      const year = new Date().getFullYear();
      const idSuffix = procurement._id.toString().slice(-6).toUpperCase();
      invNum = `TRF-${year}-${idSuffix}`;
      procurement.invoiceNumber = invNum;
    }

    const createdProcurement = await procurement.save();

    // Optionally update the product's default plant transfer price and cogs if admin
    const updateData = { plantTransferPrice };
    if (isAdmin && cogs !== undefined) {
      updateData.cogs = Number(cogs);
    }
    await Product.updateOne({ _id: productId }, { $set: updateData });

    // Generate PDF and send email asynchronously
    const sendInvoiceEmail = async () => {
      try {
        await createdProcurement.populate('branch', 'name code');
        await createdProcurement.populate('product', 'nameEn unit');
        const pdfBuffer = await generateProcurementInvoicePDF(createdProcurement);
        
        const owner = await User.findOne({ role: 'dairyOwner', 'dairyOwnerProfile.branchId': branch });
        if (owner && owner.email) {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">Stock Transfer Created</h2>
              <p>Dear ${owner.dairyOwnerProfile?.ownerName || 'Branch Owner'},</p>
              <p>A new stock transfer (ID: <strong>${createdProcurement._id}</strong>) has been initiated for your branch.</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e293b;">Transfer Summary</h3>
                <p style="margin: 5px 0;"><strong>Product:</strong> ${createdProcurement.product?.nameEn}</p>
                <p style="margin: 5px 0;"><strong>Quantity:</strong> ${createdProcurement.quantity} ${createdProcurement.product?.unit || ''}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${createdProcurement.totalTransferValue}</p>
              </div>

              <p>Please log into your dashboard to track and confirm receipt once dispatched.</p>
              <br>
              <p>Thank you!</p>
            </div>
          `;
          
          await sendEmail({
            to: owner.email,
            subject: `Stock Transfer Invoice - ${invNum}`,
            html: emailContent,
            attachments: [{
              filename: `GK-Dairy-Transfer-${invNum}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
          });
        }
      } catch (err) {
        console.error('Error sending procurement invoice email:', err);
      }
    };

    sendInvoiceEmail(); // do not await

    res.status(201).json({ success: true, data: createdProcurement });
  } catch (error) {
    console.error('Error creating procurement:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Dispatch procurement
// @route   PUT /api/procurements/:id/dispatch
// @access  Private/Admin
export const dispatchProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    if (procurement.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot dispatch transfer in ${procurement.status} status` });
    }

    const product = await Product.findById(procurement.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < procurement.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock at Main Plant. Available: ${product.stock}` });
    }

    // Deduct from Main Plant Stock
    const previousStock = product.stock;
    product.stock -= procurement.quantity;
    await product.save();

    // Update procurement status
    procurement.status = 'Dispatched';
    procurement.dispatchedAt = Date.now();
    procurement.dispatchedBy = req.user._id;
    await procurement.save();

    // Log Inventory History for Main Plant deduction
    await InventoryHistory.create({
      product: product._id,
      type: 'Stock Transfer',
      quantity: -procurement.quantity,
      previousStock: previousStock,
      newStock: product.stock,
      reason: `Dispatched to branch. Transfer ID: ${procurement._id.toString().slice(-6).toUpperCase()}`,
      referenceId: procurement._id,
      createdBy: req.user._id
    });

    // Notify Owner
    dispatchNotification({
      recipientRole: 'dairyOwner',
      branch: procurement.branch,
      type: 'SYSTEM_ALERT',
      title: '📦 Stock Dispatched',
      message: `${procurement.quantity} units of ${product.nameEn} have been dispatched to your branch.`,
      referenceId: procurement._id,
      referenceType: 'Procurement'
    });

    res.json({ success: true, data: procurement });
  } catch (error) {
    console.error('Error dispatching procurement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Receive procurement
// @route   PUT /api/procurements/:id/receive
// @access  Private/Owner
export const receiveProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const ownerBranchId = req.user.dairyOwnerProfile?.branchId;
    if (procurement.branch.toString() !== ownerBranchId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to receive this transfer' });
    }

    if (procurement.status === 'Received') {
      return res.status(400).json({ success: false, message: 'This transfer has already been received' });
    }

    if (procurement.status !== 'Dispatched' && procurement.status !== 'Issue Reported') {
      return res.status(400).json({ success: false, message: `Cannot receive transfer in ${procurement.status} status` });
    }

    const product = await Product.findById(procurement.product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Add to Branch Stock
    const branchStockIndex = product.branchStock.findIndex(b => b.branch.toString() === ownerBranchId.toString());
    const prevBranchStock = branchStockIndex >= 0 ? product.branchStock[branchStockIndex].stock : 0;
    const newBranchStock = prevBranchStock + procurement.quantity;
    
    if (branchStockIndex >= 0) {
      product.branchStock[branchStockIndex].stock = newBranchStock;
    } else {
      product.branchStock.push({ branch: ownerBranchId, stock: newBranchStock });
    }
    await product.save();

    // Update procurement status
    procurement.status = 'Received';
    procurement.receivedAt = Date.now();
    procurement.receivedBy = req.user._id;
    // Clear issue if it was resolved by receiving
    if(procurement.status === 'Issue Reported') {
      procurement.actualReceivedQuantity = procurement.quantity;
      procurement.issueReason = 'Issue resolved, full stock accepted';
    }
    await procurement.save();

    // Log Inventory History for Branch addition
    await InventoryHistory.create({
      product: product._id,
      type: 'Stock Transfer',
      quantity: procurement.quantity,
      previousStock: prevBranchStock,
      newStock: newBranchStock,
      reason: `Received from Main Plant. Transfer ID: ${procurement._id.toString().slice(-6).toUpperCase()}`,
      referenceId: procurement._id,
      branch: ownerBranchId,
      createdBy: req.user._id
    });

    // Notify Admin
    dispatchNotification({
      recipientRole: 'admin',
      type: 'SYSTEM_ALERT',
      title: '✅ Stock Received',
      message: `Branch successfully received ${procurement.quantity} units of ${product.nameEn}.`,
      referenceId: procurement._id,
      referenceType: 'Procurement'
    });

    res.json({ success: true, data: procurement });
  } catch (error) {
    console.error('Error receiving procurement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Report issue with procurement
// @route   PUT /api/procurements/:id/issue
// @access  Private/Owner
export const reportProcurementIssue = async (req, res) => {
  try {
    const { actualReceivedQuantity, issueReason } = req.body;
    const procurement = await Procurement.findById(req.params.id);
    
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const ownerBranchId = req.user.dairyOwnerProfile?.branchId;
    if (procurement.branch.toString() !== ownerBranchId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to report an issue for this transfer' });
    }

    if (procurement.status === 'Received') {
      return res.status(400).json({ success: false, message: 'This transfer has already been received' });
    }

    if (procurement.status !== 'Dispatched') {
      return res.status(400).json({ success: false, message: `Cannot report issue for transfer in ${procurement.status} status` });
    }

    procurement.status = 'Issue Reported';
    procurement.actualReceivedQuantity = actualReceivedQuantity;
    procurement.issueReason = issueReason;
    await procurement.save();

    const product = await Product.findById(procurement.product);

    // Notify Admin
    dispatchNotification({
      recipientRole: 'admin',
      type: 'SYSTEM_ALERT',
      title: '⚠️ Delivery Issue Reported',
      message: `Branch reported an issue receiving ${product?.nameEn}. Expected: ${procurement.quantity}, Received: ${actualReceivedQuantity}. Reason: ${issueReason}`,
      referenceId: procurement._id,
      referenceType: 'Procurement'
    });

    res.json({ success: true, data: procurement });
  } catch (error) {
    console.error('Error reporting procurement issue:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete procurement
// @route   DELETE /api/procurements/:id
// @access  Private/Admin
export const deleteProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    await procurement.deleteOne();

    res.json({ success: true, message: 'Transfer deleted successfully' });
  } catch (error) {
    console.error('Error deleting procurement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
