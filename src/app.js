import { whatsappService } from './services/whatsapp.js';
import { reminderScheduler } from './schedules/scheduler.js';
import { getMessage } from './messages/templates.js';
import { logger } from './utils/logger.js';
import { config } from './config/config.js';

async function main() {
  // Parse command line arguments for instant testing
  const args = process.argv.slice(2);
  const triggerIdx = args.indexOf('--trigger');
  const triggerType = triggerIdx !== -1 ? args[triggerIdx + 1] : null;

  logger.info('=============================================');
  if (triggerType) {
    logger.info(`    WhatsApp Reminder Bot: Direct Trigger     `);
  } else {
    logger.info('    WhatsApp Daily Reminder Bot Starting     ');
  }
  logger.info('=============================================');

  // Verify target number configuration
  if (!config.targetNumber) {
    logger.warn('WARNING: TARGET_NUMBER is not set in the .env configuration file.');
    logger.warn('Please update the .env file with your target phone number.');
  } else {
    logger.info(`Target Phone Number: ${config.targetNumber}`);
    logger.info(`Target WhatsApp ID: ${config.whatsappTargetId}`);
  }

  try {
    // Start WhatsApp client connection
    await whatsappService.initialize();

    // Start scheduling jobs or execute direct trigger once ready
    whatsappService.once('ready', async () => {
      if (triggerType) {
        logger.info(`Direct Trigger active. Sending [${triggerType}] reminder...`);
        try {
          const message = getMessage(triggerType);
          const success = await whatsappService.sendMessage(config.whatsappTargetId, message);
          if (success) {
            logger.success(`Direct Trigger [${triggerType}] message sent successfully.`);
          } else {
            logger.error(`Direct Trigger [${triggerType}] message failed to send.`);
          }
        } catch (error) {
          logger.error(`Direct Trigger error: ${error.message}`);
        }
        
        // Shut down client connection cleanly after sending
        logger.info('Exiting testing trigger session...');
        await whatsappService.client.destroy();
        process.exit(0);
      } else {
        reminderScheduler.start();

        // Send startup notification to target number
        try {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: config.timezone
          });
          const startupMsg =
            `*Bot Reminder Aktif!*\n\n` +
            `✅ Bot telah berhasil terhubung dan siap mengirim pengingat harian.\n\n` +
            `📅 Jadwal aktif:\n` +
            `• 07:00 - Pengingat Pagi\n` +
            `• 12:00 - Peringatan Jam Makan\n` +
            `• 13:00 - Pengingat Siang\n` +
            `• 17:00 - Pengingat Sore\n\n` +
            `🕐 Waktu aktif: ${timeStr} WIB`;
          await whatsappService.sendMessage(config.whatsappTargetId, startupMsg);
          logger.success('Startup notification sent to target number.');
        } catch (err) {
          logger.error(`Failed to send startup notification: ${err.message}`);
        }
      }
    });

  } catch (error) {
    logger.error(`Fatal error on startup sequence: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle process signals for graceful shut down
 * @param {string} signal - Received OS signal (e.g. SIGINT, SIGTERM)
 */
async function handleShutdown(signal) {
  logger.warn(`Received signal [${signal}]. Starting graceful shutdown sequence...`);
  
  // 1. Stop all cron schedules
  reminderScheduler.stopAll();
  
  // 2. Shut down browser instance in WhatsApp Client
  if (whatsappService && whatsappService.client) {
    logger.info('Closing WhatsApp client Puppeteer instance...');
    try {
      await whatsappService.client.destroy();
      logger.success('WhatsApp client session closed successfully.');
    } catch (err) {
      logger.error(`Error during WhatsApp client destroy sequence: ${err.message}`);
    }
  }
  
  logger.info('Graceful shutdown finished. Exiting process.');
  process.exit(0);
}

// Register process termination handlers
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Catch any unhandled application errors
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Launch application
main();
