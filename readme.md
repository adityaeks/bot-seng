# WhatsApp Daily Reminder Bot

## Overview

WhatsApp Daily Reminder Bot adalah aplikasi berbasis Node.js yang berjalan di VPS dan mengirimkan pesan WhatsApp otomatis ke nomor tertentu pada jam-jam yang telah ditentukan setiap hari.

Bot menggunakan:

* Node.js
* whatsapp-web.js
* node-cron
* WhatsApp Web Session

## Tujuan

Membantu pengguna mendapatkan pengingat harian secara otomatis tanpa perlu membuka aplikasi atau membuat jadwal manual setiap hari.

Contoh reminder:

* 07:00 → Pengingat pagi
* 13:00 → Pengingat siang
* 17:00 → Pengingat sore

## Fitur MVP

### Reminder Pagi

Jam 07:00 WIB

Contoh:

🌅 Selamat pagi

Jangan lupa memulai aktivitas hari ini.

Tetap semangat dan fokus pada target yang ingin dicapai.

### Reminder Siang

Jam 13:00 WIB

Contoh:

☀️ Selamat siang

Sudah sejauh mana progres pekerjaan hari ini?

Jangan lupa istirahat dan makan siang.

### Reminder Sore

Jam 17:00 WIB

Contoh:

🌇 Selamat sore

Pastikan seluruh pekerjaan penting hari ini sudah selesai.

Semoga harimu produktif.

## Arsitektur

VPS
│
├── Node.js Application
│
├── WhatsApp Session
│
├── Cron Scheduler
│
└── WhatsApp Client

## Struktur Folder

project/
│
├── src/
│ ├── config/
│ ├── services/
│ ├── schedules/
│ └── messages/
│
├── session/
│
├── .env
│
├── package.json
│
└── app.js

## Konfigurasi

File .env

TARGET_NUMBER=628xxxxxxxxxx

## Scheduler

### Morning Reminder

Cron:

0 7 * * *

### Afternoon Reminder

Cron:

0 13 * * *

### Evening Reminder

Cron:

0 17 * * *

## Flow Kerja

1. Bot dijalankan di VPS
2. WhatsApp login menggunakan QR Code
3. Session disimpan secara lokal
4. Scheduler aktif
5. Ketika waktu sesuai:

   * Ambil pesan
   * Kirim ke nomor target
   * Simpan log
6. Tunggu jadwal berikutnya

## Logging

Catat aktivitas berikut:

* Bot Start
* QR Generated
* Login Success
* Reminder Sent
* Reminder Failed

Contoh:

[07:00:00] Morning Reminder Sent
[13:00:00] Afternoon Reminder Sent
[17:00:00] Evening Reminder Sent

## Deployment

PM2 digunakan agar bot tetap berjalan ketika VPS restart.

Command:

pm2 start app.js --name whatsapp-reminder

pm2 save

pm2 startup

## Target Akhir

Bot berjalan 24 jam di VPS dan secara otomatis mengirim reminder harian ke WhatsApp tanpa intervensi pengguna.
