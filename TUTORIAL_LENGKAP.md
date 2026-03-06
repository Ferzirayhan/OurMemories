# 📖 Tutorial Lengkap — Our Memories

Panduan lengkap untuk mengedit, mengganti konten, dan mengelola project **Our Memories**.

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── globals.css          ← Warna tema (dark/light)
│   ├── layout.tsx           ← Judul tab browser, metadata
│   ├── page.tsx             ← Halaman utama (Home)
│   ├── memories/page.tsx    ← Halaman gallery foto
│   └── secret-space/page.tsx← Halaman rahasia
├── components/
│   ├── Navigation.tsx       ← Menu bar atas
│   ├── AdminLock.tsx        ← Tombol PIN admin
│   ├── TimeCapsule.tsx      ← Hitung waktu sejak ketemu
│   ├── MoodSupport.tsx      ← Mood picker + surat mood
│   ├── Mixtape.tsx          ← Playlist lagu
│   ├── Notebook.tsx         ← Daily diary
│   ├── BucketList.tsx       ← Bucket list berdua
│   ├── LoveJar.tsx          ← Jar berisi alasan cinta
│   ├── FutureLetters.tsx    ← Surat masa depan
│   ├── OurMap.tsx           ← Peta tempat kenangan
│   ├── MilestoneTimeline.tsx← Timeline milestone
│   ├── MemoryTimeline.tsx   ← Timeline foto gallery
│   └── MemoryUpload.tsx     ← Form upload foto
├── lib/
│   ├── admin-context.tsx    ← PIN admin & nama author
│   ├── theme-context.tsx    ← Dark/light mode
│   ├── supabase.ts          ← Koneksi database
│   └── mock-data.ts         ← Data playlist & fallback
public/
├── audio/                   ← File lagu MP3
├── logo.png                 ← Logo di navbar
├── icon.png                 ← Icon app
├── favicon.ico              ← Icon tab browser
└── manifest.json            ← PWA manifest
```

---

## 🔐 1. Admin PIN & Nama Author

**File:** `src/lib/admin-context.tsx`

### Ganti PIN Admin
```tsx
// Baris 17 — ganti "230898" ke PIN yang kamu mau
const ADMIN_PIN = "230898";
```

### Ganti Nama Author
```tsx
// Baris 48 — nama yang muncul saat nulis catatan/upload
const authorName = isAdmin ? "Ezi" : "Ratih";
```
- **"Ezi"** → nama yang muncul kalau login admin
- **"Ratih"** → nama yang muncul kalau tidak login (user biasa)

---

## 🎨 2. Warna Tema

**File:** `src/app/globals.css`

### Dark Mode (Default)
```css
/* Baris 31-57 */
:root, .dark {
  --background: #121110;      /* Warna latar belakang */
  --accent: #d4a574;           /* Warna aksen utama (coklat caramel) */
  --accent-soft: rgba(212,165,116,0.15); /* Glow aksen */
  --text-primary: #f5f2ed;     /* Teks utama */
  --text-secondary: #a1a1aa;   /* Teks sub */
  --text-muted: #71717a;       /* Teks redup */
  --nav-bg: rgba(0,0,0,0.4);   /* Background navbar */
  /* ... dll */
}
```

### Light Mode
```css
/* Baris 60-82 */
.light {
  --background: #faf8f5;      /* Warna latar (krem hangat) */
  --accent: #c4875a;           /* Warna aksen (coklat gelap) */
  --text-primary: #1a1816;     /* Teks utama */
  --nav-bg: rgba(255,255,255,0.75); /* Background navbar */
  /* ... dll */
}
```

### Cara Ganti Warna
Cukup ganti value hex/rgba di file CSS. Contoh ganti aksen jadi pink:
```css
--accent: #e91e63;
--accent-soft: rgba(233,30,99,0.15);
```

---

## ⏱ 3. Time Capsule (Hitung Waktu)

**File:** `src/app/page.tsx` — Baris 29-32

```tsx
<TimeCapsule
  startDate="2026-02-04T00:00:00"    // ← Tanggal mulai (ISO format)
  subtext="Every second since we met again."  // ← Teks di bawah judul
/>
```

### Cara Ganti
- **startDate**: Ganti ke tanggal pertama kalian ketemu/jadian. Format: `"YYYY-MM-DDTHH:MM:SS"`
- **subtext**: Ganti ke kalimat apa aja

---

## 😊 4. Mood Support (Surat Mood)

**File:** `src/components/MoodSupport.tsx`

### Teks Sapaan (Baris 96-98)
```tsx
<h2>Hi, Ratih.</h2>               // ← Ganti nama
<p>How is your heart feeling today?</p>  // ← Ganti pertanyaan
```

### Teks Virtual Hug (Baris 185)
```tsx
<p>Sending a virtual hug...</p>    // ← Ganti teks pelukan
```

### Teks Audio Support (Baris 155)
```tsx
<p>A message for your heart</p>    // ← Ganti judul audio
```

### Fallback Surat Mood (Baris 51-56)
Kalau di database kosong, surat ini yang muncul:
```tsx
const fallbacks = {
  'Happy': { title: 'Yay!', content: 'I am so happy that you...' },
  'Neutral': { title: 'Thinking of You', content: 'Just a regular day...' },
  'Tired': { title: 'Rest Up, Love', content: 'You have worked so hard...' },
  'Sad': { title: 'I am Right Here', content: 'I wish I could be there...' }
};
```

### ✅ Via Supabase (Tanpa Ngoding!)
Cara paling gampang — bisa ganti kapan aja tanpa deploy ulang:
1. Buka **Supabase Dashboard** → **Table Editor** → tabel **`mood_letters`**
2. Insert/edit row:

| Kolom | Isi |
|-------|-----|
| `mood` | `Happy` / `Neutral` / `Tired` / `Sad` |
| `title` | Judul surat, misal: `"Senangnyaa!"` |
| `content` | Isi surat panjang |

---

## 🎵 5. Playlist (Mixtape)

**File:** `src/lib/mock-data.ts` — Baris 57-87

```tsx
export const MOCK_PLAYLIST: Song[] = [
  {
    id: '1',
    title: 'Soft',                    // ← Judul lagu
    artist: 'LANY',                   // ← Nama artis
    duration: '3:13',                 // ← Durasi
    memoryText: '"This song the definition of u hehehe"',  // ← Cerita tentang lagu
    audioUrl: '/audio/LANY - Soft.mp3'  // ← Path file audio
  },
  // ... tambah lagu lain di sini
];
```

### Cara Tambah Lagu Baru
1. Taruh file `.mp3` di folder `public/audio/`
2. Tambah entry baru di array `MOCK_PLAYLIST`:
```tsx
{
  id: '4',
  title: 'Judul Lagu',
  artist: 'Nama Artis',
  duration: '3:45',
  memoryText: '"Kenangan tentang lagu ini..."',
  audioUrl: '/audio/nama-file.mp3'
}
```

### Cara Hapus Lagu
Hapus entry dari array dan hapus file mp3 dari `public/audio/`.

### File Audio Support (untuk Mood Sad/Tired)
Letakkan file di `public/audio/support.mp3` — akan diputar saat Ratih pilih mood Sad/Tired.

---

## ✍️ 6. Daily Notebook

Konten notebook disimpan di **Supabase** tabel **`notes`**.

- Bisa ditulis & dihapus oleh **semua orang** (Ezi & Ratih)
- Setiap catatan otomatis punya nama author
- Realtime — langsung muncul tanpa refresh

Tidak ada yang perlu diedit di kode. Semua lewat UI app.

---

## ✅ 7. Bucket List

Konten bucket list disimpan di **Supabase** tabel **`bucket_list`**.

- Bisa ditambah, di-checklist, dan dihapus oleh **semua orang**
- Semua lewat UI app — tidak perlu edit kode

---

## 💌 8. Love Jar

Konten love jar disimpan di **Supabase** tabel **`love_reasons`**.

### Warna Kertas (Pilihan di UI)
**File:** `src/components/LoveJar.tsx` — Baris 18-23

```tsx
const COLORS = [
  { name: "Rose", value: "#FDA4AF" },      // Pink
  { name: "Cream", value: "#FEF9C3" },     // Kuning krem
  { name: "Sky", value: "#BAE6FD" },        // Biru langit
  { name: "Lavender", value: "#E9D5FF" },   // Ungu muda
  { name: "Mint", value: "#BBF7D0" },       // Hijau mint
];
```

### Cara Ganti/Tambah Warna
Tambah entry baru di array `COLORS`:
```tsx
{ name: "Coral", value: "#FCA5A5" },
```

### Operasi via UI
- **Tambah note**: Tombol "Write Note" di pojok kanan atas jar
- **Baca note**: Klik kertas kecil di dalam jar
- **Hapus note**: Hover kertas → tombol X (hanya admin)

---

## 💌 9. Future Letters (Surat Masa Depan)

Konten disimpan di **Supabase** tabel **`future_letters`**.

### Operasi via UI
- **Tulis surat baru**: Tombol "Write Letter"
- **Baca surat**: Klik surat yang sudah unlock (tanggal sudah lewat)
- **Hapus surat**: Tombol trash (hanya admin)
- Surat yang **belum unlock** ditampilkan abu-abu + countdown

### Teks Header
**File:** `src/components/FutureLetters.tsx` — Baris 97
```tsx
<h2>Future Letters</h2>  // ← Judul section
```

---

## 🗺 10. Our Map (Peta Kenangan)

Konten disimpan di **Supabase** tabel **`memorable_places`**.

### Cara Pakai di UI
1. **Klik di peta** → muncul form "Pin this Memory"
2. Isi nama tempat, cerita, dan kategori
3. **Hapus pin**: Klik marker → popup → tombol trash (hanya admin)

### Kategori Tempat (bisa ditambah)
**File:** `src/components/OurMap.tsx` — Baris 262-267
```tsx
<select>
  <option value="Date">Date</option>
  <option value="First Meet">First Meet</option>
  <option value="Special Moment">Special Moment</option>
  <option value="Travel">Travel</option>
</select>
```
Tambah `<option>` baru kalau mau kategori lain.

### Ganti Posisi Default Peta
**File:** `src/components/OurMap.tsx` — Baris 155
```tsx
center={[-6.2088, 106.8456]}  // ← Koordinat Jakarta
zoom={11}                      // ← Level zoom (1-18)
```
Ganti koordinat ke kota kalian. Cari di Google Maps → klik kanan → "Copy coordinates".

---

## 🏆 11. Milestones (Timeline Momen Penting)

Konten disimpan di **Supabase** tabel **`milestones`**.

### Icon yang Tersedia
**File:** `src/components/MilestoneTimeline.tsx` — Baris 20
```tsx
const AVAILABLE_ICONS = [
  "Heart",          // ❤️
  "Star",           // ⭐
  "Camera",         // 📷
  "Coffee",         // ☕
  "MapPin",         // 📍
  "MessageCircle",  // 💬
  "Eye"             // 👁
];
```

### Cara Pakai di UI
- **Tambah milestone**: Tombol "Add Milestone"
- **Hapus milestone**: Tombol trash (hanya admin)

---

## 📷 12. Memories Gallery

Konten (foto + deskripsi) disimpan di **Supabase** tabel **`memories`**.
Foto disimpan di **Supabase Storage** bucket **`memories`**.

### Cara Pakai di UI
1. Buka halaman **Memories** (menu bar)
2. Klik **"Add New Memory"**
3. Upload foto, isi judul, deskripsi, dan hidden message (curhatan)
4. Hapus memory: klik tombol trash di card

### Ganti Judul Halaman
**File:** `src/app/memories/page.tsx` — Baris 92-94
```tsx
<h1>Our Gallery</h1>                           // ← Judul besar
<p>Every frame is a story. Add yours...</p>    // ← Subtitle
```

---

## 🧭 13. Navigasi & Branding

**File:** `src/components/Navigation.tsx`

### Ganti Nama App di Navbar
```tsx
// Baris 32 — tampil di desktop
<span className="hidden sm:inline ...">OurMemories</span>

// Baris 33 — tampil di mobile
<span className="sm:hidden ...">OM</span>
```

### Ganti Logo
Ganti file `public/logo.png` dengan gambar baru (disarankan kotak, min 100x100px).

### Ganti Link Menu
```tsx
// Baris 14-17
const links = [
  { href: "/memories", label: "Memories" },
  { href: "/secret-space", label: "Secret Space" }
];
```

---

## 🏠 14. Halaman Home

**File:** `src/app/page.tsx`

### Teks Secret Space Portal (Baris 65-75)
```tsx
<h2>The Secret Space</h2>
<p>A private corner filled with small surprises...</p>
<Link>Enter Our Hidden World</Link>   // ← Teks tombol
```

---

## 🔮 15. Halaman Secret Space

**File:** `src/app/secret-space/page.tsx`

### Teks Header (Baris 50-58)
```tsx
<span>Go Back Home</span>                  // ← Teks tombol kembali
<h1>The Secret Space</h1>                 // ← Judul halaman
<p>
  A private sanctuary for the little things that mean the most.
  Just for you, Ratih.                     // ← Ganti nama
</p>
```

### Teks Section Milestone (Baris 84)
```tsx
<h2>Our Secret Milestones</h2>
```

### Teks Footer (Baris 92)
```tsx
<p>Made with love & code</p>
```

---

## 🌐 16. Metadata & SEO

**File:** `src/app/layout.tsx` — Baris 20-28

```tsx
export const metadata: Metadata = {
  title: "Our Memories",                    // ← Judul tab browser
  description: "A deeply personal space.",  // ← Deskripsi SEO
};
```

---

## 📱 17. Icon & Manifest (PWA)

### Ganti Icon App
Ganti file-file ini:
- `public/icon.png` — Icon utama (min 512x512px, PNG)
- `public/favicon.ico` — Icon tab browser

### Manifest PWA
**File:** `public/manifest.json`
```json
{
  "name": "Our Memories",           // ← Nama lengkap app
  "short_name": "Our Memories",     // ← Nama pendek
  "description": "Your personal space and memory timeline.",
  "start_url": "/",                 // ← ⚠️ Ganti dari "/dashboard" ke "/"
  "theme_color": "#121110",         // ← ⚠️ Ganti ke warna tema
  "background_color": "#121110"     // ← ⚠️ Ganti ke warna background
}
```

---

## 🗄 18. Database Supabase — Ringkasan Tabel

| Tabel | Isi | Bisa lewat UI? |
|-------|-----|----------------|
| `memories` | Foto gallery + deskripsi + curhatan | ✅ Upload & hapus di app |
| `notes` | Catatan daily notebook | ✅ Tulis & hapus di app |
| `love_reasons` | Kertas-kertas di Love Jar | ✅ Tambah & hapus di app |
| `future_letters` | Surat masa depan (terkunci sampai tanggal) | ✅ Tulis & hapus di app |
| `memorable_places` | Pin lokasi di peta | ✅ Klik peta & hapus di app |
| `milestones` | Momen penting di timeline | ✅ Tambah & hapus di app |
| `mood_letters` | Surat respons mood (Happy/Sad/dll) | ❌ Edit di Supabase Dashboard |
| `bucket_list` | Daftar hal yang mau dilakukan berdua | ✅ Tambah, checklist & hapus di app |

### Cara Edit Data Langsung di Supabase
1. Buka https://supabase.com/dashboard
2. Pilih project **For-Ratih**
3. Klik **Table Editor** di sidebar
4. Pilih tabel → edit/tambah/hapus row

---

## 🔑 19. Environment Variables

**File:** `.env.local` (JANGAN di-commit ke GitHub!)

```env
NEXT_PUBLIC_SUPABASE_URL=https://nnifiqayjjlanfslkjck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...panjang...
```

Kalau deploy ke **Vercel**, tambahkan kedua variable ini di:
**Vercel Dashboard → Project → Settings → Environment Variables**

---

## 🎯 20. Fitur Admin vs Non-Admin

| Fitur | Admin (PIN ✅) | Non-Admin |
|-------|---------------|-----------|
| Upload memory | ✅ (author: "Ezi") | ✅ (author: "Ratih") |
| Hapus memory | ✅ | ✅ |
| Tulis notebook | ✅ | ✅ |
| Hapus notebook | ✅ | ✅ |
| Tambah love jar | ✅ | ✅ |
| Hapus love jar | ✅ | ❌ |
| Tulis future letter | ✅ | ✅ |
| Hapus future letter | ✅ | ❌ |
| Pin di map | ✅ | ✅ |
| Hapus pin map | ✅ | ❌ |
| Tambah milestone | ✅ | ✅ |
| Hapus milestone | ✅ | ❌ |
| Bucket list (semua) | ✅ | ✅ |

---

## 🚀 21. Deploy ke Vercel

1. Push ke GitHub (sudah di `https://github.com/Ferzirayhan/OurMemories.git`)
2. Buka https://vercel.com → **Import Project** → pilih repo `OurMemories`
3. Di **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**
5. Selesai! Dapat link `.vercel.app`

### Custom Domain (Opsional)
Di Vercel Dashboard → **Settings → Domains** → tambahkan domain custom.

---

## 📝 Checklist Sebelum Kasih ke Ratih

- [ ] Ganti `startDate` di TimeCapsule ke tanggal yang benar
- [ ] Ganti nama "Ezi" & "Ratih" di `admin-context.tsx` kalau perlu
- [ ] Upload lagu-lagu yang meaningful ke `public/audio/`
- [ ] Edit `MOCK_PLAYLIST` di `mock-data.ts` dengan lagu yang benar
- [ ] Isi tabel `mood_letters` di Supabase dengan surat personal
- [ ] Upload foto-foto kenangan lewat UI app
- [ ] Tambah milestone pertama lewat UI app
- [ ] Pin tempat-tempat kenangan di peta lewat UI app
- [ ] Tulis beberapa future letter dengan tanggal unlock
- [ ] Ganti `public/logo.png` dan `public/icon.png`
- [ ] Fix `manifest.json`: ganti `start_url` ke `/`, update `theme_color`
- [ ] Deploy ke Vercel
- [ ] Test di HP (iPhone/Android)
- [ ] Kirim link ke Ratih 💕

---

## ❓ FAQ

### Q: Gimana kalau mau ganti font?
**File:** `src/app/layout.tsx` — Baris 9-16. Import font baru dari `next/font/google` dan ganti variable-nya.

### Q: Gimana kalau mau tambah halaman baru?
Buat folder baru di `src/app/nama-halaman/page.tsx` dan tambahkan link di `Navigation.tsx`.

### Q: Gimana kalau mau ganti audio support yang diputar saat Sad/Tired?
Ganti file `public/audio/support.mp3` dengan file audio baru (harus nama sama, atau ganti path di `MoodSupport.tsx` baris 157).

### Q: Gimana akses Supabase Dashboard?
Buka https://supabase.com/dashboard → login → pilih project **For-Ratih**.

### Q: Data bisa hilang nggak?
Data aman di Supabase cloud. Selama project Supabase aktif (free tier berlaku 1 project aktif), data tetap aman.

### Q: Gimana reset PIN admin kalau lupa?
Edit `ADMIN_PIN` di `src/lib/admin-context.tsx` baris 17, lalu deploy ulang.
