import mongoose from 'mongoose';
import { MilkCollection } from '../models/MilkCollection.js';
import { User } from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

export const sendStatements = async (req, res) => {
  try {
    let { branchId, year, month, period } = req.body;

    if (req.user && req.user.role === 'dairyOwner') {
      branchId = req.user.dairyOwnerProfile?.branchId;
      if (!branchId) {
        return res.status(403).json({ success: false, message: 'You do not have a valid branch assigned.' });
      }
    }

    if (!branchId || !year || !month || !period) {
      return res.status(400).json({ success: false, message: 'branchId, year, month, and period are required' });
    }

    const y = parseInt(year);
    const m = parseInt(month) - 1; // 0-indexed month

    let startDate, endDate;
    if (period === 1) {
      startDate = new Date(y, m, 1);
      endDate = new Date(y, m, 10, 23, 59, 59, 999);
    } else if (period === 2) {
      startDate = new Date(y, m, 11);
      endDate = new Date(y, m, 20, 23, 59, 59, 999);
    } else if (period === 3) {
      startDate = new Date(y, m, 21);
      endDate = new Date(y, m + 1, 0, 23, 59, 59, 999); // last day of month
    } else {
      return res.status(400).json({ success: false, message: 'Invalid period. Must be 1, 2, or 3.' });
    }

    if (mongoose.connection.readyState !== 1) {
       return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    // 1. Aggregate Milk Collections by farmer
    const aggregatedData = await MilkCollection.aggregate([
      {
        $match: {
          branch: new mongoose.Types.ObjectId(branchId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { farmerId: "$farmer", farmerCode: "$farmerCode", farmerName: "$farmerName" },
          totalWeight: { $sum: "$weight" },
          totalAmount: { $sum: "$amount" },
          collections: {
            $push: {
              date: "$date",
              session: "$session",
              milkType: "$milkType",
              weight: "$weight",
              fat: "$fat",
              snf: "$snf",
              rate: "$rate",
              amount: "$amount"
            }
          }
        }
      }
    ]);

    if (aggregatedData.length === 0) {
      return res.status(404).json({ success: false, message: 'No milk collections found for the specified period.' });
    }

    // 2. Find farmers with registered emails
    let emailsSent = 0;
    
    for (const data of aggregatedData) {
      const { farmerCode, farmerName } = data._id;
      
      // Look up Users for this farmer (by code and branch)
      const farmerUsers = await User.find({
        role: 'farmer',
        'farmerProfile.farmerCode': farmerCode,
        'farmerProfile.branch': branchId
      });

      for (const farmerUser of farmerUsers) {
        if (farmerUser && farmerUser.email) {
          // Send email
          const periodStr = period === 1 ? '1st-10th' : period === 2 ? '11th-20th' : '21st-End';
          const monthName = startDate.toLocaleString('default', { month: 'long' });
          
          const subject = `Milk Collection Statement - ${periodStr} ${monthName} ${y}`;
          
          const collectionsHtml = data.collections
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(c => {
              const d = new Date(c.date);
              const dt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
              return `
              <tr style="border-bottom: 1px solid #ddd; text-align: center; font-size: 0.75em; letter-spacing: -0.2px;">
                <td style="padding: 4px 2px;">${dt}</td>
                <td style="padding: 4px 2px;">${c.session === 'morning' ? 'M' : 'E'}</td>
                <td style="padding: 4px 2px;">${c.milkType.charAt(0).toUpperCase()}</td>
                <td style="padding: 4px 2px;">${c.weight}</td>
                <td style="padding: 4px 2px;">${c.fat}</td>
                <td style="padding: 4px 2px;">${c.snf}</td>
                <td style="padding: 4px 2px;">${c.rate.toFixed(1)}</td>
                <td style="padding: 4px 2px; color: #27ae60; font-weight: bold;">${Math.round(c.amount)}</td>
              </tr>
              `;
            }).join('');

          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Milk Collection Statement</h2>
              <p>Dear <strong>${farmerName}</strong> (Code: ${farmerCode}),</p>
              <p>Here is your detailed milk collection summary for the period of <strong>${periodStr} ${monthName} ${y}</strong>:</p>
              
              <div style="width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #eee;">
                  <thead>
                    <tr style="background-color: #f8f9fa; text-align: center; font-size: 0.75em; color: #7f8c8d; letter-spacing: -0.2px;">
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">DT</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">SES</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">TYP</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">LTR</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">FAT</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">SNF</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">RT(₹)</th>
                      <th style="padding: 4px 2px; border-bottom: 2px solid #ddd;">AMT(₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${collectionsHtml}
                  </tbody>
                </table>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Milk Collected:</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${data.totalWeight.toFixed(2)} Liters</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Amount:</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #27ae60; font-size: 1.1em;">₹${data.totalAmount.toFixed(2)}</td>
                </tr>
              </table>
              
              <p style="color: #7f8c8d; font-size: 0.9em; text-align: center; margin-top: 30px;">
                Thank you for choosing GK Dairy Management.
              </p>
            </div>
          `;
          
          // Send email asynchronously in the background so it doesn't block the response
          sendEmail({
            to: farmerUser.email,
            subject,
            html
          }).catch(err => {
            console.error(`Failed to send email to ${farmerUser.email}:`, err);
          });
          emailsSent++;
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Statements generated. Sent ${emailsSent} emails to registered farmers.` 
    });

  } catch (error) {
    console.error('Error generating statements:', error);
    return res.status(500).json({ success: false, message: 'Server error generating statements' });
  }
};
