async function start() {
  const response = await fetch('./invitation.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('invitation.json tidak ditemukan.');
  const config = await response.json();
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(config.id || '')) throw new Error('ID undangan harus unik dan berisi huruf kecil, angka, atau tanda hubung.');
  if (!Array.isArray(config.events) || config.events.length !== 2) throw new Error('Isi tepat dua acara pada invitation.json.');
  if (!Number.isFinite(Date.parse(config.countdownTo))) throw new Error('Tanggal hitung mundur tidak valid.');
  if (!config.couple?.first?.short || !config.couple?.second?.short) throw new Error('Isi nama kedua mempelai.');
  for (const event of config.events) {
    if (!Number.isFinite(Date.parse(event.start)) || !Number.isFinite(Date.parse(event.end)) ||
        Date.parse(event.end) <= Date.parse(event.start)) throw new Error('Tanggal mulai atau selesai acara tidak valid.');
  }
  window.INVITATION_CONFIG = config;
  await import('./firebase-config.js');
  const { renderInvitation } = await import('./customize.js');
  renderInvitation(config);
  await import('./app.js');
  await import('./firestore.js');
}

start().catch((error) => {
  console.error('Undangan gagal disiapkan:', error);
  const guest = document.querySelector('#coverGuest');
  if (guest) guest.textContent = 'Periksa invitation.json';
  const note = document.querySelector('#storageNote');
  if (note) note.textContent = error.message;
});
