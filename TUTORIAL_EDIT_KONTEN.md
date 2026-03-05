# Panduan Edit Konten - Pro Ratih Web 📝

Halo! Ini adalah panduan singkat jika kamu ingin mengubah tulisan, lagu, atau waktu di aplikasi kamu sendiri.

## 1. Cara Ganti Tulisan & Pertanyaan (Dashboard)
Jika kamu ingin mengubah sapaan ("Hi, Ratih") atau pertanyaan suasana hati:
- **File**: `src/components/MoodSupport.tsx`
- **Cari Baris**:
  - Baris 65: `Hi, Ratih.` (Ganti namanya di sini)
  - Baris 67: `How is your heart feeling today?` (Ganti pertanyaannya di sini)

## 2. Cara Ganti Waktu di Time Capsule
Jika kamu ingin mengubah kapan kalian bertemu kembali:
- **File**: `src/app/page.tsx`
- **Cari Bagian**:
  ```tsx
  <TimeCapsule 
    startDate="2026-02-04T00:00:00" 
    subtext="Every second since we met again." 
  />
  ```
- **Ganti `startDate`**: Gunakan format `YYYY-MM-DD`.
- **Ganti `subtext`**: Ubah kalimat di bawah angka penghitung.

## 3. Cara Ganti Lagu & Playlist
Ada dua cara, lewat data dummy atau pakai file MP3 sendiri.
- **File Data**: `src/lib/mock-data.ts`
- **Lagu dummy**: Ganti judul dan artist di dalam `MOCK_PLAYLIST`.
- **Lagu MP3 sendiri**:
  1. Simpan file MP3 kamu di folder `public/audio/`.
  2. Di file `src/lib/mock-data.ts`, tambahkan linknya:
     ```ts
     url: '/audio/nama_lagu_kamu.mp3'
     ```

## 4. Cara Ganti Warna Aplikasi
Jika warna "Warm" saat ini ingin kamu ubah lagi:
- **File**: `src/app/globals.css`
- **Cari Bagian `@theme`**:
  - `--color-background`: Warna latar belakang (Gelap).
  - `--color-foreground`: Warna tulisan utama (Terang).
  - `--color-primary`: Warna aksen/garis (Abu-abu/Beige).

## 5. Cara Ganti Konten di Halaman Memories
Semua judul dan deskripsi di halaman Memories bisa langsung kamu edit melalui tombol **"Add New Memory"** di website. Data akan langsung tersimpan di Supabase secara otomatis.

---
**Tips**: Selalu gunakan tanda petik `"` yang benar saat mengedit kode agar tidak terjadi error! Kalau ada yang bingung, tanya saya lagi ya. 😊
