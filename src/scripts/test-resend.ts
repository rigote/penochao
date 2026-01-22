
import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Testing Resend configuration...');
  console.log('API Key present:', !!process.env.RESEND_API_KEY);
  console.log('From Email:', process.env.RESEND_FROM_EMAIL);

  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY is missing');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: 'delivered@resend.dev', // Resend test email sink
      subject: 'Test Email from Penochão',
      html: '<p>It works!</p>'
    });

    console.log('Success:', data);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

main();
