# JOIN Football Community (JOIN FC)

Aplikasi web komunitas sepak bola untuk mengelola event, jersey, galeri, berita, dan voting.

## Tech Stack

- **Next.js 16.2.3** (App Router + Turbopack)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Prisma 6.19.3** + **Neon PostgreSQL**
- **Vercel Blob** (image storage)
- **xlsx** (Excel export)

## Fitur Utama

- Event management dengan registrasi (pemain + kiper, auto waiting list berdasarkan kuota)
- Jersey launch dengan grid nomor 0-99, multi-image desain, dan harga per ukuran/tipe (basePrice + surcharge)
- Galeri aktivitas dengan rich text dan carousel (terbaru dulu)
- Berita multi-foto
- Voting/polling dengan gambar opsi
- Admin panel lengkap (7 menu) dengan status dropdown untuk registrasi event
- Internasionalisasi (Indonesia + English)
- Tema warna kustomisasi (Primary, Secondary, Accent)
- Deferred upload (preview sebelum upload) + UHD upscaling otomatis
- Format Rupiah otomatis pada input harga
- Export Excel untuk laporan event dan jersey
- Responsive design (mobile + desktop)

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Buka http://localhost:3000

- Admin: http://localhost:3000/manage-jfc
- Password default: `admjoinfc2020`

## Environment Variables

Buat file `.env`:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

## Build & Deploy

```bash
# Production build (auto prisma generate + next build)
npm run build

# Start production server
npx next start
```

Deploy ke **Vercel**: set `DATABASE_URL` dan `BLOB_READ_WRITE_TOKEN` di environment variables.

## Dokumentasi Lengkap

- [Panduan Pengguna](docs/USER_GUIDE.md)
- [Dokumentasi Teknis](docs/TECHNICAL.md)

---

*Terakhir diperbarui: April 2026*
