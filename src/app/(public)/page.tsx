"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { KKScannerPanel } from "@/components/forms/KKScannerPanel";
import { useApplications } from "@/hooks/useApplications";

// ponytail: sensor NIK & Nomor KK untuk tampilan riwayat publik agar privasi terjaga
function maskSensitiveNumber(val?: string) {
  if (!val) return "-";
  const clean = String(val).trim();
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 6)}******${clean.slice(-4)}`;
}

const VERIFICATION_STEPS = [
  {
    step: "01",
    icon: "upload_file",
    title: "Input / Unggah KK",
    desc: "Panitia atau pendaftar mengunggah foto/scan Kartu Keluarga (JPG/PNG) atau memilih skenario sampel uji berkas.",
  },
  {
    step: "02",
    icon: "document_scanner",
    title: "Pembacaan Data KK Otomatis",
    desc: "Sistem membaca seluruh tabel anggota keluarga, NIK, tanggal terbit KK, dan memilih kandidat usia SMA (15–17 tahun).",
  },
  {
    step: "03",
    icon: "route",
    title: "Perhitungan Jarak & Rute Jalan",
    desc: "Koordinat alamat KK dihitung terhadap lokasi sekolah tujuan menggunakan pengukuran garis lurus dan rute jalan darat aktual.",
  },
  {
    step: "04",
    icon: "policy",
    title: "Deteksi Kecurangan & Titip KK",
    desc: "Sistem mengevaluasi usia domisili KK (<1 tahun), status hubungan keluarga (Anak Kandung vs Famili Lain), dan jenis bangunan tempat tinggal.",
  },
  {
    step: "05",
    icon: "gavel",
    title: "Keputusan & Peninjauan Panitia",
    desc: "Status kelayakan berkas terbit otomatis dan dapat ditinjau atau ditetapkan ulang melalui Dashboard Pengawas Panitia.",
  },
];

const PPDB_QUOTA_PATHS = [
  {
    id: "zonasi",
    name: "Jalur Zonasi (Fokus Utama Zonasi-Agent)",
    pct: 50,
    quota: 160,
    filledBase: 142,
    icon: "my_location",
    badge: "Prioritas Verifikasi Zonasi",
    desc: "Verifikasi otomatis radius ≤ 1.200 m dari lokasi sekolah tujuan (SMAN 12 Surabaya), masa terbit KK minimal 1 tahun, & status hubungan keluarga Anak Kandung.",
  },
  {
    id: "perpindahan",
    name: "Perpindahan Domisili / Tugas Orang Tua (Terkait KK < 1 Tahun)",
    pct: 5,
    quota: 16,
    filledBase: 11,
    icon: "transfer_within_a_station",
    badge: "Verifikasi Berkas Bersyarat",
    desc: "Validasi berkas bersyarat SKPWNI Dukcapil / SK Pindah Tugas Orang Tua bagi pendaftar zonasi yang Kartu Keluarganya terbit kurang dari 1 tahun.",
  },
];

const AUDIT_TIMELINE = [
  {
    phase: "Tahap 1 • Penetapan Wilayah & Aturan Zonasi",
    actor: "Sistem & Konfigurasi",
    desc: "Penetapan koordinat lokasi sekolah tujuan (SMAN 12 Surabaya: -7.2468, 112.6358), batas radius 1.200 m, dan syarat usia SMA (15–17 tahun).",
    status: "SELESAI",
  },
  {
    phase: "Tahap 2 • Pemindaian KK & Verifikasi Domisili Otomatis",
    actor: "Zonasi-Agent Otomatis",
    desc: "Pembacaan otomatis berkas KK, perhitungan jarak rute jalan darat, deteksi indikasi titip KK, dan pemeriksaan berkas bersyarat SKPWNI.",
    status: "BERLANGSUNG",
  },
  {
    phase: "Tahap 3 • Peninjauan Berkas & Keputusan Panitia",
    actor: "Verifikator Panitia PPDB",
    desc: "Pemeriksaan berkas yang memerlukan revisi atau terindikasi kecurangan pada Dashboard Panitia serta peninjauan bukti foto rumah ber-geotag.",
    status: "BERLANGSUNG",
  },
  {
    phase: "Tahap 4 • Ekspor Berita Acara & Penetapan Final",
    actor: "Ketua Verifikator Panitia",
    desc: "Penguncian hasil verifikasi dan pengunduhan Berita Acara resmi (CSV/Excel) oleh Ketua Verifikator Panitia PPDB.",
    status: "SIAP_EKSPOR",
  },
];

const FAQ_ITEMS = [
  {
    q: "Apa fungsi utama Zonasi-Agent bagi Panitia PPDB?",
    a: "Zonasi-Agent adalah sistem verifikasi dan deteksi kecurangan PPDB yang membantu panitia memindai Kartu Keluarga (KK) secara instan, memilih otomatis anggota keluarga usia SMA (15–17 tahun), menghitung jarak rute jalan darat ke sekolah tujuan, dan mendeteksi indikasi kecurangan 'titip KK'.",
  },
  {
    q: "Bagaimana perhitungan jarak domisili ke SMA Negeri 12 Surabaya dilakukan?",
    a: "Alamat pada Kartu Keluarga dipetakan secara otomatis terhadap titik koordinat SMA Negeri 12 Surabaya (-7.2468, 112.6358 dengan batas radius zonasi 1.200 meter) untuk menghitung jarak garis lurus sekaligus jarak rute jalan darat secara presisi.",
  },
  {
    q: "Bagaimana jika KK baru diterbitkan kurang dari 1 tahun karena pindah rumah satu keluarga yang sah?",
    a: "Sistem akan menandai berkas sebagai Perlu Revisi / Verifikasi Berkas Bersyarat dan membuka formulir unggah dokumen resmi seperti SKPWNI Dukcapil, SK Pindah Tugas Orang Tua, atau Foto Rumah Geotag untuk disetujui panitia.",
  },
  {
    q: "Apakah riwayat pemindaian KK pengguna lain dapat dilihat oleh publik?",
    a: "Tidak. Tabel riwayat di halaman depan diisolasi hanya untuk sesi perangkat saat ini dan seluruh digit tengah NIK serta Nomor KK disensor otomatis (contoh: 357806******0004). Seluruh antrean lengkap hanya dapat diakses oleh Panitia resmi di halaman Dashboard.",
  },
];

export default function PublicTrackingPage() {
  const router = useRouter();
  const { data, isLoading } = useApplications();
  const apps = data?.applications ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusLookupQuery, setStatusLookupQuery] = useState("");
  const [statusLookupError, setStatusLookupError] = useState("");
  const [myTrackingIds, setMyTrackingIds] = useState<string[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const mainRef = useRef<HTMLElement | null>(null);

  // GSAP Stagger Reveal Animation (UI/UX Pro Max motion guideline, respects prefers-reduced-motion)
  useEffect(() => {
    if (!mainRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gsap='home-section']",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }, mainRef);
    return () => ctx.revert();
  }, []);

  // Baca daftar tracking_id milik sesi browser user saat ini
  useEffect(() => {
    const syncMyIds = () => {
      try {
        const raw = sessionStorage.getItem("zonasi_my_tracking_ids");
        setMyTrackingIds(raw ? JSON.parse(raw) : []);
      } catch {
        setMyTrackingIds([]);
      }
    };
    syncMyIds();
    window.addEventListener("zonasi-session-updated", syncMyIds);
    window.addEventListener("zonasi:my-apps-updated", syncMyIds);
    window.addEventListener("storage", syncMyIds);
    return () => {
      window.removeEventListener("zonasi-session-updated", syncMyIds);
      window.removeEventListener("zonasi:my-apps-updated", syncMyIds);
      window.removeEventListener("storage", syncMyIds);
    };
  }, [apps.length]);

  // Hanya tampilkan riwayat milik user di sesi ini (bukan data user lain yang upload sebelumnya)
  const myApps = apps.filter((a) => myTrackingIds.includes(a.tracking_id));

  const filtered = myApps.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.tracking_id.toLowerCase().includes(q) ||
      a.student_name.toLowerCase().includes(q) ||
      a.student_nik.toLowerCase().includes(q) ||
      a.kk_number.toLowerCase().includes(q)
    );
  });

  const approvedCount = apps.filter((a) => a.status === "APPROVED").length;
  const revisionCount = apps.filter(
    (a) => a.status === "NEEDS_REVISION" || a.status === "NEEDS_LIVE_PHOTO",
  ).length;
  const rejectedCount = apps.filter((a) => a.status === "REJECTED").length;

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusLookupError("");
    const q = statusLookupQuery.trim();
    if (!q) {
      setStatusLookupError("Masukkan Nomor Berkas (contoh: PPDB-2026-8821) atau 16 digit NIK/KK.");
      return;
    }
    const found = apps.find(
      (a) =>
        a.tracking_id.toLowerCase() === q.toLowerCase() ||
        a.student_nik === q ||
        a.kk_number === q,
    );
    if (found) {
      router.push(`/track/${encodeURIComponent(found.tracking_id)}`);
      return;
    }
    if (q.toUpperCase().startsWith("PPDB-")) {
      router.push(`/track/${encodeURIComponent(q.toUpperCase())}`);
      return;
    }
    setStatusLookupError(
      `Berkas dengan nomor "${q}" belum ditemukan di antrean. Silakan pindai Kartu Keluarga terlebih dahulu di bawah.`,
    );
  };

  const handleDownloadSOP = () => {
    const guideContent = [
      "DOKUMEN SOP TEKNIS PANITIA — ZONASI-AGENT (SISTEM VERIFIKASI & DETEKSI KECURANGAN PPDB)",
      "=======================================================================================",
      "1. LOKASI SEKOLAH TUJUAN ZONASI:",
      "   - Sekolah Tujuan       : SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Kec. Benowo)",
      "   - Koordinat Sekolah    : -7.2468, 112.6358",
      "   - Radius Zonasi Resmi  : Maksimal 1.200 Meter",
      "",
      "2. PARAMETER VERIFIKASI OTOMATIS:",
      "   - Usia Calon Siswa SMA : 15 s.d. 17 Tahun (otomatis memilih kandidat Anak Kandung yang memenuhi usia)",
      "   - Masa Terbit KK       : Minimal 1 tahun sebelum pendaftaran",
      "   - Hubungan Keluarga    : Anak Kandung (status Famili Lain dengan KK baru ditandai sebagai indikasi titip KK)",
      "   - Validasi Tempat Tinggal: Rumah Tinggal vs Bangunan Komersial/Ruko",
      "",
      "3. PROSEDUR PENANGANAN BERKAS BERSYARAT (PERLU REVISI):",
      "   - Untuk pindah rumah satu keluarga sah (< 1 tahun), unggah SKPWNI Dukcapil / SK Pindah Tugas Orang Tua.",
      "   - Panitia melakukan verifikasi akhir atau keputusan di halaman /dashboard.",
    ].join("\n");
    const blob = new Blob([guideContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SOP-Panitia-Zonasi-Agent-2026.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main ref={mainRef} className="flex-1 w-full">
      {/* 1. HERO SECTION (Split Layout — Biru Navy #1E3A8A + Pola Geometris Tipis + Identitas Zonasi-Agent) */}
      <section
        id="beranda"
        data-gsap="home-section"
        className="relative overflow-hidden bg-[#1E3A8A] text-white border-b-4 border-[#F59E0B]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, #1E3A8A 0%, #172554 100%)",
          backgroundSize: "24px 24px, 100% 100%",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline & Primary Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
                <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                  Zonasi-Agent • Sistem Verifikasi &amp; Audit Panitia PPDB Aktif
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.18]">
                Sistem Verifikasi Berkas &amp;{" "}
                <span className="text-[#F59E0B]">Deteksi Kecurangan</span> Zonasi PPDB Otomatis
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed max-w-2xl">
                Alat bantu resmi bagi <strong>Panitia Verifikator PPDB</strong> untuk memindai Kartu Keluarga (KK), memvalidasi usia masuk SMA (<strong>15–17 tahun</strong>), menghitung jarak rute jalan darat secara presisi, serta mendeteksi indikasi <em>titip KK</em> di wilayah zonasi <strong>SMA Negeri 12 Surabaya (Radius 1.200 m)</strong>.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <a
                  href="#scanner-kk"
                  className="px-6 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                  <span>Mulai Pindai &amp; Audit KK</span>
                </a>

                <Link
                  href="/dashboard"
                  className="px-5 py-3.5 rounded-xl border-2 border-white/80 hover:bg-white hover:text-[#1E3A8A] text-white font-bold text-sm sm:text-base transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                  <span>Buka Dashboard Panitia</span>
                </Link>

                <button
                  type="button"
                  onClick={handleDownloadSOP}
                  className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  <span>Unduh SOP Audit</span>
                </button>
              </div>

              {/* 3 Pilar Keunggulan Singkat */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/15 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">bolt</span>
                  <span className="text-white/90 font-medium">Pemindaian KK Otomatis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">route</span>
                  <span className="text-white/90 font-medium">Peta &amp; Jarak Rute Jalan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">gpp_maybe</span>
                  <span className="text-white/90 font-medium">Deteksi Titip KK &amp; Usia</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Radar Forensik AI & Floating Card Statistik Real-Time */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl bg-white/10 border border-white/20 p-5 sm:p-6 backdrop-blur-md shadow-xl">
                {/* Header Kartu Visual Forensik */}
                <div className="flex items-center justify-between pb-4 border-b border-white/15">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">radar</span>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-white">
                        Panel Pemantauan Zonasi-Agent
                      </div>
                      <div className="text-[11px] text-white/75">
                        Sekolah Tujuan: SMAN 12 Surabaya (Radius Zonasi 1.200 m)
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-extrabold uppercase tracking-wider">
                    AKTIF
                  </span>
                </div>

                {/* Visualisasi 3 Pilar Forensik AI */}
                <div className="my-4 rounded-xl bg-[#0F172A]/80 border border-white/15 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">person_check</span>
                      Seleksi Usia Calon Siswa SMA
                    </span>
                    <span className="font-code-sm text-xs font-bold text-[#4ADE80]">
                      15 – 17 Tahun (Otomatis)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">straighten</span>
                      Batas Radius Zonasi Sekolah
                    </span>
                    <span className="font-code-sm text-xs font-bold text-white">
                      ≤ 1.200 Meter (Rute Jalan)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">history_edu</span>
                      Syarat Masa Terbit KK
                    </span>
                    <span className="font-code-sm text-xs font-bold text-[#F59E0B]">
                      ≥ 1 Tahun / SKPWNI Sah
                    </span>
                  </div>

                  {/* Ringkasan Live Antrean Database */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white/5">
                      <div className="text-[10px] text-white/70 uppercase font-bold">Disetujui</div>
                      <div className="text-base font-extrabold text-[#4ADE80]">{approvedCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <div className="text-[10px] text-white/70 uppercase font-bold">Revisi/SKPWNI</div>
                      <div className="text-base font-extrabold text-[#FBBF24]">{revisionCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5">
                      <div className="text-[10px] text-white/70 uppercase font-bold">Indikasi Kecurangan</div>
                      <div className="text-base font-extrabold text-[#F87171]">{rejectedCount}</div>
                    </div>
                  </div>
                </div>

                {/* Floating Cards Statistik Real-Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#1E3A8A] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">groups</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                        Daya Tampung Sekolah
                      </div>
                      <div className="text-base font-extrabold text-[#1E293B]">
                        Total Kuota: 320 Siswa
                      </div>
                      <div className="text-[11px] text-[#16A34A] font-semibold">
                        {apps.length} Berkas Telah Diverifikasi
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#F59E0B] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">timer</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                        Masa Verifikasi Aktif
                      </div>
                      <div className="text-base font-extrabold text-[#1E293B]">
                        Sisa Waktu: 12 Hari
                      </div>
                      <div className="text-[11px] text-[#D97706] font-semibold">
                         {approvedCount} Lulus • {revisionCount} Revisi
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WIDGET CEK STATUS CEPAT (Floating Search Box di atas perbatasan Hero & Konten) */}
      <section
        id="cek-status-cepat"
        data-gsap="home-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20"
      >
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-md p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">manage_search</span>
                <span>Widget Lacak &amp; Inspeksi Berkas Cepat</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
                Buka Laporan Forensik 3 Pilar Berdasarkan Nomor Berkas / NIK
              </h2>
              <p className="text-xs sm:text-sm text-[#475569]">
                Masukkan Nomor Pendaftaran (<code className="font-code-sm font-bold text-[#1E3A8A]">PPDB-2026-XXXX</code>) atau 16 digit NIK untuk melihat hasil audit geospasial, kependudukan KK, dan status kelulusan.
              </p>
            </div>

            <form
              onSubmit={handleQuickLookup}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto lg:min-w-[460px]"
            >
              <div className="relative flex-1">
                <span className="material-symbols-outlined text-[20px] text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2">
                  badge
                </span>
                <input
                  type="text"
                  value={statusLookupQuery}
                  onChange={(e) => setStatusLookupQuery(e.target.value)}
                  placeholder="Ketik Nomor Pendaftaran (PPDB-2026-...) atau NIK"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Inspeksi Berkas</span>
              </button>
            </form>
          </div>

          {statusLookupError && (
            <div className="mt-3 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{statusLookupError}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. SEKSI ALUR VERIFIKASI AI (5 Langkah Visual Horizontal dengan Lingkaran Navy & Aksen Kuning) */}
      <section
        id="alur-verifikasi"
        data-gsap="home-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14"
      >
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
            Alur Verifikasi Otomatis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            5 Tahap Alur Kerja Verifikasi &amp; Deteksi Kecurangan Zonasi-Agent
          </h2>
          <p className="text-sm text-[#475569]">
            Dirancang agar Panitia PPDB maupun orang tua siswa dapat menguji kelayakan berkas Kartu Keluarga secara transparan, objektif, dan bebas manipulasi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {VERIFICATION_STEPS.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
              className="relative bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md hover:border-[#1E3A8A]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Ikon di dalam lingkaran biru navy dengan aksen kuning */}
                  <div className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm ring-4 ring-[#F59E0B]/30">
                    <span className="material-symbols-outlined text-[22px] text-[#F59E0B]">
                      {item.icon}
                    </span>
                  </div>
                  <span className="font-code-sm text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">
                    TAHAP {item.step}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1E293B] mb-1.5">
                  {idx + 1}. {item.title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-semibold text-[#1E3A8A]">
                <span>Otomatis &amp; Terukur</span>
                <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
                  arrow_forward
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. SEKSI PARAMETER JALUR PPDB & KUOTA TOLAK UKUR (Interactive Cards + Progress Bar) */}
      <section
        id="kuota-jalur"
        data-gsap="home-section"
        className="bg-[#FFFFFF] border-y border-[#E2E8F0] py-12 sm:py-14"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-extrabold uppercase tracking-wider">
                Informasi Daya Tampung &amp; Kuota Zonasi PPDB
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Kuota &amp; Cakupan Verifikasi Zonasi SMA Negeri 12 Surabaya
              </h2>
              <p className="text-sm text-[#475569] max-w-2xl">
                Fokus utama <strong>Zonasi-Agent</strong> adalah memverifikasi berkas <strong>Jalur Zonasi</strong> serta berkas bersyarat perpindahan domisili (SKPWNI / Pindah Tugas) secara akurat dan transparan.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#16A34A]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Kuota Tersedia
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                Hampir Penuh (&gt;85%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PPDB_QUOTA_PATHS.map((path) => {
              const dynamicFilled =
                path.id === "zonasi"
                  ? Math.min(path.quota, path.filledBase + approvedCount)
                  : path.filledBase;
              const fillRatio = Math.min(100, Math.round((dynamicFilled / path.quota) * 100));
              const isNearFull = fillRatio >= 85;

              return (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md hover:border-[#1E3A8A] transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] text-[#F59E0B]">
                          {path.icon}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] font-extrabold text-xs">
                        {path.pct}% Kuota
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#1E293B]">{path.name}</h3>
                      <p className="text-xs text-[#475569] mt-1 leading-relaxed">{path.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#475569]">
                        Terverifikasi:{" "}
                        <strong className="text-[#1E293B]">
                          {dynamicFilled} / {path.quota} Kursi
                        </strong>
                      </span>
                      <span
                        className={`font-code-sm font-bold ${
                          isNearFull ? "text-[#D97706]" : "text-[#16A34A]"
                        }`}
                      >
                        {fillRatio}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${fillRatio}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          isNearFull ? "bg-[#F59E0B]" : "bg-[#16A34A]"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#475569] pt-1">
                      <span>Sisa Kuota: {Math.max(0, path.quota - dynamicFilled)} Kursi</span>
                      <a
                        href="#scanner-kk"
                        className="font-bold text-[#1E3A8A] hover:underline"
                      >
                        Uji Jalur Ini →
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SEKSI INTI: AI KK FORENSIC SCANNER & FORM PENDAFTARAN/VERIFIKASI (100% Fungsional Utuh) */}
      <section
        id="syarat-berkas"
        data-gsap="home-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 space-y-6"
      >
        {/* Banner Parameter Aturan Forensik KK */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
                Parameter Validasi &amp; Pemindaian Berkas Kartu Keluarga Otomatis
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                Unggah dokumen Kartu Keluarga (JPG/PNG) di bawah ini. Sistem Zonasi-Agent otomatis memverifikasi{" "}
                <strong>Usia Masuk SMA (15–17 Tahun)</strong>, <strong>Masa Terbit KK (≥ 1 Tahun)</strong>,{" "}
                <strong>Status Anak Kandung</strong>, dan <strong>Jarak Rute Jalan Darat ≤ 1.200 m ke SMA Negeri 12 Surabaya</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#16A34A]">
              ✓ Usia 15–17 Tahun
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">
              ! Pindah Sah &lt;1 Thn Wajib SKPWNI
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#DC2626]">
              ✕ Titip KK / Ruko Ditolak
            </span>
          </div>
        </div>

        {/* Komponen Inti KKScannerPanel — TIDAK DIUBAH FUNGSINYA */}
        <KKScannerPanel />
      </section>

      {/* 6. TABEL RIWAYAT VERIFIKASI SESI USER (Privasi Terisolasi + Sensor NIK/KK) */}
      <section
        id="riwayat-sesi"
        data-gsap="home-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
      >
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#1E293B]">
                  Riwayat Pendaftaran &amp; Verifikasi KK Sesi Anda
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-code-sm text-[11px] font-bold">
                  Privasi Terlindungi • NIK/KK Disensor
                </span>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                Hanya menampilkan berkas Kartu Keluarga yang Anda pindai pada sesi perangkat ini ({myApps.length} berkas). Seluruh antrean global dikelola di Dashboard Panitia.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined text-[18px] text-[#475569] absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter nama atau nomor berkas..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] text-xs text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1E3A8A] text-white font-code-sm text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Pendaftaran</th>
                  <th className="py-3.5 px-4">Nama Calon Siswa</th>
                  <th className="py-3.5 px-4">NIK &amp; No. KK (Disensor)</th>
                  <th className="py-3.5 px-4">Jarak Rute Jalan</th>
                  <th className="py-3.5 px-4">Usia KK &amp; Bangunan</th>
                  <th className="py-3.5 px-4">Status Verifikasi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#475569]">
                      Memuat status verifikasi berkas Anda...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#475569] text-xs sm:text-sm">
                      Belum ada berkas KK yang Anda pindai pada sesi browser ini. Silakan unggah Kartu Keluarga pada panel{" "}
                      <a href="#scanner-kk" className="text-[#1E3A8A] font-bold underline">
                        Pemindai KK
                      </a>{" "}
                      di atas atau gunakan{" "}
                      <a href="#cek-status-cepat" className="text-[#1E3A8A] font-bold underline">
                        Widget Lacak Berkas Cepat
                      </a>
                      .
                    </td>
                  </tr>
                )}
                {filtered.map((app) => (
                  <tr
                    key={app.tracking_id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-code-sm text-xs font-bold text-[#1E3A8A]">
                      #{app.tracking_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1E293B]">
                      {app.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-code-sm text-xs text-[#475569]">
                      <div>NIK: {maskSensitiveNumber(app.student_nik)}</div>
                      <div className="text-[11px] opacity-80">
                        KK: {maskSensitiveNumber(app.kk_number)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-code-sm text-xs font-bold text-[#1E293B]">
                      {app.real_route_distance_meters} m
                    </td>
                    <td className="py-3.5 px-4 font-code-sm text-xs text-[#475569]">
                      {app.kk_age_label} • {app.detected_building}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-code-sm text-xs font-bold inline-flex items-center gap-1 ${
                          app.status === "REJECTED"
                            ? "bg-[#FEE2E2] text-[#DC2626]"
                            : app.status === "APPROVED"
                            ? "bg-[#DCFCE7] text-[#16A34A]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {app.status === "APPROVED"
                          ? "TERVERIFIKASI / LULUS"
                          : app.status === "REJECTED"
                          ? "DITOLAK / ANOMALI"
                          : "MENUNGGU PROSES"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/track/${encodeURIComponent(app.tracking_id)}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs hover:bg-[#172554] transition-all inline-flex items-center gap-1"
                      >
                        <span>Buka Inspeksi</span>
                        <span className="material-symbols-outlined text-[15px]">
                          arrow_forward
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. SEKSI ALUR TAHAPAN OPERASIONAL VERIFIKASI PANITIA (Tanpa Tanggal) */}
      <section
        id="jadwal-verifikasi"
        data-gsap="home-section"
        className="bg-[#FFFFFF] border-y border-[#E2E8F0] py-12 sm:py-14"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
                Alur Operasional Panitia PPDB
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Alur Tahapan Pemindaian &amp; Verifikasi Berkas
              </h2>
              <p className="text-sm text-[#475569]">
                Urutan kerja operasional sistem Zonasi-Agent mulai dari penetapan wilayah zonasi, pemindaian Kartu Keluarga otomatis, hingga penguncian Berita Acara panitia.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1E3A8A] text-white text-xs font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Tahapan Alur Verifikasi</th>
                  <th className="py-4 px-5">Pelaksana / Modul</th>
                  <th className="py-4 px-5 hidden md:table-cell">Rincian Proses Verifikasi</th>
                  <th className="py-4 px-5 text-right">Status Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-[#FFFFFF] text-sm">
                {AUDIT_TIMELINE.map((row) => (
                  <tr key={row.phase} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-5 font-extrabold text-[#1E293B]">
                      <div>{row.phase}</div>
                      <div className="text-xs font-normal text-[#475569] md:hidden mt-1">
                        {row.desc}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-code-sm text-xs sm:text-sm font-bold text-[#1E3A8A] whitespace-nowrap">
                      {row.actor}
                    </td>
                    <td className="py-4 px-5 text-xs sm:text-sm text-[#475569] hidden md:table-cell">
                      {row.desc}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {row.status === "BERLANGSUNG" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-extrabold border border-[#86EFAC]">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]" />
                          </span>
                          Aktif Berjalan
                        </span>
                      ) : row.status === "SELESAI" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-bold">
                          <span className="material-symbols-outlined text-[15px]">
                            check_circle
                          </span>
                          Terkonfigurasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-semibold">
                          <span className="material-symbols-outlined text-[15px]">fact_check</span>
                          Siap Diekspor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. SEKSI FAQ (Pertanyaan Umum Teknis Panitia & Verifikasi KK) */}
      <section
        id="faq-panitia"
        data-gsap="home-section"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 space-y-8"
      >
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
            Dokumentasi &amp; Tanya Jawab Sistem
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-sm text-[#475569]">
            Panduan singkat mengenai mekanisme kerja Zonasi-Agent, ketentuan radius zonasi SMA Negeri 12 Surabaya, dan prosedur verifikasi panitia.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <span className="text-sm sm:text-base font-extrabold text-[#1E293B]">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-[#1E3A8A]"
                  >
                    expand_more
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
