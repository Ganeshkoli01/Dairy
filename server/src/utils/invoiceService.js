import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc.fillColor('#4f46e5').fontSize(24).font('Helvetica-Bold').text('GK Dairy', { align: 'center' });
      doc.fillColor('#475569').fontSize(12).font('Helvetica').text('Dairy Management & E-Commerce System', { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(10).text('Address: GK Dairy Main Plant, Maharashtra, India', { align: 'center' });
      doc.text('Phone: +91 8010434421 | Email: ganeshkoli0149@gmail.com', { align: 'center' });
      doc.text('Website: www.gkdairy.online', { align: 'center' });
      
      doc.moveDown(2);
      
      // Draw a line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown(1.5);

      // --- Invoice Details vs Customer Details ---
      const topY = doc.y;
      
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('INVOICE', 50, topY);
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice No:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${order.invoiceNumber || 'N/A'}`);
      doc.font('Helvetica-Bold').text('Order ID:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${order._id}`);
      
      const orderDate = new Date(order.createdAt);
      doc.font('Helvetica-Bold').text('Date:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${orderDate.toLocaleDateString()}`);
      doc.font('Helvetica-Bold').text('Time:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${orderDate.toLocaleTimeString()}`);
      doc.font('Helvetica-Bold').text('Status:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${order.status}`);

      // Customer Details (Right Aligned)
      const customerX = 350;
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', customerX, topY + 2);
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica').text(order.customerDetails?.name || 'Customer', customerX, doc.y);
      if (order.customerDetails?.phone) {
        doc.text(`Phone: ${order.customerDetails.phone}`, customerX, doc.y);
      }
      if (order.customerDetails?.address) {
        doc.text(`Address: ${order.customerDetails.address}`, customerX, doc.y);
      }
      if (order.user?.email) {
        doc.text(`Email: ${order.user.email}`, customerX, doc.y);
      }
      if (order.branch?.name) {
        doc.text(`Branch: ${order.branch.name}`, customerX, doc.y);
      }

      doc.moveDown(3);

      // --- Table ---
      const tableTop = Math.max(doc.y, 250);
      doc.font('Helvetica-Bold');
      
      const itemCodeX = 50;
      const descriptionX = 90;
      const quantityX = 280;
      const unitX = 340;
      const priceX = 400;
      const amountX = 480;

      // Table Header
      doc.text('No.', itemCodeX, tableTop);
      doc.text('Product', descriptionX, tableTop);
      doc.text('Qty', quantityX, tableTop, { width: 50, align: 'right' });
      doc.text('Unit', unitX, tableTop);
      doc.text('Unit Price', priceX, tableTop, { width: 70, align: 'right' });
      doc.text('Amount', amountX, tableTop, { width: 65, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#cbd5e1').stroke();
      
      doc.font('Helvetica');
      let y = tableTop + 25;

      order.items.forEach((item, i) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text((i + 1).toString(), itemCodeX, y);
        doc.text(item.nameEn, descriptionX, y);
        doc.text(item.quantity.toString(), quantityX, y, { width: 50, align: 'right' });
        doc.text(item.unit, unitX, y);
        
        // Ensure price is treated as Selling Price (never expose internal COGS)
        doc.text(`Rs. ${item.price.toFixed(2)}`, priceX, y, { width: 70, align: 'right' });
        
        const amount = item.price * item.quantity;
        doc.text(`Rs. ${amount.toFixed(2)}`, amountX, y, { width: 65, align: 'right' });

        y += 20;
      });

      doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor('#cbd5e1').stroke();
      y += 25;

      // --- Totals ---
      doc.font('Helvetica-Bold');
      doc.text('Subtotal:', 350, y, { width: 120, align: 'right' });
      doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 480, y, { width: 65, align: 'right' });
      y += 20;

      doc.text('Delivery:', 350, y, { width: 120, align: 'right' });
      doc.text('Rs. 0.00', 480, y, { width: 65, align: 'right' });
      y += 20;

      doc.moveTo(350, y).lineTo(545, y).strokeColor('#cbd5e1').stroke();
      y += 10;

      doc.fontSize(14).text('Total:', 350, y, { width: 120, align: 'right' });
      doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 480, y, { width: 65, align: 'right' });

      // --- Payment Information ---
      doc.fontSize(12).font('Helvetica-Bold').text('Payment Information', 50, y - 20);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Method: ${order.paymentMethod}`, 50, doc.y);
      doc.text(`Status: ${order.paymentStatus}`, 50, doc.y);
      
      if (order.razorpayPaymentId) {
        doc.text(`Transaction ID: ${order.razorpayPaymentId}`, 50, doc.y);
      }

      // --- Footer ---
      doc.fontSize(10).fillColor('#64748b').text(
        'Thank you for your business. For any queries, contact ganeshkoli0149@gmail.com',
        50,
        780,
        { align: 'center', width: 450 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateProcurementInvoicePDF = (procurement) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Header ---
      doc.fillColor('#4f46e5').fontSize(24).font('Helvetica-Bold').text('GK Dairy', { align: 'center' });
      doc.fillColor('#475569').fontSize(12).font('Helvetica').text('Stock Transfer Invoice', { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(10).text('Address: GK Dairy Main Plant, Maharashtra, India', { align: 'center' });
      doc.text('Phone: +91 8010434421 | Email: ganeshkoli0149@gmail.com', { align: 'center' });
      doc.text('Website: www.gkdairy.online', { align: 'center' });
      
      doc.moveDown(2);
      
      // Draw a line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown(1.5);

      // --- Invoice Details vs Customer Details ---
      const topY = doc.y;
      
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('TRANSFER INVOICE', 50, topY);
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice No:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${procurement.invoiceNumber || 'N/A'}`);
      doc.font('Helvetica-Bold').text('Transfer ID:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${procurement._id}`);
      
      const orderDate = new Date(procurement.createdAt);
      doc.font('Helvetica-Bold').text('Date:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${orderDate.toLocaleDateString()}`);
      doc.font('Helvetica-Bold').text('Status:', 50, doc.y, { continued: true }).font('Helvetica').text(` ${procurement.status}`);

      // Customer Details (Right Aligned)
      const customerX = 350;
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To (Branch):', customerX, topY + 2);
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica').text(procurement.branch?.name || 'Unknown Branch', customerX, doc.y);
      if (procurement.branch?.code) {
        doc.text(`Branch Code: ${procurement.branch.code}`, customerX, doc.y);
      }

      doc.moveDown(3);

      // --- Table ---
      const tableTop = Math.max(doc.y, 250);
      doc.font('Helvetica-Bold');
      
      const itemCodeX = 50;
      const descriptionX = 90;
      const quantityX = 280;
      const unitX = 340;
      const priceX = 400;
      const amountX = 480;

      // Table Header
      doc.text('No.', itemCodeX, tableTop);
      doc.text('Product', descriptionX, tableTop);
      doc.text('Qty', quantityX, tableTop, { width: 50, align: 'right' });
      doc.text('Unit', unitX, tableTop);
      doc.text('Transfer Price', priceX, tableTop, { width: 70, align: 'right' });
      doc.text('Amount', amountX, tableTop, { width: 65, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#cbd5e1').stroke();
      
      doc.font('Helvetica');
      let y = tableTop + 25;

      doc.text('1', itemCodeX, y);
      doc.text(procurement.product?.nameEn || 'Unknown Product', descriptionX, y);
      doc.text(procurement.quantity.toString(), quantityX, y, { width: 50, align: 'right' });
      doc.text(procurement.product?.unit || '-', unitX, y);
      
      doc.text(`Rs. ${procurement.plantTransferPrice.toFixed(2)}`, priceX, y, { width: 70, align: 'right' });
      doc.text(`Rs. ${procurement.totalTransferValue.toFixed(2)}`, amountX, y, { width: 65, align: 'right' });

      y += 20;

      doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor('#cbd5e1').stroke();
      y += 25;

      // --- Totals ---
      doc.font('Helvetica-Bold');
      
      doc.fontSize(14).text('Total Amount:', 350, y, { width: 120, align: 'right' });
      doc.text(`Rs. ${procurement.totalTransferValue.toFixed(2)}`, 480, y, { width: 65, align: 'right' });

      // --- Footer ---
      doc.fontSize(10).fillColor('#64748b').text(
        'This is a computer generated invoice for internal stock transfer.',
        50,
        780,
        { align: 'center', width: 450 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
