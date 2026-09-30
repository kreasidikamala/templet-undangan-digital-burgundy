# Template undangan digital

Ini salinan **mandiri** dari undangan Amelia & Zeus: sampul, galeri, cerita, kalender, musik, tautan nama tamu, RSVP, dan ucapan bersama. Foto contoh hanya gambar placeholder. Undangan yang sudah tayang tetap terpisah.

## Pakai ulang dalam 5 langkah

1. **Buat tempat untuk undangan baru.** Salin **isi folder `starter/`** ke root repository GitHub baru, misalnya `undangan-alya-raka`. Alternatifnya, salin folder menjadi `undangan-alya-raka/` dalam repository Pages yang sudah ada. Jangan menimpa `index.html` undangan Amelia & Zeus.
2. **Edit satu berkas utama:** `invitation.json`. Ganti `id` dengan slug unik, nama dan orang tua, tanggal, dua acara, lokasi, tautan peta, cerita, foto, warna/model, serta ucapan penutup. `id` contoh **wajib diganti** agar RSVP dan ucapan tidak bercampur dengan undangan lain. Pakai waktu ISO dengan zona, misalnya `2027-06-12T09:00:00+08:00`. `countdownTo` menentukan hitung mundur; `events[].start` dan `end` menentukan kalender `.ics`.
3. **Unggah media ke `assets/`.** Ubah path di `invitation.json`, misalnya `"cover": "assets/sampul.webp"`. Foto sampul, desktop, pembuka, kedua mempelai, penutup, foto dua acara, dan galeri dapat berbeda. JPG/PNG/WebP didukung. Untuk musik, unggah MP3 yang benar dan isi `"music": "assets/musik.mp3"`; jika kosong, tombol musik hilang. Foto placeholder akan tetap tampil sampai diganti.
4. **Hubungkan Firebase.** Lihat bagian di bawah. Tanpa Firebase, pratinjau tetap tampil tetapi tombol RSVP dan ucapan nonaktif.
5. **Terbitkan GitHub Pages.** Di repository baru: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Pastikan `index.html` ada di root. Alamatnya biasanya `https://NAMA-AKUN.github.io/NAMA-REPO/`. Jika memilih folder di repository lama, alamatnya menjadi `https://kreasidikamala.github.io/NAMA-FOLDER/`.

## Pilihan tampilan

Pada `invitation.json`:

| Field | Pilihan | Hasil |
| --- | --- | --- |
| `theme` | `burgundy` atau `sage` | Palet merah marun atau hijau sage |
| `layout` | `split` atau `centered` | Foto besar di sisi desktop atau kolom undangan di tengah |
| `photos`, `events[].photo`, `gallery` | Path berkas di `assets/` | Foto pada tiap bagian |

Pada layar kecil kedua layout tetap satu kolom. Untuk model yang benar-benar berbeda, salin template ini dan ubah `styles.css`; isi undangan, Firebase, dan fitur formulir tetap dapat digunakan.

## Firebase untuk RSVP dan ucapan

**Paling sederhana untuk klien/acara terpisah:** buat project Firebase baru. Daftarkan Web app dan salin `apiKey`, `authDomain`, `projectId`, dan `appId` ke `firebase-config.js` (field lain boleh ditambahkan). Buat Cloud Firestore Standard `(default)` dalam **Production mode**, lalu aktifkan **Authentication → Sign-in method → Anonymous**. Lokasi database dipilih saat pembuatan dan tidak dapat diubah. Jangan unggah service-account JSON/private key.

Aturan untuk `id` di `invitation.json` dibuat dengan:

```bash
node tools/generate-rules.mjs
```

- **Project Firebase baru:** salin isi `setup/firestore.rules.generated.txt` ke **Firestore Database → Rules → Publish**.
- **Project Firebase yang sudah dipakai undangan lain:** salin **hanya** isi `setup/rules.blocks.generated.txt` ke dalam `match /databases/{database}/documents` pada rules yang sudah terbit, lalu Publish. **Jangan mengganti seluruh rules**, karena undangan lama akan berhenti bekerja.
- Tanpa Node.js, buka `setup/rules.blocks.template`, ganti semua `__INVITATION_ID__` dengan nilai `id`, lalu tempel dua blok `match` itu ke rules yang ada. Untuk project baru, bungkus kedua blok dengan `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { ... } }`.

Data masing-masing undangan berada di `invitations/ID-UNDANGAN/wishes` dan `invitations/ID-UNDANGAN/rsvps`. Ucapan terbaru dapat dilihat semua tamu. RSVP hanya dapat dilihat pemilik project melalui **Firebase Console → Firestore → Data**. Aturan anonim membatasi akses, tetapi belum mencegah spam sepenuhnya; pertimbangkan Firebase App Check untuk undangan yang ramai.

## Periksa sebelum membagikan

```bash
node tools/check.mjs
python3 -m http.server 8000
```

Jalankan perintah dari folder template, lalu buka `http://localhost:8000/`. Setelah Firebase dan Pages aktif, kirim satu RSVP uji, periksa dokumennya di Console, dan kirim satu ucapan uji untuk memastikan daftar ucapan muncul di browser lain. Hapus data uji melalui Console bila tidak ingin ditampilkan.

Tautan tamu dapat dibuat dari tombol **Buat tautan nama tamu** pada sampul, atau dengan `?to=Nama%20Tamu` di akhir alamat undangan. Nama pada tautan akan mengisi formulir, tetapi tamu tetap dapat mengubahnya.
