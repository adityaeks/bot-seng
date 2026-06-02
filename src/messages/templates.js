/**
 * Message templates for daily reminders
 */

/**
 * Get Indonesian formatted date string (e.g., "Selasa, 2 Juni 2026")
 * @returns {string}
 */
function getIndonesianDate() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const now = new Date();
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();
  
  return `${dayName}, ${date} ${monthName} ${year}`;
}

export const templates = {
  getMorningMessage: () => {
    const dateStr = getIndonesianDate();
    const now = new Date();
    const dayIndex = now.getDay(); // 0=Minggu, 5=Jumat, 6=Sabtu
    const isCoffeeDay = dayIndex === 5 || dayIndex === 6;
    const coffeeNote = isCoffeeDay
      ? `☕ _Hari ini adalah hari kopi! Boleh minum kopi maksimal 1 kali ya._`
      : `🚫 _Hari ini bukan hari kopi. Jangan lupa aturannya, kopi hanya boleh di hari Jumat atau Sabtu!_`;

    return (
      `🌅 *Selamat Pagi, Seng!*\n` +
      `📅 _${dateStr}_\n\n` +
      `Semangat menjalani hari ini! Ingat kewajiban harian yak:\n\n` +
      `🥛 *Bear Brand:*\n` +
      `• Wajib minum 2x dalam seminggu\n` +
      `• Senin wajib 1x — jangan sampai terlewat!\n\n` +
      `${coffeeNote}\n\n` +
      `🍽️ *Jam Makan:*\n` +
      `• Jangan makan setelah pukul *13.00*!\n` +
      `• Kalau melewati batas, siap-siap +1 Bear Brand minggu ini 😬\n\n` +
      `Yuk mulai hari dengan penuh semangat! 💪`
    );
  },

  getAfternoonMessage: () => {
    const dateStr = getIndonesianDate();
    return (
      `⏰ *Pengingat Jam Makan — 13.00 WIB*\n` +
      `📅 _${dateStr}_\n\n` +
      `🔔 Batas makan siang sudah berakhir!\n\n` +
      `Kalau Seng masih belum makan dan makan *setelah pukul 13.00* ini, ingat konsekuensinya:\n\n` +
      `⚠️ *+1 kali Bear Brand tambahan minggu ini!*\n\n` +
      `Jadi pastikan kamu sudah makan sebelum jam ini ya. Jaga disiplin, jaga kesehatan! 💪`
    );
  },

  getEveningMessage: () => {
    const dateStr = getIndonesianDate();
    const now = new Date();
    const dayIndex = now.getDay();
    const isCoffeeDay = dayIndex === 5 || dayIndex === 6;

    const coffeeReminder = isCoffeeDay
      ? `☕ *Kopi:* Hari ini adalah hari kopi! Sudah minum? Ingat maksimal 1x seminggu ya.`
      : `☕ *Kopi:* Bukan hari kopi hari ini. Tahan dulu sampai Jumat/Sabtu 😊`;

    return (
      `🌇 *Pengingat Sore, Seng!*\n` +
      `📅 _${dateStr}_\n\n` +
      `Sebentar lagi hari berakhir. Yuk cek kewajiban harianmu:\n\n` +
      `🥛 *Bear Brand:*\n` +
      `• Sudah minum Bear Brand hari ini?\n` +
      `• Ingat: minimal *2x seminggu*, Senin wajib 1x!\n\n` +
      `${coffeeReminder}\n\n` +
      `Terima kasih ya sudah menjalani hari ini sampai sore dengan semangat dan ceria! 🫂\n` +
      `Jangan lupa istirahat yang cukup, dan kalau mau ngerjain tugas malam ini — jangan terlalu larut ya, kesehatan tetap nomor satu! 💤`
    );
  },

  getNoonMessage: () => {
    const dateStr = getIndonesianDate();
    return (
      `🕛 *Peringatan Jam Makan — 12.00 WIB*\n` +
      `📅 _${dateStr}_\n\n` +
      `Hei Seng! ⏳ Sisa waktu makan siangmu tinggal *1 jam lagi*!\n\n` +
      `Batas makan siang adalah pukul *13.00 WIB*.\n` +
      `Kalau kamu makan setelah itu → kena *+1 Bear Brand* minggu ini 😬\n\n` +
      `Yuk segera siapkan makan siangmu sekarang! 🍱`
    );
  }
};

/**
 * Get message by schedule type
 * @param {'morning'|'noon'|'afternoon'|'evening'} type 
 * @returns {string}
 */
export function getMessage(type) {
  switch (type.toLowerCase()) {
    case 'morning':
      return templates.getMorningMessage();
    case 'noon':
      return templates.getNoonMessage();
    case 'afternoon':
      return templates.getAfternoonMessage();
    case 'evening':
      return templates.getEveningMessage();
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}
