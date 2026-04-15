# JOIN Football Community — Panduan Pengguna

## Daftar Isi
- [Untuk Pengunjung (User)](#untuk-pengunjung-user)
- [Untuk Admin](#untuk-admin)
- [Cara Running Lokal](#cara-running-lokal)

---

## Untuk Pengunjung (User)

### Halaman Utama
Buka **http://localhost:3000** (lokal) atau URL production untuk melihat halaman utama JOIN FC.

Di halaman utama terdapat:
- **Header/Hero** — Logo, nama komunitas, deskripsi, dan link sosial media
- **Galeri Aktivitas** — Foto-foto kegiatan komunitas
- **Berita & Aktivitas** — Informasi terbaru dari komunitas
- **Kalender Event** — Kalender visual yang menampilkan tanggal-tanggal event
- **Open Events** — Event yang bisa didaftari (main bareng)
- **Jersey Launch** — Pre-order jersey komunitas
- **Footer** — Link sosial media dan copyright

### Ganti Bahasa
Klik tombol bahasa di pojok kanan atas (dengan ikon bendera SVG):
- 🇮🇩 **ID** = Bahasa Indonesia (default)
- 🇬🇧 **EN** = English

### Mendaftar Event
1. Di halaman utama, klik **"Daftar Sekarang"** pada event yang diinginkan
2. Isi form:
   - **Nama Lengkap**
   - **Nomor Telepon** 
   - **Posisi** — Pilih Pemain ⚽ atau Kiper 🧤
3. Klik **"Daftar Sekarang"**
4. Jika kuota posisi masih tersedia → **Confirmed** ✅
5. Jika kuota penuh → Masuk **Waiting List** ⏳

### Pesan Jersey
1. Di halaman utama, klik **"Pesan Jersey"** pada jersey yang diinginkan
2. Pilih nomor jersey (1-99) dari grid angka
   - Hijau = Tersedia
   - Merah = Sudah diambil (hover untuk lihat nama pemilik)
3. Isi form:
   - **Nama Pendaftar** (nama lengkap pemesan)
   - **Nama Jersey** (yang akan dicetak di jersey)
   - **Nomor Telepon**
   - **Ukuran** (S/M/L/XL/XXL)
4. Klik **"Pesan Jersey #(nomor)"**

---

## Untuk Admin

### Login Admin
1. Buka **http://localhost:3000/manage-jfc**
2. Masukkan password admin
3. Klik **"Masuk"**

### Dashboard
Setelah login, Anda akan melihat dashboard dengan ringkasan:
- Jumlah open events
- Jumlah jersey launches
- Jumlah foto galeri

### Menu Admin

#### ⚙️ Pengaturan
Mengatur konfigurasi website:
- **Informasi Umum** — Nama situs, deskripsi, logo
- **Sosial Media** — Link Instagram dan WhatsApp
- **Background Header** — Pilih gradient warna atau gambar upload
- **Warna Tema** — Primary, Secondary, Accent (berlaku di semua halaman termasuk admin)

> **Ubah Password:** Klik link **"🔒 Ubah Password Admin →"** di bawah form pengaturan, akan diarahkan ke halaman khusus ubah password.

> **Penting:** Password admin disimpan di tabel `site_settings` kolom `adminPassword`. Default: `admjoinfc2020`. Untuk mengubah langsung di database, update kolom `admin_password` pada baris `id = 'default'`.

#### 📷 Galeri
Mengelola foto-foto aktivitas komunitas:
- Klik **"Tambah Foto Aktivitas"** untuk menambah
- Isi keterangan dan upload foto
- Klik **"✕ Hapus Foto"** untuk menghapus foto yang dipilih sebelum submit
- Hover foto untuk edit/hapus
- Konfirmasi hapus menggunakan popup modal (bukan alert browser)

#### 📰 Berita
Mengelola berita dan artikel:
- Klik **"Tambah Berita"** untuk menambah
- Isi judul, isi berita, dan gambar (opsional)
- Artikel akan ditampilkan di halaman utama

#### ⚽ Events
Mengelola open events (main bareng):
- **Buat Event Baru** — Isi judul, lokasi, link Google Maps, tanggal, rekening, maks pemain, maks kiper
- **Lihat Peserta** — Klik "Lihat" pada event untuk melihat daftar pendaftar (nama, telepon, posisi, status)
- **Download Report** — Klik "📥 Report" pada setiap event untuk download Excel, atau klik "📥 Download Semua Event" di atas untuk semua event
- **Toggle Open/Close** — Buka/tutup pendaftaran event
- **Edit/Hapus** — Ubah atau hapus event

#### 👕 Jersey
Mengelola jersey launch:
- **Launch Jersey Baru** — Isi nama dan upload desain
- **Lihat Peserta** — Klik "Lihat" untuk melihat daftar pemesanan (pendaftar, nama jersey, telepon, nomor, ukuran, tipe)
- **Download Report** — Klik "📥 Report" pada setiap jersey untuk download Excel
- **Toggle Open/Close** — Buka/tutup pemesanan
- **Link Share** — Salin link `/jersey/[slug]` untuk dibagikan

> **Catatan:** Menu Reports tidak lagi terpisah di sidebar. Fitur download report sudah terintegrasi langsung di halaman Events dan Jersey masing-masing.

### Logout
Klik tombol **"Logout"** di bagian bawah sidebar.

---

## Cara Running Lokal

### Prasyarat
- **Node.js** versi 18 atau lebih baru — [Download](https://nodejs.org/)
- Koneksi internet (untuk akses database Neon)

### Langkah-langkah

#### 1. Buka Terminal
Buka PowerShell atau Command Prompt, masuk ke folder project:
```bash
cd d:\Project\joinfc
```

#### 2. Install Dependencies (pertama kali atau setelah update)
```bash
npm install
```

#### 3. Generate Prisma Client (pertama kali atau setelah perubahan schema)
```bash
npx prisma generate
```

#### 4. Jalankan Server Development
```bash
npm run dev
```
Tunggu sampai muncul pesan:
```
✓ Ready in X.Xs
○ Local:    http://localhost:3000
```

#### 5. Buka di Browser
- **User**: http://localhost:3000
- **Admin**: http://localhost:3000/manage-jfc

### Menghentikan Server

#### Cara 1: Keyboard Shortcut
Di terminal yang sedang menjalankan server, tekan:
```
Ctrl + C
```

#### Cara 2: Kill Process (jika terminal sudah tertutup)

**Windows PowerShell:**
```powershell
# Cari proses node.js
Get-Process -Name node

# Kill semua proses node
Get-Process -Name node | Stop-Process -Force
```

**Atau kill berdasarkan port:**
```powershell
# Cari PID di port 3000
netstat -ano | findstr :3000

# Kill process berdasarkan PID
taskkill /PID <masukkan_PID> /F
```

### Build untuk Production

```bash
# Build
npx next build

# Jalankan production server
npx next start
```

---

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Port 3000 already in use` | Kill proses yang menggunakan port 3000 (lihat cara di atas) |
| `Cannot find module '@prisma/client'` | Jalankan `npx prisma generate` |
| `Database connection error` | Periksa `DATABASE_URL` di file `.env` dan koneksi internet |
| `ENOENT: no such file or directory 'uploads'` | Buat folder `public/uploads/` secara manual |
| Halaman admin kosong setelah login | Cek console browser untuk error, pastikan API berjalan |

---

*Terakhir diperbarui: 15 April 2026*
