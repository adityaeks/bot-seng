import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config();

const targetNumber = process.env.TARGET_NUMBER;
const timezone = process.env.TIMEZONE || 'Asia/Jakarta';

// Simple validation
if (!targetNumber) {
  console.error('\x1b[31m[ERROR] TARGET_NUMBER is not defined in the .env file.\x1b[0m');
  console.error('\x1b[33mPlease edit the .env file and set TARGET_NUMBER to a valid WhatsApp number.\x1b[0m');
}

export const config = {
  targetNumber: targetNumber ? targetNumber.trim() : '',
  timezone: timezone.trim(),
  // Helper to format WhatsApp ID
  get whatsappTargetId() {
    if (!this.targetNumber) return '';
    // Format to WhatsApp ID structure (e.g. 628123456789@c.us)
    const cleaned = this.targetNumber.replace(/[^0-9]/g, '');
    return `${cleaned}@c.us`;
  }
};
