import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('invitation.json', root), 'utf8'));
const errors = [];
const warnings = [];
if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(config.id || '')) errors.push('id tidak valid.');
if (!config.couple?.first?.short || !config.couple?.second?.short) errors.push('Nama kedua mempelai belum lengkap.');
if (!Array.isArray(config.events) || config.events.length !== 2) errors.push('Isi tepat dua acara.');
if (!Number.isFinite(Date.parse(config.countdownTo))) errors.push('countdownTo tidak valid.');
for (const event of config.events || []) {
  if (!Number.isFinite(Date.parse(event.start)) || !Number.isFinite(Date.parse(event.end)) ||
      Date.parse(event.end) <= Date.parse(event.start)) errors.push(`Tanggal acara ${event.title || '?'} tidak valid.`);
}
const media = [
  ...Object.values(config.photos || {}),
  ...(config.events || []).map((item) => item.photo),
  ...(config.gallery || []).map((item) => item.src),
  config.music, config.brand?.logo,
  ...(config.gifts?.enabled ? (config.gifts.banks || []).map((item) => item.logo) : [])
].filter(Boolean);
for (const path of new Set(media)) {
  if (/^https:\/\//.test(path)) continue;
  if (!path.startsWith('assets/') || path.includes('..')) { errors.push(`Path media tidak aman: ${path}`); continue; }
  try { await access(new URL(path, root)); } catch { errors.push(`Berkas media tidak ditemukan: ${path}`); }
}
if (media.includes('assets/photo-placeholder.svg')) warnings.push('Masih ada foto placeholder; ganti sebelum membagikan undangan.');
if (!config.music) warnings.push('Musik belum diisi; tombol musik akan disembunyikan.');
if (config.id === 'contoh-alya-raka-2027') warnings.push('Ganti id contoh agar data undangan baru terpisah.');
const firebase = await readFile(new URL('firebase-config.js', root), 'utf8');
if (/apiKey:\s*''/.test(firebase)) warnings.push('Konfigurasi Firebase belum diisi; formulir RSVP/ucapan belum aktif.');
for (const error of errors) console.error('ERROR:', error);
for (const warning of warnings) console.warn('PERIKSA:', warning);
if (errors.length) process.exitCode = 1;
else console.log('Struktur undangan dan lokasi media valid.');
