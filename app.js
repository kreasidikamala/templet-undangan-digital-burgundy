const INV = window.INVITATION_CONFIG;
const $ = (selector) => document.querySelector(selector);
const eventDate = Date.parse(INV.countdownTo);
const guestFromUrl = new URLSearchParams(location.search).get('to');
let guestName = cleanName(guestFromUrl) || INV.guestPlaceholder || 'Tamu Undangan';
let toastTimer;

function cleanName(value) {
  return (value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 3000);
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      if (!document.execCommand('copy')) throw new Error('Gagal menyalin');
      area.remove();
    }
    return true;
  } catch {
    toast('Gagal menyalin. Silakan pilih dan salin teks secara manual.');
    return false;
  }
}

function setGuest(name, prefillForms = true) {
  guestName = name;
  $('#coverGuest').textContent = name;
  $('#rsvpName').value = prefillForms ? name : '';
  $('#wishName').value = prefillForms ? name : '';
  $('#guestInput').value = name;
}
setGuest(guestName, Boolean(cleanName(guestFromUrl)));

const audio = $('#backgroundMusic');
const musicButton = $('#musicControl');
function updateMusicButton() {
  const playing = !audio.paused;
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.setAttribute('aria-label', playing ? 'Jeda musik' : 'Putar musik');
}
async function playMusic() {
  try { await audio.play(); } catch { /* Pengunjung dapat menekan tombol musik lagi. */ }
  updateMusicButton();
}
audio.addEventListener('play', updateMusicButton);
audio.addEventListener('pause', updateMusicButton);
musicButton.addEventListener('click', () => audio.paused ? playMusic() : audio.pause());

function openInvitation(fromClick = false) {
  document.body.classList.remove('is-covered');
  $('#invitation').removeAttribute('inert');
  $('#cover').setAttribute('aria-hidden', 'true');
    musicButton.hidden = !audio.hasAttribute('src');
  if (fromClick) {
    history.replaceState({}, '', location.pathname + location.search + '#open');
    window.scrollTo({ top: 0, behavior: 'auto' });
    playMusic();
    $('#opening').focus({ preventScroll: true });
  }
}
$('#openInvitation').addEventListener('click', () => openInvitation(true));
if (location.hash === '#open') openInvitation();

const guestDialog = $('#guestDialog');
$('#editGuest').addEventListener('click', () => guestDialog.showModal());
$('#applyGuest').addEventListener('click', () => {
  const name = cleanName($('#guestInput').value);
  if (!name) { $('#guestInput').focus(); toast('Masukkan nama tamu terlebih dahulu.'); return; }
  setGuest(name);
  const url = new URL(location.href);
  url.searchParams.set('to', name);
  url.hash = '';
  history.replaceState({}, '', url);
  guestDialog.close();
  toast('Nama tamu diterapkan. Tautan siap disalin.');
});
$('#copyGuestLink').addEventListener('click', async () => {
  const name = cleanName($('#guestInput').value);
  if (!name) { $('#guestInput').focus(); toast('Masukkan nama tamu terlebih dahulu.'); return; }
  setGuest(name);
  const url = new URL(location.href);
  url.searchParams.set('to', name);
  url.hash = '';
  history.replaceState({}, '', url);
  if (await copyText(url.href)) toast('Tautan untuk ' + name + ' tersalin.');
});

function updateCountdown() {
  let difference = Math.max(0, eventDate - Date.now());
  const days = Math.floor(difference / 86400000);
  difference %= 86400000;
  const hours = Math.floor(difference / 3600000);
  difference %= 3600000;
  const minutes = Math.floor(difference / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);
  [['#countDays', days], ['#countHours', hours], ['#countMinutes', minutes], ['#countSeconds', seconds]].forEach(([id, value]) => { $(id).textContent = String(value).padStart(2, '0'); });
}
updateCountdown();
setInterval(updateCountdown, 1000);

function makeCalendar() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateValue = (value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Undangan Digital//ID','CALSCALE:GREGORIAN','METHOD:PUBLISH'
  ];
  INV.events.forEach((event, index) => lines.push(
    'BEGIN:VEVENT', `UID:${INV.id}-${index + 1}@undangan.local`, 'DTSTAMP:' + stamp,
    'DTSTART:' + dateValue(event.start), 'DTEND:' + dateValue(event.end),
    'SUMMARY:' + escape(`${event.title} ${INV.couple.first.short} dan ${INV.couple.second.short}`),
    'LOCATION:' + escape(event.venue),
    'DESCRIPTION:' + escape(`${event.date} ${event.time}. ${event.address}`), 'END:VEVENT'
  ));
  lines.push('END:VCALENDAR');
  const fold = (line) => {
    const parts = [];
    let part = '', length = 0;
    for (const character of line) {
      const bytes = new TextEncoder().encode(character).length;
      if (length + bytes > 73) { parts.push(part); part = ' '; length = 1; }
      part += character; length += bytes;
    }
    parts.push(part);
    return parts.join('\r\n');
  };
  const content = lines.map(fold).join('\r\n') + '\r\n';
  const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = INV.id + '.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  toast('Jadwal akad dan resepsi diunduh.');
}
$('#addCalendar').addEventListener('click', makeCalendar);

document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
  if (await copyText(button.dataset.copy)) toast('Nomor rekening tersalin.');
}));
const giftAddress = INV.gifts?.enabled ? INV.gifts.address?.text : '';
if (giftAddress) {
  $('#copyAddress').disabled = false;
  $('#copyAddress').removeAttribute('title');
  $('#copyAddress').addEventListener('click', async () => {
    if (await copyText((INV.gifts.address.recipient || '') + ' — ' + giftAddress)) toast('Alamat kado tersalin.');
  });
}

const galleryButtons = [...document.querySelectorAll('[data-gallery]')];
const galleryDialog = $('#galleryDialog');
let galleryIndex = 0;
function showPhoto(index) {
  galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
  const thumb = galleryButtons[galleryIndex].querySelector('img');
  $('#largePhoto').src = thumb.src;
  $('#largePhoto').alt = thumb.alt;
  $('#galleryCaption').textContent = (galleryIndex + 1) + ' / ' + galleryButtons.length + ' · ' + thumb.alt;
  if (!galleryDialog.open) galleryDialog.showModal();
}
galleryButtons.forEach((button, index) => button.addEventListener('click', () => showPhoto(index)));
$('#prevGallery').addEventListener('click', () => showPhoto(galleryIndex - 1));
$('#nextGallery').addEventListener('click', () => showPhoto(galleryIndex + 1));
$('#closeGallery').addEventListener('click', () => galleryDialog.close());
document.addEventListener('keydown', (event) => {
  if (!galleryDialog.open) return;
  if (event.key === 'ArrowLeft') showPhoto(galleryIndex - 1);
  if (event.key === 'ArrowRight') showPhoto(galleryIndex + 1);
});

// Penyimpanan bersama dan daftar ucapan ditangani oleh firestore.js.
// Cegah form mengirim ulang halaman sebelum sambungan Firebase siap.
$('#attendance').addEventListener('change', (event) => {
  $('#guestCount').disabled = event.target.value === 'tidak';
});
$('#rsvpForm').addEventListener('submit', (event) => event.preventDefault());
$('#wishesForm').addEventListener('submit', (event) => event.preventDefault());
$('#rsvpForm button[type="submit"]').disabled = true;
$('#wishesForm button[type="submit"]').disabled = true;

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.09, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

// Structured actions for browsers that support WebMCP; the visible forms remain the source of truth.
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const register = (tool) => {
    try { Promise.resolve(modelContext.registerTool(tool)).catch(() => {}); } catch { /* Browser support varies. */ }
  };
  register({
    name: 'personalize_guest_link', title: 'Buat tautan nama tamu',
    description: 'Set the wedding invitation guest name and return its personalized cover URL.',
    inputSchema: { type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 80 } }, required: ['name'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const name = cleanName(input?.name);
      if (!name) throw new Error('Nama tamu wajib diisi.');
      $('#guestInput').value = name;
      $('#applyGuest').click();
      const url = new URL(location.href); url.hash = '';
      return { name, url: url.href };
    }
  });
}
