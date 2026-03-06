# 📖 Tutorial Lengkap — Our Memories

Panduan lengkap untuk mengedit, mengganti konten, dan mengelola project **Our Memories**.

🌐 **Live URL:** https://our-memories-beta.vercel.app/

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── globals.css              ← Warna tema (dark/light)
│   ├── layout.tsx               ← Judul tab, metadata, providers
│   ├── page.tsx                 ← Halaman utama (Home)
│   ├── memories/page.tsx        ← Halaman gallery foto
│   ├── secret-space/page.tsx    ← Halaman rahasia
│   └── api/push/
│       ├── send/route.ts        ← API kirim push notification
│       └── subscribe/route.ts   ← API simpan subscription
├── components/
│   ├── Navigation.tsx           ← Menu bar atas (auto-hide saat scroll)
│   ├── AdminLock.tsx            ← Tombol PIN admin
│   ├── NotificationSetup.tsx    ← Popup aktifkan push notification
│   ├── TimeCapsule.tsx          ← Hitung waktu sejak ketemu
│   ├── DailyMemory.tsx          ← 🆕 Random memory harian
│   ├── MoodSupport.tsx          ← Mood picker + surat mood + voice recorder
│   ├── Mixtape.tsx              ← Playlist lagu (persistent across pages)
│   ├── Notebook.tsx             ← Daily diary
│   ├── BucketList.tsx           ← Bucket list berdua
│   ├── LoveJar.tsx              ← Jar berisi alasan cinta (admin-only write)
│   ├── GratitudeWall.tsx        ← 🆕 Dinding rasa syukur
│   ├── FutureLetters.tsx        ← Surat masa depan (date-locked)
│   ├── OurMap.tsx               ← Peta tempat kenangan
│   ├── GrowthGarden.tsx         ← Growth garden
│   ├── MilestoneTimeline.tsx    ← Timeline milestone
│   ├── MemoryTimeline.tsx       ← Timeline foto gallery (polaroid style)
│   └── MemoryUpload.tsx         ← Form upload foto
├── lib/
│   ├── admin-context.tsx        ← PIN admin & nama author
│   ├── theme-context.tsx        ← Dark/light mode (default: Light)
│   ├── audio-context.tsx        ← 🆕 Persistent audio playback
│   ├── push-notifications.ts   ← 🆕 Helper push notification
│   ├── supabase.ts              ← Koneksi database
│   └── mock-data.ts             ← Data playlist & fallback
public/
├── sw.js                        ← 🆕 Service Worker untuk push notif
├── manifest.json                ← PWA manifest
├── audio/                       ← File lagu MP3
├── logo.png                     ← Logo di navbar
├── icon.png                     ← Icon app
└── favicon.ico                  ← Icon tab browser
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
- **"Ezi"** → nama yang muncul kalau login admin (unlock 🔓)
- **"Ratih"** → nama yang muncul kalau tidak login (lock 🔒)

---

## 🎨 2. Warna Tema

**File:** `src/app/globals.css`

### Light Mode (Default)
```css
:root {
  --background: #faf8f5;                    /* Krem hangat */
  --accent: #a06b3e;                         /* Coklat earthy gold */
  --accent-soft: rgba(160,107,62,0.12);      /* Glow aksen */
  --text-primary: #1a1816;                   /* Teks utama */
  --text-secondary: #57534e;                 /* Teks sub */
  --text-muted: #71717a;                     /* Teks redup */
  --nav-bg: rgba(255,255,255,0.85);          /* Background navbar */
}
```

### Dark Mode
```css
.dark {
  --background: #121110;                     /* Gelap */
  --accent: #d4a574;                         /* Coklat caramel */
  --text-primary: #f5f2ed;                   /* Teks terang */
  --nav-bg: rgba(0,0,0,0.4);                /* Background navbar */
}
```

### Cara Ganti Warna
Cukup ganti value hex/rgba di file CSS. Contoh ganti aksen jadi pink:
```css
--accent: #e91e63;
--accent-soft: rgba(233,30,99,0.15);
```

### Cara Ganti Default Theme
**File:** `src/lib/theme-context.tsx`
```tsx
// Ganti "light" ke "dark" untuk default gelap
const [theme, setTheme] = useState<"light" | "dark">("light");
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

## 📸 4. Daily Memory (Random Kenangan Harian)

**File:** `src/components/DailyMemory.tsx`

Fitur yang menampilkan **1 kenangan random setiap hari** di halaman Home.

### Cara Kerja
- Mengambil semua foto dari tabel `memories`
- Menggunakan date-based seed → setiap hari foto yang tampil berbeda
- Ditampilkan dalam **polaroid frame** dengan judul & deskripsi
- Klik → navigasi ke halaman Memories

### Teks yang bisa diganti
```tsx
<h3>Today&apos;s Memory ✨</h3>        // ← Judul section
<p>What the stars chose for today</p>  // ← Subtitle
<span>See all memories →</span>        // ← Teks link
```

Tidak perlu input data — otomatis ambil dari foto yang sudah di-upload.

---

## 😊 5. Mood Support (Surat Mood + Voice Recorder)

**File:** `src/components/MoodSupport.tsx`

### Teks Sapaan
```tsx
<h2>Hi, Ratih.</h2>                          // ← Ganti nama
<p>How is your heart feeling today?</p>      // ← Ganti pertanyaan
```

### Fallback Surat Mood
Kalau di database kosong, surat ini yang muncul:
```tsx
const fallbacks = {
  'Happy': { title: 'Yay!', content: '...' },
  'Neutral': { title: 'Thinking of You', content: '...' },
  'Tired': { title: 'Rest Up, Love', content: '...' },
  'Sad': { title: 'I am Right Here', content: '...' }
};
```

### ✅ Edit Surat via Supabase (Tanpa Ngoding!)
1. Buka **Supabase Dashboard** → **Table Editor** → tabel **`mood_letters`**
2. Insert/edit row:

| Kolom | Isi |
|-------|-----|
| `mood` | `Happy` / `Neutral` / `Tired` / `Sad` |
| `title` | Judul surat |
| `content` | Isi surat panjang |

### 🎙️ Voice Recorder (Admin Only)
- Hanya muncul saat **admin unlock** (Ezi)
- Bisa rekam suara langsung dari HP/browser
- Pilih kategori: Happy / Neutral / Tired / Sad
- Voice note disimpan di **Supabase Storage** bucket `voice-notes`
- Satu voice note per kategori (hapus dulu kalau mau ganti)
- Ratih bisa **mendengarkan** voice note saat pilih mood

---

## 🎵 6. Playlist (Mixtape) — Persistent Playback

**File:** `src/lib/mock-data.ts`

Musik sekarang **tidak berhenti saat pindah halaman**! Audio dikelola oleh `AudioProvider` di `src/lib/audio-context.tsx`.

```tsx
export const MOCK_PLAYLIST: Song[] = [
  {
    id: '1',
    title: 'Soft',                              // ← Judul lagu
    artist: 'LANY',                              // ← Nama artis
    duration: '3:13',                            // ← Durasi
    memoryText: '"This song..."',                // ← Cerita tentang lagu
    audioUrl: '/audio/LANY - Soft.mp3'           // ← Path file audio
  },
];
```

### Cara Tambah Lagu Baru
1. Taruh file `.mp3` di folder `public/audio/`
2. Tambah entry baru di array `MOCK_PLAYLIST`

### Cara Hapus Lagu
Hapus entry dari array dan hapus file mp3 dari `public/audio/`.

### File Audio Support (untuk Mood Sad/Tired)
Letakkan file di `public/audio/support.mp3` — akan diputar saat Ratih pilih mood Sad/Tired.

---

## ✍️ 7. Daily Notebook

Konten notebook disimpan di **Supabase** tabel **`notes`**.

- Bisa ditulis & dihapus oleh **semua orang** (Ezi & Ratih)
- Setiap catatan otomatis punya nama author
- Realtime — langsung muncul tanpa refresh
- **Push notification** dikirim saat ada catatan baru

---

## ✅ 8. Bucket List

Konten bucket list disimpan di **Supabase** tabel **`bucket_list`**.

- Bisa ditambah, di-checklist, dan dihapus oleh **semua orang**
- **Push notification** dikirim saat item baru ditambah
- Semua lewat UI app

---

## 💌 9. Love Jar (Admin-Only Write)

Konten love jar disimpan di **Supabase** tabel **`love_reasons`**.

### ⚠️ Perubahan Penting
- **Hanya admin (Ezi) yang bisa menulis** Love Note baru
- Ratih **hanya bisa membaca** — sebagai surprise 💕
- Hapus note tetap admin-only

### Warna Kertas
**File:** `src/components/LoveJar.tsx`
```tsx
const COLORS = [
  { name: "Rose", value: "#FDA4AF" },
  { name: "Cream", value: "#FEF9C3" },
  { name: "Sky", value: "#BAE6FD" },
  { name: "Lavender", value: "#E9D5FF" },
  { name: "Mint", value: "#BBF7D0" },
];
```

---

## 🌸 10. Gratitude Wall (Dinding Syukur)

**File:** `src/components/GratitudeWall.tsx`

Fitur di **Secret Space** — dinding tempat Ezi & Ratih menulis hal-hal yang mereka syukuri.

### Cara Kerja
- **Kedua orang bisa menulis** (Ezi & Ratih)
- Setiap note menampilkan nama author + tanggal
- Hapus note hanya bisa admin
- Realtime — muncul otomatis saat partner nulis
- **Push notification** dikirim saat ada note baru
- Warna gradient berbeda untuk setiap note

### Tabel Supabase: `gratitude_wall`
| Kolom | Tipe |
|-------|------|
| `id` | UUID |
| `message` | TEXT |
| `author` | TEXT |
| `created_at` | TIMESTAMPTZ |

---

## ✉️ 11. Future Letters (Surat Masa Depan)

Konten disimpan di **Supabase** tabel **`future_letters`**.

### Operasi via UI
- **Tulis surat baru**: Tombol "Write Letter" — pilih tanggal unlock
- **Baca surat**: Klik surat yang sudah unlock (tanggal sudah lewat)
- **Hapus surat**: Tombol trash (hanya admin)
- Surat yang **belum unlock** ditampilkan abu-abu + countdown
- **Push notification** dikirim saat surat baru ditulis

---

## 🗺 12. Our Map (Peta Kenangan)

Konten disimpan di **Supabase** tabel **`memorable_places`**.

### Cara Pakai di UI
1. **Klik di peta** → muncul form "Pin this Memory"
2. Isi nama tempat, cerita, dan kategori
3. **Hapus pin**: Klik marker → popup → tombol trash (hanya admin)
4. **Push notification** dikirim saat pin baru ditambah

### Kategori Tempat
```tsx
<option value="Date">Date</option>
<option value="First Meet">First Meet</option>
<option value="Special Moment">Special Moment</option>
<option value="Travel">Travel</option>
```
Tambah `<option>` baru kalau mau kategori lain.

### Ganti Posisi Default Peta
```tsx
center={[-6.2088, 106.8456]}  // ← Koordinat Jakarta
zoom={11}                      // ← Level zoom (1-18)
```

---

## 🏆 13. Milestones (Timeline Momen Penting)

Konten disimpan di **Supabase** tabel **`milestones`**.

### Icon yang Tersedia
```
Heart ❤️, Star ⭐, Camera 📷, Coffee ☕, MapPin 📍, MessageCircle 💬, Eye 👁
```

- **Tambah milestone**: Tombol "Add Milestone"
- **Hapus milestone**: Tombol trash (hanya admin)

---

## 📷 14. Memories Gallery (Polaroid Style)

Konten disimpan di **Supabase** tabel **`memories`** + Storage bucket **`memories`**.

### Cara Pakai di UI
1. Buka halaman **Memories**
2. Klik **"Add New Memory"**
3. Upload foto, isi judul, deskripsi, dan hidden message (curhatan)
4. Foto ditampilkan dalam **polaroid frame** putih dengan caption strip
5. **Push notification** dikirim saat memory baru di-upload

---

## 🔔 15. Push Notifications (PWA)

### Cara Kerja
- Saat buka app pertama kali, muncul popup "Stay Connected 💕"
- Klik **Enable Notifications** → izinkan di browser
- Setiap kali ada konten baru (memory, note, gratitude, dll), **semua subscriber** dapat notifikasi
- Notifikasi muncul bahkan saat app tidak dibuka

### Fitur yang Kirim Notif
| Fitur | Emoji | Contoh Notifikasi |
|-------|-------|-------------------|
| Upload Memory | 📸 | "Ezi added: Dinner Date" |
| Love Jar | 💌 | "Ezi dropped a new note in the Love Jar" |
| Gratitude Wall | 🌸 | "Ratih shared something they're grateful for" |
| Bucket List | ✅ | "Ezi added: Visit Paris" |
| Voice Message | 🎙️ | "Ezi recorded a voice note for you" |
| Future Letter | ✉️ | "A new letter is waiting to be unlocked" |
| Notebook | 📝 | "Ratih wrote something in the notebook" |
| Map Pin | 📍 | "Ezi pinned: Cafe Kita" |

### Troubleshooting Notif
- **Notif tidak muncul?** Pastikan sudah klik "Enable" dan izinkan di browser
- **iOS Safari**: Harus **Add to Home Screen** dulu, baru bisa push notif
- **Android Chrome**: Langsung bisa tanpa install

### Environment Variables untuk Push Notif
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDikc-ib78pth...
VAPID_PRIVATE_KEY=9cLdaYBny3cb...
```
Kedua variable ini harus ada di `.env.local` (lokal) **dan** Vercel Dashboard (production).

---

## 🧭 16. Navigasi & Branding

**File:** `src/components/Navigation.tsx`

### Navbar Features
- **Auto-hide** saat scroll ke bawah, muncul saat scroll ke atas
- **Glass effect** dengan blur backdrop
- Logo + nama app di kiri
- Theme toggle (🌙/☀️) + admin lock di kanan

### Ganti Nama App di Navbar
```tsx
<span className="hidden sm:inline ...">OurMemories</span>  // Desktop
<span className="sm:hidden ...">OM</span>                   // Mobile
```

### Ganti Logo
Ganti file `public/logo.png` (disarankan kotak, min 100x100px).

---

## 🏠 17. Halaman Home

**File:** `src/app/page.tsx`

### Layout
- **Kiri**: Daily Memory → Mood Support → Mixtape
- **Kanan**: Notebook → Bucket List
- **Bawah**: Portal ke Secret Space

---

## 🔮 18. Halaman Secret Space

**File:** `src/app/secret-space/page.tsx`

### Komponen di Secret Space
1. **Love Jar** (admin-only write)
2. **Gratitude Wall** (kedua bisa tulis)
3. **Future Letters** (date-locked)
4. **Our Map** (peta interaktif)
5. **Milestone Timeline**

---

## 🌐 19. Metadata & SEO

**File:** `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: "Our Memories",
  description: "A deeply personal space.",
};
```

---

## 📱 20. PWA & Manifest

**File:** `public/manifest.json`
```json
{
  "name": "Our Memories",
  "short_name": "Our Memories",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#a06b3e",
  "background_color": "#faf8f5"
}
```

### Cara Install sebagai App
- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu (⋮) → "Add to Home Screen"

---

## 🗄 21. Database Supabase — Ringkasan Tabel

| Tabel | Isi | Bisa lewat UI? | Push Notif? |
|-------|-----|----------------|-------------|
| `memories` | Foto gallery + deskripsi + curhatan | ✅ Upload & hapus | ✅ |
| `notes` | Catatan daily notebook | ✅ Tulis & hapus | ✅ |
| `love_reasons` | Kertas di Love Jar | ✅ Tambah (admin) & hapus | ✅ |
| `future_letters` | Surat masa depan (date-locked) | ✅ Tulis & hapus | ✅ |
| `memorable_places` | Pin lokasi di peta | ✅ Klik peta & hapus | ✅ |
| `milestones` | Momen penting di timeline | ✅ Tambah & hapus | ❌ |
| `mood_letters` | Surat respons mood | ❌ Edit di Supabase | ❌ |
| `bucket_list` | Hal yang mau dilakukan berdua | ✅ Tambah, checklist, hapus | ✅ |
| `voice_notes` | Rekaman suara per mood | ✅ Rekam & hapus (admin) | ✅ |
| `gratitude_wall` | Catatan rasa syukur | ✅ Tulis & hapus (admin) | ✅ |
| `push_subscriptions` | Data subscriber notif | ❌ Otomatis | ❌ |

### Cara Edit Data Langsung di Supabase
1. Buka https://supabase.com/dashboard
2. Pilih project **For-Ratih**
3. Klik **Table Editor** di sidebar
4. Pilih tabel → edit/tambah/hapus row

---

## 🔑 22. Environment Variables

**File:** `.env.local` (JANGAN di-commit ke GitHub!)

```env
NEXT_PUBLIC_SUPABASE_URL=https://nnifiqayjjlanfslkjck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...panjang...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDikc-ib78pth...
VAPID_PRIVATE_KEY=9cLdaYBny3cb...
```

**Di Vercel**, tambahkan **semua 4 variable** di:
**Vercel Dashboard → Project → Settings → Environment Variables**

---

## 🎯 23. Fitur Admin vs Non-Admin

| Fitur | Admin / Ezi (PIN ✅) | Non-Admin / Ratih |
|-------|---------------------|-------------------|
| Upload memory | ✅ (author: "Ezi") | ✅ (author: "Ratih") |
| Hapus memory | ✅ | ✅ |
| Tulis notebook | ✅ | ✅ |
| Hapus notebook | ✅ | ✅ |
| **Tambah love jar** | ✅ | ❌ **(admin only!)** |
| Hapus love jar | ✅ | ❌ |
| Tulis future letter | ✅ | ✅ |
| Hapus future letter | ✅ | ❌ |
| Pin di map | ✅ | ✅ |
| Hapus pin map | ✅ | ❌ |
| Tambah milestone | ✅ | ✅ |
| Hapus milestone | ✅ | ❌ |
| Bucket list (semua) | ✅ | ✅ |
| Tulis gratitude | ✅ | ✅ |
| Hapus gratitude | ✅ | ❌ |
| Rekam voice note | ✅ | ❌ |
| Dengar voice note | ✅ | ✅ |
| Theme toggle | ✅ | ✅ |

---

## 🚀 24. Deploy ke Vercel

1. Push ke GitHub (sudah di `https://github.com/Ferzirayhan/OurMemories.git`)
2. Buka https://vercel.com → **Import Project** → pilih repo `OurMemories`
3. Di **Environment Variables**, tambahkan 4 variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
4. Klik **Deploy**
5. Selesai! Live di: https://our-memories-beta.vercel.app/

### Auto Deploy
Setiap `git push` ke branch `main`, Vercel otomatis deploy ulang.

### Custom Domain (Opsional)
Di Vercel Dashboard → **Settings → Domains** → tambahkan domain custom.

---

## 📝 25. Checklist Sebelum Kasih ke Ratih

- [ ] Ganti `startDate` di TimeCapsule ke tanggal yang benar
- [ ] Upload lagu-lagu yang meaningful ke `public/audio/`
- [ ] Edit `MOCK_PLAYLIST` di `mock-data.ts`
- [ ] Isi tabel `mood_letters` di Supabase dengan surat personal
- [ ] Rekam voice notes untuk setiap mood (Happy/Neutral/Tired/Sad)
- [ ] Upload foto-foto kenangan lewat UI app
- [ ] Tulis beberapa love notes di Love Jar
- [ ] Tulis gratitude notes di Gratitude Wall
- [ ] Tambah milestone pertama lewat UI app
- [ ] Pin tempat-tempat kenangan di peta
- [ ] Tulis beberapa future letters dengan tanggal unlock
- [ ] Ganti `public/logo.png` dan `public/icon.png`
- [ ] Test push notification di HP
- [ ] Deploy ke Vercel + set env variables
- [ ] Test di HP (iPhone/Android)
- [ ] Kirim link ke Ratih 💕

---

## ❓ FAQ

### Q: Gimana kalau mau ganti font?
**File:** `src/app/layout.tsx`. Import font baru dari `next/font/google` dan ganti variable-nya.

### Q: Gimana kalau mau tambah halaman baru?
Buat folder baru di `src/app/nama-halaman/page.tsx` dan tambahkan link di `Navigation.tsx`.

### Q: Gimana kalau mau ganti audio support yang diputar saat Sad/Tired?
Ganti file `public/audio/support.mp3` dengan file audio baru.

### Q: Gimana akses Supabase Dashboard?
Buka https://supabase.com/dashboard → login → pilih project **For-Ratih**.

### Q: Data bisa hilang nggak?
Data aman di Supabase cloud. Selama project Supabase aktif, data tetap aman.

### Q: Gimana reset PIN admin kalau lupa?
Edit `ADMIN_PIN` di `src/lib/admin-context.tsx`, lalu deploy ulang.

### Q: Push notif tidak muncul?
1. Pastikan sudah klik "Enable Notifications" di popup
2. Di **iOS**: harus Add to Home Screen dulu
3. Cek Settings browser → pastikan notifikasi diizinkan untuk site ini
4. Cek Vercel env variables sudah lengkap (4 variable)

### Q: Musik berhenti saat pindah halaman?
Tidak lagi! Audio sekarang persistent — tetap main meskipun pindah halaman.

### Q: Siapa yang dapat push notif?
Semua orang yang sudah enable notification akan dapat notif, baik Ezi maupun Ratih.

---

## 🛠 Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 16.1.6 | Framework React |
| React | 19.2.3 | UI Library |
| Supabase | - | Database + Storage + Realtime |
| Tailwind CSS | v4 | Styling |
| Framer Motion | 12.35 | Animasi |
| Leaflet | - | Peta interaktif |
| web-push | - | Push notifications |
| Lucide React | - | Icons |
| Vercel | - | Hosting & deployment |
