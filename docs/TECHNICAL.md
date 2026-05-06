# JOIN Football Community - Dokumentasi Teknis

## Daftar Isi
- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Setup & Running Lokal](#setup--running-lokal)
- [Database](#database)
- [Arsitektur SOLID](#arsitektur-solid)
- [API Routes](#api-routes)
- [Fitur Utama](#fitur-utama)
- [Environment Variables](#environment-variables)

---

## Arsitektur

Aplikasi ini menggunakan **Next.js 16 (App Router)** dengan arsitektur **SOLID** (Repository -> Service -> DI Container -> API Route). Database menggunakan **Neon PostgreSQL** via **Prisma ORM**. File upload menggunakan **Vercel Blob** storage.

```
Browser
  |
Next.js App Router (src/app/)
  |-- User Pages (/, /event/[id], /jersey/[slug], /highlight/[id], /vote/[id])
  |-- Admin Pages (/manage-jfc/dashboard/*)
  +-- API Routes (/api/*)
        |
    Service Layer (src/lib/services/)
        |
    Repository Layer (src/lib/repositories/)
        |
    Prisma ORM -> Neon PostgreSQL
        
    File Upload -> Vercel Blob Storage (@vercel/blob)
```

## Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 16.2.3 | Framework React fullstack (App Router + Turbopack) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 6.19.3 | ORM database |
| Neon PostgreSQL | - | Database cloud |
| @vercel/blob | 2.3.3 | Cloud file/image storage |
| bcryptjs | 3.0.3 | Password hashing |
| date-fns | 4.x | Formatting tanggal |
| xlsx | 0.18.x | Export Excel |
| uuid | 13.x | Generate unique filenames |

## Struktur Folder

```
joinfc/
|-- prisma/
|   +-- schema.prisma              # Database schema
|-- src/
|   |-- app/
|   |   |-- globals.css            # Global CSS + admin theme + caret-color
|   |   |-- layout.tsx             # Root layout (I18nProvider)
|   |   |-- page.tsx               # Homepage (user-facing)
|   |   |-- event/[id]/page.tsx    # Detail event & registrasi
|   |   |-- highlight/[id]/page.tsx # Detail galeri (judul, gambar, deskripsi)
|   |   |-- jersey/[slug]/page.tsx # Detail jersey & order
|   |   |-- vote/[id]/page.tsx     # Detail voting & cast vote
|   |   |-- manage-jfc/
|   |   |   |-- page.tsx           # Admin login
|   |   |   |-- layout.tsx         # Auth check wrapper
|   |   |   +-- dashboard/
|   |   |       |-- layout.tsx     # Sidebar (7 menu) + AdminThemeProvider
|   |   |       |-- page.tsx       # Dashboard overview
|   |   |       |-- settings/      # Pengaturan website
|   |   |       |-- password/      # Ubah password admin (halaman terpisah)
|   |   |       |-- highlights/    # Galeri aktivitas (CRUD + rich text)
|   |   |       |-- news/          # Berita (CRUD + multi-image)
|   |   |       |-- events/        # Events (CRUD + registrasi + report)
|   |   |       |-- jerseys/       # Jersey launch (CRUD + registrasi + report)
|   |   |       +-- votes/         # Voting system (CRUD)
|   |   +-- api/                   # REST API routes
|   |       |-- auth/              # Login/logout
|   |       |-- settings/          # Site settings + password
|   |       |-- highlights/        # Galeri CRUD
|   |       |-- news/              # News CRUD
|   |       |-- events/            # Events + registrasi
|   |       |-- events/registrations/ # Admin kelola registrasi
|   |       |-- jerseys/           # Jerseys + registrasi
|   |       |-- votes/             # Voting CRUD + cast vote
|   |       |-- reports/           # Excel export
|   |       +-- upload/            # File upload (Vercel Blob)
|   |-- components/
|   |   +-- ConfirmModal.tsx       # Custom confirm/alert popup
|   +-- lib/
|       |-- admin-theme.tsx        # Admin theme context (CSS variables)
|       |-- container.ts           # DI container
|       |-- prisma.ts              # Prisma client singleton
|       |-- auth.ts                # Admin session validation
|       |-- api-utils.ts           # Response helpers
|       |-- i18n/
|       |   |-- index.tsx          # I18nProvider, useI18n, LanguageToggle
|       |   +-- translations.ts   # ID/EN translation dictionary (~350+ keys)
|       |-- interfaces/
|       |   |-- repository.interfaces.ts
|       |   +-- service.interfaces.ts
|       |-- repositories/
|       |   |-- event.repository.ts
|       |   |-- highlight.repository.ts
|       |   |-- jersey.repository.ts
|       |   |-- news.repository.ts
|       |   |-- vote.repository.ts
|       |   |-- schedule.repository.ts
|       |   +-- settings.repository.ts
|       +-- services/
|           |-- event.service.ts
|           |-- highlight.service.ts
|           |-- jersey.service.ts
|           |-- news.service.ts
|           |-- report.service.ts
|           |-- vote.service.ts
|           |-- schedule.service.ts
|           +-- settings.service.ts
|-- .env                           # Environment variables
|-- package.json                   # Build: "prisma generate && next build"
+-- tsconfig.json
```

## Setup & Running Lokal

### Prasyarat
- **Node.js** v18+
- **npm** (bundled dengan Node.js)
- Akses internet (koneksi ke database Neon + Vercel Blob)

### Langkah Instalasi

```bash
# 1. Buka folder project
cd d:\Project\joinfc

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. (Opsional) Deploy migrasi database
npx prisma migrate deploy
```

### Environment Variables

Buat file `.env` di root project:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### Menjalankan Lokal

```bash
npm run dev
```

Server berjalan di **http://localhost:3000**

- Homepage: http://localhost:3000
- Admin login: http://localhost:3000/manage-jfc
- Password admin default: `admjoinfc2020`

### Build & Deploy

```bash
# Build production (otomatis prisma generate + next build)
npm run build

# Jalankan production server
npx next start
```

**Deploy ke Vercel**: Set `DATABASE_URL` dan `BLOB_READ_WRITE_TOKEN` di Vercel environment variables. Build command otomatis dari package.json.

## Database

### Schema (Model Utama)

| Model | Tabel | Deskripsi |
|-------|-------|-----------|
| `SiteSettings` | site_settings | Pengaturan website (nama, warna, logo, social media, hero, admin password) |
| `Highlight` | highlights | Gambar galeri aktivitas (judul, deskripsi rich text, gambar) |
| `News` | news | Berita & artikel (judul, konten, **multi-image: imageUrls String[]**) |
| `CalendarSchedule` | calendar_schedules | Jadwal kalender (legacy, tidak digunakan admin) |
| `Event` | events | Open event / main bareng |
| `EventRegistration` | event_registrations | Pendaftaran peserta event (player/goalkeeper) |
| `JerseyLaunch` | jersey_launches | Launch jersey baru (**multi-image: designUrls String[]**) |
| `JerseyRegistration` | jersey_registrations | Pemesanan jersey (pendaftar, nama jersey, nomor, ukuran, **tipe**) |
| `AdminSession` | admin_sessions | Session login admin (token + expiry) |
| `Vote` | votes | Voting / polling (judul, status open/closed) |
| `VoteOption` | vote_options | Pilihan dalam voting (nama, gambar opsional) |
| `VoteResponse` | vote_responses | Respons/suara user pada voting |

### Field Penting

**SiteSettings:**
- `primaryColor`, `secondaryColor`, `accentColor` - Warna tema (berlaku di user & admin)
- `instagramUrl`, `whatsappUrl` - Link sosial media
- `heroType` ("gradient" | "image") - Tipe background header
- `heroImageUrl` - URL gambar header (jika heroType = "image")
- `adminPassword` - Password login admin (default: "admjoinfc2020", bisa diubah via admin)

**News:**
- `imageUrls String[]` - Array URL gambar (mendukung multi-foto per berita)

**Event:**
- `maxPlayers` - Kuota maksimal pemain
- `maxGoalkeepers` - Kuota maksimal kiper (default: 3)
- `locationUrl` - Link Google Maps lokasi

**EventRegistration:**
- `position` ("player" | "goalkeeper") - Posisi pendaftar
- `status` ("confirmed" | "registered" | "waiting") - Status registrasi
- `phone` - Opsional (tidak wajib diisi saat registrasi)

**JerseyLaunch:**
- `designUrls String[]` - Array URL gambar desain jersey (multi-image)
- `basePrice` - Harga dasar jersey
- `sizeSurcharges` - JSON string berisi array surcharge rules:
  - Base rules: `{ target: "base", size, itemType, surcharge }` - tambahan harga per ukuran/tipe
  - Shirt rules: `{ target: "shirt", shirtSize, surcharge, itemType: "set" }` - tambahan harga ukuran baju khusus

**JerseyRegistration:**
- `registrantName` - Nama lengkap pemesan
- `name` - Nama yang dicetak di jersey
- `number` - Nomor jersey (0-99, unique per launch)
- `size` - Ukuran utama (S/M/L/XL/XXL/3XL/4XL/5XL/6XL)
- `shirtSize` - Ukuran baju khusus (opsional, default: "")
- `jerseyType` - Tipe jersey ("player" | "goalkeeper", default: "player")
- `itemType` - Tipe item ("set" | "shirt" | "shorts", default: "set")
- `totalPrice` - Harga total (basePrice + base surcharge + shirt surcharge)

**Vote:**
- `status` ("open" | "closed") - Admin bisa toggle

**VoteOption:**
- `name` - Nama pilihan
- `imageUrl` - Gambar opsional
- `sortOrder` - Urutan tampil

### Migrasi

```bash
npx prisma migrate status    # Cek status migrasi
npx prisma migrate deploy    # Deploy migrasi (production)
npx prisma migrate dev       # Buat migrasi baru (development)
npx prisma db push           # Push schema tanpa migrasi file
```

## Arsitektur SOLID

### Repository Pattern
Setiap model database memiliki repository di `src/lib/repositories/`. Repository hanya berkomunikasi dengan database via Prisma.

### Service Pattern
Layer bisnis logika di `src/lib/services/`. Service memanggil repository dan berisi validasi/logika bisnis.

### DI Container
`src/lib/container.ts` mengelola instansiasi semua repository dan service. API routes mengimpor service dari container.

```typescript
// Contoh penggunaan di API route:
import { eventService } from "@/lib/container";
const events = await eventService.findAll();
```

## API Routes

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth` | Login admin |
| DELETE | `/api/auth` | Logout admin |
| GET | `/api/settings` | Ambil pengaturan site |
| PUT | `/api/settings` | Update pengaturan |
| PUT | `/api/settings/password` | Ubah password admin |
| GET/POST | `/api/highlights` | List/create galeri |
| PUT/DELETE | `/api/highlights/[id]` | Update/hapus galeri |
| GET/POST | `/api/news` | List/create berita |
| PUT/DELETE | `/api/news/[id]` | Update/hapus berita |
| GET/POST | `/api/events` | List/create event |
| GET/PUT/DELETE | `/api/events/[id]` | Detail/update/hapus event |
| POST | `/api/events/[id]/register` | Daftar event |
| PATCH/DELETE | `/api/events/registrations/[regId]` | Admin kelola registrasi |
| GET/POST | `/api/jerseys` | List/create jersey |
| PUT/DELETE | `/api/jerseys/[id]` | Update/hapus jersey |
| GET | `/api/jerseys/slug/[slug]` | Detail jersey by slug |
| POST | `/api/jerseys/[id]/register` | Pesan jersey |
| GET/POST | `/api/votes` | List/create voting |
| GET/PUT/DELETE | `/api/votes/[id]` | Detail/update/hapus voting |
| POST | `/api/votes/[id]/vote` | Cast vote |
| GET | `/api/reports?type=...` | Download Excel report |
| POST | `/api/upload` | Upload file ke Vercel Blob |

## Fitur Utama

### 1. Internasionalisasi (i18n)
- Bahasa Indonesia (default) dan English
- Toggle bahasa di pojok kanan atas (user) dan sidebar (admin)
- Stored di localStorage key `jfc_lang`
- ~350+ translation keys di `src/lib/i18n/translations.ts`
- **Halaman publik**: semua teks menggunakan `t()` (tidak ada hardcoded string)
- **Halaman admin**: Semua halaman (Dashboard, Settings, Password, Events, Jersey, Highlights, News, Votes, Reports, Login) menggunakan `t()` untuk semua label, judul, tombol, placeholder, hint, tabel header, modal teks, dan pesan error/sukses
- **Konsistensi**: Saat switching bahasa, seluruh UI berubah — termasuk tabel header, confirm dialog, rekomendasi dimensi upload, status badge, dan empty state messages

### 2. Sistem Tema Warna
- 3 warna tema: Primary, Secondary, Accent
- Dikonfigurasi di admin settings
- Berlaku di halaman user DAN admin
- Admin: CSS custom properties (`--admin-primary`, dll)
- User: inline styles dari API settings
- Tombol "Kembali ke Beranda" di semua halaman detail menggunakan `backgroundColor: primary`
- Tanggal event di homepage menggunakan warna `accent` (agar terlihat di background gelap)

### 3. Deferred Upload
- Semua admin pages menggunakan pola deferred upload
- File dipilih -> disimpan di React state sebagai `File` object -> preview via `URL.createObjectURL()`
- Preview ditampilkan dengan border kuning putus-putus (`border-dashed border-yellow-500`)
- File baru diupload ke Vercel Blob saat form di-submit
- Mendukung hapus individual sebelum submit
- Halaman yang menggunakan: Settings (logo + hero), Galeri, Berita (multi), Jersey (multi), Votes (per opsi)

### 4. Event & Registrasi
- Registrasi berbasis posisi (Pemain/Kiper)
- Kuota terpisah per posisi (maxPlayers + maxGoalkeepers)
- **Auto waiting list**: saat registrasi, backend menghitung jumlah registered+confirmed untuk posisi tersebut. Jika >= kuota, status otomatis `"waiting"`, jika tidak `"registered"`
- Status bisa diubah admin via dropdown: **Waiting** ↔ **Registered** ↔ **Confirmed**
- Admin bisa pindah posisi (Kiper ↔ Pemain), hapus registrasi
- Waiting list ditampilkan terpisah per posisi (kiper dan pemain) di halaman publik
- Phone opsional, field wajib ditandai asterisk merah (*)
- Link lokasi Google Maps
- `countByEventIdAndPosition()` menghitung registrasi dengan status `IN ["registered", "confirmed"]` (waiting tidak dihitung)

### 5. Jersey Launch
- Grid nomor 0-99 dengan tooltip nama pemilik
- Field "Nama Pendaftar" terpisah dari "Nama Jersey" (tercetak)
- **Nama jersey otomatis uppercase** saat diketik di halaman publik
- Ukuran: S/M/L/XL/XXL/3XL/4XL/5XL/6XL
- Tipe jersey: Pemain atau Kiper (`jerseyType`)
- Tipe item: 1 Stel / Baju Saja / Celana Saja (`itemType`)
- **Ukuran Baju Khusus** (`shirtSize`): Opsional. Muncul jika admin sudah set surcharge ukuran baju khusus. User bisa pilih ukuran baju berbeda dari ukuran utama
- **Harga dual-layer**:
  - Layer 1 (Base): `basePrice` + surcharge dari `target: "base"` rules (match size+itemType)
  - Layer 2 (Shirt): surcharge dari `target: "shirt"` rules (match shirtSize)
  - Total = basePrice + base surcharge + shirt surcharge
- **Admin form**: 2 section surcharge terpisah — "Tambahan Harga Ukuran 1 Stel" dan "Tambahan Khusus Ukuran Baju"
- Multi-image upload desain (`designUrls String[]`)
- **Carousel auto-slide** setiap 3 detik (pause saat lightbox buka)
- **Indikator slide** (dots + counter X/N) + hint "Klik untuk lihat penuh" saat hover
- **Lightbox fullscreen** dengan navigasi keyboard (Escape, Arrow Left/Right)
- Input harga di admin menggunakan format Rupiah otomatis (Rp + pemisah ribuan) via `formatNumber()`/`parseNumber()`
- Harga di halaman publik dihitung otomatis berdasarkan pilihan ukuran dan tipe item

### 6. Berita Multi-Foto
- Berita mendukung multiple gambar (`imageUrls String[]`)
- Bisa hapus foto individual
- Homepage menampilkan foto pertama dari array
- Admin list: thumbnail max 2 foto + badge "+N"

### 7. Hero Background
- Pilihan gradient warna atau gambar upload
- Dikonfigurasi di admin settings

### 8. Sosial Media
- Instagram & WhatsApp link
- Ditampilkan di hero homepage dan footer

### 9. Export Excel
- Download report event per-event atau semua event
- Download report jersey per-jersey
- Report terintegrasi di halaman Events dan Jersey admin (bukan menu terpisah)

### 10. Kalender Event (Homepage)
- Kalender visual mini di homepage (sidebar kiri)
- Data diambil dari tabel Event
- Tanggal event ditandai warna primary, waktu ditampilkan warna accent
- Hover/tap menunjukkan detail event
- Navigasi bulan (prev/next)

### 11. Custom Popup Modal
- Semua konfirmasi hapus menggunakan custom modal (bukan browser `confirm()`)
- Komponen: `src/components/ConfirmModal.tsx`
- Support mode "confirm" dan "alert"
- Prop `open` (bukan `isOpen`)

### 12. Voting System
- Admin: create multiple voting, setiap opsi bisa punya gambar
- Upload gambar opsi: deferred (per-option `pendingFile`)
- User: klik opsi untuk vote, hasil ditampilkan real-time
- 1 vote per user per polling (localStorage)

### 13. Homepage Layout
- Layout 2 kolom setelah hero (1/3 + 2/3)
- Sidebar kiri: kalender mini sticky + daftar event
- Konten kanan: galeri carousel, berita, events, jersey, voting

### 14. Galeri Carousel & Detail Page
- Carousel horizontal di homepage (custom scrollbar)
- **Urutan: terbaru dulu** (`createdAt: "desc"` di `findActive()`), admin list tetap `sortOrder: "asc"`
- Klik -> halaman detail (`/highlight/[id]`) dengan rich text deskripsi
- Admin: rich text editor (bold, italic, list, heading)
- Admin: multi-file upload — saat tambah baru, setiap file menjadi 1 highlight terpisah

### 15. Caret-Color
- `caret-color: transparent` di body (mencegah cursor text muncul saat klik teks biasa)
- `caret-color: auto !important` untuk input, textarea, select, contenteditable (cursor tetap muncul saat mengetik)

### 16. Password Admin
- Halaman terpisah (`/manage-jfc/dashboard/password`)
- Diakses via link di halaman Pengaturan
- Validasi: minimal 6 karakter, konfirmasi password harus cocok

### 17. Upload Validation
- Tipe file: hanya image (jpg, png, gif, webp, svg)
- Maks ukuran: 20 MB
- Filename: UUID + sanitized extension
- Storage: Vercel Blob (bukan local filesystem)
- **UHD Upscaling**: gambar di bawah 3840×2160 otomatis di-upscale via canvas sebelum upload. Output WebP (atau PNG untuk input PNG) quality 0.92
- Upload menggunakan `fetch` dengan `credentials: "include"` untuk mengirim cookie auth
- Fallback auth: jika `validateAdminSession()` gagal, API upload membaca cookie `jfc_admin_token` langsung dari request

### 18. Rekomendasi Dimensi Upload
- Logo: 200x200 px (1:1, PNG transparan)
- Hero: 1920x600 px (16:5, landscape)
- Highlights: 800x600 px (4:3)
- News: 800x450 px (16:9)
- Jersey: 800x800 px (1:1, multiple)
- Vote options: 800x800 px (1:1)

## Environment Variables

| Variable | Deskripsi | Wajib |
|----------|-----------|-------|
| `DATABASE_URL` | Connection string Neon PostgreSQL | Ya |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob storage (upload gambar) | Ya |

> `DATABASE_URL` dibaca dari `.env` saat development. Saat deploy (Vercel), set di environment variables platform.

> `BLOB_READ_WRITE_TOKEN` didapat dari Vercel Blob dashboard. Tanpa token ini, upload gambar tidak berfungsi.

> Password admin disimpan di database (`site_settings.adminPassword`). Default: `admjoinfc2020`. Bisa diubah di admin panel.

---

*Terakhir diperbarui: April 2026*
