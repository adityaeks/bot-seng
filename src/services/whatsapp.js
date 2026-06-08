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

    this.isReady = false;
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
    logger.info('Attempting to reconnect WhatsApp Client...');
    try {
      await this.client.destroy();
      this.isReady = false;
      // Re-initialize client
      await this.client.initialize();
    } catch (error) {
      logger.error(`Failed to reconnect WhatsApp: ${error.message}`);
    }
  }

  /**
   * Send a text message to target WhatsApp number
   * @param {string} targetId - Formatted target WhatsApp ID (e.g. 628xxxxxxxxxx@c.us)
   * @param {string} text - Message text to send
   * @returns {Promise<boolean>} Resolves to true if successful, false otherwise
   */
  async sendMessage(targetId, text) {
    if (!this.isReady) {
      logger.error(`Cannot send message: WhatsApp client is not ready yet.`);
      return false;
    }

    if (!targetId) {
      logger.error('Cannot send message: Target number is missing.');
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
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
