import cron from 'node-cron';
import { whatsappService } from '../services/whatsapp.js';
import { getMessage } from '../messages/templates.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

class ReminderScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start scheduling cron jobs
   */
  start() {
    logger.info(`Starting reminder scheduler with timezone: ${config.timezone}`);
    
    // 1. Morning Reminder (07:00)
    this.scheduleJob('0 7 * * *', 'morning', 'Morning Reminder');

    // 2. Noon Warning - 1 jam sebelum batas makan (12:00)
    this.scheduleJob('0 12 * * *', 'noon', 'Noon Warning');

    // 3. Afternoon Reminder (13:00)
    this.scheduleJob('0 13 * * *', 'afternoon', 'Afternoon Reminder');

    // 4. Evening Reminder (17:00)
    this.scheduleJob('0 17 * * *', 'evening', 'Evening Reminder');
    
    logger.success('Scheduler initialized and running. Waiting for schedule triggers...');
  }

  /**
   * Helper to schedule a job and register it
   * @param {string} cronExpression - Standard 5-field cron expression
   * @param {'morning'|'noon'|'afternoon'|'evening'} messageType - Template category
   * @param {string} label - Readable name for the job
   */
  scheduleJob(cronExpression, messageType, label) {
    try {
      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info(`Scheduler: Triggering [${label}]...`);
          
          const targetId = config.whatsappTargetId;
          if (!targetId) {
            logger.error(`Skipping [${label}]: No valid TARGET_NUMBER is set in your .env file.`);
            return;
          }

          try {
            const message = getMessage(messageType);
            const success = await whatsappService.sendMessage(targetId, message);
            
            if (success) {
              logger.success(`[${label}] has been executed and logged successfully.`);
            } else {
              logger.error(`[${label}] failed: Message delivery reported failure.`);
            }
          } catch (error) {
            logger.error(`[${label}] failed. Inner exception: ${error.message}`);
          }
        },
        {
          scheduled: true,
          timezone: config.timezone
        }
      );

      this.jobs.push({ label, cronExpression, job });
      logger.info(`Registered cron job [${label}] with pattern: "${cronExpression}"`);
    } catch (error) {
      logger.error(`Failed to register job [${label}]: ${error.message}`);
    }
  }

  /**
   * Stop all scheduled cron jobs (useful for testing or shutting down gracefully)
   */
  stopAll() {
    logger.info('Stopping all scheduler jobs...');
    this.jobs.forEach(({ label, job }) => {
      job.stop();
      logger.info(`Stopped cron job: [${label}]`);
    });
    this.jobs = [];
    logger.success('All schedules stopped.');
  }
}

export const reminderScheduler = new ReminderScheduler();
