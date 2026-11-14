# Zonasi-Agent — Sistem Verifikasi Berkas & Deteksi Kecurangan Zonasi PPDB

> **Kategori:** Web Application  
> **Status:** MVP / Production-Ready  
> **Target Wilayah Percontohan:** SMA Negeri 12 Surabaya (Koordinat: `-7.2468, 112.6358`, Radius Zonasi: `1.200 meter`)

---

## 👥 Profil Tim Pengembang

**Nama Tim:** [Masukkan Nama Tim Anda]

| No | Nama Anggota | Peran / Tanggung Jawab |
|---|---|---|
| 1 | **Muhammad Khaled Meshal** | Project Manager |
| 2 | **Yafi' Putra Widya** | FullStack Developer |
| 3 | **Arkan Faiz Prastowo** | UI/UX Designer |
| 4 | **Muhammad Daffa Raditya** | QA Engineer |

---

## Demo

[zonasi-agent.vercel.app](https://zonasi-agent.vercel.app])

---

## 📌 Deskripsi Solusi, Masalah & Target Pengguna

### 1. Masalah yang Diangkat
Proses Penerimaan Peserta Didik Baru (PPDB) Jalur Zonasi di jenjang SMA/SMK kerap menghadapi tantangan integritas data kependudukan dan geospasial:
- **Praktik Titip Kartu Keluarga (KK):** Calon siswa dimasukkan ke KK kerabat/kenalan yang dekat dengan sekolah beberapa bulan sebelum pendaftaran demi memenuhi radius zonasi.
- **Manipulasi Relasi Keluarga:** Status keluarga tercatat bukan *Anak Kandung*, melainkan *Famili Lain* tanpa dokumen sah perpindahan orang tua.
- **Alamat Fiktif / Non-Residensial:** Titik koordinat pendaftar menunjuk ke kawasan ruko komersial, kantor, atau lahan kosong, bukan rumah hunian.
- **Beban Verifikasi Manual Panitia:** Memeriksa ribuan berkas KK fisik, menghitung rute darat nyata, dan mencocokkan usia calon siswa memakan waktu lama serta rentan kesalahan manusia.

### 2. Deskripsi Solusi
**Zonasi-Agent** adalah platform web otomatis berbasis AI vision dan komputasi geospasial yang dirancang khusus sebagai alat bantu kerja bagi **Panitia Verifikator PPDB**. Sistem ini melakukan verifikasi berlapis secara instan:
1. Membaca dan mengekstrak tabel Kartu Keluarga (KK) asli secara multi-tahap (OCR Vision).
2. Memilih calon siswa usia masuk SMA (**15–17 tahun**) secara otomatis berdasarkan tanggal lahir di KK atau 6 digit tengah NIK Dukcapil.
3. Menghitung jarak garis lurus (*Euclidean*) dan **jarak rute jalan darat aktual** (*Routing OSRM / OpenStreetMap*) ke sekolah tujuan.
4. Mendeteksi anomali masa terbit KK (< 1 tahun), relasi *Famili Lain*, dan fasad bangunan non-residensial.
5. Menyediakan alur berkas bersyarat (unggah SKPWNI Dukcapil / SK Pindah Tugas) dan portal pengawas panitia lengkap dengan kemampuan override manual.

### 3. Target Pengguna
- **Panitia Verifikator PPDB SMA/SMK:** Pengguna utama di portal *Dashboard Panitia* untuk memantau antrean, menginvestigasi anomali, menyetujui berkas bersyarat, dan mengunduh Berita Acara (CSV/Excel).
- **Calon Peserta Didik & Orang Tua / Wali:** Pengguna publik di portal *Lacak & Pindai KK* untuk menguji kelayakan berkas secara mandiri dengan perlindungan privasi (NIK dan Nomor KK disensor otomatis).

---

## ✨ Fitur Utama yang Berhasil Diimplementasikan

- [x] **Pemindai & Ekstraksi Dokumen KK Otomatis:** Membaca tabel anggota keluarga, Nomor KK, NIK, tanggal terbit, dan status hubungan tanpa data dummy palsu.
- [x] **Validasi Usia Otomatis (15–17 Tahun):** Mengidentifikasi anak kandung yang memenuhi rentang usia masuk SMA berdasarkan tanggal lahir atau NIK (`DDMMYY`, penyesuaian wanita `DD - 40`).
- [x] **Perhitungan Jarak Geospasial Ganda:** Pengukuran jarak garis lurus dan kalkulasi rute darat riil via OSRM/OpenStreetMap terhadap koordinat SMA Negeri 12 Surabaya.
- [x] **Deteksi Indikasi Titip KK & Anomali:** Identifikasi otomatis untuk KK terbit < 1 tahun, status famili lain, serta deteksi bangunan non-residensial.
- [x] **Alur Berkas Bersyarat (SKPWNI / Pindah Tugas):** Fasilitas unggah dokumen pembuktian sah bagi keluarga yang pindah domisili sah < 1 tahun agar dapat diloloskan panitia.
- [x] **Dashboard Pengawas Panitia:** Peta interaktif OpenStreetMap, tabel antrean real-time, filter status (*Approved*, *Revisi*, *Ditolak*), pagination, dan investigasi mendalam.
- [x] **Override Keputusan Panitia:** Panitia berwenang mengubah status keputusan secara manual disertai catatan resmi verifikator.
- [x] **Ekspor Berita Acara:** Unduhan otomatis Berita Acara resmi verifikasi PPDB berformat CSV/Excel siap cetak.
- [x] **Pencarian Cepat & Lacak Berkas Publik:** Lacak status berkas berdasarkan Nomor Registrasi (`PPDB-2026-XXXX`) atau NIK dengan isolasi data sesi dan sensor digit sensitif.
- [x] **Desain Responsif & Aksesibilitas Pro Max:** Skema warna 60-30-10 (`#FFFFFF`, `#1E3A8A`, `#F59E0B`), animasi halus Framer Motion & GSAP yang aman untuk `prefers-reduced-motion`.

---

## 🛠️ Arsitektur Teknologi

### 1. Framework & Bahasa
- **Next.js 16 (App Router)**: Framework React fullstack untuk routing publik dan portal panitia.
- **React 19**: Library antarmuka komponen UI.
- **TypeScript**: Type-safety ketat end-to-end.

### 2. Styling & Animasi
- **Tailwind CSS 3**: Utilitas styling modern dengan palet warna resmi zonasi.
- **Framer Motion 14**: Transisi mikro, drawer, dan feedback interaktif.
- **GSAP 3**: Stagger animations bento-card dan smooth transitions.

### 3. State Management & Data Fetching
- **@tanstack/react-query 5**: Manajemen cache, deduplikasi request, dan auto-refetch data antrean verifikasi.
- **Axios**: HTTP client untuk integrasi API eksternal.

### 4. Database & Backend Services
- **Supabase (PostgreSQL / PostGIS)**: Penyimpanan data aplikasi pendaftar, query spasial geospasial, dan autentikasi.
- **Local File Store Fallback (`.zonasi-store.json`)**: Mekanisme ketahanan sistem yang otomatis aktif saat koneksi cloud database tidak terkonfigurasi.

### 5. API & Layanan Pihak Ketiga
- **Google Gemini Vision API (`gemini-flash-lite-latest`)**: Ekstraksi OCR vision multi-modal tabel Kartu Keluarga.
- **OpenStreetMap (OSM) Nominatim**: Geocoding alamat domisili ke koordinat lintang/bujur.
- **OSRM (Open Source Routing Machine)**: Kalkulasi jarak jalan darat nyata dan rute tempuh pendaftar ke sekolah.

---

## 🏗️ Diagram Arsitektur Sistem & Alur Data

```
+-----------------------------------------------------------------------------------+
|                                 PENGGUNA / KLIEN                                  |
|   [Portal Publik: Pindai KK / Lacak]           [Portal Panitia: Dashboard & BA]   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTPS)
+-----------------------------------------------------------------------------------+
|                              NEXT.JS 16 APP ROUTER                                |
|  - Middleware / Proxy Auth (/dashboard protection via session token & cookie)     |
|  - Server Actions & Route Handlers (/api/applications, /api/auth, /api/health)    |
|  - Modular UI Sections (Hero, Scanner, Quota, Timeline, Map, QueueTable, Modal)   |
+-----------------------------------------------------------------------------------+
       │                                     │                           │
       ▼ (Vision Prompting)                  ▼ (Geocoding & Route)       ▼ (Data Layer)
+-------------------------+     +-------------------------+     +-------------------+
|      GEMINI VISION      |     |  OPENSTREETMAP & OSRM   |     | SUPABASE POSTGIS  |
| - Pembacaan Tabel KK    |     | - Geocoding Alamat      |     | - Tabel Pendaftar |
| - Ekstraksi NIK & Tgl   |     | - Jarak Garis Lurus     |     | - Riwayat Audit   |
| - Filter Usia SMA       |     | - Jarak Rute Darat      |     | (Fallback: Local) |
+-------------------------+     +-------------------------+     +-------------------+
       │                                     │                           │
       └─────────────────────────────────────┴───────────────────────────┘
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              ORCHESTRATOR VERIFIKASI                              |
|  1. Hitung Usia (15–17 Thn)      -> VALID / ANOMALI                               |
|  2. Hitung Jarak (<= 1.200 m)    -> MEMENUHI / LUAR ZONASI                        |
|  3. Evaluasi Terbit KK (>= 1 Th) -> VALID / PERLU SKPWNI                          |
|  4. Evaluasi Bangunan            -> RESIDENSIAL / KOMERSIAL                       |
|                                                                                   |
|  STATUS AKHIR:  [APPROVED]  |  [NEEDS_REVISION / SKPWNI]  |  [REJECTED]           |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Panduan Instalasi, Konfigurasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Node.js**: Versi `18.x` atau lebih baru (`v20.x` LTS direkomendasikan).
- **Package Manager**: `npm`, `pnpm`, atau `yarn`.
- **Git**: Terpasang di sistem.

### 2. Kloning Repositori
```bash
git clone https://github.com/yfpwdya/Zonasi-Agent-Autonomous-PPDB-Validator-Fraud-Detector-.git
cd "Zonasi-Agent-Autonomous-PPDB-Validator-Fraud-Detector-"
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Lingkungan (`.env`)
Salin berkas contoh `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan lengkapi variabel lingkungan berikut:
```env
# Database & Backend (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-service-role-key

# Mesin Pemindai Dokumen KK (Server-side)
GEMINI_API_KEY=your-gemini-api-key
```

> **Catatan Mode Offline / Fallback Lokal:**  
> Jika `NEXT_PUBLIC_SUPABASE_URL` tidak diisi, Zonasi-Agent secara cerdas akan beralih ke mode penyimpanan lokal (`.zonasi-store.json`) sehingga seluruh fitur pemindaian, peta, dashboard, dan ekspor CSV tetap dapat dijalankan dan diuji 100% tanpa error database.

### 5. Menjalankan Pengujian Unit
```bash
npm test
```
*Memverifikasi 4 skenario inti: kelulusan aturan zonasi, penolakan anomali usia SMA, ekstraksi NIK Dukcapil, dan penentuan kandidat siswa terbaik.*

### 6. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 7. Kompilasi Produksi
```bash
npm run build
npm start
```

---

## 🔐 Akun Demonstrasi Panitia

Tidak ada email atau kata sandi bersama yang dipublikasikan dalam repositori ini.

Untuk demonstrasi, buka [http://localhost:3000/login](http://localhost:3000/login), pilih tab **Daftar Akun Baru**, lalu daftarkan akun panitia secara mandiri. Akun yang dibuat dapat digunakan untuk masuk ke Dashboard Pengawas Panitia.

> Jangan pernah memasukkan kredensial demo atau produksi ke `README.md`, `.env.example`, maupun commit Git.

---

## 🤖 Dokumentasi Penggunaan AI & AI Development Stack

Proyek ini dikembangkan secara intensif dengan bantuan ekosistem Autonomous AI Coding Agent untuk mempercepat siklus rekayasa perangkat lunak:

### 1. AI Runtime di Dalam Aplikasi
- **Google Gemini Vision API (`gemini-flash-lite-latest`)**:
  - Berperan sebagai modul OCR Forensik multi-pass pada berkas KK.
  - Dilengkapi sistem *graceful fallback* dan sanitasi parsing JSON terstruktur untuk mengekstrak identitas calon siswa tanpa memalsukan data.

### 2. AI Tools pada Proses Pengembangan & Orkestrasi
- **Hermes Agent (Nous Research)**:
  - Berfungsi sebagai orchestrator AI utama selama proses pengembangan sistem end-to-end (refactoring komponen modular, patching logika OCR, manajemen dependensi, dan otomatisasi audit kode).
- **9router**:
  - Digunakan sebagai gateway / model provider AI multi-model berlatensi rendah untuk routing inferensi selama proses perancangan dan iterasi kode proyek.
- **Antigravity CLI**:
  - Digunakan sebagai model provider dan agen coding otomatis dalam ekosistem pengembangan untuk mempercepat pembuatan fitur, review kualitas kode, dan eksekusi instruksi kompleks.

---

## 📄 Atribusi & Lisensi

- **Ikon Antarmuka:** [Google Material Symbols Outlined](https://fonts.google.com/icons)
- **Peta & Geospasial:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, [OSRM Project](http://project-osrm.org/)
- **Animasi Web:** [GSAP by GreenSock](https://greensock.com/gsap/), [Motion (Framer Motion)](https://motion.dev/)
- **Font:** [Inter & Geist](https://fonts.google.com/)
- **Regulasi Zonasi PPDB:** Permendikbudristek No. 1 Tahun 2021 & Petunjuk Teknis PPDB Dinas Pendidikan Provinsi Jawa Timur (Wilayah Surabaya).

---

© 2026 **Zonasi-Agent Team**. Seluruh hak cipta dilindungi undang-undang.
