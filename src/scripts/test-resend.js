
const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('Testing Resend configuration (CommonJS)...');
  console.log('CWD:', process.cwd());
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Present (' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'MISSING');
  console.log('From Email:', process.env.RESEND_FROM_EMAIL);

  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY is missing');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('Attempting to send email...');
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Test Email from Penochão (CJS)',
      html: '<p>It works!</p>'
    });

    console.log('Success:', data);
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();
