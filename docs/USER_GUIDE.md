# JOIN Football Community - Panduan Pengguna

## Daftar Isi
- [Untuk Pengunjung (User)](#untuk-pengunjung-user)
- [Untuk Admin](#untuk-admin)
- [Cara Running Lokal](#cara-running-lokal)

---

## Untuk Pengunjung (User)

### Halaman Utama
Buka **http://localhost:3000** (lokal) atau URL production untuk melihat halaman utama JOIN FC.

Di halaman utama terdapat:
- **Header/Hero** - Logo, nama komunitas, deskripsi, dan link sosial media
- **Galeri Aktivitas** - Carousel horizontal foto-foto kegiatan komunitas (klik untuk buka detail)
- **Berita & Aktivitas** - Informasi terbaru dari komunitas (mendukung multi-foto)
- **Kalender Event** - Kalender visual yang menampilkan tanggal-tanggal event (warna accent)
- **Open Events** - Event yang bisa didaftari (main bareng)
- **Jersey Launch** - Pre-order jersey komunitas
- **Voting** - Polling terbuka yang bisa diikuti user
- **Footer** - Link sosial media dan copyright

### Ganti Bahasa
Klik tombol bahasa di pojok kanan atas (dengan ikon bendera SVG):
- ID = Bahasa Indonesia (default)
- EN = English

> Bahasa berlaku untuk seluruh halaman publik **dan admin** (termasuk login, password, reports). Semua label, judul, tombol, tabel header, hint, modal konfirmasi, dan pesan error/sukses akan berubah sesuai bahasa yang dipilih.

### Mendaftar Event
1. Di halaman utama, klik **"Daftar Sekarang"** pada event yang diinginkan
2. Isi form:
   - **Nama Lengkap** (wajib)
   - **Nomor Telepon** (opsional)
   - **Posisi** - Pilih Pemain atau Kiper
3. Klik **"Daftar Sekarang"**
4. Jika kuota posisi masih tersedia -> status **Registered**
5. Jika kuota penuh -> otomatis masuk **Waiting List**
6. Admin bisa mengubah status ke Confirmed/Registered/Waiting dari dashboard

### Pesan Jersey
1. Di halaman utama, klik **"Pesan Jersey"** pada jersey yang diinginkan
2. Pilih nomor jersey (0-99) dari grid angka
   - Hijau = Tersedia
   - Merah = Sudah diambil (hover/tap untuk lihat nama pemilik)
3. Pilih tipe jersey: **Pemain** atau **Kiper**
4. Pilih tipe item (jika tersedia): **1 Stel** / **Baju Saja** / **Celana Saja**
5. Isi form:
   - **Nama Pendaftar** (nama lengkap pemesan)
   - **Nama Jersey** (otomatis huruf kapital saat diketik)
   - **Nomor Telepon**
   - **Ukuran** (S / M / L / XL / XXL / 3XL / 4XL / 5XL / 6XL)
   - **Ukuran Baju Khusus** (opsional) - Jika admin sudah mengatur surcharge ukuran baju, akan muncul dropdown untuk memilih ukuran baju berbeda dari ukuran utama
6. Harga ditampilkan otomatis berdasarkan ukuran, tipe item, dan ukuran baju yang dipilih
7. Klik **"Pesan Jersey #(nomor)"
**

> **Galeri desain jersey** bisa di-scroll otomatis (berganti setiap 3 detik) atau manual. Klik gambar untuk melihat ukuran penuh.

### Voting
1. Di halaman utama, klik salah satu opsi pada voting yang sedang buka
2. Setelah memilih, hasil voting ditampilkan (progress bar + persentase)
3. Setiap user hanya bisa vote 1 kali per polling (disimpan di localStorage)

### Melihat Detail Galeri
1. Klik salah satu foto di carousel galeri
2. Akan membuka halaman detail (`/highlight/[id]`) dengan gambar besar, judul, dan deskripsi

### Tombol Kembali ke Beranda
Setiap halaman detail (event, jersey, voting, galeri) memiliki tombol **"Kembali ke Beranda"** berbentuk button dengan warna sesuai tema yang dipilih admin.

---

## Untuk Admin

### Login Admin
1. Buka **http://localhost:3000/manage-jfc**
2. Masukkan password admin (default: `admjoinfc2020`)
3. Klik **"Masuk"**

### Dashboard
Setelah login, Anda akan melihat dashboard dengan ringkasan:
- Jumlah open events
- Jumlah jersey launches
- Jumlah foto galeri

### Menu Admin (Sidebar - 7 Menu)

#### 1. Dashboard
Halaman ringkasan statistik.

#### 2. Pengaturan
Mengatur konfigurasi website:
- **Informasi Umum** - Nama situs, deskripsi, logo
- **Sosial Media** - Link Instagram dan WhatsApp
- **Background Header** - Pilih gradient warna atau gambar upload
- **Warna Tema** - Primary, Secondary, Accent (berlaku di semua halaman termasuk admin)

> **Ubah Password:** Klik link **"Ubah Password Admin"** di bawah form pengaturan, akan diarahkan ke halaman khusus ubah password (`/manage-jfc/dashboard/password`).

> **Upload Gambar:** Logo dan Hero menggunakan pola *deferred upload* - gambar dipilih dan di-preview dulu (border kuning putus-putus), baru benar-benar diupload saat klik **"Simpan Pengaturan"**.

#### 3. Galeri
Mengelola foto-foto aktivitas komunitas:
- Klik **"Tambah Foto Aktivitas"** untuk menambah
- Isi judul, deskripsi (mendukung rich text: bold, italic, list, heading), dan upload foto
- Upload menggunakan pola *deferred upload* - gambar di-preview dulu (border kuning), baru diupload saat submit
- Hover foto untuk edit/hapus
- Konfirmasi hapus menggunakan popup modal (bukan alert browser)
- Klik foto di homepage membuka halaman detail (`/highlight/[id]`)

#### 4. Berita
Mengelola berita dan artikel:
- Klik **"Tambah Berita"** untuk menambah
- **Mendukung multi-foto** - bisa upload lebih dari 1 gambar per berita
- Bisa hapus foto individual jika salah upload
- Upload menggunakan pola *deferred upload* - gambar dipilih dan di-preview dulu (border kuning putus-putus), baru benar-benar diupload saat klik **"Tambah"** atau **"Simpan"**
- Di daftar berita, thumbnail menampilkan max 2 foto + badge "+N" jika lebih

#### 5. Events
Mengelola open events (main bareng):
- **Buat Event Baru** - Isi judul, lokasi, link Google Maps, tanggal, rekening bank, maks pemain, maks kiper
- **Lihat Peserta** - Klik "Lihat" pada event untuk melihat daftar pendaftar
  - Daftar terpisah: Kiper di atas, Pemain di bawah
  - Waiting list otomatis ketika kuota posisi penuh
  - Admin bisa mengubah status via dropdown: **Waiting** ↔ **Registered** ↔ **Confirmed**
  - Admin bisa pindah posisi (Kiper ↔ Pemain), hapus registrasi
- **Download Report** - Klik "Report" pada setiap event untuk download Excel, atau klik "Download Semua Event" di atas untuk semua event sekaligus
- **Toggle Open/Close** - Buka/tutup pendaftaran event
- **Edit/Hapus** - Ubah atau hapus event

#### 6. Jersey
Mengelola jersey launch:
- **Launch Jersey Baru** - Isi nama dan upload desain (bisa banyak gambar)
- **Harga Jersey:**
  - **Harga Normal** (base price) - Harga default untuk semua ukuran & tipe. Input dengan format Rupiah otomatis (Rp + pemisah ribuan)
  - **Tambahan Harga Ukuran 1 Stel** (opsional) - Surcharge untuk ukuran tertentu. Setiap entry berisi: ukuran dan nominal tambahan
  - **Tambahan Khusus Ukuran Baju** (opsional) - Surcharge jika user memilih ukuran baju berbeda dari ukuran utama. Setiap entry berisi: ukuran baju dan nominal tambahan
  - Harga akhir = Harga Normal + Tambahan Harga Ukuran + Tambahan Ukuran Baju
- Upload menggunakan pola *deferred upload* - gambar di-preview dulu, baru diupload saat submit
- **Lihat Peserta** - Klik "Lihat" untuk melihat daftar pemesanan (pendaftar, nama jersey, telepon, nomor, ukuran, ukuran baju, tipe pemain/kiper, tipe item, harga)
- **Download Report** - Klik "Report" pada setiap jersey untuk download Excel
- **Toggle Open/Close** - Buka/tutup pemesanan
- **Link Share** - Salin link `/jersey/[slug]` untuk dibagikan

#### 7. Votes
Mengelola voting/polling:
- **Buat Voting Baru** - Isi judul dan daftar opsi (nama + gambar opsional per opsi)
- Upload gambar opsi menggunakan pola *deferred upload* - di-preview dulu (border kuning), baru diupload saat submit
- Opsi bisa ditambah/kurang secara dinamis
- **Hasil Voting** - Progress bar + persentase per opsi
- **Toggle Open/Close** - Buka/tutup voting
- **Edit/Hapus** - Ubah atau hapus voting

> **Catatan:** Menu Reports tidak ada di sidebar. Fitur download report terintegrasi langsung di halaman Events dan Jersey masing-masing.

### Pola Upload (Deferred Upload)
Semua fitur upload gambar di admin menggunakan pola **deferred upload**:
1. Klik **"Pilih File"** untuk memilih gambar
2. Gambar akan di-preview dengan **border kuning putus-putus** (belum diupload)
3. Bisa hapus/ganti gambar sebelum submit
4. Gambar baru benar-benar diupload ke server saat klik tombol simpan/tambah/update

### Logout
Klik tombol **"Logout"** di bagian bawah sidebar.

---

## Cara Running Lokal

### Prasyarat
- **Node.js** versi 18 atau lebih baru - [Download](https://nodejs.org/)
- Koneksi internet (untuk akses database Neon dan Vercel Blob storage)

### Langkah-langkah

#### 1. Buka Terminal
Buka PowerShell atau Command Prompt, masuk ke folder project:
```
cd d:\Project\joinfc
```

#### 2. Install Dependencies (pertama kali atau setelah update)
```
npm install
```

#### 3. Generate Prisma Client (pertama kali atau setelah perubahan schema)
```
npx prisma generate
```

#### 4. Jalankan Server Development
```
npm run dev
```
Tunggu sampai muncul pesan: `Ready in X.Xs`

#### 5. Buka di Browser
- **User**: http://localhost:3000
- **Admin**: http://localhost:3000/manage-jfc

### Menghentikan Server

#### Cara 1: Keyboard Shortcut
Di terminal yang sedang menjalankan server, tekan `Ctrl + C`

#### Cara 2: Kill Process (jika terminal sudah tertutup)

Windows PowerShell:
```
Get-Process -Name node | Stop-Process -Force
```

Atau kill berdasarkan port:
```
netstat -ano | findstr :3000
taskkill /PID <masukkan_PID> /F
```

### Build untuk Production

```
# Build (otomatis generate Prisma client + Next.js build)
npm run build

# Jalankan production server
npx next start
```

### Deploy ke Vercel
1. Push project ke GitHub
2. Hubungkan repo ke Vercel
3. Set environment variables di Vercel:
   - `DATABASE_URL` - Connection string Neon PostgreSQL
   - `BLOB_READ_WRITE_TOKEN` - Token Vercel Blob storage (untuk upload gambar)
4. Build command sudah otomatis: `prisma generate && next build`

---

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Port 3000 already in use | Kill proses yang menggunakan port 3000 (lihat cara di atas) |
| Cannot find module '@prisma/client' | Jalankan `npx prisma generate` |
| Database connection error | Periksa `DATABASE_URL` di file `.env` dan koneksi internet |
| jerseyType does not exist saat build | Pastikan `prisma generate` sudah dijalankan (sudah otomatis di build script) |
| Upload gambar gagal | Pastikan `BLOB_READ_WRITE_TOKEN` sudah di-set di environment |

---

*Terakhir diperbarui: April 2026*
