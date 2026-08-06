import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Reusable email sending utility using nodemailer
 * In production, you would configure SMTP credentials in .env (e.g., EMAIL_USER, EMAIL_PASS)
 * For testing, if valid credentials are not found, it falls back to Ethereal Email.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_EMAIL;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  // Use configured credentials if they look valid, else use a generated test account
  if (emailUser && emailUser !== 'test@ethereal.email') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com', // fallback to gmail
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    // Ethereal Test Account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'GK Dairy Management'}" <${process.env.FROM_EMAIL || emailUser || 'no-reply@gkdairy.com'}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // Very basic HTML to text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  
  console.log('Email sent: %s', info.messageId);
  
  // If we are using Ethereal, log the preview URL for testing
  let previewUrl = null;
  if (info.messageId.includes('ethereal') || emailUser === 'test@ethereal.email') {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Preview URL: %s', previewUrl);
  }

  return { info, previewUrl };
};
