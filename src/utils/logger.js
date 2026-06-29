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

const LOG_LEVELS = {
  'INFO': 1,
  'SUCCESS': 2,
  'WARN': 3,
  'ERROR': 4
};

/**
 * Get minimum log level from environment variables dynamically
 */
function getMinLogLevel() {
  const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
  return LOG_LEVELS[envLevel] || 1;
}

/**
 * Write log to file and console
 * @param {string} level 
 * @param {string} message 
 */
function log(level, message) {
  const levelPriority = LOG_LEVELS[level] || 1;
  if (levelPriority < getMinLogLevel()) {
    return; // Skip logging if below threshold
  }

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
  
  // Append to log file with rotation (Max 10MB)
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const maxSize = 10 * 1024 * 1024; // 10 MB limit
      if (stats.size > maxSize) {
        const backupFile = path.join(logDir, 'app.log.old');
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile); // delete old backup
        }
        fs.renameSync(logFile, backupFile); // rotate active log to backup
      }
    }
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
