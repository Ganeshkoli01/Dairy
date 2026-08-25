import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Protected
export const getProducts = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (branchId) {
        query = { $or: [{ branch: branchId }, { branch: { $exists: false } }, { branch: null }] };
      }
    }
    const products = await Product.find(query).sort({ category: 1, nameEn: 1 }).populate('branch', 'name');
    
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && req.user.role === 'dairyOwner';
    const isPrivileged = isAdmin || isOwner;
    const branchId = isOwner ? req.user.dairyOwnerProfile?.branchId : null;
    
    const formattedProducts = products.map(product => {
      const p = product.toObject();
      
      // Always show Main Plant stock in the Shop so owners can purchase from it
      
      if (!isAdmin) {
        delete p.cogs;
      }
      if (!isPrivileged) {
        delete p.plantTransferPrice;
      }
      return p;
    });

    res.json({ success: true, count: formattedProducts.length, data: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single product by id
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && req.user.role === 'dairyOwner';

    if (isOwner) {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (product.branch && String(product.branch) !== String(branchId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access other branch products' });
      }
    }

    const isPrivileged = isAdmin || isOwner;
    const p = product.toObject();
    
    // If Dairy Owner, show their branch stock instead of Main Plant stock
    if (isOwner) {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (branchId) {
        const bStock = p.branchStock?.find(b => b.branch && b.branch.toString() === branchId.toString());
        p.stock = bStock ? bStock.stock : 0;
      }
    }
    
    if (!isAdmin) {
      delete p.cogs;
    }
    if (!isPrivileged) {
      delete p.plantTransferPrice;
    }
    
    res.json({ success: true, data: p });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (branchId) {
        productData.branch = branchId;
      }
    }
    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json({ success: true, data: createdProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (!branchId) return res.status(403).json({ success: false, message: 'Branch info missing' });
      query.branch = branchId;
      req.body.branch = branchId; // Prevent changing branch
    }

    const product = await Product.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (!branchId) return res.status(403).json({ success: false, message: 'Branch info missing' });
      query.branch = branchId;
    }

    const product = await Product.findOneAndDelete(query);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
