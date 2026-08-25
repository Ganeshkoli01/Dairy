import Procurement from '../models/Procurement.js';
import Product from '../models/Product.js';
import InventoryHistory from '../models/InventoryHistory.js';

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

// @desc    Create new procurement
// @route   POST /api/procurements
// @access  Private/Admin/Owner
export const createProcurement = async (req, res) => {
  try {
    const { product: productId, quantity, plantTransferPrice, cogs, invoiceNumber, purchaseDate, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let branchId = undefined;
    if (req.user && req.user.role === 'dairyOwner') {
      branchId = req.user.dairyOwnerProfile?.branchId;
    } else if (req.body.branch) {
      branchId = req.body.branch;
    }

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch is required for Stock Transfer' });
    }

    // Check if Main Plant has enough stock
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock at Main Plant. Available: ${product.stock}` });
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
      branch: branchId,
      createdBy: req.user._id
    });

    const createdProcurement = await procurement.save();

    // Deduct from Main Plant Stock
    product.stock -= quantity;
    
    // Add to Branch Stock
    const branchStockIndex = product.branchStock.findIndex(b => b.branch.toString() === branchId.toString());
    const prevBranchStock = branchStockIndex >= 0 ? product.branchStock[branchStockIndex].stock : 0;
    const newBranchStock = prevBranchStock + quantity;
    
    if (branchStockIndex >= 0) {
      product.branchStock[branchStockIndex].stock = newBranchStock;
    } else {
      product.branchStock.push({ branch: branchId, stock: newBranchStock });
    }
    
    // Update the product's default plant transfer price and cogs if admin
    product.plantTransferPrice = plantTransferPrice;
    if (isAdmin && cogs !== undefined) {
      product.cogs = Number(cogs);
    }
    
    await product.save();

    await InventoryHistory.create({
      product: productId,
      type: 'Stock Transfer',
      quantity: quantity,
      previousStock: prevBranchStock,
      newStock: newBranchStock,
      reason: 'Stock received from Main Plant',
      referenceId: createdProcurement._id,
      branch: branchId,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: createdProcurement });
  } catch (error) {
    console.error('Error creating procurement:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
