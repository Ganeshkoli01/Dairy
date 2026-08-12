import { sendEmail } from './src/utils/sendEmail.js';

async function test() {
  try {
    console.log('Attempting to send test email...');
    const res = await sendEmail({
      to: 'ganeshkoli23112005@gmail.com',
      subject: 'Test Email from Dairy First Project',
      html: '<h1>This is a test email</h1><p>Checking if the email delivery works correctly.</p>'
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Error in sending email:', err);
  }
}
test();
