import Order from '../models/Order.js';
import { User } from '../models/User.js';
import Product from '../models/Product.js';
import InventoryHistory from '../models/InventoryHistory.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { generateInvoicePDF } from '../utils/invoiceService.js';
import { Otp } from '../models/Otp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { dispatchToAdminAndOwner } from '../utils/notificationService.js';

// @desc    Send OTP for Dairy Owner Order Verification
// @route   POST /api/orders/send-otp
// @access  Private/DairyOwner
export const sendOrderOtp = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'dairyOwner') {
      return res.status(403).json({ success: false, message: 'Only Dairy Owners can request an order OTP' });
    }

    const email = user.email;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database
    await Otp.findOneAndUpdate(
      { email: email },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center;">
          <h1 style="color: #f8fafc; margin: 0; font-size: 24px;">GK Dairy System</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; color: #334155;">
          <h2 style="margin-top: 0;">Order Verification OTP</h2>
          <p>You requested to place a stock order for your branch. Your 6-digit verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #06b6d4;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #64748b;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `Order Verification OTP - GK Dairy [${new Date().toLocaleTimeString()}]`,
      html: emailHtml,
    });

    return res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Send Order OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Helper function to fulfill an order (deduct stock, send email)
const fulfillOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    // Deduct stock and record history
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      
      if (order.branch) {
        // Dairy Owner is purchasing from Main Plant to stock their branch.
        // Subtract from Main Plant stock only. Branch stock is updated when they confirm receipt.
        const mainPrevStock = product.stock;
        const mainNewStock = Math.max(0, product.stock - item.quantity);
        product.stock = mainNewStock;
        
        await product.save();

        await InventoryHistory.create({
          product: product._id,
          type: 'Customer Order',
          quantity: -item.quantity,
          previousStock: mainPrevStock,
          newStock: mainNewStock,
          reason: 'Branch Order Dispatch',
          referenceId: order._id,
          branch: null, // Log against main plant since it's a dispatch
          createdBy: order.user
        });
      } else {
        // Main Plant Order (Admin direct sale)
        const prevStock = product.stock;
        const newStock = Math.max(0, product.stock - item.quantity);
        product.stock = newStock;
        
        await product.save();

        await InventoryHistory.create({
          product: product._id,
          type: 'Customer Order',
          quantity: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          reason: 'Customer purchase',
          referenceId: order._id,
          branch: null,
          createdBy: order.user
        });
      }
    }

    // Determine email to send confirmation to
    let userEmail = null;
    if (order.user) {
      const user = await User.findById(order.user);
      if (user) userEmail = user.email;
    }

    // Generate invoice if not exists
    if (!order.invoiceNumber) {
      const year = new Date().getFullYear();
      const idSuffix = order._id.toString().slice(-6).toUpperCase();
      order.invoiceNumber = `INV-${year}-${idSuffix}`;
      await order.save();
    }

    let pdfBuffer = null;
    try {
      // Repopulate branch if needed for invoice
      await order.populate('branch', 'name');
      pdfBuffer = await generateInvoicePDF(order);
    } catch (pdfErr) {
      console.error('Error generating PDF for email:', pdfErr);
    }

    // Send confirmation email
    if (userEmail) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Order Confirmed!</h2>
          <p>Dear ${order.customerDetails.name},</p>
          <p>Your order (ID: <strong>${order._id}</strong>) has been successfully placed and is currently being processed.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Order Summary</h3>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          </div>

          <p>You can track your order status in your dashboard.</p>
          <br>
          <p>Thank you for choosing GK Dairy!</p>
        </div>
      `;

      try {
        const mailOptions = {
          to: userEmail,
          subject: `Order Confirmation - ${order._id}`,
          html: emailContent
        };
        
        if (pdfBuffer) {
          mailOptions.attachments = [{
            filename: `GK-Dairy-Invoice-${order.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }];
        }

        await sendEmail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // We don't fail the order if email fails
      }
    }
  } catch (error) {
    console.error("Error fulfilling order:", error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (or Private depending on user requirements)
export const createOrder = async (req, res) => {
  try {
    const { items, customerDetails, paymentMethod, otp } = req.body;

    if (items && items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    let calculatedTotal = 0;
    const validatedItems = [];
    const stockUpdates = [];

    let branchId = undefined;
    if (req.user && req.user.role === 'dairyOwner') {
      branchId = req.user.dairyOwnerProfile?.branchId;
      if (!branchId) {
        return res.status(403).json({ success: false, message: 'Your account is not assigned to a branch. Please contact the administrator.' });
      }
      if (req.body.branchId && req.body.branchId.toString() !== branchId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized branch selection. You can only order for your assigned branch.' });
      }

      // Verify OTP for Dairy Owner
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required to place an order.' });
      }

      const otpRecord = await Otp.findOne({ email: req.user.email }).sort({ createdAt: -1 });
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
      }
      
      // Enforce 10 minute expiry
      if (Date.now() - new Date(otpRecord.createdAt).getTime() > 10 * 60 * 1000) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      console.log('Validating OTP. DB OTP:', otpRecord.otp, 'Provided OTP:', otp, 'Type of DB OTP:', typeof otpRecord.otp, 'Type of provided OTP:', typeof otp);

      if (String(otpRecord.otp).trim() !== String(otp).trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      // Clear the OTP
      await Otp.deleteOne({ _id: otpRecord._id });
    }
    
    // Now verify stock based on branch
    for (const item of items) {
      const product = await Product.findById(item.product || item._id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found` });
      }
      
      let availableStock = product.stock; // Always check Main Plant stock since Shop buys from Main Plant

      
      if (availableStock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.nameEn}. Available: ${availableStock}, Requested: ${item.quantity}` });
      }
      
      const actualPrice = product.plantTransferPrice || product.price;
      calculatedTotal += (actualPrice * item.quantity);
      
      validatedItems.push({
        product: product._id,
        nameEn: product.nameEn,
        nameMr: product.nameMr,
        price: actualPrice,
        quantity: item.quantity,
        unit: product.unit,
      });

      stockUpdates.push({
        product,
        quantity: item.quantity
      });
    }

    const order = new Order({
      user: req.user?._id,
      customerDetails,
      items: validatedItems,
      totalAmount: calculatedTotal,
      paymentMethod,
      branch: branchId
    });

    await order.save();

    dispatchToAdminAndOwner(
      branchId,
      'NEW_ORDER',
      'New Order Received',
      `Order #${order._id.toString().slice(-6).toUpperCase()} for ₹${calculatedTotal} was placed.`,
      order._id,
      'Order'
    );

    if (paymentMethod === 'Cash on Delivery') {
      // For COD, fulfill immediately
      await fulfillOrder(order._id);
      return res.status(201).json({ success: true, data: order, message: 'Order placed successfully' });
    } else {
      try {
        let rzpOrderId = 'order_dummy_' + Date.now();
        
        // Only call Razorpay API if real keys are provided
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key') {
          const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(calculatedTotal * 100), // amount in paise
            currency: 'INR',
            receipt: order._id.toString(),
          });
          rzpOrderId = rzpOrder.id;
        }

        order.razorpayOrderId = rzpOrderId;
        await order.save();
        
        return res.status(201).json({ 
          success: true, 
          data: order,
          razorpayOrderId: rzpOrderId
        });
      } catch (rzpError) {
        console.error('Razorpay Error:', rzpError);
        return res.status(500).json({ success: false, message: 'Failed to create payment order', error: rzpError.message });
      }
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
// Force nodemon restart to load new .env variables

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (branchId) {
        query.branch = branchId;
      }
    }
    const orders = await Order.find(query).populate('branch', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify-payment
// @access  Public
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (order) {
        // Double check payment status with Razorpay API for security
        let paymentCaptured = false;
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key') {
          try {
            const razorpayInstance = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);
            if (payment.status === 'captured' && payment.amount === order.totalAmount * 100) {
              paymentCaptured = true;
            } else {
              return res.status(400).json({ success: false, message: 'Payment not captured or amount mismatch' });
            }
          } catch (fetchErr) {
            console.error('Error fetching payment from Razorpay API:', fetchErr);
            return res.status(500).json({ success: false, message: 'Failed to verify payment with gateway' });
          }
        } else {
          // Dev fallback when using placeholder keys
          paymentCaptured = true;
        }

        if (paymentCaptured) {
          order.paymentStatus = 'Completed';
          order.razorpayPaymentId = razorpay_payment_id;
          order.razorpaySignature = razorpay_signature;
          await order.save();
          
          // Fulfill order now that payment is securely verified
          await fulfillOrder(order._id);
          
          dispatchToAdminAndOwner(
            order.branch,
            'PAYMENT_RECEIVED',
            'Online Payment Received',
            `Payment of ₹${order.totalAmount} for Order #${order._id.toString().slice(-6).toUpperCase()} was successfully captured.`,
            order._id,
            'Order'
          );

          return res.status(200).json({ success: true, message: 'Payment verified successfully' });
        }
      } else {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Download order invoice PDF
// @route   GET /api/orders/:id/invoice
// @access  Protected (Admin / Dairy Owner)
export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'email name')
      .populate('branch', 'name');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && req.user.role === 'dairyOwner';

    if (isOwner) {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      if (order.branch && String(order.branch._id || order.branch) !== String(branchId)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot access invoices for other branches' });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!order.invoiceNumber) {
      const year = new Date().getFullYear();
      const idSuffix = order._id.toString().slice(-6).toUpperCase();
      order.invoiceNumber = `INV-${year}-${idSuffix}`;
      await order.save();
    }

    const pdfBuffer = await generateInvoicePDF(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=GK-Dairy-Invoice-${order.invoiceNumber}.pdf`
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice', error: error.message });
  }
};

// Expose razorpay key to frontend
export const getRazorpayKey = (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key' });
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Receive order (Dairy Owner confirms receipt of stock)
// @route   PUT /api/orders/:id/receive
// @access  Private/DairyOwner
export const receiveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Order must be marked as Delivered by Admin before you can receive it.' });
    }

    const branchId = req.user.dairyOwnerProfile?.branchId;
    if (String(order.branch) !== String(branchId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to receive this order' });
    }

    // Add stock to branch
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      let prevStock = 0;
      let newStock = 0;

      const bIndex = product.branchStock.findIndex(b => b.branch.toString() === order.branch.toString());
      if (bIndex >= 0) {
        prevStock = product.branchStock[bIndex].stock;
        newStock = prevStock + item.quantity;
        product.branchStock[bIndex].stock = newStock;
      } else {
        prevStock = 0;
        newStock = item.quantity;
        product.branchStock.push({ branch: order.branch, stock: newStock });
      }

      await product.save();

      await InventoryHistory.create({
        product: product._id,
        type: 'Customer Order',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        reason: 'Branch Order Received',
        referenceId: order._id,
        branch: order.branch,
        createdBy: req.user._id
      });
    }

    order.status = 'Received';
    await order.save();

    res.json({ success: true, message: 'Order marked as received and stock updated', data: order });
  } catch (error) {
    console.error('Error receiving order:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
