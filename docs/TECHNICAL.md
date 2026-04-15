# JOIN Football Community — Dokumentasi Teknis

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

Aplikasi ini menggunakan **Next.js 16 (App Router)** dengan arsitektur **SOLID** (Repository → Service → DI Container → API Route). Database menggunakan **Neon PostgreSQL** via **Prisma ORM**.

```
Browser
  ↓
Next.js App Router (src/app/)
  ├── User Pages (/, /event/[id], /jersey/[slug], /highlight/[id], /vote/[id])
  ├── Admin Pages (/manage-jfc/dashboard/*)
  └── API Routes (/api/*)
        ↓
    Service Layer (src/lib/services/)
        ↓
    Repository Layer (src/lib/repositories/)
        ↓
    Prisma ORM → Neon PostgreSQL
```

## Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 16.2.3 | Framework React fullstack |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 6.19.3 | ORM database |
| Neon PostgreSQL | - | Database cloud |
| date-fns | 4.x | Formatting tanggal |
| xlsx | 0.18.x | Export Excel |

## Struktur Folder

```
joinfc/
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
│   └── uploads/                   # File uploads (images)
├── src/
│   ├── app/
│   │   ├── globals.css            # Global CSS + admin theme utilities
│   │   ├── layout.tsx             # Root layout (I18nProvider)
│   │   ├── page.tsx               # Homepage (user-facing)
│   │   ├── event/[id]/page.tsx    # Detail event & registrasi
│   │   ├── highlight/[id]/page.tsx # Detail galeri (judul, gambar, deskripsi)
│   │   ├── jersey/[slug]/page.tsx # Detail jersey & order
│   │   ├── manage-jfc/
│   │   │   ├── page.tsx           # Admin login
│   │   │   ├── layout.tsx         # Auth check wrapper
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx     # Sidebar + AdminThemeProvider + I18nProvider
│   │   │       ├── page.tsx       # Dashboard overview
│   │   │       ├── settings/      # Pengaturan website (link ke ubah password)
│   │   │       ├── password/      # Ubah password admin (halaman terpisah)
│   │   │       ├── highlights/    # Galeri aktivitas (CRUD + rich text)
│   │   │       ├── news/          # Berita & aktivitas (CRUD)
│   │   │       ├── events/        # Open events (CRUD + registrasi + download report)
│   │   │       ├── jerseys/       # Jersey launch (CRUD + registrasi + download report)
│   │   │       └── votes/         # Voting system (CRUD)
│   │   └── api/                   # REST API routes
│   │       ├── auth/              # Login/logout
│   │       ├── settings/          # Site settings
│   │       ├── settings/password/ # Ubah password admin
│   │       ├── highlights/        # Galeri CRUD
│   │       ├── news/              # News CRUD
│   │       ├── calendar/          # Calendar CRUD (legacy)
│   │       ├── events/            # Events + registrasi
│   │       ├── events/registrations/ # Admin kelola registrasi (PATCH/DELETE)
│   │       ├── jerseys/           # Jerseys + registrasi
│   │       ├── votes/             # Voting CRUD + cast vote
│   │       ├── reports/           # Excel export
│   │       └── upload/            # File upload handler
│   ├── components/
│   │   └── ConfirmModal.tsx       # Custom confirm/alert popup
│   └── lib/
│       ├── admin-theme.tsx        # Admin theme context (CSS variables)
│       ├── container.ts           # DI container
│       ├── prisma.ts              # Prisma client singleton
│       ├── i18n/
│       │   ├── index.tsx          # I18nProvider, useI18n, LanguageToggle
│       │   └── translations.ts   # ID/EN translation dictionary
│       ├── interfaces/
│       │   ├── repository.interfaces.ts
│       │   └── service.interfaces.ts
│       ├── repositories/
│       │   ├── event.repository.ts
│       │   ├── highlight.repository.ts
│       │   ├── jersey.repository.ts
│       │   ├── news.repository.ts
│       │   ├── vote.repository.ts
│       │   ├── schedule.repository.ts
│       │   └── settings.repository.ts
│       └── services/
│           ├── event.service.ts
│           ├── highlight.service.ts
│           ├── jersey.service.ts
│           ├── news.service.ts
│           ├── report.service.ts
│           ├── vote.service.ts
│           ├── schedule.service.ts
│           └── settings.service.ts
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

## Setup & Running Lokal

### Prasyarat
- **Node.js** v18+ 
- **npm** (bundled dengan Node.js)
- Akses internet (koneksi ke database Neon)

### Langkah Instalasi

```bash
# 1. Clone / buka folder project
cd d:\Project\joinfc

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. (Opsional) Jalankan migrasi database
npx prisma migrate deploy
```

### Menjalankan Lokal (Development)

```bash
# Start development server
npm run dev
```

Server akan berjalan di **http://localhost:3000**

- Homepage: http://localhost:3000
- Admin login: http://localhost:3000/manage-jfc
- Password admin default: `admjoinfc2020` (disimpan di tabel `site_settings.adminPassword`, bisa diubah via admin panel)

### Menghentikan Server Lokal

```bash
# Di terminal yang sedang running, tekan:
Ctrl + C

# Jika terminal sudah ditutup, cari proses dan kill:
# Windows PowerShell:
Get-Process -Name node | Stop-Process -Force

# Atau kill port tertentu:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Build Production

```bash
# Build untuk production
npx next build

# Jalankan production server
npx next start
```

## Database

### Schema (Model Utama)

| Model | Deskripsi |
|-------|-----------|
| `SiteSettings` | Pengaturan website (nama, warna, logo, social media, hero, admin password) |
| `Highlight` | Gambar galeri aktivitas |
| `News` | Berita & artikel |
| `CalendarSchedule` | Jadwal main / kalender (legacy, tidak digunakan admin) |
| `Event` | Open event (main bareng) — data ini juga tampil di kalender homepage |
| `EventRegistration` | Pendaftaran peserta event (player/goalkeeper) |
| `JerseyLaunch` | Launch jersey baru (multi-image: `designUrls String[]`) |
| `JerseyRegistration` | Pemesanan jersey (nama pendaftar, nama jersey, nomor, ukuran) |
| `Vote` | Voting / polling (judul, status open/closed) |
| `VoteOption` | Pilihan dalam voting (nama, gambar opsional, sortOrder) |
| `VoteResponse` | Respons/suara dari user pada voting |

### Field Penting

**SiteSettings:**
- `primaryColor`, `secondaryColor`, `accentColor` — Warna tema (berlaku di user & admin)
- `instagramUrl`, `whatsappUrl` — Link sosial media
- `heroType` ("gradient" | "image") — Tipe background header
- `heroImageUrl` — URL gambar header (jika heroType = "image")
- `adminPassword` — Password login admin (default: "admjoinfc2020", bisa diubah di Settings)

**Event:**
- `maxPlayers` — Kuota maksimal pemain
- `maxGoalkeepers` — Kuota maksimal kiper  
- `locationUrl` — Link Google Maps lokasi

**EventRegistration:**
- `position` ("player" | "goalkeeper") — Posisi pendaftar
- `status` ("registered" | "confirmed") — Default "registered", admin konfirmasi manual via admin panel
- `phone` — Opsional (tidak wajib diisi saat registrasi)

**Vote:**
- `title` — Judul voting
- `status` ("open" | "closed") — Admin bisa toggle open/close
- `options` — Relasi ke VoteOption (nama + gambar opsional)

**VoteOption:**
- `name` — Nama pilihan
- `imageUrl` — Gambar opsional (untuk visual voting seperti desain jersey)
- `sortOrder` — Urutan tampil

### Migrasi

```bash
# Melihat status migrasi
npx prisma migrate status

# Deploy migrasi (production)
npx prisma migrate deploy

# Buat migrasi baru (development)
npx prisma migrate dev --name nama_migrasi

# Reset database (HATI-HATI: hapus semua data)
npx prisma migrate reset
```

## Arsitektur SOLID

### Repository Pattern
Setiap model database memiliki repository sendiri di `src/lib/repositories/`. Repository hanya berkomunikasi dengan database via Prisma.

### Service Pattern
Layer bisnis logika di `src/lib/services/`. Service memanggil repository dan berisi validasi/logika bisnis.

### DI Container
`src/lib/container.ts` mengelola instansiasi semua repository dan service. API routes mengimpor dari container.

```typescript
// Contoh penggunaan di API route:
import { container } from "@/lib/container";

const events = await container.eventService.findAll();
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
| GET/POST | `/api/calendar` | List/create jadwal |
| PUT/DELETE | `/api/calendar/[id]` | Update/hapus jadwal |
| GET/POST | `/api/events` | List/create event |
| GET/PUT/DELETE | `/api/events/[id]` | Detail/update/hapus event |
| POST | `/api/events/[id]/register` | Daftar event |
| GET/POST | `/api/jerseys` | List/create jersey |
| PUT/DELETE | `/api/jerseys/[id]` | Update/hapus jersey |
| GET | `/api/jerseys/slug/[slug]` | Detail jersey by slug |
| POST | `/api/jerseys/[id]/register` | Pesan jersey |
| GET | `/api/reports?type=...` | Download Excel report |
| PATCH/DELETE | `/api/events/registrations/[regId]` | Admin kelola registrasi (status/posisi/hapus) |
| GET/POST | `/api/votes` | List/create voting |
| GET/PUT/DELETE | `/api/votes/[id]` | Detail/update/hapus voting |
| POST | `/api/votes/[id]/vote` | Cast vote (pilih opsi) |
| POST | `/api/upload` | Upload file/gambar |

## Fitur Utama

### 1. Internasionalisasi (i18n)
- Bahasa Indonesia (default) dan English
- Toggle bahasa di pojok kanan atas halaman user
- Toggle bahasa juga tersedia di sidebar admin panel
- Stored di localStorage key `jfc_lang`
- ~230+ translation keys di `src/lib/i18n/translations.ts`
- Admin panel: navigasi sidebar, label, dan teks menggunakan i18n

### 2. Sistem Tema Warna
- 3 warna tema: Primary, Secondary, Accent
- Dikonfigurasi di admin settings
- Berlaku di halaman user DAN admin
- Admin menggunakan CSS custom properties (`--admin-primary`, `--admin-secondary`, `--admin-accent`)
- User halaman menggunakan inline styles dari API settings

### 3. Event & Registrasi
- Registrasi berbasis posisi (Pemain/Kiper)
- Kuota terpisah per posisi
- Status default "registered", admin konfirmasi manual (Confirm/Unconfirm)
- Admin bisa pindah posisi (Kiper ↔ Pemain) dan hapus registrasi
- Daftar kiper ditampilkan di atas daftar pemain
- Phone opsional saat registrasi, field wajib ditandai asterisk merah (*)
- Link lokasi Google Maps

### 4. Jersey Launch
- Grid nomor 1-99 dengan tooltip nama pemilik
- Hover di nomor yang sudah diambil menunjukkan nama pendaftar
- Field "Nama Pendaftar" (pemesan) terpisah dari "Nama Jersey" (tercetak di jersey)
- Pemilihan ukuran (S/M/L/XL/XXL)
- Multi-image upload untuk desain jersey (`designUrls String[]`)
- Laporan Excel: kolom Pendaftar + Nama Jersey (tanpa phone)

### 5. Hero Background
- Pilihan gradient warna atau gambar upload
- Dikonfigurasi di admin settings

### 6. Sosial Media
- Instagram & WhatsApp link
- Ditampilkan di hero homepage dan footer
- Dikonfigurasi di admin settings

### 7. Export Excel
- Download laporan event per-event atau semua event (tombol di halaman Events admin)
- Download laporan jersey per-jersey (tombol di halaman Jersey admin)
- Report terintegrasi langsung di masing-masing halaman admin (tidak ada menu Reports terpisah)

### 8. Kalender Event (Homepage)
- Menampilkan kalender visual mini di homepage
- Data diambil dari Event (bukan tabel terpisah)
- Tanggal yang ada event ditandai warna primary
- Hover menunjukkan detail event di tanggal tersebut
- Navigasi bulan (prev/next)

### 9. Custom Popup Modal
- Semua konfirmasi hapus menggunakan custom modal (bukan browser `confirm()`)
- Komponen reusable di `src/components/ConfirmModal.tsx`
- Support mode "confirm" dan "alert"

### 10. Flag Icons 
- Language toggle menampilkan SVG bendera Indonesia dan Inggris
- Terletak di pojok kanan atas halaman user dan di sidebar admin panel

### 11. Voting System
- Admin bisa membuat multiple voting/polling
- Setiap voting memiliki judul dan daftar pilihan (opsi)
- Setiap opsi bisa memiliki nama dan gambar opsional (cocok untuk vote desain jersey)
- Opsi bisa ditambah/kurang secara dinamis saat create/edit
- Admin bisa open/close voting, edit, atau hapus
- Admin panel menampilkan hasil voting dengan progress bar dan persentase
- Homepage menampilkan voting yang open — user klik opsi untuk vote
- Setelah vote, hasil ditampilkan dengan progress bar dan persentase
- Upload gambar opsi menggunakan styled button (bukan browser default)

### 12. Homepage 2-Column Layout
- Setelah hero: layout 2 kolom (1/3 sidebar kiri + 2/3 konten kanan)
- Sidebar kiri: kalender mini sticky + daftar event mendatang
- Konten kanan: galeri (carousel horizontal), berita, events, jersey, voting

### 13. Upload Dimension Recommendations
- Semua area upload gambar menampilkan rekomendasi dimensi:
  - Logo: 200×200 px (1:1, PNG transparan)
  - Hero: 1920×600 px (16:5, landscape)
  - Highlights: 800×600 px (4:3)
  - News: 800×450 px (16:9)
  - Jersey: 800×800 px (1:1, multiple)
  - Vote options: 800×800 px (1:1)

### 14. Galeri Carousel & Detail Page
- Galeri highlights ditampilkan sebagai carousel horizontal (scroll)
- Klik gambar untuk melihat halaman detail (`/highlight/[id]`) dengan judul, gambar, dan deskripsi rich text
- Admin bisa menambahkan deskripsi berformat (bold, italic, list, heading) via rich text editor
- Custom scrollbar styling

### 15. Jersey Type
- Pendaftaran jersey mendukung tipe Pemain (⚽) dan Kiper (🧤)
- Selector button di halaman public jersey
- Kolom tipe ditampilkan di tabel admin

### 16. Password Admin
- Ubah password ada di halaman terpisah (`/manage-jfc/dashboard/password`)
- Diakses via link di halaman Pengaturan
- Validasi: minimal 6 karakter, konfirmasi password harus cocok

## Environment Variables

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | Connection string Neon PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Base URL aplikasi | `http://localhost:3000` |

> **Catatan:** `DATABASE_URL` otomatis dibaca dari `.env` saat development lokal. Saat deploy (Vercel, Railway, dll), set di environment variables platform tersebut.

> **Catatan:** Password admin sekarang disimpan di database (tabel `site_settings`, kolom `adminPassword`). Default: `admjoinfc2020`. Bisa diubah di halaman Settings admin panel.

---

*Terakhir diperbarui: April 2026*
