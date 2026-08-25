import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Reusable email sending utility using nodemailer
 * In production, you would configure SMTP credentials in .env (e.g., EMAIL_USER, EMAIL_PASS)
 * For testing, if valid credentials are not found, it falls back to Ethereal Email.
 */
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  let transporter;

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_EMAIL;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  // Check if we have a Brevo API key instead of an SMTP password
  if (emailPass && emailPass.startsWith('xkeysib-')) {
    try {
        const brevoPayload = {
          sender: { name: process.env.FROM_NAME || 'GK Dairy Management', email: process.env.FROM_EMAIL || emailUser || 'no-reply@gkdairy.com' },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
          textContent: text || html.replace(/<[^>]+>/g, '')
        };

        if (attachments && attachments.length > 0) {
          brevoPayload.attachment = attachments.map(att => {
            if (Buffer.isBuffer(att.content)) {
              return {
                name: att.filename,
                content: att.content.toString('base64')
              };
            }
            return {
              name: att.filename,
              content: Buffer.from(att.content).toString('base64')
            };
          });
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': emailPass,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(brevoPayload)
        });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API Error:', errorData);
        throw new Error('Failed to send email via Brevo API');
      }

      const data = await response.json();
      console.log('Email sent via Brevo API:', data.messageId);
      return { info: { messageId: data.messageId }, previewUrl: null };
    } catch (error) {
      console.error('SendEmail Brevo Fetch Error:', error);
      throw error;
    }
  }

  // Use configured credentials if they look valid, else use a generated test account
  if (emailUser && emailUser !== 'test@ethereal.email') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com', // fallback to brevo
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
    attachments: attachments || [],
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
