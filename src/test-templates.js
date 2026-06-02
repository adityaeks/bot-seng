import { config } from './config/config.js';
import { getMessage } from './messages/templates.js';
import { logger } from './utils/logger.js';

logger.info('Starting dry-run template check...');
logger.info(`Configured timezone: ${config.timezone}`);
logger.info(`Target number: ${config.targetNumber || '(Not configured yet)'}`);
logger.info(`Target WhatsApp ID: ${config.whatsappTargetId || '(Not configured yet)'}`);

logger.info('\n--- RENDERED TEMPLATES ---');
try {
  logger.info('--- Morning Message ---');
  console.log(getMessage('morning'));
  
  logger.info('\n--- Afternoon Message ---');
  console.log(getMessage('afternoon'));
  
  logger.info('\n--- Evening Message ---');
  console.log(getMessage('evening'));
  
  logger.success('\nDry-run template check completed successfully.');
} catch (error) {
  logger.error(`Dry-run template check failed: ${error.message}`);
}
