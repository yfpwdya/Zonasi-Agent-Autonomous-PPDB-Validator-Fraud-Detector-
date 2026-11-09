# DOKUMEN SPESIFIKASI TEKNIS, ARSITEKTUR & DESAIN SISTEM (PROJECT BLUEPRINT)

**Nama Proyek:** Zonasi-Agent (Autonomous PPDB Validator & Fraud Detector)  
**Kategori:** Smart Governance & Public Service  
**Platform:** Full-Stack Web Application (Next.js + Supabase Cloud Ecosystem)

---

## 1. Latar Belakang & Identifikasi Masalah (Pain Points)

Penerimaan Peserta Didik Baru (PPDB) Jalur Zonasi setiap tahun selalu menjadi isu krusial di Indonesia. Sistem yang bertujuan memeratakan pendidikan ini sering kali dicederai oleh kecurangan manipulatif dan inefisiensi birokrasi:

* **Manipulasi Kartu Keluarga (KK):** Praktik "titip KK" ke rumah warga dekat sekolah favorit, penggunaan KK berusia di bawah 1 tahun, atau anomali status hubungan keluarga.
* **Manipulasi Titik Koordinat (Geospasial):** Pendaftar meletakkan pin lokasi secara bebas di tengah lapangan, ruko komersial, atau lahan kosong yang bukan hunian sebenarnya.
* **Kelemahan Perhitungan Jarak (Garis Lurus):** Sistem konvensional menggunakan radius udara (*Euclidean distance*) yang mengabaikan rintangan geografis (sungai, jalan tol, tembok perumahan), sehingga tidak merepresentasikan jarak tempuh darat yang riil.
* **Bottleneck & Human Error Panitia:** Verifikasi ribuan dokumen secara manual memakan waktu lama dan rentan terhadap kelelahan manusia (*fatigue*) maupun subjektivitas.

---

## 2. Solusi Inovatif (Zonasi-Agent)

**Zonasi-Agent** mentransformasi portal pendaftaran pasif menjadi platform cerdas berbasis *Agentic AI* yang terintegrasi penuh dengan layanan cloud modern:

* **Ekstraksi & Penalaran OCR Cerdas:** AI mengekstrak teks Kartu Keluarga, mencari "Tanggal Terbit KK", menghitung validitas usia dokumen ($\ge 1$ tahun), serta memeriksa kecocokan nama orang tua dan status hubungan keluarga.
* **Validasi Rute Darat Riil:** Mengalkulasi jarak tempuh darat aktual (jalan kaki/berkendara) dari titik koordinat rumah ke gerbang sekolah menggunakan API navigasi dan menyimpannya dalam struktur geospasial PostGIS.
* **Audit Tata Ruang Otomatis (Vision AI):** Menarik citra visual dari Google Street View berdasarkan koordinat pendaftar dan mengklasifikasikan bangunan sebagai `[HUNIAN]`, `[KOMERSIAL/RUKO]`, atau `[LAHAN KOSONG]`.
* **Live Realtime Status Tracking:** Memanfaatkan fitur *Supabase Realtime* untuk memperbarui tahapan verifikasi AI secara langsung di layar orang tua murid dengan transisi antarmuka yang halus tanpa perlu memuat ulang halaman (*no page reload*).

---

## 3. Arsitektur Teknis Sistem (Next.js + Supabase Stack)

Arsitektur dirancang secara modern, *serverless-ready*, dan terpusat menggunakan ekosistem **Next.js** dan **Supabase Cloud**.

### A. Tumpukan Teknologi (Tech Stack)
* **Frontend & Backend Framework:** Next.js 14/15 (App Router) dengan TypeScript.
* **Styling & UI Library:** Tailwind CSS + Shadcn UI (komponen dasar yang dapat dikustomisasi).
* **Animation Engine:** **Framer Motion** (transisi halaman, *micro-interactions*, dan animasi *stepper* verifikasi AI secara *real-time*).
* **Database & Cloud Backend:** **Supabase**
  * **Supabase Database:** PostgreSQL dengan ekstensi **PostGIS** untuk pemrosesan titik koordinat dan indeks geospasial.
  * **Supabase Storage:** Penyimpanan *cloud* terenkripsi untuk unggahan gambar Kartu Keluarga (KK) dan foto verifikasi rumah mandiri.
  * **Supabase Realtime:** *WebSockets* bawaan untuk memancarkan perubahan status verifikasi dari database langsung ke antarmuka pengguna.
* **AI Orchestration & Background Runner:** Vercel AI SDK / LangChain.js yang dieksekusi melalui Next.js Server Actions atau *Async Background Functions* (Inngest / Trigger.dev / Supabase Edge Functions).

### B. Integrasi Pihak Ketiga (Agent Tools)
* **Vision & Reasoning LLM:** Google Gemini 1.5 Pro atau OpenAI GPT-4o.
* **Google Maps Routes / Distance Matrix API:** Kalkulasi jarak tempuh rute darat riil.
* **Google Street View Static API:** Akuisisi citra visual lokasi rumah pendaftar.

---

## 4. Sistem Desain (UI/UX) & Spesifikasi Framer Motion

Desain mengusung konsep **"Clean Trustworthy Governance"** yang memadukan warna biru elegan dan putih bersih untuk menciptakan kesan profesional, transparan, modern, dan menenangkan bagi wali murid maupun panitia.

### A. Palet Warna (Elegant Blue & White)
* **Background Primary:** `#FFFFFF` (Pure White — memberikan kesan bersih dan luas).
* **Background Secondary / Surface:** `#F8FAFC` (Slate 50 — latar belakang halaman dashboard dan area formulir).
* **Primary Brand (Royal Blue):** `#1E40AF` (Blue 800 — melambangkan otoritas, kepercayaan, dan institusi resmi).
* **Interactive & Accent (Vibrant Blue):** `#2563EB` (Blue 600) hingga `#3B82F6` (Blue 500) untuk tombol utama, tautan aktif, dan indikator progres.
* **Soft Accent / Glass Tint:** `#EFF6FF` (Blue 50 — latar belakang kartu sorotan dan *badge* informasi).
* **Text Hierarchy:**
  * Heading: `#0F172A` (Slate 900)
  * Body Text: `#334155` (Slate 700)
  * Muted / Caption: `#64748B` (Slate 500)
* **Semantic Status Colors:**
  * Approved / Valid: `#10B981` (Emerald 500) dengan latar `#ECFDF5`
  * Warning / Revisi Dokumen: `#F59E0B` (Amber 500) dengan latar `#FFFBEB`
  * Rejected / Fraud Detected: `#EF4444` (Rose 500) dengan latar `#FEF2F2`

### B. Tipografi & Komponen Visual
* **Font Utama:** `Plus Jakarta Sans` atau `Inter` (Sans-serif modern dengan keterbacaan tinggi).
* **Font Monospace:** `JetBrains Mono` (digunakan khusus untuk menampilkan NIK, Tracking ID, Koordinat GPS, dan jarak meter).
* **Gaya Kartu (Cards):** Sudut membulat (`rounded-2xl`), *border* tipis `#E2E8F0` (`border-slate-200`), dan bayangan lembut berwarna kebiruan (`shadow-[0_8px_30px_rgb(30,64,175,0.06)]`).
* **Glassmorphism Header:** Navigasi atas menggunakan efek kaca buram (`bg-white/80 backdrop-blur-md border-b border-blue-100`).

### C. Spesifikasi Animasi (Framer Motion)
1. **Page & Section Entry (`FadeInUp`):**
   * Setiap halaman dan modul kartu muncul dengan transisi lembut dari bawah ke atas:
     `initial={{ opacity: 0, y: 20 }}` $\rightarrow$ `animate={{ opacity: 1, y: 0 }}` dengan `transition={{ duration: 0.4, ease: "easeOut" }}`.
2. **Multi-Step Registration Wizard (`AnimatePresence`):**
   * Pergantian langkah pengisian formulir (Data Diri $\rightarrow$ Unggah KK $\rightarrow$ Pilih Titik Peta) menggunakan animasi geser horizontal (*slide transition*) dengan `mode="wait"` agar perpindahan terasa mulus seperti aplikasi *native*.
3. **AI Verification Scanner Effect:**
   * Saat dokumen KK sedang dianalisis oleh AI, tampilkan pratinjau gambar KK dengan garis laser biru bercahaya (`bg-gradient-to-r from-transparent via-blue-500 to-transparent`) yang bergerak naik-turun secara kontinu (`animate={{ top: ["0%", "100%", "0%"] }}`, `transition={{ duration: 2.5, repeat: Infinity }}`).
4. **Realtime Progress Stepper (`layoutId` & Spring Physics):**
   * Pada halaman pelacakan status, 3 tahapan agen (Analisis KK $\rightarrow$ Kalkulasi Jarak Darat $\rightarrow$ Audit Visual Street View) dianimasikan menggunakan `spring` (`stiffness: 300, damping: 25`). Ketika Supabase mengirimkan pembaruan status, ikon *loading spinner* berubah menjadi tanda centang biru/hijau dengan efek *scale pop* (`scale: [0.8, 1.15, 1]`).
5. **Interactive Map Pin & Card Hover:**
   * Kartu ringkasan di dashboard panitia memiliki respons mikro saat kursor diarahkan: `whileHover={{ y: -4, boxShadow: "0 12px 35px rgba(37, 99, 235, 0.12)" }}` dan tombol memiliki efek tekan `whileTap={{ scale: 0.98 }}`.

---

## 5. Spesifikasi Halaman Admin (Dashboard Panitia)

* **Command Center Map (PostGIS):** Peta interaktif menampilkan pin lokasi pendaftar dengan warna sesuai status AI (Hijau, Kuning, Merah).
* **AI Audit & Fraud Triage Table:** Tabel filter cerdas untuk memeriksa anomali data tingkat tinggi.
* **Detail & Manual Override Panel:** *Slide-over* UI untuk membandingkan dokumen fisik vs temuan AI secara bersisian, dilengkapi tombol *Force Approve/Reject*.

---

## 6. Skema Database Supabase (PostgreSQL + PostGIS)

Berikut adalah rancangan skema SQL yang siap dijalankan pada **Supabase SQL Editor**:

```sql
-- 1. Aktifkan Ekstensi PostGIS untuk Geospasial
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enum untuk Status Pendaftaran dan Klasifikasi Bangunan
CREATE TYPE verification_status AS ENUM (
  'PENDING_QUEUE',
  'PROCESSING_OCR',
  'PROCESSING_GEO',
  'PROCESSING_VISION',
  'NEEDS_REVISION',
  'NEEDS_LIVE_PHOTO',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE building_type AS ENUM (
  'UNVERIFIED',
  'RESIDENTIAL',
  'COMMERCIAL',
  'EMPTY_LAND',
  'NO_STREET_VIEW'
);

-- 3. Tabel Sekolah Tujuan
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  npsn VARCHAR(20) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL, -- Longitude, Latitude
  max_quota INT NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Pendaftaran Siswa (Applications)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(20) UNIQUE NOT NULL, -- Contoh: PPDB-2026-X89K
  student_nik VARCHAR(16) UNIQUE NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  kk_number VARCHAR(16) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Data Geospasial Pendaftar
  home_lat DOUBLE PRECISION NOT NULL,
  home_lng DOUBLE PRECISION NOT NULL,
  home_location GEOMETRY(Point, 4326) NOT NULL,
  real_route_distance_meters NUMERIC(10, 2), -- Hasil Google Routes API
  straight_line_distance_meters NUMERIC(10, 2), -- Hasil kalkulasi PostGIS ST_Distance
  
  -- File URLs (Supabase Storage)
  kk_image_url TEXT NOT NULL,
  street_view_image_url TEXT,
  live_house_photo_url TEXT,
  
  -- Hasil Analisis AI Agent
  kk_issue_date DATE,
  kk_age_valid BOOLEAN,
  family_relation_valid BOOLEAN,
  ocr_confidence NUMERIC(5, 2),
  detected_building building_type DEFAULT 'UNVERIFIED',
  
  -- Status & Catatan Keputusan
  status verification_status DEFAULT 'PENDING_QUEUE',
  ai_reasoning_summary TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Log Audit AI (Untuk Transparansi & Realtime Stepper)
CREATE TABLE agent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL, -- 'OCR_CHECK', 'ROUTE_CALC', 'VISION_AUDIT', 'FINAL_DECISION'
  status VARCHAR(50) NOT NULL, -- 'STARTED', 'SUCCESS', 'WARNING', 'FAILED'
  detail_message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Supabase Realtime pada tabel applications dan agent_audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_audit_logs;
```

---

## 7. Alur Kerja Eksekusi Program (Technical Workflow)

1. **Ingestion & Storage Upload:**
   * Wali murid mengisi formulir di Next.js dan mengunggah foto KK langsung ke *bucket* `kk-documents` di **Supabase Storage**.
   * Formulir dikirim ke Next.js API Route (`POST /api/applications`). Data awal disimpan ke tabel `applications` di Supabase dengan status `PENDING_QUEUE` dan mengembalikan `tracking_id`.
2. **Realtime Subscription:**
   * Klien web otomatis diarahkan ke halaman `/track/[tracking_id]`. Halaman ini membuka koneksi *WebSocket* ke Supabase Realtime untuk mendengarkan perubahan pada baris `applications` dan `agent_audit_logs` dengan animasi *stepper* Framer Motion.
3. **Agent Tool 1 — Document OCR & Reasoning (`PROCESSING_OCR`):**
   * Agen AI mengambil URL gambar KK dari Supabase Storage dan menganalisisnya menggunakan Vision LLM.
   * Mengekstrak tanggal terbit KK, memvalidasi usia KK ($\ge 1$ tahun), memeriksa status hubungan keluarga (Anak Kandung vs Famili Lain), dan mencatat skor *confidence* OCR.
4. **Agent Tool 2 — Geospatial Route Analysis (`PROCESSING_GEO`):**
   * Menggunakan fungsi PostGIS `ST_DistanceSphere` untuk mencatat jarak lurus sebagai referensi, lalu memanggil **Google Maps Routes API** untuk mendapatkan jarak tempuh darat riil (`real_route_distance_meters`) dari koordinat rumah ke koordinat sekolah di tabel `schools`.
5. **Agent Tool 3 — Visual Fraud Detection (`PROCESSING_VISION`):**
   * Agen memanggil **Google Street View Static API** menggunakan koordinat pendaftar.
   * Jika citra tersedia, Vision LLM mengklasifikasikan bangunan (`RESIDENTIAL`, `COMMERCIAL`, atau `EMPTY_LAND`).
6. **Decision Maker (Penalaran Akhir):**
   * Apabila `ocr_confidence < 80` $\rightarrow$ Status: `NEEDS_REVISION`.
   * Apabila Street View tidak tersedia di gang sempit $\rightarrow$ Status: `NEEDS_LIVE_PHOTO`.
   * Apabila usia KK $< 1$ tahun **ATAU** bangunan terdeteksi `COMMERCIAL` / `EMPTY_LAND` $\rightarrow$ Status: `REJECTED` disertai alasan transparan.
   * Apabila seluruh parameter valid $\rightarrow$ Status: `APPROVED`.

---

## 8. Struktur Direktori Proyek (Next.js App Router)

```text
zonasi-agent/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                  # Landing Page (Hero elegan biru-putih + Statistik)
│   │   │   ├── daftar/page.tsx           # Multi-step Form Pendaftaran + Peta Interaktif
│   │   │   └── track/[trackingId]/page.tsx # Live AI Verification Tracker (Realtime + Framer Motion)
│   │   ├── (admin)/
│   │   │   └── dashboard/page.tsx        # Dashboard Panitia (Peta PostGIS, Filter Fraud, Override)
│   │   └── api/
│   │       ├── applications/route.ts     # Endpoint submit pendaftaran & trigger AI Agent
│   │       └── verify-live-photo/route.ts# Endpoint unggah foto rumah live via HTML5 Camera
│   ├── components/
│   │   ├── ui/                           # Komponen dasar Shadcn UI (bertema Royal Blue)
│   │   ├── animations/
│   │   │   ├── FadeIn.tsx                # Wrapper animasi Framer Motion
│   │   │   └── DocumentScanner.tsx       # Animasi laser scanning KK
│   │   ├── forms/
│   │   │   └── RegistrationWizard.tsx    # Wizard pendaftaran dengan AnimatePresence
│   │   └── maps/
│   │       └──ZoneMapPicker.tsx          # Pemilih koordinat & visualisasi rute sekolah
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Supabase Browser Client (untuk Realtime & Storage)
│   │   │   └── server.ts                 # Supabase Server Client
│   │   └── agent/
│   │       ├── orchestrator.ts           # Alur kerja utama Zonasi-Agent
│   │       ├── ocr-kk-tool.ts            # Prompt & ekstraksi terstruktur Vision AI untuk KK
│   │       ├── route-distance-tool.ts    # Integrasi Google Maps Distance & PostGIS
│   │       └── streetview-audit-tool.ts  # Integrasi Street View & klasifikasi tata ruang
├── supabase/
│   └── migrations/
│       └── 0001_init_zonasi_schema.sql   # Skema PostgreSQL + PostGIS
├── tailwind.config.ts                    # Konfigurasi tema warna biru-putih elegan
└── package.json
```

---

## 9. Strategi Mitigasi Masalah Teknis (Edge Cases)

* **Gambar KK Buram atau Tidak Terbaca (`NEEDS_REVISION`):**
  * Jika tingkat *confidence* OCR di bawah $80\%$, antarmuka `/track/[trackingId]` menampilkan kartu peringatan beraksen *Amber* dengan animasi *shake* lembut dari Framer Motion, disertai dropzone untuk mengunggah ulang foto KK yang lebih jelas ke Supabase Storage tanpa harus mengisi ulang formulir dari awal.
* **Lokasi Rumah di Gang Sempit Tanpa Street View (`NEEDS_LIVE_PHOTO`):**
  * Jika metadata Google Street View mengembalikan status `ZERO_RESULTS`, aplikasi mengaktifkan modul **Verifikasi Visual Mandiri** yang memanggil kamera ponsel secara langsung (`<input type="file" accept="image/*" capture="environment" />`) beserta validasi *Geolocation API* browser untuk memastikan wali murid mengambil foto di lokasi rumah yang sama dengan koordinat pendaftaran.
* **Lonjakan Traffic Hari Pertama PPDB:**
  * Penyimpanan dokumen langsung diunggah dari *client* ke **Supabase Storage** menggunakan *Signed URLs* sehingga tidak membebani memori server Next.js. Pemrosesan AI berjalan secara asinkron di latar belakang dan dipantau melalui koneksi ringan *Supabase Realtime*.

## 10. Manajemen Repositori & Standar Version Control (Git)

Untuk memastikan kolaborasi yang transparan, mudah ditelusuri oleh pembaca, dan mempermudah proses *debugging*, seluruh proses pengembangan proyek **wajib** dipublikasikan (push) secara berkala ke repositori Git yang telah disediakan.

Setiap pembaruan fitur, perbaikan *bug*, atau penyesuaian desain harus dipisah dalam *commit* yang atomik menggunakan standar **Conventional Commits**. Berikut adalah konvensi *prefix* yang harus digunakan:

*   **`feat:`** Digunakan saat menambahkan fitur atau kapabilitas baru (contoh: `feat: add geospatial caching logic for Google Maps API`).
*   **`fix:`** Digunakan saat memperbaiki masalah atau *bug* (contoh: `fix: resolve hydration error on real-time stepper`).
*   **`refactor:`** Digunakan untuk merombak kode tanpa mengubah perilaku fungsionalnya (contoh: `refactor: simplify distance calculation module`).
*   **`style:`** Digunakan untuk perubahan UI/UX yang tidak mengubah logika, seperti CSS, warna, atau animasi Framer Motion (contoh: `style: apply royal blue theme and scanning animation`).
*   **`docs:`** Digunakan saat memperbarui dokumentasi atau file Markdown ini (contoh: `docs: update system design specification`).
*   **`chore:`** Digunakan untuk pembaruan rutin, instalasi *package*, atau konfigurasi *build* (contoh: `chore: setup Supabase client and environment variables`).
*   **`perf:`** Digunakan untuk perubahan yang meningkatkan performa sistem (contoh: `perf: implement image compression before upload`).

**Aturan Push:** Lakukan proses `git add`, `git commit`, dan `git push` setiap kali satu fungsi/fitur/modul berhasil berjalan di lingkungan *development*. Jangan menggabungkan terlalu banyak perubahan ke dalam satu *commit* besar.

