"use client";
import { useState } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";

export default function HomePage() {
  const [trackQuery, setTrackQuery] = useState("");
  const [showQuickResult, setShowQuickResult] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [complaintSent, setComplaintSent] = useState(false);

  return (
    <FadeIn>
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-tint-blue via-surface to-surface-canvas pt-space-xl pb-24">
        {/* Ambient Sapphire Glow Orbs */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-48 right-[-100px] w-80 h-80 bg-secondary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-margin relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-space-md">
            {/* Innovation Badge */}
            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-canvas text-secondary shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                verified_user
              </span>
              {' '}
              <span className="font-code-sm text-code-sm font-semibold tracking-wide">
                Inovasi Smart Governance PPDB 2026/2027 • Berbasis Agentic AI & Supabase Cloud
              </span>
            </div>
            {/* Main Title & Typographic Scale */}
            <h1 className="font-headline-xl text-headline-xl text-text-heading tracking-tight sm:text-5xl font-extrabold max-w-3xl leading-tight">
              Sistem Zonasi Transparan, Adil, dan{' '}
              <span className="text-primary-container relative inline-block underline decoration-secondary decoration-4 underline-offset-8">
                Bebas Titip KK
              </span>
            </h1>
            {/* Subheadline */}
            <p className="font-body-lg text-body-lg text-text-muted max-w-2xl leading-relaxed">
              Validasi otomatis integritas Kartu Keluarga, kalkulasi rute darat riil PostGIS berpresisi tinggi, dan audit tata ruang visual Street View dalam hitungan detik.
            </p>
            {/* Interactive Quick Tracking Bar */}
            <div className="w-full max-w-2xl mt-4">
              <form
                className="p-2 rounded-2xl bg-surface-canvas shadow-xl flex flex-col sm:flex-row gap-2"
                id="trackingForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowQuickResult(true);
                }}
              >
                <div className="relative flex-1 flex items-center pl-3">
                  <span className="material-symbols-outlined text-text-muted text-[22px]">
                    search
                  </span>
                  <input
                    className="w-full pl-2 pr-3 py-3 bg-transparent text-text-heading font-code-md text-code-md placeholder:text-text-muted/60 focus:outline-none"
                    id="trackingInput"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Masukkan Tracking ID (cth: PPDB-2026-X89K) atau NIK..."
                    required
                    type="text"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-full sm:w-auto px-space-md py-3.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary transition-all flex items-center justify-center gap-space-xs"
                    type="submit"
                  >
                    <span>Cek Status AI</span>{' '}
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                  <Link
                    className="hidden sm:inline-flex px-space-md py-3.5 rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg hover:bg-surface-tint-blue transition-all items-center"
                    href="/daftar"
                  >
                    Daftar
                  </Link>
                </div>
              </form>
              {/* Quick Status Indicator */}
              {showQuickResult && (
                <div
                  className="mt-3 p-3 rounded-xl bg-status-approved-bg text-status-approved text-left flex items-center justify-between shadow-sm animate-fadeIn"
                  id="quickResult"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">
                      check_circle
                    </span>{' '}
                    <span className="font-body-sm text-body-sm font-semibold">
                      Berkas ID{' '}
                      <span className="font-code-sm">
                        {trackQuery.trim() || "PPDB-2026-X89K"}
                      </span>
                      : Tervalidasi Sah (Rute Jarak: 842m, Status KK: Memenuhi Syarat {'>'}1 Thn)
                    </span>
                  </div>
                  <Link
                    href={`/track/${encodeURIComponent(trackQuery.trim() || "PPDB-2026-X89K")}`}
                    className="font-code-sm text-code-sm bg-surface-canvas px-2 py-0.5 rounded-full shadow-xs hover:underline"
                  >
                    99.4% AI Score →
                  </Link>
                </div>
              )}
            </div>
            {/* Trust Badges */}
            <div className="pt-space-md flex flex-wrap items-center justify-center gap-y-3 gap-x-6">
              <div className="flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-card shadow-sm text-text-body font-label-md text-label-md">
                <span className="w-2.5 h-2.5 rounded-full bg-status-approved" />
                {' '}
                <span className="font-bold text-text-heading">
                  99.8%
                </span>
                {' '}Deteksi Anomali Dokumen
              </div>
              <div className="flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-card shadow-sm text-text-body font-label-md text-label-md">
                <span className="w-2.5 h-2.5 rounded-full bg-status-approved" />
                {' '}
                <span className="font-bold text-text-heading">
                  0 Toleransi
                </span>
                {' '}Manipulasi Jarak
              </div>
              <div className="flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-card shadow-sm text-text-body font-label-md text-label-md">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                {' '}
                <span className="font-bold text-text-heading">
                  100% Realtime
                </span>
                {' '}WebSocket Audit
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* STATISTIK TRANSPARANSI NASIONAL / DAERAH (BENTO METRIC TILES) */}
      <section className="w-full -mt-10 mb-16 relative z-20">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Metric Card 1 */}
            <div className="p-space-lg rounded-2xl bg-surface-canvas shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-label-md text-label-md uppercase tracking-wider">
                  Audit Berkas
                </span>
                <div className="w-10 h-10 rounded-xl bg-surface-tint-blue flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[22px]">
                    assignment_turned_in
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="font-code-lg text-3xl font-extrabold text-text-heading tracking-tight">
                  142.580+
                </span>
                <p className="font-body-sm text-body-sm text-text-muted mt-1">
                  Berkas Terverifikasi Otomatis
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-status-approved font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  trending_up
                </span>
                {' '}
                <span>
                  +18.4% efisiensi dari 2025
                </span>
              </div>
            </div>
            {/* Metric Card 2 */}
            <div className="p-space-lg rounded-2xl bg-surface-canvas shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-label-md text-label-md uppercase tracking-wider">
                  Integritas Wilayah
                </span>
                <div className="w-10 h-10 rounded-xl bg-status-fraud-bg flex items-center justify-center text-status-fraud">
                  <span className="material-symbols-outlined text-[22px]">
                    shield_lock
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="font-code-lg text-3xl font-extrabold text-text-heading tracking-tight">
                  1.824
                </span>
                <p className="font-body-sm text-body-sm text-text-muted mt-1">
                  Anomali Titip KK & Rute Dicegah
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-secondary font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  gavel
                </span>
                {' '}
                <span>
                  Didiskualifikasi objektif AI
                </span>
              </div>
            </div>
            {/* Metric Card 3 */}
            <div className="p-space-lg rounded-2xl bg-surface-canvas shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-label-md text-label-md uppercase tracking-wider">
                  Kecepatan Mesin
                </span>
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">
                    bolt
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="font-code-lg text-3xl font-extrabold text-text-heading tracking-tight">
                  {'<'} 42.8 Detik
                </span>
                <p className="font-body-sm text-body-sm text-text-muted mt-1">
                  Rata-rata Analisis Lengkap
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-text-muted font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  schedule
                </span>
                {' '}
                <span>
                  Konfirmasi instan ke pendaftar
                </span>
              </div>
            </div>
            {/* Metric Card 4 */}
            <div className="p-space-lg rounded-2xl bg-surface-canvas shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-label-md text-label-md uppercase tracking-wider">
                  Indeks Kepuasan
                </span>
                <div className="w-10 h-10 rounded-xl bg-status-approved-bg flex items-center justify-center text-status-approved">
                  <span className="material-symbols-outlined text-[22px]">
                    sentiment_very_satisfied
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <span className="font-code-lg text-3xl font-extrabold text-text-heading tracking-tight">
                  98.6%
                </span>
                <p className="font-body-sm text-body-sm text-text-muted mt-1">
                  Kepuasan Wali Murid & Panitia
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-status-approved font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  verified
                </span>
                {' '}
                <span>
                  Survei Ombudsman daerah
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* TIGA PILAR VALIDASI AI ZONASI-AGENT */}
      <section className="w-full py-space-xl bg-surface">
        <div className="max-w-7xl mx-auto px-margin">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-code-sm text-code-sm uppercase tracking-widest text-secondary font-bold">
              Multi-Agent Intelligence Architecture
            </span>
            <h2 className="font-headline-lg text-headline-lg text-text-heading mt-2 font-bold tracking-tight">
              Tiga Pilar Validasi Otonom Tanpa Intervensi Manual
            </h2>
            <p className="font-body-md text-body-md text-text-muted mt-3">
              Setiap permohonan zonasi diproses melalui pipeline tiga lapisan verifikasi berlapis untuk memastikan hak pendidikan tepat sasaran.
            </p>
          </div>
          {/* 3 Pillars Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-stretch">
            {/* Pilar 1 */}
            <div className="rounded-3xl bg-surface-canvas p-space-lg shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-surface-tint-blue flex items-center justify-center text-primary-container mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[32px]">
                    document_scanner
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-code-sm text-code-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">
                    PILAR 01
                  </span>
                  {' '}
                  <span className="font-label-md text-label-md text-text-muted">
                    Agentic Vision Reasoning
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-3">
                  OCR & Penalaran Integritas Kartu Keluarga
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed mb-6">
                  AI mengekstraksi data Kartu Keluarga dengan analisis relasi biologis. Sistem secara otomatis menolak KK dengan masa terbit di bawah 1 tahun atau yang terindikasi manipulasi scan digital.
                </p>
                {/* Sub-features tags */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Validasi Masa Tinggal KK ≥ 1 Tahun
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Pendeteksian Barcode QR Dukcapil Asli
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Pencegahan Modus Numpang KK Paman/Kolega
                    </span>
                  </div>
                </div>
              </div>
              {/* Visual Asset: OCR Scan Simulation Card */}
              <div className="relative w-full h-44 rounded-2xl bg-surface-slate overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted">
                  <span className="font-code-sm text-code-sm">
                    KK_DOC_INSPECT.pdf
                  </span>
                  {' '}
                  <span className="px-2 py-0.5 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-bold">
                    Terverifikasi
                  </span>
                </div>
                <div className="space-y-2 my-auto">
                  <div className="h-2 w-3/4 bg-surface-container rounded-full" />
                  <div className="h-2 w-1/2 bg-surface-container rounded-full" />
                  <div className="h-2 w-5/6 bg-secondary/30 rounded-full" />
                </div>
                {/* Scanning Line Animation */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
                <div className="text-right">
                  <span className="font-code-sm text-code-sm text-text-muted">
                    OCR Hash: 0x8F92...B4
                  </span>
                </div>
              </div>
            </div>
            {/* Pilar 2 */}
            <div className="rounded-3xl bg-surface-canvas p-space-lg shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-surface-tint-blue flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[32px]">
                    alt_route
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-code-sm text-code-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">
                    PILAR 02
                  </span>
                  {' '}
                  <span className="font-label-md text-label-md text-text-muted">
                    PostGIS Spatial Engine
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-3">
                  Rute Darat Riil Google Routes & PostGIS
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed mb-6">
                  Meninggalkan metode 'tarik garis lurus' masa lalu yang rawan manipulasi. Zonasi-Agent menghitung jarak tempuh jalan kaki & berkendara riil yang mematuhi batas fisik kota.
                </p>
                {/* Sub-features tags */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Bukan Euclidean (Garis Lurus Semu)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Memperhitungkan Halangan Sungai & Tol
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Akurasi Geometri PostGIS Topologis
                    </span>
                  </div>
                </div>
              </div>
              {/* Visual Asset: Map Location Box */}
              <div className="w-full h-44 rounded-2xl bg-surface-slate overflow-hidden relative shadow-inner" data-location="Jakarta, Indonesia">
                <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-surface-canvas/90 backdrop-blur-sm flex items-center justify-between">
                  <span className="font-code-sm text-code-sm font-semibold text-text-heading">
                    Rute Pejalan Kaki: 680 m
                  </span>
                  {' '}
                  <span className="font-code-sm text-code-sm text-secondary font-bold">
                    12 Menit
                  </span>
                </div>
              </div>
            </div>
            {/* Pilar 3 */}
            <div className="rounded-3xl bg-surface-canvas p-space-lg shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-surface-tint-blue flex items-center justify-center text-primary-container mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[32px]">
                    streetview
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-code-sm text-code-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">
                    PILAR 03
                  </span>
                  {' '}
                  <span className="font-label-md text-label-md text-text-muted">
                    Visual Spatial Classifier
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-3">
                  Audit Tata Ruang Visual Street View
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed mb-6">
                  AI memindai fasad bangunan pada koordinat terdaftar untuk mendeteksi apakah lokasi benar-benar rumah tinggal keluarga atau kantor palsu/lahan kosong tak berpenghuni.
                </p>
                {/* Sub-features tags */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Klasifikasi: Rumah Tapak vs Ruko Komersial
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Deteksi Lahan Kosong & Properti Hantu
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-slate">
                    <span className="material-symbols-outlined text-status-approved text-[18px]">
                      check
                    </span>
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body font-medium">
                      Geo-tagging Validasi Lapangan Otomatis
                    </span>
                  </div>
                </div>
              </div>
              {/* Visual Asset: Street View Inspection Simulation */}
              <div className="w-full h-44 rounded-2xl overflow-hidden relative shadow-inner">
                <img className="w-full h-full object-cover" data-alt="A clean modern residential suburban house in Indonesia under bright daylight with visible gate, tiled roof, and front porch, captured with crisp street view architectural photography, representing verified authentic residential household for school zoning admission." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAivzTrIZf5K7fURhRbM5FrAIb3sMwMnJGzVlHq6fuDQqP1tf1SF-uQP94rMTZ0xATAT0cPAxFoazP9FV3UP8MhNfgOrTAhYftqNDiNvKbCDwRR3KqfzcxWBh3zxNr0_14UytDW-PdvArZ63vPCRaFvT_JoUTDGPeCTidyH9WTRijCkETQ_hNrnds7Nfzu5TZPDd90CHuyyBZZ2Q-XLfV8TZ-B1oGdVt7I9Z0QZFoU" />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    home
                  </span>
                  {' '}
                  <span>
                    Hunian Asli (99.1%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SIMULASI VISUAL INTERAKTIF: GARIS LURUS VS RUTE DARAT RIIL */}
      <section className="w-full py-space-xl bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="p-space-lg lg:p-space-xl rounded-3xl bg-surface-slate shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
              {/* Explanation Column */}
              <div className="lg:col-span-5 space-y-space-md">
                <span className="font-code-sm text-code-sm px-3 py-1 rounded-full bg-status-fraud-bg text-status-fraud font-bold tracking-wide">
                  Mengapa Sistem Konvensional Gagal?
                </span>
                <h2 className="font-headline-lg text-headline-lg text-text-heading font-extrabold leading-tight">
                  Garis Lurus Menguntungkan Manipulasi. Rute Darat Riil Mengembalikan Keadilan.
                </h2>
                <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                  Pada PPDB konvensional, jarak dihitung secara{' '}
                  <strong className="text-text-heading font-semibold">
                    Euclidean (garis lurus udara)
                  </strong>
                  . Hal ini memicu kecurangan: sebuah titik seberang sungai atau jalan tol tanpa akses jembatan terlihat seolah 'hanya 350 meter', padahal kenyataannya siswa harus memutar lebih dari 3 kilometer!
                </p>
                {/* Comparison Table Component */}
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-surface-canvas shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-status-fraud" />
                      <div>
                        <span className="font-label-lg text-label-lg text-text-heading block">
                          Sistem Lama (Euclidean)
                        </span>
                        {' '}
                        <span className="font-body-sm text-body-sm text-text-muted">
                          Abaikan rintangan fisik jalan
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-code-lg text-code-lg text-status-fraud block line-through">
                        420 Meter
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted">
                        Sangat Bias
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-tint-blue shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                      <div>
                        <span className="font-label-lg text-label-lg text-text-heading font-bold block">
                          Zonasi-Agent (PostGIS Riil)
                        </span>
                        {' '}
                        <span className="font-body-sm text-body-sm text-text-muted">
                          Jalur tempuh jalan kaki resmi
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-code-lg text-code-lg text-secondary font-bold block">
                        1.850 Meter
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                        100% Akurat
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="font-body-sm text-body-sm text-text-muted italic">
                    *Algoritma Zonasi-Agent mengisolasi anomali topografi dan secara otomatis memberi kuota pada siswa yang rute tempuhnya benar-benar berdekatan dengan sekolah.
                  </p>
                </div>
              </div>
              {/* Schematic Interactive Map Visual Column */}
              <div className="lg:col-span-7">
                <div className="relative w-full rounded-2xl bg-surface-canvas p-space-md shadow-md overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-secondary" />
                      {' '}
                      <span className="font-headline-sm text-headline-sm text-text-heading font-bold">
                        Simulasi Interaktif Topologi Rute
                      </span>
                    </div>
                    <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-semibold">
                      Live PostGIS Canvas
                    </span>
                  </div>
                  {/* Schematic SVG Map Illustration */}
                  <div className="relative w-full h-80 rounded-xl bg-surface-slate overflow-hidden flex items-center justify-center p-4">
                    {/* Grid background lines */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:16px_16px]" />
                    {/* Schematic River/Highway Obstacle */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-12 h-full bg-blue-100/60 flex items-center justify-center pointer-events-none">
                      <span className="[writing-mode:vertical-rl] font-code-sm text-code-sm text-primary/40 font-bold tracking-widest uppercase">
                        Sungai & Jalan Tol (Tanpa Akses)
                      </span>
                    </div>
                    {/* SVG Paths */}
                    <svg className="w-full h-full absolute inset-0 pointer-events-none" fill="none" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
                      {/* Straight line (Euclidean - Red Dashed) */}
                      <line stroke="#EF4444" strokeDasharray="6 6" strokeWidth="3" x1="90" x2="410" y1="150" y2="150" />
                      {/* Real Walking Route (Curved along bridge - Blue Solid) */}
                      <path d="M 90 150 L 90 60 L 250 60 L 250 80 L 410 80 L 410 150" stroke="#0051d5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                      {/* Bridge Highlight Indicator */}
                      <rect fill="#dde1ff" height="35" rx="4" width="30" x="235" y="45" />
                      <text fill="#00288e" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="bold" x="238" y="40">
                        Jembatan
                      </text>
                    </svg>
                    {/* Point A: Siswa House */}
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-surface-canvas shadow-lg flex flex-col items-center z-10">
                      <div className="w-9 h-9 rounded-full bg-status-fraud-bg text-status-fraud flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-[20px]">
                          person_pin_circle
                        </span>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-text-heading">
                        Rumah Siswa
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted">
                        Titik Koordinat A
                      </span>
                    </div>
                    {/* Point B: Sekolah Tujuan */}
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-surface-canvas shadow-lg flex flex-col items-center z-10">
                      <div className="w-9 h-9 rounded-full bg-status-approved-bg text-status-approved flex items-center justify-center mb-1">
                        <span className="material-symbols-outlined text-[20px]">
                          school
                        </span>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-text-heading">
                        SMA Negeri 1
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted">
                        Titik Koordinat B
                      </span>
                    </div>
                  </div>
                  {/* Map Legend Bar */}
                  <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-text-body font-body-sm text-body-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 bg-status-fraud inline-block" />
                        {' '}
                        <span className="font-code-sm text-code-sm text-text-muted">
                          Garis Lurus (420m - Tidak Valid)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-1 bg-secondary inline-block rounded-full" />
                        {' '}
                        <span className="font-code-sm text-code-sm text-text-heading font-bold">
                          Rute PostGIS (1.850m - Valid)
                        </span>
                      </div>
                    </div>
                    <span className="font-code-sm text-code-sm text-secondary font-bold">
                      Delta Rute: +1.430 meter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* PANDUAN ALUR PENDAFTARAN 4 LANGKAH MUDAH BAGI ORANG TUA SISWA */}
      <section className="w-full py-space-xl bg-surface">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-code-sm text-code-sm uppercase tracking-widest text-secondary font-bold">
              Panduan Wali Murid
            </span>
            <h2 className="font-headline-lg text-headline-lg text-text-heading mt-2 font-bold tracking-tight">
              Empat Langkah Pendaftaran Transparan Tanpa Antre
            </h2>
            <p className="font-body-md text-body-md text-text-muted mt-3">
              Seluruh proses pendaftaran dilakukan mandiri dari rumah. Hasil validasi AI dapat diawasi secara terbuka melalui Dashboard Realtime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter relative">
            {/* Step 1 */}
            <div className="p-space-lg rounded-3xl bg-surface-canvas shadow-md flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center font-code-lg text-code-lg font-bold mb-6">
                  01
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-2">
                  Input NIK & Unggah KK
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                  Masukkan NIK siswa dan foto/scan Kartu Keluarga asli. Sistem OCR akan mendeteksi keabsahan tanggal cetak dan relasi wali secara otomatis.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-2 text-primary font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">
                  cloud_upload
                </span>
                {' '}
                <span>
                  Deteksi Dokumen Instan
                </span>
              </div>
            </div>
            {/* Step 2 */}
            <div className="p-space-lg rounded-3xl bg-surface-canvas shadow-md flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center font-code-lg text-code-lg font-bold mb-6">
                  02
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-2">
                  Pin Lokasi Rumah Riil
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                  Tentukan titik letak rumah pada peta presisi tinggi. Mesin Google Street View AI akan mencocokkan visual bangunan dengan alamat domisili.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-2 text-secondary font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">
                  pin_drop
                </span>
                {' '}
                <span>
                  Audit Fasad Bangunan
                </span>
              </div>
            </div>
            {/* Step 3 */}
            <div className="p-space-lg rounded-3xl bg-surface-canvas shadow-md flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center font-code-lg text-code-lg font-bold mb-6">
                  03
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-2">
                  Pilih Sekolah Tujuan
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                  Pilih hingga 3 sekolah pilihan dalam zona Anda. Mesin PostGIS akan seketika mengkalkulasi rute jalan kaki resmi ke masing-masing gerbang sekolah.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-2 text-primary font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">
                  straighten
                </span>
                {' '}
                <span>
                  Jarak Rute Darat Akurat
                </span>
              </div>
            </div>
            {/* Step 4 */}
            <div className="p-space-lg rounded-3xl bg-surface-canvas shadow-md flex flex-col justify-between relative group hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-status-approved-bg text-status-approved flex items-center justify-center font-code-lg text-code-lg font-bold mb-6">
                  04
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold mb-2">
                  Terbit Kode Verifikasi
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                  Dapatkan Tracking ID unik dan sertifikat audit digital terlindungi enkripsi. Pantau posisi kuota harian Anda secara live tanpa rasa was-was.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-2 text-status-approved font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                {' '}
                <span>
                  Sertifikat Audit Terbit
                </span>
              </div>
            </div>
          </div>
          {/* Action Button CTA */}
          <div className="mt-12 text-center">
            <a className="inline-flex items-center gap-space-xs px-space-xl py-4 rounded-2xl bg-primary text-on-primary font-label-lg text-label-lg shadow-lg hover:bg-primary-container transition-all" href="/daftar">
              <span>
                Mulai Pendaftaran Siswa Sekarang
              </span>
              {' '}
              <span className="material-symbols-outlined text-[20px]">
                how_to_reg
              </span>
            </a>
          </div>
        </div>
      </section>
      {/* FAQ PPDB & LAYANAN PENGADUAN INTEGRASI */}
      <section className="w-full py-space-xl bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Left: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-space-md">
              <span className="font-code-sm text-code-sm uppercase tracking-widest text-secondary font-bold">
                Tanya Jawab Seputar Zonasi-Agent
              </span>
              <h2 className="font-headline-lg text-headline-lg text-text-heading font-extrabold tracking-tight">
                Pertanyaan Yang Sering Diajukan
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-8">
                Pahami bagaimana algoritma bekerja demi menjamin keadilan seluruh calon peserta didik.
              </p>
              <div className="space-y-4" id="faqAccordion">
                {[
                  {
                    q: "Bagaimana jika KK saya baru diperbarui karena penambahan anggota keluarga?",
                    a: "Vision AI kami melakukan pengecekan tanggal cetak KK sekaligus riwayat administrasi Dukcapil. Jika pembaruan KK murni karena kelahiran adik baru atau perbaikan ejaan nama, dan alamat utama terbukti sudah ditempati lebih dari 1 tahun, berkas Anda tetap sah dan diverifikasi otomatis.",
                  },
                  {
                    q: "Mengapa jarak saya di Zonasi-Agent lebih jauh daripada Google Maps mobil?",
                    a: "Zonasi-Agent memprioritaskan kalkulasi rute jalan kaki pejalan kaki yang aman (termasuk gang pemukiman yang dapat dilalui pejalan kaki, bukan rute putaran balik kendaraan bermotor di jalan arteri yang memutar jauh). Ini memberi peluang zonasi yang lebih realistis dan adil bagi warga sekitar.",
                  },
                  {
                    q: "Apa yang terjadi jika rumah saya belum ada di Google Street View?",
                    a: "Sistem tidak langsung mendiskualifikasi berkas. AI akan menandai status berkas sebagai 'Review Petugas Lapangan'. Tim verifikator resmi sekolah akan melakukan survei koordinat geolokasi dengan bukti foto geotag terenkripsi tanpa merugikan urutan pendaftaran Anda.",
                  },
                  {
                    q: "Apakah masyarakat bisa melihat bukti kecurangan yang didiskualifikasi?",
                    a: 'Ya! Melalui menu Live Tracking AI, publik dapat memantau log audit anonim berisi alasan diskualifikasi (misal: "KK usia 2 bulan terbit", "Titik berada di ruko kosong"). Transparansi ini mengeliminasi praktik titip siswa secara permanen.',
                  },
                ].map((item, idx) => {
                  const open = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="p-space-md rounded-2xl bg-surface-slate shadow-xs cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-text-heading font-semibold text-base sm:text-lg">
                          {item.q}
                        </span>{' '}
                        <span className="material-symbols-outlined text-text-muted text-[22px]">
                          {open ? "expand_less" : "expand_more"}
                        </span>
                      </div>
                      {open && (
                        <p className="faq-ans mt-3 font-body-sm text-body-sm text-text-body leading-relaxed pt-2">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Right: Integrated Fraud Complaint Center Card */}
            <div className="lg:col-span-5 p-space-lg lg:p-space-xl rounded-3xl bg-surface-tint-blue shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-surface-canvas text-secondary flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[28px]">
                  support_agent
                </span>
              </div>
              <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-canvas text-secondary font-bold">
                Whistleblower Protection
              </span>
              <h3 className="font-headline-md text-headline-md text-text-heading font-bold mt-3 mb-2">
                Posko Aduan Dugaan Pelanggaran Zonasi
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed mb-6">
                Melihat kecurangan titip KK di lingkungan RT/RW Anda? Laporkan secara anonim kepada Satgas PPDB Terpadu. Setiap laporan diproses dengan bukti log geospasial real-time.
              </p>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setComplaintSent(true); e.currentTarget.reset(); }}>
                <div>
                  <label className="block font-label-md text-label-md text-text-heading font-semibold mb-1">
                    Nama / NIK Terlapor (Bila Ada)
                  </label>
                  <input className="w-full px-3 py-2.5 rounded-xl bg-surface-canvas text-text-heading font-body-sm text-body-sm shadow-xs focus:outline-none" placeholder="Masukkan nama atau indikasi siswa..." type="text" />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-text-heading font-semibold mb-1">
                    Sekolah yang Dituju
                  </label>
                  <select className="w-full px-3 py-2.5 rounded-xl bg-surface-canvas text-text-heading font-body-sm text-body-sm shadow-xs focus:outline-none">
                    <option>
                      Pilih Satuan Pendidikan Terkait...
                    </option>
                    <option>
                      SMA Negeri 1 Kota
                    </option>
                    <option>
                      SMA Negeri 3 Kota
                    </option>
                    <option>
                      SMP Negeri 2 Kota
                    </option>
                    <option>
                      Lainnya
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-text-heading font-semibold mb-1">
                    Rincian Dugaan Kejanggalan
                  </label>
                  <textarea className="w-full px-3 py-2.5 rounded-xl bg-surface-canvas text-text-heading font-body-sm text-body-sm shadow-xs focus:outline-none" placeholder="Contoh: Terlapor terbukti bertempat tinggal di kecamatan lain, namun mencantumkan alamat kos kosong..." required rows={3} />
                </div>
                <button className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2" type="submit">
                  <span className="material-symbols-outlined text-[18px]">
                    send
                  </span>
                  {' '}
                  <span>
                    {complaintSent ? "Laporan Terenkripsi Terkirim ✓" : "Kirimkan Aduan Terenkripsi"}
                  </span>
                </button>
              </form>
              <div className="mt-4 pt-3 flex items-center justify-center gap-2 text-text-muted font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px] text-status-approved">
                  verified_user
                </span>
                {' '}
                <span>
                  Identitas Pelapor Dilindungi UU No. 31/2014
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CALL TO ACTION BANNER */}
      <section className="w-full py-16 bg-gradient-to-r from-primary via-primary-container to-secondary text-on-primary">
        <div className="max-w-7xl mx-auto px-margin text-center space-y-6">
          <h2 className="font-headline-lg text-headline-lg font-extrabold max-w-2xl mx-auto leading-tight">
            Wujudkan PPDB yang Adil, Setara, dan Berintegritas Bersama Zonasi-Agent
          </h2>
          <p className="font-body-md text-body-md text-on-primary/80 max-w-xl mx-auto">
            Kawal masa depan putra-putri bangsa dengan sistem verifikasi otonom tanpa celah manipulasi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a className="px-space-lg py-3.5 rounded-xl bg-surface-canvas text-primary font-label-lg text-label-lg shadow-xl hover:bg-surface-tint-blue transition-all flex items-center gap-2" href="/daftar">
              <span>
                Daftar Siswa Baru Sekarang
              </span>
              {' '}
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </a>
            {' '}
            <a className="px-space-lg py-3.5 rounded-xl bg-on-primary/10 hover:bg-on-primary/20 text-on-primary font-label-lg text-label-lg backdrop-blur-sm transition-all flex items-center gap-2" href="/track/PPDB-2026-X89K">
              <span className="material-symbols-outlined text-[18px]">
                analytics
              </span>
              {' '}
              <span>
                Buka Papan Audit Publik
              </span>
            </a>
          </div>
        </div>
      </section>
      {/* Client-side Interactive Script for Tracking Demo */}
    </div>
    </FadeIn>
  );
}
