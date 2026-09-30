// Formulir bersama untuk undangan statis di GitHub Pages.
const $ = (selector) => document.querySelector(selector);
const rsvpButton = $('#rsvpForm button[type="submit"]');
const wishButton = $('#wishesForm button[type="submit"]');
const sdkBase = 'https://www.gstatic.com/firebasejs/12.19.0/';

function showUnavailable(message) {
  rsvpButton.disabled = true;
  wishButton.disabled = true;
  $('#rsvpFeedback').textContent = message;
  $('#wishFeedback').textContent = message;
  $('#storageNote').textContent = 'Formulir belum tersambung. Silakan coba lagi nanti.';
  const empty = document.createElement('p');
  empty.className = 'empty-note';
  empty.textContent = 'Ucapan belum dapat dimuat.';
  $('#wishesList').replaceChildren(empty);
}

function renderWishes(snapshot) {
  const list = $('#wishesList');
  list.replaceChildren();
  if (snapshot.empty) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'Belum ada ucapan. Jadilah yang pertama mengirim doa.';
    list.append(empty);
    return;
  }
  snapshot.forEach((entry) => {
    const wish = entry.data();
    const article = document.createElement('article');
    article.className = 'wish-item';
    const head = document.createElement('div');
    head.className = 'wish-item__head';
    const name = document.createElement('strong');
    name.textContent = String(wish.name || '').slice(0, 80);
    const time = document.createElement('time');
    const date = wish.createdAt?.toDate?.();
    if (date instanceof Date && !Number.isNaN(date.valueOf())) {
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      time.textContent = 'Baru saja';
    }
    const message = document.createElement('p');
    message.textContent = String(wish.message || '').slice(0, 700);
    head.append(name, time);
    article.append(head, message);
    list.append(article);
  });
}

async function initialize() {
  const config = window.WEDDING_FIREBASE_CONFIG;
  const invitationId = window.INVITATION_CONFIG?.id;
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  if (!config || !required.every((key) => typeof config[key] === 'string' && config[key].trim())) {
    showUnavailable('Konfigurasi Firebase belum diisi.');
    return;
  }

  try {
    const [appSdk, authSdk, dbSdk] = await Promise.all([
      import(sdkBase + 'firebase-app.js'),
      import(sdkBase + 'firebase-auth.js'),
      import(sdkBase + 'firebase-firestore.js')
    ]);
    const app = appSdk.initializeApp(config);
    const db = dbSdk.getFirestore(app);
    const auth = authSdk.getAuth(app);
    const wishes = dbSdk.collection(db, 'invitations', invitationId, 'wishes');
    const recentWishes = dbSdk.query(wishes, dbSdk.orderBy('createdAt', 'desc'), dbSdk.limit(30));

    dbSdk.onSnapshot(recentWishes, renderWishes, (error) => {
      console.error('Gagal memuat ucapan:', error);
      const empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'Ucapan belum dapat dimuat. Silakan muat ulang halaman.';
      $('#wishesList').replaceChildren(empty);
    });

    await auth.authStateReady();
    const user = auth.currentUser || (await authSdk.signInAnonymously(auth)).user;
    rsvpButton.disabled = false;
    wishButton.disabled = false;
    $('#storageNote').textContent = 'Ucapan terlihat oleh semua tamu. RSVP hanya dapat dilihat penyelenggara.';

    $('#rsvpForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (rsvpButton.disabled) return;
      const name = $('#rsvpName').value.replace(/\s+/g, ' ').trim().slice(0, 80);
      const attendance = $('#attendance').value;
      const count = attendance === 'hadir' ? Number($('#guestCount').value) : 0;
      if (!name || !['hadir', 'tidak'].includes(attendance) ||
          (attendance === 'hadir' && ![1, 2, 3, 4].includes(count))) {
        $('#rsvpFeedback').textContent = 'Lengkapi nama, kehadiran, dan jumlah tamu.';
        return;
      }
      if (!navigator.onLine) {
        $('#rsvpFeedback').textContent = 'Anda sedang offline. Sambungkan internet, lalu kirim lagi.';
        return;
      }
      rsvpButton.disabled = true;
      $('#rsvpFeedback').textContent = 'Mengirim RSVP...';
      try {
        await dbSdk.setDoc(dbSdk.doc(db, 'invitations', invitationId, 'rsvps', user.uid), {
          ownerUid: user.uid,
          name,
          attendance,
          count,
          updatedAt: dbSdk.serverTimestamp()
        });
        $('#rsvpFeedback').textContent = 'Terima kasih. RSVP Anda sudah tersimpan untuk penyelenggara dan dapat diperbarui dari perangkat ini.';
      } catch (error) {
        console.error('Gagal menyimpan RSVP:', error);
        $('#rsvpFeedback').textContent = 'RSVP gagal dikirim. Periksa koneksi, lalu coba lagi.';
      } finally {
        rsvpButton.disabled = false;
      }
    });

    $('#wishesForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      if (wishButton.disabled) return;
      const name = $('#wishName').value.replace(/\s+/g, ' ').trim().slice(0, 80);
      const message = $('#wishMessage').value.trim().slice(0, 700);
      if (!name || !message) {
        $('#wishFeedback').textContent = 'Isi nama dan ucapan terlebih dahulu.';
        return;
      }
      if (!navigator.onLine) {
        $('#wishFeedback').textContent = 'Anda sedang offline. Sambungkan internet, lalu kirim lagi.';
        return;
      }
      wishButton.disabled = true;
      $('#wishFeedback').textContent = 'Mengirim ucapan...';
      try {
        await dbSdk.addDoc(wishes, {
          authorUid: user.uid,
          name,
          message,
          createdAt: dbSdk.serverTimestamp()
        });
        $('#wishMessage').value = '';
        $('#wishFeedback').textContent = 'Terima kasih. Ucapan Anda dapat dilihat semua tamu.';
      } catch (error) {
        console.error('Gagal mengirim ucapan:', error);
        $('#wishFeedback').textContent = 'Ucapan gagal dikirim. Periksa koneksi, lalu coba lagi.';
      } finally {
        wishButton.disabled = false;
      }
    });
  } catch (error) {
    console.error('Gagal menghubungkan Firebase:', error);
    showUnavailable('Formulir belum dapat terhubung. Periksa konfigurasi Firebase dan Anonymous Authentication.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
