import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Get current timestamp in [YYYY-MM-DD HH:mm:ss] format
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Write log to file and console
 * @param {string} level 
 * @param {string} message 
 */
function log(level, message) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  // Write to console with colors
  let color = '\x1b[0m'; // Default reset
  switch (level) {
    case 'INFO':
      color = '\x1b[36m'; // Cyan
      break;
    case 'SUCCESS':
      color = '\x1b[32m'; // Green
      break;
    case 'WARN':
      color = '\x1b[33m'; // Yellow
      break;
    case 'ERROR':
      color = '\x1b[31m'; // Red
      break;
  }
  
  console.log(`${color}[${timestamp}] [${level}] ${message}\x1b[0m`);
  
  // Append to log file
  try {
    fs.appendFileSync(logFile, logMessage, 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export const logger = {
  info: (msg) => log('INFO', msg),
  success: (msg) => log('SUCCESS', msg),
  warn: (msg) => log('WARN', msg),
  error: (msg) => log('ERROR', msg)
};
