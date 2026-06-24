import whatsappWeb from 'whatsapp-web.js';
const { Client, LocalAuth } = whatsappWeb;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

/**
 * Automatically locate Chrome executable on Windows
 * @returns {string|undefined}
 */
function getChromePath() {
  if (process.platform === 'win32') {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }
  return undefined;
}

class WhatsAppService {
  constructor() {
    this.isReady = false;
    this.isReconnecting = false;
    this.initClient();
  }

  /**
   * Create and configure the Client instance
   */
  initClient() {
    const puppeteerOptions = {
      headless: true,
      protocolTimeout: 0, // Disable protocol timeout to prevent Runtime.callFunctionOn timeout on slow VPS
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process' // Helps with resource constraints on light VPS
      ]
    };

    const localChrome = getChromePath();
    if (localChrome) {
      puppeteerOptions.executablePath = localChrome;
      logger.info(`Detected Chrome browser installed locally at: ${localChrome}`);
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './session' // Stores credentials in the local './session' directory
      }),
      puppeteer: puppeteerOptions
    });

    this.initEventListeners();
  }

  /**
   * Initialize event listeners for the WhatsApp Client
   */
  initEventListeners() {
    // Generate QR Code for first-time login
    this.client.on('qr', (qr) => {
      logger.info('QR Code generated. Scan with your WhatsApp app:');
      qrcode.generate(qr, { small: true });
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      logger.success('WhatsApp authentication successful!');
    });

    // Authentication failure event
    this.client.on('auth_failure', (msg) => {
      logger.error(`WhatsApp authentication failed: ${msg}`);
    });

    // Ready event
    this.client.on('ready', () => {
      this.isReady = true;
      logger.success('WhatsApp Client is ready and connected!');
    });

    // Disconnected event
    this.client.on('disconnected', async (reason) => {
      this.isReady = false;
      logger.warn(`WhatsApp Client was disconnected: ${reason}`);
      await this.reconnect();
    });

    // Handle commands from incoming messages (from other people TO this number)
    this.client.on('message', async (msg) => {
      await this._handleCommand(msg);
    });

    // Handle commands from messages sent BY this number (self-chat / send to self)
    this.client.on('message_create', async (msg) => {
      if (msg.fromMe) {
        await this._handleCommand(msg);
      }
    });
  }

  /**
   * Process command messages (lines starting with '!')
   * Command map:
   *   !1  → morning reminder
   *   !2  → noon warning (12:00)
   *   !3  → afternoon reminder (13:00)
   *   !4  → evening reminder
   *   !ping → check bot is alive
   *   !menu → show available commands
   * @param {Object} msg - whatsapp-web.js Message object
   */
  async _handleCommand(msg) {
    if (!msg.body || !msg.body.startsWith('!')) return;

    const body = msg.body.trim().toLowerCase();
    const targetId = config.whatsappTargetId;

    logger.info(`[CMD] Received: "${body}" | from=${msg.from} | fromMe=${msg.fromMe}`);

    // Determine who to reply to
    const replyTo = msg.fromMe ? msg.to : msg.from;

    // Map shorthand number commands to reminder types
    const shorthandMap = {
      '!1': 'morning',
      '!2': 'noon',
      '!3': 'afternoon',
      '!4': 'evening'
    };

    // --- !ping ---
    if (body === '!ping') {
      try {
        await this.client.sendMessage(replyTo, '🏓 pong! Bot aktif dan siap.');
        logger.success(`[CMD] Replied pong to: ${replyTo}`);
      } catch (err) {
        logger.error(`[CMD] Error on !ping: ${err.message}`);
      }

    // --- !menu ---
    } else if (body === '!menu') {
      const menuText =
        `🤖 *Daftar Perintah Bot*\n\n` +
        `!1 → 🌅 Kirim reminder Pagi\n` +
        `!2 → 🕛 Kirim peringatan jam makan (12.00)\n` +
        `!3 → ⏰ Kirim reminder Siang (13.00)\n` +
        `!4 → 🌇 Kirim reminder Sore\n` +
        `!ping → 🏓 Cek apakah bot aktif\n` +
        `!menu → 📋 Tampilkan daftar perintah ini`;
      try {
        await this.client.sendMessage(replyTo, menuText);
        logger.success(`[CMD] Replied menu to: ${replyTo}`);
      } catch (err) {
        logger.error(`[CMD] Error on !menu: ${err.message}`);
      }

    // --- !1 / !2 / !3 / !4 shorthand ---
    } else if (shorthandMap[body]) {
      const type = shorthandMap[body];
      logger.info(`[CMD] Shorthand trigger [${type}] to ${targetId}`);
      try {
        const { getMessage } = await import('../messages/templates.js');
        const message = getMessage(type);
        await this.sendMessage(targetId, message);
      } catch (err) {
        logger.error(`[CMD] Error on ${body}: ${err.message}`);
      }

    // --- !trigger <type> (verbose form) ---
    } else if (body.startsWith('!trigger ')) {
      const type = body.substring(9).trim();
      if (['morning', 'noon', 'afternoon', 'evening'].includes(type)) {
        logger.info(`[CMD] Triggering [${type}] reminder to ${targetId}`);
        try {
          const { getMessage } = await import('../messages/templates.js');
          const message = getMessage(type);
          await this.sendMessage(targetId, message);
        } catch (err) {
          logger.error(`[CMD] Error on !trigger ${type}: ${err.message}`);
        }
      } else {
        logger.warn(`[CMD] Unknown type: "${type}". Valid: morning, noon, afternoon, evening`);
      }
    }
  }

  /**
   * Verify if the Puppeteer page context is healthy and responsive
   * @returns {Promise<boolean>}
   */
  async checkPageHealth() {
    try {
      if (!this.client || !this.client.pupPage) {
        return false;
      }
      if (this.client.pupPage.isClosed()) {
        return false;
      }
      
      // Simple timeout wrapper for evaluate
      const evalPromise = this.client.pupPage.evaluate(() => 1);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), 5000)
      );

      await Promise.race([evalPromise, timeoutPromise]);
      return true;
    } catch (err) {
      logger.warn(`WhatsApp client page health check failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper to wait for the client to be ready, with a timeout
   * @param {number} timeoutMs
   * @returns {Promise<boolean>} Resolves to true if ready, false if timeout
   */
  async waitForReady(timeoutMs = 60000) {
    if (this.isReady) return true;

    return new Promise((resolve) => {
      const interval = 100;
      let elapsed = 0;
      const timer = setInterval(() => {
        if (this.isReady) {
          clearInterval(timer);
          resolve(true);
        }
        elapsed += interval;
        if (elapsed >= timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, interval);
    });
  }

  /**
   * Start the WhatsApp client connection
   */
  async initialize() {
    logger.info('Initializing WhatsApp Client...');
    try {
      await this.client.initialize();
    } catch (error) {
      logger.error(`Error during WhatsApp initialization: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reconnect implementation when disconnected
   */
  async reconnect() {
    if (this.isReconnecting) {
      logger.info('Reconnection is already in progress, skipping duplicate request.');
      return;
    }
    this.isReconnecting = true;
    logger.info('Attempting to reconnect WhatsApp Client...');
    this.isReady = false;

    try {
      if (this.client) {
        logger.info('Destroying existing client...');
        try {
          await this.client.destroy();
        } catch (destroyErr) {
          logger.warn(`Error during client.destroy(): ${destroyErr.message}`);
        }
      }
    } catch (err) {
      logger.error(`Error tearing down client: ${err.message}`);
    }

    try {
      logger.info('Creating a new WhatsApp client instance...');
      this.initClient();
      await this.client.initialize();
    } catch (error) {
      logger.error(`Failed to reconnect WhatsApp: ${error.message}`);
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Send a text message to target WhatsApp number
   * @param {string} targetId - Formatted target WhatsApp ID (e.g. 628xxxxxxxxxx@c.us)
   * @param {string} text - Message text to send
   * @param {number} retryCount - Number of connection retries allowed
   * @returns {Promise<boolean>} Resolves to true if successful, false otherwise
   */
  async sendMessage(targetId, text, retryCount = 1) {
    if (!targetId) {
      logger.error('Cannot send message: Target number is missing.');
      return false;
    }

    // Check page health first
    const healthy = await this.checkPageHealth();
    if (!healthy) {
      logger.warn('WhatsApp page health check failed. Attempting to heal client before sending...');
      this.isReady = false;
      await this.reconnect();
      
      logger.info('Waiting for WhatsApp client to become ready after healing...');
      const ready = await this.waitForReady(60000);
      if (!ready) {
        logger.error('WhatsApp client failed to become ready after healing. Aborting message send.');
        return false;
      }
    }

    if (!this.isReady) {
      logger.error(`Cannot send message: WhatsApp client is not ready.`);
      return false;
    }

    try {
      // Resolve the correct WhatsApp ID for this number (handles @c.us vs @lid automatically)
      const numberId = await this.client.getNumberId(targetId.replace('@c.us', ''));
      
      if (!numberId) {
        logger.error(`Cannot send message: Number ${targetId} is not registered on WhatsApp.`);
        return false;
      }

      const resolvedId = numberId._serialized;
      logger.info(`Resolved WhatsApp ID: ${resolvedId}`);
      
      await this.client.sendMessage(resolvedId, text);
      logger.success(`Reminder message sent successfully to ${resolvedId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send message to ${targetId}. Error: ${error.message}`);
      
      // If we have retries left and the error looks like a browser/frame/puppeteer failure, try to heal and retry
      const isBrowserError = error.message.includes('detached Frame') || 
                            error.message.includes('Execution context was destroyed') || 
                            error.message.includes('Target closed') || 
                            error.message.includes('Session closed') ||
                            error.message.includes('Protocol error');
                            
      if (retryCount > 0 && isBrowserError) {
        logger.warn(`Detected Puppeteer connection/browser failure. Reconnecting and retrying send (retries left: ${retryCount})...`);
        this.isReady = false;
        await this.reconnect();
        
        logger.info('Waiting for WhatsApp client to become ready for retry...');
        const ready = await this.waitForReady(60000);
        if (ready) {
          return this.sendMessage(targetId, text, retryCount - 1);
        } else {
          logger.error('WhatsApp client failed to become ready for retry. Aborting.');
        }
      }
      
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
