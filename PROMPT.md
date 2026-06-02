# PROMPT.md

Build a production-ready WhatsApp Reminder Bot using Node.js.

Requirements:

* Use whatsapp-web.js
* Use LocalAuth for session persistence
* Use node-cron for scheduling
* Use dotenv for configuration
* Use clean architecture
* Use service-based structure
* Use ES Modules
* Use async/await
* Add logging support

Folder Structure:

src/
├── config/
├── services/
├── schedules/
├── messages/
├── utils/
└── app.js

Features:

1. WhatsApp Login

   * QR Code Authentication
   * Session Persistence
   * Automatic Reconnect

2. Reminder Schedule

   * 07:00 Morning Reminder
   * 13:00 Afternoon Reminder
   * 17:00 Evening Reminder

3. Logging

   * Startup Log
   * Authentication Log
   * Reminder Sent Log
   * Error Log

4. Environment Variables

TARGET_NUMBER=
TIMEZONE=Asia/Jakarta

5. Message Templates

Morning:
"🌅 Selamat pagi, jangan lupa fokus pada target hari ini."

Afternoon:
"☀️ Selamat siang, semoga pekerjaan berjalan lancar."

Evening:
"🌇 Selamat sore, pastikan semua pekerjaan hari ini sudah selesai."

Additional Requirements:

* Modular code
* Production-ready
* Easy to extend
* PM2 compatible
* Error handling
* Clean code
* Comment important sections

Generate all files completely.
