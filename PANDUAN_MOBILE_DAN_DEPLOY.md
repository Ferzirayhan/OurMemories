# Panduan Akses HP & Deployment - Pro Ratih Web 📱🚀

Agar kamu bisa akses web ini di HP dan edit-edit santai sebelum tidur, ada dua cara yang bisa kamu lakukan:

## 1. Cara Cepat (Satu Wi-Fi)
Gunakan cara ini jika kamu hanya ingin melihat tampilan di HP saat sedang coding di Mac.
1. Pastikan Mac dan HP kamu terhubung ke **Wi-Fi yang sama**.
2. Di Mac, buka Terminal dan ketik: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Cari angka setelah `inet` (contoh: `192.168.1.15`).
4. Jalankan project di Mac: `npm run dev`
5. Di HP, buka browser dan ketik: `http://192.168.1.15:3000` (ganti angkanya dengan IP kamu).

---

## 2. Cara Pro (Deployment ke Vercel) - REKOMENDASI ⭐
Ini cara terbaik agar web kamu punya link asli (contoh: `ratih-web.vercel.app`) yang bisa dibuka di mana saja tanpa perlu Mac kamu menyala.

### Langkah-langkah:
1. **Upload ke GitHub**:
   - Buat repository baru di GitHub (Private saja).
   - Upload folder project kamu ke sana.
2. **Hubungkan ke Vercel**:
   - Buka [vercel.com](https://vercel.com) dan login pakai akun GitHub.
   - Klik **"Add New"** -> **"Project"**.
   - Pilih repository project kamu.
3. **Setting Environment Variables**:
   - Sebelum klik Deploy, cari menu **"Environment Variables"**.
   - Masukkan key dari file `.env.local` kamu:
     - `NEXT_PUBLIC_SUPABASE_URL` = (isi URL Supabase kamu)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (isi Anon Key kamu)
4. **Deploy**: Klik tombol Deploy. Tunggu 1 menit, dan web kamu sudah LIVE!

---

## 3. Cara Edit Santai di HP (Sebelum Tidur)
Setelah web kamu di-deploy ke Vercel:

### A. Edit Konten (Memories & Notebook)
Kamu tidak perlu edit kode! Cukup buka link web kamu di HP, lalu:
- Tambah memory baru lewat tombol **"Add New Memory"**.
- Tulis curhatan di **Notebook**.
- Semua akan tersimpan otomatis karena sudah terhubung ke Supabase.

### B. Edit Kode (Waktu, Warna, Lagu)
Jika ingin edit kode (misal di file `mock-data.ts` atau `page.tsx`) lewat HP:
1. Buka browser di HP dan buka [github.com](https://github.com).
2. Masuk ke repository project kamu.
3. Pilih file yang ingin diedit.
4. Klik icon 📝 (Edit) atau tekan tombol `.` (titik) di keyboard HP (lewat browser) untuk membuka **Web Editor**.
5. Edit kodenya, lalu klik **"Commit Changes"**.
6. **Vercel akan otomatis mengupdate web kamu** dalam hitungan detik. Selesai!

---
**Tips**: Untuk pengalaman terbaik di HP, jangan lupa klik **"Add to Home Screen"** di browser HP kamu agar aplikasinya terasa seperti aplikasi asli (PWA)! Kamu sudah saya buatkan fiturnya. 😊
