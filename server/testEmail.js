import { sendEmail } from './src/utils/sendEmail.js';

async function test() {
  try {
    const res = await sendEmail({
      to: 'dairymanagement20@gmail.com', // sending to themselves
      subject: 'Test Email',
      html: '<h1>Test</h1>'
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
