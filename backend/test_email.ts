import dotenv from 'dotenv';
dotenv.config();
import { sendContactMessage } from './services/emailService';

async function test() {
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("CONTACT_RECIPIENT_EMAIL:", process.env.CONTACT_RECIPIENT_EMAIL);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
  try {
    await sendContactMessage("Test User", "test@example.com", "Test Subject", "This is a test message.");
    console.log("sendContactMessage resolved successfully.");
  } catch (e) {
    console.error("sendContactMessage threw an error:", e);
  }
}

test();
