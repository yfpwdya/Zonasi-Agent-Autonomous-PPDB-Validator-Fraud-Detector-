"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { KKScannerPanel } from "@/components/forms/KKScannerPanel";
import { useApplications } from "@/hooks/useApplications";
import { usePanitiaSession } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const panitia = usePanitiaSession();
  const { data } = useApplications();
  const allApps = data?.applications ?? [];
  const [myTrackingIds, setMyTrackingIds] = useState<string[]>([]);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const syncMyIds = () => {
      try {
        const raw = window.sessionStorage.getItem("zonasi_my_tracking_ids");
        setMyTrackingIds(raw ? JSON.parse(raw) : []);
      } catch {
        setMyTrackingIds([]);
      }
    };
    syncMyIds();
    window.addEventListener("zonasi:my-apps-updated", syncMyIds);
    return () => window.removeEventListener("zonasi:my-apps-updated", syncMyIds);
  }, []);

  // ponytail: GSAP entrance + stagger sesuai UI/UX Pro Max & GSAP skill (compositor-only, menghormati prefers-reduced-motion)
  useEffect(() => {
    if (!pageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gsap='home-section']",
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // ponytail: di halaman publik (user), hanya tampilkan berkas yang baru saja dimasukkan oleh user pada sesi ini agar privasi pendaftar lain terjaga. Seluruh berkas lintas user tetap masuk otomatis ke /dashboard panitia.
  const myIdSet = new Set(myTrackingIds.map((id) => id.toUpperCase()));
  const apps = allApps.filter((a) => myIdSet.has(a.tracking_id.toUpperCase()));

  // Fungsi unduh Panduan Resmi PDF/HTML Cetak tanpa library tambahan (native Blob)
  const handleDownloadGuide = () => {
    const guideHtml = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"/><title>Panduan Resmi PPDB SMA Negeri 12 Surabaya TA 2026/2027</title>
<style>body{font-family:Arial,sans-serif;color:#1E293B;line-height:1.6;max-width:800px;margin:32px auto;padding:0 20px}h1,h2{color:#1E3A8A}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #CBD5E1;padding:10px;text-align:left}</style></head>
<body>
<h1>PANDUAN RESMI PPDB SMA NEGERI 12 SURABAYA (TA 2026/2027)</h1>
<p><strong>Alamat Sekolah:</strong> Jl. Sememi Kidul No.1, Sememi, Kec. Benowo, Surabaya 60198 | <strong>Radius Zonasi:</strong> 1.200 Meter</p>
<h2>1. Syarat Wajib Pendaftar</h2>
<ul>
<li>Berusia <strong>15 s.d. 17 tahun</strong> pada Tahun Ajaran 2026/2027 (tervalidasi otomatis dari Tanggal Lahir &amp; NIK KK).</li>
<li>Kartu Keluarga (KK) asli terbitan minimal 1 tahun sebelum pendaftaran dengan status hubungan keluarga <strong>ANAK KANDUNG</strong>.</li>
<li>Apabila KK baru (&lt; 1 tahun) karena pindah rumah satu keluarga atau wali sah, wajib melampirkan Berkas Pendukung (SKPWNI Dukcapil / Surat Tugas / Akta Perwalian).</li>
</ul>
<h2>2. Pembagian Kuota Jalur PPDB (Total 320 Siswa)</h2>
<table><tr><th>Jalur PPDB</th><th>Persentase</th><th>Daya Tampung</th></tr>
<tr><td>Jalur Zonasi (Radius Prioritas 1.200m)</td><td>50%</td><td>160 Siswa</td></tr>
<tr><td>Jalur Prestasi Akademik &amp; Non-Akademik</td><td>30%</td><td>96 Siswa</td></tr>
<tr><td>Jalur Afirmasi (KIP / PKH / Keluarga Tidak Mampu)</td><td>15%</td><td>48 Siswa</td></tr>
<tr><td>Jalur Perpindahan Tugas Orang Tua / Wali</td><td>5%</td><td>16 Siswa</td></tr></table>
</body></html>`;
    const blob = new Blob([guideHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Panduan-Resmi-PPDB-SMAN12-Surabaya-2026.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fungsi Widget Cek Status Cepat (Nomor Pendaftaran / NIK / Nama pada sesi user atau langsung ke /track/[id])
  const handleQuickStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuery.trim();
    if (!q) {
      setQuickFeedback("Masukkan Nomor Pendaftaran (contoh: PPDB-2026-XXXX) atau NIK Siswa terlebih dahulu.");
      return;
    }
    const upper = q.toUpperCase();
    if (upper.startsWith("PPDB-")) {
      setQuickFeedback(null);
      router.push(`/track/${encodeURIComponent(upper)}`);
      return;
    }
    const matched = apps.find(
      (a) =>
        a.tracking_id.toUpperCase() === upper ||
        a.student_nik === q ||
        a.kk_number === q ||
        a.student_name.toUpperCase().includes(upper),
    );
    if (matched) {
      setQuickFeedback(null);
      router.push(`/track/${encodeURIComponent(matched.tracking_id)}`);
      return;
    }
    setQuickFeedback(
      "Nomor tidak ditemukan pada riwayat sesi browser ini. Silakan masukkan Nomor Pendaftaran lengkap (format PPDB-2026-XXXX) atau unggah KK Anda pada formulir di bawah.",
    );
  };

  const registrationSteps = [
    {
      step: "01",
      icon: "person_add",
      title: "1. Registrasi Akun",
      desc: "Siapkan NISN/NIK calon peserta didik dan akses portal PPDB SMA Negeri 12 Surabaya tanpa perlu instalasi aplikasi tambahan.",
    },
    {
      step: "02",
      icon: "edit_document",
      title: "2. Isi Formulir",
      desc: "Sistem mengotomatisasi pengisian data dari Kartu Keluarga sehingga orang tua tidak perlu mengetik ulang NIK, alamat, dan tanggal lahir.",
    },
    {
      step: "03",
      icon: "upload_file",
      title: "3. Unggah Berkas",
      desc: "Unggah foto/scan Kartu Keluarga (KK) asli. Jika pindah domisili sah (< 1 tahun), lampirkan SKPWNI Dukcapil atau Surat Pindah Tugas.",
    },
    {
      step: "04",
      icon: "fact_check",
      title: "4. Verifikasi Panitia",
      desc: "Agen AI & Panitia PPDB memvalidasi usia SMA (15–17 thn), keaslian KK, dan jarak rute jalan raya OSRM ke SMAN 12 Surabaya.",
    },
    {
      step: "05",
      icon: "campaign",
      title: "5. Pengumuman",
      desc: "Pantau hasil seleksi secara real-time melalui Nomor Pendaftaran dan cetak bukti kelulusan resmi untuk daftar ulang.",
    },
  ];

  const quotaPathways = [
    {
      name: "Jalur Zonasi (Prioritas Radius 1.200m)",
      percent: 50,
      seats: 160,
      filled: Math.min(160, 128 + allApps.filter((a) => a.status === "APPROVED").length),
      icon: "my_location",
      badge: "Kuota Utama • 50%",
      desc: "Diperuntukkan bagi calon peserta didik yang berdomisili di wilayah zonasi SMA Negeri 12 Surabaya (Kec. Benowo & sekitarnya) berdasarkan jarak rute jalan raya terdekat.",
      highlight: true,
    },
    {
      name: "Jalur Prestasi Akademik & Non-Akademik",
      percent: 30,
      seats: 96,
      filled: 72,
      icon: "workspace_premium",
      badge: "Kuota • 30%",
      desc: "Seleksi berdasarkan gabungan rerata nilai rapor SMP/MTs semester 1–5 serta piagam kejuaraan akademik maupun olahraga/seni berjenjang.",
      highlight: false,
    },
    {
      name: "Jalur Afirmasi (Keluarga Ekonomi Tidak Mampu)",
      percent: 15,
      seats: 48,
      filled: 34,
      icon: "volunteer_activism",
      badge: "Kuota • 15%",
      desc: "Khusus bagi calon siswa dari keluarga penerima program KIP, PKH, KKS, atau terdaftar pada DTKS Dinas Sosial serta anak penyandang disabilitas.",
      highlight: false,
    },
    {
      name: "Jalur Perpindahan Tugas Orang Tua / Wali",
      percent: 5,
      seats: 16,
      filled: 11,
      icon: "transfer_within_a_station",
      badge: "Kuota • 5%",
      desc: "Bagi calon peserta didik yang mengikuti perpindahan tugas kedinasan orang tua/wali (ASN/TNI/Polri/BUMN) dibuktikan dengan SK Mutasi & SKPWNI.",
      highlight: false,
    },
  ];

  const scheduleTimeline = [
    {
      phase: "Tahap 1 — Sosialisasi & Uji Coba Verifikasi Mandiri KK",
      date: "01 – 08 November 2026",
      time: "08.00 – 21.00 WIB",
      status: "SELESAI",
      note: "Pengecekan titik koordinat rumah dan validasi usia calon siswa (15–17 tahun).",
    },
    {
      phase: "Tahap 2 — Pendaftaran & Unggah Berkas KK Jalur Zonasi",
      date: "09 – 25 November 2026",
      time: "Layanan Online 24 Jam",
      status: "BERLANGSUNG",
      note: "Unggah Kartu Keluarga (KK) pada pemindai AI di bawah untuk verifikasi otomatis.",
    },
    {
      phase: "Tahap 3 — Verifikasi Faktual & Validasi Berkas Bersyarat oleh Panitia",
      date: "10 – 26 November 2026",
      time: "07.30 – 16.00 WIB",
      status: "BERLANGSUNG",
      note: "Peninjauan berkas pindah domisili (SKPWNI/SK Mutasi) di Dashboard Panitia SMAN 12 Surabaya.",
    },
    {
      phase: "Tahap 4 — Pengumuman Hasil Seleksi Resmi PPDB",
      date: "28 November 2026",
      time: "Pukul 10.00 WIB",
      status: "AKAN_DATANG",
      note: "Pengumuman kelulusan dapat dicek melalui Widget Cek Status Cepat di halaman ini.",
    },
    {
      phase: "Tahap 5 — Daftar Ulang Peserta Didik Baru yang Diterima",
      date: "30 Nov – 03 Des 2026",
      time: "08.00 – 15.00 WIB",
      status: "AKAN_DATANG",
      note: "Wajib membawa KK asli, Ijazah/SKL asli, dan Bukti Lulus Verifikasi PPDB.",
    },
  ];

  const faqItems = [
    {
      q: "Berapa batas usia calon peserta didik baru untuk masuk SMA Negeri 12 Surabaya?",
      a: "Sesuai juknis PPDB SMA Negeri, calon peserta didik wajib berusia antara 15 sampai dengan 17 tahun pada tahun ajaran berjalan (dan maksimal 21 tahun per 1 Juli). Sistem AI kami otomatis memilih anak yang berusia 15–17 tahun apabila terdapat lebih dari satu anak di dalam Kartu Keluarga.",
    },
    {
      q: "Bagaimana jika Kartu Keluarga (KK) saya baru diterbitkan kurang dari 1 tahun karena pindah rumah?",
      a: "Apabila KK baru diterbitkan kurang dari 1 tahun karena pindah domisili seluruh anggota keluarga (bukan titip KK pada famili lain), berkas akan masuk ke status Verifikasi Bersyarat (Kuning). Anda cukup mengunggah dokumen pendukung resmi seperti SKPWNI dari Dukcapil atau SK Pindah Tugas Orang Tua pada panel yang muncul.",
    },
    {
      q: "Apakah data NIK dan Nomor KK keluarga saya aman dan tidak bisa dilihat pendaftar lain?",
      a: "Sangat aman. Sesuai Undang-Undang Pelindungan Data Pribadi (UU PDP), tabel riwayat di halaman utama dikunci khusus untuk sesi browser Anda sendiri dan digit tengah NIK/KK disensor (357806******0004). Hanya Panitia Resmi PPDB SMAN 12 Surabaya yang dapat melihat data lengkap di ruang pengawas.",
    },
    {
      q: "Bagaimana cara sistem menghitung jarak rumah ke SMA Negeri 12 Surabaya?",
      a: "Sistem tidak hanya menarik garis lurus, melainkan menggunakan mesin geospasial OpenStreetMap & OSRM untuk menghitung jarak rute jalan darat sebenarnya menuju gerbang SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Kec. Benowo, Surabaya, radius prioritas 1.200 meter).",
    },
  ];

  return (
    <div ref={pageRef} className="w-full text-[#1E293B]">
      {/* 1. HERO SECTION (SPLIT LAYOUT — 30% DOMINANT NAVY #1E3A8A + 10% AMBER CTA #F59E0B) */}
      <section
        id="beranda"
        data-gsap="home-section"
        className="relative overflow-hidden bg-[#1E3A8A] text-white border-b border-blue-900"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, #1E3A8A 0%, #172554 100%)",
          backgroundSize: "24px 24px, 100% 100%",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Kolom Kiri: Badge, Headline Tegas, Sub-headline, CTA Utama Amber & Unduh Panduan PDF */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs sm:text-sm font-bold tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
              <span>PPDB Tahun Ajaran 2026/2027 Resmi Dibuka • SMAN 12 Surabaya</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Penerimaan Peserta Didik Baru (PPDB) yang{" "}
              <span className="text-[#F59E0B]">Transparan, Akurat,</span> &amp; Ramah Orang Tua
            </h1>

            <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl">
              Selamat datang di portal resmi PPDB <strong>SMA Negeri 12 Surabaya</strong>. Cukup unggah{" "}
              <strong>Kartu Keluarga (KK)</strong> Anda — sistem AI langsung memvalidasi usia siswa SMA{" "}
              <strong>(15–17 Tahun)</strong>, keaslian domisili, serta menghitung jarak rute ke sekolah secara otomatis tanpa antre.
            </p>

            {/* Tombol CTA Utama (#F59E0B) & Tombol Sekunder (Outline Putih) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href="#scanner-kk"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                <span>Daftar Sekarang (Unggah KK)</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadGuide}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl border-2 border-white/80 hover:bg-white hover:text-[#1E3A8A] text-white font-bold text-sm sm:text-base transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Unduh Panduan PDF</span>
              </button>

              {panitia && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                  <span>Posko Panitia</span>
                </Link>
              )}
            </div>

            {/* Poin Keunggulan Singkat untuk Orang Tua */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/15 text-xs sm:text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">verified</span>
                <span>1x Upload KK Tanpa Ketik Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">shield_lock</span>
                <span>Privasi NIK &amp; KK Terlindungi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">route</span>
                <span>Radius Zonasi Resmi 1.200 Meter</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ilustrasi Visual Siswa/Siswi SMA & Floating Cards Statistik Real-Time */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-gradient-to-b from-blue-800/70 to-blue-950/90 border-2 border-white/20 p-5 sm:p-6 shadow-xl overflow-hidden">
              {/* Header Kartu Visual Sekolah */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-extrabold">
                    12
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                      SMA Negeri 12 Surabaya
                    </span>
                    <span className="text-[11px] text-blue-200">
                      Jl. Sememi Kidul No.1, Kec. Benowo
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#16A34A]/25 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                  Terakreditasi A
                </span>
              </div>

              {/* Ilustrasi SVG Siswa/Siswi SMA Rapi & Gerbang Sekolah */}
              <div className="my-4 rounded-xl bg-gradient-to-br from-[#F8FAFC] to-blue-50 p-4 text-[#1E293B] shadow-inner">
                <svg
                  viewBox="0 0 420 210"
                  className="w-full h-44 sm:h-48 object-cover rounded-lg"
                  role="img"
                  aria-label="Ilustrasi Siswa Siswi SMA Negeri 12 Surabaya"
                >
                  <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EFF6FF" />
                      <stop offset="100%" stopColor="#DBEAFE" />
                    </linearGradient>
                  </defs>
                  <rect width="420" height="210" rx="12" fill="url(#skyGrad)" />
                  {/* Gedung SMAN 12 Surabaya */}
                  <rect x="35" y="62" width="350" height="115" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                  <polygon points="20,62 210,18 400,62" fill="#1E3A8A" />
                  <rect x="155" y="42" width="110" height="22" rx="4" fill="#F59E0B" />
                  <text x="210" y="57" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1E293B">
                    SMAN 12 SURABAYA
                  </text>
                  {/* Jendela Gedung */}
                  <rect x="58" y="82" width="36" height="32" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
                  <rect x="108" y="82" width="36" height="32" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
                  <rect x="276" y="82" width="36" height="32" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
                  <rect x="326" y="82" width="36" height="32" rx="4" fill="#DBEAFE" stroke="#93C5FD" />
                  {/* Ilustrasi Siswa & Siswi Berseragam Putih Abu-abu */}
                  <circle cx="178" cy="112" r="18" fill="#FDE68A" stroke="#1E3A8A" strokeWidth="2" />
                  <path d="M160,108 Q178,90 196,108" fill="#1E293B" />
                  <rect x="156" y="132" width="44" height="58" rx="10" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="2" />
                  <polygon points="175,134 181,134 184,162 178,168 172,162" fill="#94A3B8" />
                  {/* Siswi */}
                  <circle cx="242" cy="114" r="18" fill="#FDE68A" stroke="#1E3A8A" strokeWidth="2" />
                  <path d="M222,116 Q242,88 262,116" fill="#1E3A8A" />
                  <rect x="220" y="132" width="44" height="58" rx="10" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="2" />
                  <rect x="230" y="146" width="24" height="16" rx="3" fill="#F59E0B" />
                  {/* Badge Zonasi 1200m */}
                  <rect x="12" y="14" width="128" height="26" rx="13" fill="#16A34A" />
                  <text x="76" y="31" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFFFFF">
                    ✓ Radius Zonasi 1.200m
                  </text>
                </svg>
              </div>

              {/* Floating Card Statistik Real-Time (Sesuai Spesifikasi Prompt) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#F59E0B]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
                    Total Kuota Penerimaan
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1E3A8A] mt-0.5">
                    320 Siswa
                  </div>
                  <span className="text-[11px] font-semibold text-[#16A34A] block mt-0.5">
                    10 Rombel • 4 Jalur Resmi
                  </span>
                </div>

                <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#16A34A]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
                    Sisa Waktu Pendaftaran
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#1E293B] mt-0.5">
                    12 Hari
                  </div>
                  <span className="text-[11px] font-semibold text-[#D97706] block mt-0.5">
                    Tutup: 25 Nov 2026 (23:59)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WIDGET CEK STATUS CEPAT (BG PUTIH BERSIH #FFFFFF - TERHUBUNG KE SISTEM PELACAKAN) */}
      <section
        id="cek-status-cepat"
        data-gsap="home-section"
        className="bg-[#FFFFFF] border-b border-slate-200 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">
                  manage_search
                </span>
                <span>Widget Cek Status Cepat PPDB</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
                Sudah Mengunggah KK? Cek Status Verifikasi Berkas Anda
              </h2>
              <p className="text-xs sm:text-sm text-[#475569]">
                Masukkan <strong>Nomor Pendaftaran</strong> (contoh: <code>PPDB-2026-XXXX</code>) atau <strong>NIK / NISN</strong> yang baru Anda daftarkan untuk membuka lembar inspeksi forensik secara langsung.
              </p>
            </div>

            <form
              onSubmit={handleQuickStatusSearch}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto lg:min-w-[460px]"
            >
              <div className="relative flex-1">
                <span className="material-symbols-outlined text-[20px] text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2">
                  badge
                </span>
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => {
                    setQuickQuery(e.target.value);
                    if (quickFeedback) setQuickFeedback(null);
                  }}
                  placeholder="Ketik No. Pendaftaran (PPDB-2026-...) atau NIK"
                  aria-label="Nomor Pendaftaran atau NIK Siswa"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FFFFFF] border border-slate-300 text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-sm transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Cek Status</span>
              </button>
            </form>
          </div>

          {quickFeedback && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs sm:text-sm text-[#D97706] font-semibold flex items-center justify-between gap-3">
              <span>{quickFeedback}</span>
              <a href="#scanner-kk" className="underline font-bold text-[#1E3A8A] shrink-0">
                Unggah KK Sekarang ↓
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 3. SEKSI ALUR PENDAFTARAN (5 LANGKAH VISUAL — BG ABU-ABU MUDA #F8FAFC) */}
      <section
        id="alur-pendaftaran"
        data-gsap="home-section"
        className="bg-[#F8FAFC] py-14 sm:py-16 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
              Panduan Langkah demi Langkah
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              5 Langkah Mudah Alur Pendaftaran PPDB
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Dirancang khusus agar orang tua/wali murid dan calon siswa dapat menyelesaikan pendaftaran serta verifikasi berkas Kartu Keluarga dalam hitungan detik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {registrationSteps.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-xl bg-[#FFFFFF] border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {/* Lingkaran Biru Navy #1E3A8A dengan Aksen Kuning #F59E0B */}
                    <div className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white ring-4 ring-[#F59E0B]/30 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[22px] text-[#F59E0B]">
                        {item.icon}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-slate-200 font-mono text-xs font-extrabold text-[#1E3A8A]">
                      LANGKAH {item.step}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-[#1E293B]">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1E3A8A]">
                  <span>{idx === 2 ? "Otomatis via AI Vision" : "Bebas Biaya (Gratis)"}</span>
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SEKSI JALUR PPDB & KUOTA (INTERACTIVE CARDS + PROGRESS BAR — BG PUTIH #FFFFFF) */}
      <section
        id="jalur-kuota"
        data-gsap="home-section"
        className="bg-[#FFFFFF] py-14 sm:py-16 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-[#D97706] text-xs font-extrabold uppercase tracking-wider">
                Daya Tampung Resmi • Total 320 Kursi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Jalur Penerimaan PPDB &amp; Keterisian Kuota
              </h2>
              <p className="text-sm sm:text-base text-[#475569]">
                Komposisi kuota resmi SMA Negeri 12 Surabaya mengacu pada Peraturan Menteri Pendidikan dan Juknis Dinas Pendidikan Provinsi Jawa Timur.
              </p>
            </div>
            <a
              href="#scanner-kk"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-extrabold text-xs sm:text-sm shadow-sm transition-all self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>Uji Kelayakan Zonasi KK Anda →</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quotaPathways.map((p) => {
              const fillRatio = Math.min(100, Math.round((p.filled / p.seats) * 100));
              return (
                <div
                  key={p.name}
                  className={`rounded-xl p-6 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-5 ${
                    p.highlight
                      ? "bg-[#F8FAFC] border-2 border-[#1E3A8A]"
                      : "bg-[#FFFFFF] border-slate-200"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-[#F59E0B] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                        </div>
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] text-[11px] font-extrabold">
                            {p.badge}
                          </span>
                          <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B] mt-0.5">
                            {p.name}
                          </h3>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-extrabold text-[#1E3A8A] block leading-none">
                          {p.percent}%
                        </span>
                        <span className="text-xs font-semibold text-[#475569]">
                          {p.seats} Kursi
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">{p.desc}</p>
                  </div>

                  {/* Progress Bar Keterisian Kuota */}
                  <div className="space-y-2 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#475569]">
                        Pendaftar Terverifikasi: <strong className="text-[#1E293B]">{p.filled}</strong> dari{" "}
                        <strong>{p.seats} Kursi</strong>
                      </span>
                      <span className="text-[#16A34A]">{fillRatio}% Terisi</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.highlight ? "bg-[#1E3A8A]" : "bg-[#16A34A]"
                        }`}
                        style={{ width: `${fillRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SEKSI PERSYARATAN RESMI & MESIN UTAMA PEMINDAI KK AI (FUNGSIONAL INTI 100% UTUH) */}
      <section
        id="syarat-pendaftaran"
        data-gsap="home-section"
        className="bg-[#F8FAFC] py-14 sm:py-16 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Ringkasan Syarat Wajib (Ramah Orang Tua) */}
          <div className="rounded-xl bg-[#FFFFFF] border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                  Syarat Dokumen &amp; Kriteria Kelayakan Otomatis
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B]">
                  Ketentuan Wajib Verifikasi Kartu Keluarga (KK) SMA Negeri 12 Surabaya
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#16A34A]">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>1x Single-Pass AI Vision Aktif</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-1">
                <div className="font-extrabold text-[#1E3A8A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#16A34A]">
                    cake
                  </span>
                  <span>1. Usia Masuk SMA (15–17 Tahun)</span>
                </div>
                <p className="text-[#475569] leading-relaxed">
                  Calon siswa wajib berusia <strong>15–17 tahun</strong>. Jika ada beberapa anak di dalam KK, AI otomatis memilih kandidat anak usia SMA.
                </p>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-1">
                <div className="font-extrabold text-[#1E3A8A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">
                    family_restroom
                  </span>
                  <span>2. Masa Terbit KK &amp; Status Keluarga</span>
                </div>
                <p className="text-[#475569] leading-relaxed">
                  KK wajib terbit minimal <strong>1 tahun</strong> dengan status <strong>Anak Kandung</strong>. Pindah rumah sah (&lt;1 thn) wajib melampirkan SKPWNI Dukcapil.
                </p>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-1">
                <div className="font-extrabold text-[#1E3A8A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#16A34A]">
                    pin_drop
                  </span>
                  <span>3. Radius Zonasi Rute 1.200 Meter</span>
                </div>
                <p className="text-[#475569] leading-relaxed">
                  Jarak dihitung otomatis dari alamat KK ke <strong>SMAN 12 Surabaya (Jl. Sememi Kidul No.1)</strong> menggunakan rute jalan raya OSRM.
                </p>
              </div>
            </div>
          </div>

          {/* Mesin Utama: Upload File Kartu Keluarga & Deteksi Real-Time (TIDAK DIUBAH FUNGSIONALNYA) */}
          <KKScannerPanel
            onAuditCompleted={(createdApp) => {
              setMyTrackingIds((prev) =>
                Array.from(new Set([createdApp.tracking_id, ...prev])),
              );
            }}
          />

          {/* Daftar Berkas KK Milik User Ini Saja (Privasi Terjaga, Data User Lain Disensor/Disembunyikan) */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-[#1E293B]">
                    Riwayat Berkas Kartu Keluarga Anda ({apps.length} Berkas)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-[11px] font-bold border border-emerald-200">
                    Privasi Aktif • Hanya Menampilkan Berkas Sesi Anda
                  </span>
                </div>
                <p className="text-xs text-[#475569] mt-0.5">
                  Demi privasi data kependudukan (UU PDP), riwayat di halaman ini hanya menampilkan berkas KK yang Anda unggah sendiri. Seluruh data pendaftar terintegrasi penuh di Dashboard Panitia.
                </p>
              </div>
              <Link
                href={panitia ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs text-[#1E3A8A] font-extrabold hover:underline"
              >
                <span>Lihat Semua Berkas di Dashboard Panitia →</span>
              </Link>
            </div>

            {apps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] p-8 text-center space-y-2">
                <span className="material-symbols-outlined text-[#475569] text-[32px]">
                  lock_person
                </span>
                <p className="text-sm font-bold text-[#1E293B]">
                  Belum Ada Berkas Kartu Keluarga yang Anda Unggah di Sesi Ini
                </p>
                <p className="text-xs text-[#475569] max-w-md mx-auto">
                  Data pendaftar lain disembunyikan demi keamanan NIK &amp; Nomor KK. Silakan unggah file Kartu Keluarga Anda pada formulir di atas untuk melihat hasil audit dan riwayat Anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#475569] text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3">ID Audit</th>
                      <th className="py-2.5 px-3">Nama Anak &amp; NIK (Hasil OCR KK)</th>
                      <th className="py-2.5 px-3">No. KK &amp; Terbit</th>
                      <th className="py-2.5 px-3">Relasi &amp; Skor OCR</th>
                      <th className="py-2.5 px-3">Alamat KK &amp; Jarak</th>
                      <th className="py-2.5 px-3">Keputusan AI</th>
                      <th className="py-2.5 px-3 text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {apps.map((a) => (
                      <tr key={a.tracking_id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-3 font-mono font-bold text-[#1E3A8A]">
                          {a.tracking_id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#1E293B]">{a.student_name}</div>
                          <div className="font-mono text-[11px] text-[#475569]">
                            NIK:{" "}
                            {a.student_nik
                              ? `${a.student_nik.slice(0, 6)}******${a.student_nik.slice(-4)}`
                              : "-"}
                          </div>
                          <div
                            className={`font-mono text-[11px] font-bold ${
                              (a.student_age_valid ?? true)
                                ? "text-[#16A34A]"
                                : "text-[#DC2626]"
                            }`}
                          >
                            Lahir: {a.student_birth_date || "-"} (
                            {Math.floor(a.student_age_years ?? 16)} Thn{" "}
                            {(a.student_age_valid ?? true) ? "✓" : "✗ Anomali Usia"})
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div>
                            {a.kk_number
                              ? `${a.kk_number.slice(0, 6)}******${a.kk_number.slice(-4)}`
                              : "-"}
                          </div>
                          <div className="text-[11px] text-[#475569]">
                            {a.kk_issue_date} ({a.kk_age_label})
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div>{a.family_relation || "ANAK_KANDUNG"}</div>
                          <div className="text-[11px] text-[#475569]">
                            OCR: {a.ocr_confidence}%
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="truncate text-[#1E293B] font-medium">
                            {a.address_text || a.address}
                          </div>
                          <div className="font-mono text-[11px] text-[#475569]">
                            Rute: {a.real_route_distance_meters}m • {a.detected_building}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                              a.status === "APPROVED"
                                ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                                : a.status === "REJECTED"
                                ? "bg-red-50 text-[#DC2626] border border-red-200"
                                : "bg-amber-50 text-[#D97706] border border-amber-200"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/track/${encodeURIComponent(a.tracking_id)}`}
                            className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs inline-block"
                          >
                            Inspeksi →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. SEKSI JADWAL PENTING (TIMELINE TABLE — BG PUTIH #FFFFFF) */}
      <section
        id="jadwal-penting"
        data-gsap="home-section"
        className="bg-[#FFFFFF] py-14 sm:py-16 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
              Kalender Resmi PPDB 2026/2027
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Jadwal Penting Pelaksanaan PPDB SMA Negeri 12 Surabaya
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Catat tanggal tahapan berikut agar tidak melewati batas waktu unggah berkas maupun daftar ulang.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#FFFFFF] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E3A8A] text-white text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Tahapan Kegiatan PPDB</th>
                    <th className="py-3.5 px-4 font-bold">Tanggal Pelaksanaan</th>
                    <th className="py-3.5 px-4 font-bold">Jam Layanan</th>
                    <th className="py-3.5 px-4 font-bold">Status Tahapan</th>
                    <th className="py-3.5 px-4 font-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {scheduleTimeline.map((row) => (
                    <tr
                      key={row.phase}
                      className={
                        row.status === "BERLANGSUNG"
                          ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                          : "hover:bg-[#F8FAFC]"
                      }
                    >
                      <td className="py-4 px-4 font-bold text-[#1E293B]">{row.phase}</td>
                      <td className="py-4 px-4 font-semibold text-[#1E3A8A] whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-4 px-4 text-[#475569] whitespace-nowrap">{row.time}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {row.status === "BERLANGSUNG" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#16A34A] text-xs font-extrabold border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                            <span>Sedang Berlangsung</span>
                          </span>
                        ) : row.status === "SELESAI" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#475569] text-xs font-bold border border-slate-200">
                            <span className="material-symbols-outlined text-[14px] text-[#16A34A]">
                              check_circle
                            </span>
                            <span>Telah Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#475569] text-xs font-semibold border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>Akan Datang</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#475569]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SEKSI FAQ (TANYA JAWAB ORANG TUA & CALON SISWA — BG ABU-ABU MUDA #F8FAFC) */}
      <section
        id="faq-ppdb"
        data-gsap="home-section"
        className="bg-[#F8FAFC] py-14 sm:py-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
              Pusat Informasi Orang Tua &amp; Wali Murid
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Jawaban jelas atas pertanyaan umum seputar aturan zonasi, usia siswa, dan verifikasi Kartu Keluarga.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-xl bg-[#FFFFFF] border border-slate-200 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-extrabold text-[#1E293B]">
                      {item.q}
                    </span>
                    <span className="material-symbols-outlined text-[#1E3A8A] shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
