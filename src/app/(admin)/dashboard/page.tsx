"use client";
import { useEffect, useState } from "react";
import type { ApplicationRecord } from "@/lib/store";
import Link from "next/link";

export default function DashboardPage() {
  const [mapLayer, setMapLayer] = useState<"hybrid" | "topo" | "heat">("hybrid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FRAUD" | "REVISION" | "APPROVED">("ALL");
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.applications)) setApplications(d.applications);
      })
      .catch(() => {});
  }, [disqualified]);

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      app.student_name.toLowerCase().includes(q) ||
      app.student_nik.toLowerCase().includes(q) ||
      app.tracking_id.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (statusFilter === "FRAUD") return app.status === "REJECTED";
    if (statusFilter === "REVISION")
      return app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
    if (statusFilter === "APPROVED") return app.status === "APPROVED";
    return true;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [sidakScheduled, setSidakScheduled] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});
  const [exportLabel, setExportLabel] = useState("Ekspor Berita Acara (PDF/Excel)");
  const [syncLabel, setSyncLabel] = useState("Sinkronisasi Data Dukcapil");

  const handleExportBa = () => {
    setExportLabel("Mengemas Berita Acara...");
    setTimeout(() => {
      setExportLabel("BA-PPDB-SMAN1.pdf Diunduh ✓");
    }, 800);
  };

  const handleSyncDukcapil = () => {
    setSyncLabel("Menyinkronkan 428 NIK...");
    setTimeout(() => {
      setSyncLabel("Tersinkronisasi (0 Anomali Baru) ✓");
    }, 900);
  };

  const handleConfirmDisqualify = async () => {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracking_id: "PPDB-2024-1142",
        status: "REJECTED",
        note: "Diskualifikasi Dikonfirmasi Panitia - BA-DISKUALIFIKASI-142.pdf",
      }),
    }).catch(() => {});
    setDisqualified(true);
    setModalOpen(false);
  };

  return (
    <div className="bg-surface font-body-md text-text-body antialiased min-h-screen flex">
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-canvas shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col pt-space-md pb-space-lg">
      <div className="px-space-lg mb-space-lg flex items-center gap-space-sm">
        <img alt="Zonasi-Agent Emblem Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP82MliC1pINdpVeIABNsQF3W3U00v866HTudaniST1nlWzh255_xuUrIjrSbxRJEvk0Pce7jfaUQKtq1-SX_b0SDyILpmhDB6ruWazV92FKnpjQ2Tm8HzuLp1NqhDptwKmsP2EIEYQP_GLoZ5rsFCIC8vo3iAXwsCcacUOksxTYkXB8_oG6mHz0IHs0btY3N97OFbnjsLi08felaL4DsUov4iNib8CHaAVGkojrM" />
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-text-heading">
            Zonasi-Agent
          </span>
          <span className="font-code-sm text-code-sm text-secondary">
            Konsol Panitia PPDB
          </span>
        </div>
      </div>
      <div className="px-space-lg mb-space-sm">
        <span className="font-code-sm text-code-sm text-text-muted uppercase tracking-wider">
          Navigasi Audit
        </span>
      </div>
      <nav className="flex-1 px-space-md flex flex-col gap-1" data-active-classes="bg-surface-tint-blue text-secondary font-headline-sm rounded-lg">
        <a aria-current="page" className="flex items-center gap-space-sm px-space-md py-space-sm transition-all bg-surface-tint-blue text-secondary font-headline-sm rounded-lg" href="/dashboard">
          <span className="material-symbols-outlined text-[20px]">
            space_dashboard
          </span>
          <span className="font-label-lg text-label-lg">
            Ringkasan Verifikasi
          </span>
        </a>
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all" href="#antrean">
          <span className="material-symbols-outlined text-[20px]">
            rule
          </span>
          <span className="font-label-lg text-label-lg">
            Antrean Validasi AI
          </span>
        </a>
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all" href="#radar">
          <span className="material-symbols-outlined text-[20px]">
            explore
          </span>
          <span className="font-label-lg text-label-lg">
            Radar Geofence PostGIS
          </span>
        </a>
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all" href="/track/PPDB-2026-X89K">
          <span className="material-symbols-outlined text-[20px]">
            history_edu
          </span>
          <span className="font-label-lg text-label-lg">
            Log Forensik Dokumen
          </span>
        </a>
      </nav>
      <div className="px-space-md pt-space-md mt-auto flex flex-col gap-space-xs">
        <div className="p-space-sm rounded-xl bg-surface-slate flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-code-sm text-code-sm text-text-muted">
              PostGIS Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-status-approved" />
          </div>
          <span className="font-code-sm text-code-sm text-text-heading">
            v3.4.2 Spatial OK
          </span>
        </div>
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-error hover:bg-status-fraud-bg hover:text-error transition-all" href="/">
          <span className="material-symbols-outlined text-[20px]">
            logout
          </span>
          <span className="font-label-lg text-label-lg">
            Keluar Sesi
          </span>
        </a>
      </div>
    </aside>
    <div className="pl-72">
      <header className="fixed top-0 left-72 right-0 h-16 bg-surface-canvas/85 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
        <div className="flex items-center gap-space-md">
          <span className="font-headline-sm text-headline-sm text-text-heading hidden md:inline-block">
            Panel Pengawasan Geospasial
          </span>
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-status-approved-bg">
            <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
            <span className="font-code-sm text-code-sm text-status-approved">
              Supabase Realtime: Terhubung
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-md">
          <button aria-label="Pemberitahuan Anomali" className="relative p-space-sm rounded-lg hover:bg-surface-slate text-on-surface-variant transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-fraud" />
          </button>
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-label-lg text-label-lg text-text-heading leading-tight">
                Budi Santoso, S.Kom
              </span>
              <span className="font-code-sm text-code-sm text-text-muted leading-tight">
                Auditor Zona 01
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="relative pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full gap-space-lg p-space-md lg:p-margin">
          {/* Header Panel Panitia */}
          <section className="bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="px-space-sm py-0.5 rounded-full bg-surface-container font-code-sm text-code-sm text-secondary">
                  Zonasi-Agent Sentinel v3.4
                </span>
                {' '}
                <span className="flex items-center gap-1 font-body-sm text-body-sm text-text-muted">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    domain
                  </span>
                  {' '}SMAN 1 Teladan (Wilayah DKI Jakarta)
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md text-text-heading">
                Dashboard Pengawas PPDB — Posko Zonasi Cerdas
              </h1>
              <p className="font-body-sm text-body-sm text-text-muted">
                Pemantauan anomali geospasial real-time, audit forensik Kartu Keluarga, dan deteksi manipulasi PostGIS.
              </p>
            </div>
            {/* Quick Status Pills */}
            <div className="flex flex-wrap items-center gap-space-md w-full xl:w-auto">
              <div className="flex-1 sm:flex-initial bg-surface-slate rounded-lg p-space-md min-w-[200px]">
                <div className="flex items-center justify-between gap-space-sm mb-1">
                  <span className="font-label-md text-label-md text-text-muted">
                    Kapasitas Zonasi
                  </span>
                  {' '}
                  <span className="font-code-sm text-code-sm text-secondary font-semibold">
                    86%
                  </span>
                </div>
                <div className="font-code-lg text-code-lg text-text-heading">
                  172{' '}
                  <span className="font-body-sm text-body-sm text-text-muted">
                    / 200 Kuota
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{width: "86%"}} />
                </div>
              </div>
              <div className="flex-1 sm:flex-initial bg-status-revision-bg rounded-lg p-space-md min-w-[190px]">
                <div className="flex items-center justify-between gap-space-sm mb-1">
                  <span className="font-label-md text-label-md text-status-revision">
                    Antrean Panitia
                  </span>
                  {' '}
                  <span className="w-2 h-2 rounded-full bg-status-revision animate-ping" />
                </div>
                <div className="font-code-lg text-code-lg text-text-heading">
                  18{' '}
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Berkas Menunggu
                  </span>
                </div>
                <span className="font-code-sm text-code-sm text-status-revision block mt-2">
                  Prioritas tinjauan manual
                </span>
              </div>
            </div>
          </section>
          {/* Metric Analytics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {/* Card 1: Total Pendaftar */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider">
                  Total Pendaftar
                </span>
                <div className="w-9 h-9 rounded-lg bg-surface-tint-blue flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">
                    how_to_reg
                  </span>
                </div>
              </div>
              <div className="my-space-md">
                <div className="font-headline-lg text-headline-lg text-text-heading">
                  428
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Berkas masuk ke PostGIS layer
                </span>
              </div>
              <div className="flex items-center gap-space-xs text-status-approved font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  trending_up
                </span>
                {' '}
                <span className="">
                  +14 berkas per jam ini
                </span>
              </div>
            </div>
            {/* Card 2: Disetujui AI */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-status-approved uppercase tracking-wider">
                  Disetujui Otomatis
                </span>
                <div className="w-9 h-9 rounded-lg bg-status-approved-bg flex items-center justify-center text-status-approved">
                  <span className="material-symbols-outlined text-[20px]">
                    verified_user
                  </span>
                </div>
              </div>
              <div className="my-space-md">
                <div className="font-headline-lg text-headline-lg text-text-heading">
                  364
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Akurasi validasi AI 99.2%
                </span>
              </div>
              <div className="flex items-center justify-between text-text-muted font-code-sm text-code-sm">
                <span className="">
                  Rasio Lolos Validasi
                </span>
                {' '}
                <span className="font-semibold text-status-approved">
                  85%
                </span>
              </div>
            </div>
            {/* Card 3: Butuh Revisi */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-status-revision uppercase tracking-wider">
                  Revisi Dokumen
                </span>
                <div className="w-9 h-9 rounded-lg bg-status-revision-bg flex items-center justify-center text-status-revision">
                  <span className="material-symbols-outlined text-[20px]">
                    document_scanner
                  </span>
                </div>
              </div>
              <div className="my-space-md">
                <div className="font-headline-lg text-headline-lg text-text-heading">
                  26
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  OCR buram / barcode tidak terbaca
                </span>
              </div>
              <div className="flex items-center gap-space-xs text-status-revision font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  info
                </span>
                {' '}
                <span className="">
                  Perlu unggah ulang KTP/KK
                </span>
              </div>
            </div>
            {/* Card 4: Anomali & Fraud */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-status-fraud uppercase tracking-wider">
                  Anomali / Fraud
                </span>
                <div className="w-9 h-9 rounded-lg bg-status-fraud-bg flex items-center justify-center text-status-fraud">
                  <span className="material-symbols-outlined text-[20px]">
                    fitbit_jumping_jacks
                  </span>
                </div>
              </div>
              <div className="my-space-md">
                <div className="font-headline-lg text-headline-lg text-status-fraud">
                  14
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  KK {'<'} 1 thn / titik ruko fiktif
                </span>
              </div>
              <div className="flex items-center gap-space-xs text-status-fraud font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px]">
                  warning
                </span>
                {' '}
                <span className="">
                  Butuh investigasi lapangan
                </span>
              </div>
            </div>
          </section>
          {/* Peta Geospasial PostGIS Interaktif & Visual Telemetry Panel */}
          <section id="radar" className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Map Container */}
            <div className="lg:col-span-8 bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-heading">
                    Radar Geospasial PostGIS (Radius Zonasi 1.200m)
                  </h2>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Buffer Poligon ST_DWithin EPSG:3857 — SMAN 1 Teladan Jakarta
                  </span>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-slate rounded-lg p-1">
                  <button id="btn-layer-hybrid" type="button" onClick={() => setMapLayer("hybrid")} className={mapLayer === "hybrid" ? "px-space-sm py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary" : "px-space-sm py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"}>
                    Hybrid
                  </button>
                  <button id="btn-layer-topo" type="button" onClick={() => setMapLayer("topo")} className={mapLayer === "topo" ? "px-space-sm py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary" : "px-space-sm py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"}>
                    Batas RW
                  </button>
                  <button id="btn-layer-heat" type="button" onClick={() => setMapLayer("heat")} className={mapLayer === "heat" ? "px-space-sm py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary" : "px-space-sm py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"}>
                    Heatmap
                  </button>
                </div>
              </div>
              {/* Map Display with interactive overlay elements */}
              <div className="relative w-full h-[440px] rounded-xl overflow-hidden bg-surface-slate">
                <div className="w-full h-full bg-cover bg-center" data-location="SMAN 1 Jakarta, Jl. Budi Utomo No.7, Jakarta Pusat, Indonesia" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBWwev_YZnliq12vwr0z5yg3HvIvupz4Mytg6-9b2VflmYu4GvMmaJGNLvprYkgAuLYDJH5rDsPJt7aMRuU4RafIS5dFqgCEJ3qEBlgymZdgh3yWQwJpqRv2nzqYaAS_KQxXYCGMwrZX9B6AILlHwuQGERO8P4BBMVQ0dtIqNc2LBJggD3ykETuabV0i0onS5qUUg8eZbezEMC6o4UiNuxbIvTzAowWiOvHzulcnB4')"}} />
                {/* Floating Legend & Coordinate Indicator */}
                <div className="absolute top-space-md left-space-md bg-surface-canvas/90 backdrop-blur-md rounded-lg p-space-sm shadow-md flex flex-col gap-1 max-w-xs">
                  <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-text-heading font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      explore
                    </span>
                    {' '}-6.168524, 106.837491 (Pusat Sekolah)
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted text-[11px] leading-tight">
                    Toleransi elevasi geodesik WGS84: ± 1.5m
                  </span>
                </div>
                {/* Simulated Pin Markers Overlay for visual fidelity */}
                <div className="absolute inset-0 pointer-events-none p-space-lg flex flex-col justify-between">
                  {/* Top right pin: Fraud */}
                  <div className="self-end flex items-center gap-2 bg-status-fraud-bg/95 backdrop-blur px-2.5 py-1.5 rounded-full shadow-md pointer-events-auto cursor-pointer hover:scale-105 transition-transform">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-fraud" />
                    {' '}
                    <span className="font-code-sm text-code-sm text-status-fraud font-semibold">
                      Pin #238: Ruko Fiktif (310m)
                    </span>
                  </div>
                  {/* Center area: School Core Marker */}
                  <div className="self-center flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xl animate-pulse">
                      <span className="material-symbols-outlined text-[20px]">
                        school
                      </span>
                    </div>
                    <span className="bg-surface-canvas px-2 py-0.5 rounded shadow text-[11px] font-label-md text-text-heading mt-1">
                      SMAN 1 Teladan
                    </span>
                  </div>
                  {/* Bottom left pins: Valid & Verification */}
                  <div className="flex items-center gap-space-sm pointer-events-auto">
                    <div className="flex items-center gap-1.5 bg-status-approved-bg/95 backdrop-blur px-2.5 py-1 rounded-full shadow cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-approved" />
                      {' '}
                      <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                        #102 Valid (820m)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-status-revision-bg/95 backdrop-blur px-2.5 py-1 rounded-full shadow cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-revision" />
                      {' '}
                      <span className="font-code-sm text-code-sm text-status-revision font-semibold">
                        #144 Foto Mandiri (950m)
                      </span>
                    </div>
                  </div>
                </div>
                {/* Map Quick Legend Bottom Right */}
                <div className="absolute bottom-space-md right-space-md bg-surface-canvas/90 backdrop-blur-md rounded-lg p-space-sm shadow-md flex items-center gap-space-md text-[12px]">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-approved" />
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body">
                      Hunian Valid
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-revision" />
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body">
                      Verifikasi Fisik
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-fraud" />
                    {' '}
                    <span className="font-body-sm text-body-sm text-text-body">
                      Anomali Terdeteksi
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Inspector Telemetry & Live Incident Mini-feed */}
            <div className="lg:col-span-4 bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col justify-between gap-space-md">
              <div>
                <div className="flex items-center justify-between mb-space-sm">
                  <h3 className="font-headline-sm text-headline-sm text-text-heading">
                    Inspeksi Anomali Kritis
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-status-fraud-bg text-status-fraud font-code-sm text-code-sm">
                    Live Alert
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted mb-space-md">
                  PostGIS ST_Contains mendeteksi inkonsistensi koordinat vs. basis data Disdukcapil DKI.
                </p>
                {/* Selected Case Card */}
                <div className="bg-surface-slate rounded-xl p-space-md flex flex-col gap-space-sm mb-space-md">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg text-text-heading">
                        Budi Santoso
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted">
                        NIK: 3171032801080004
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-status-fraud-bg font-code-sm text-code-sm text-status-fraud">
                      Skor Risiko 92%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm pt-space-xs text-[12px]">
                    <div className="bg-surface-canvas p-space-sm rounded">
                      <span className="text-text-muted block">
                        Jarak Euclidean
                      </span>
                      {' '}
                      <span className="font-code-md text-code-md text-text-heading font-semibold">
                        310 meter
                      </span>
                    </div>
                    <div className="bg-surface-canvas p-space-sm rounded">
                      <span className="text-text-muted block">
                        Masa Tinggal KK
                      </span>
                      {' '}
                      <span className="font-code-md text-code-md text-status-fraud font-semibold">
                        4 Bulan
                      </span>
                    </div>
                  </div>
                  {/* Street View Preview Thumbnail */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden mt-1">
                    <img className="w-full h-full object-cover" data-alt="A realistic Google Street View perspective in central Jakarta showing a commercial shophouse with roll-up metal doors and advertising banners, captured under bright tropical daylight, clear institutional audit evidence quality" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD75CPTSZdgWu9WF_nHJaeeHib3XrpB4JyzRic5A75T6XlQEDgVyhZormvYb62S--pOL6GtwUG1ulLWoWE4MmNMpOjJq7R2ZEJBqlMjGmvSlZwBlTfGd8uyEekhzXdCZASpBOAfva7aK1ggH6e3YRQFvytukxiYe6akl-cTDXkHRFj96caHBvKxZA-imjPuKdG6ed1vLPI2hnObIpCgxog8ro5h7GvDOhCWD79c3Us" />
                    <div className="absolute bottom-2 left-2 bg-surface-canvas/90 px-2 py-0.5 rounded text-[11px] font-label-md text-status-fraud flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        store
                      </span>
                      {' '}AI Vision: Kawasan Komersial (Bukan Hunian)
                    </div>
                  </div>
                </div>
                {/* Audit Log Micro-bullet */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[12px] text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-fraud" />
                    {' '}
                    <span className="">
                      Rute ST_ShortestPath menyimpang dari jalan setapak legal
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    {' '}
                    <span className="">
                      Dukcapil API: Kepala Keluarga baru dimutasi Maret 2024
                    </span>
                  </div>
                </div>
              </div>
              {/* Action Button for Selected Case */}
              <div className="flex items-center gap-space-sm pt-space-sm">
                <button onClick={() => setModalOpen(true)} className="flex-1 py-2 px-space-sm rounded-lg bg-status-fraud text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1" type="button">
                  <span className="material-symbols-outlined text-[18px]">
                    block
                  </span>
                  {' '}{disqualified ? "Didiskualifikasi ✓" : "Diskualifikasi Berkas"}
                </button>
                <button className="py-2 px-space-md rounded-lg bg-surface-container font-label-md text-label-md text-secondary hover:bg-surface-slate transition-colors" type="button">
                  Audit Lapangan
                </button>
              </div>
            </div>
          </section>
          {/* Tabel Antrean Verifikasi & Fraud Detector */}
          <section id="antrean" className="bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-md border-b border-border-slate pb-space-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-text-heading flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      shield_with_heart
                <div className="flex items-center gap-1.5 bg-surface-slate p-1 rounded-xl flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={
                      statusFilter === "ALL"
                        ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-secondary font-bold shadow-sm border border-border-slate transition-all flex items-center gap-1.5"
                        : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-text-heading transition-all flex items-center gap-1.5"
                    }
                  >
                    <span>Semua Status</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-text-muted font-code-sm text-code-sm">
                      {applications.length || 428}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("FRAUD")}
                    className={
                      statusFilter === "FRAUD"
                        ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-fraud font-bold shadow-sm border border-status-fraud-border transition-all flex items-center gap-1.5"
                        : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-fraud hover:bg-surface-canvas/60 transition-all flex items-center gap-1.5"
                    }
                  >
                    <span className="w-2 h-2 rounded-full bg-status-fraud animate-pulse" />
                    <span>🚨 Kritis / Fraud</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-status-fraud text-on-primary font-code-sm text-code-sm font-bold shadow-sm">
                      {applications.filter((a) => a.status === "REJECTED").length || 14}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("REVISION")}
                    className={
                      statusFilter === "REVISION"
                        ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-revision font-bold shadow-sm border border-status-revision-border transition-all flex items-center gap-1.5"
                        : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-revision hover:bg-surface-canvas/60 transition-all flex items-center gap-1.5"
                    }
                  >
                    <span>⚠️ Sedang / Verifikasi</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-status-revision-bg text-status-revision font-code-sm text-code-sm font-semibold">
                      {applications.filter((a) => a.status === "NEEDS_LIVE_PHOTO" || a.status === "NEEDS_REVISION").length || 26}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("APPROVED")}
                    className={
                      statusFilter === "APPROVED"
                        ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-approved font-bold shadow-sm border border-status-approved-border transition-all flex items-center gap-1.5"
                        : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-approved hover:bg-surface-canvas/60 transition-all flex items-center gap-1.5"
                    }
                  >
                    <span>✅ Bersih / Lolos</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-semibold">
                      {applications.filter((a) => a.status === "APPROVED").length || 364}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-text-muted font-code-sm text-code-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Filter Aktif:{' '}
                    <strong className="text-text-heading">
                      {statusFilter === "ALL"
                        ? `Semua Status (${filteredApps.length} Berkas)`
                        : statusFilter === "FRAUD"
                        ? `Kritis / Fraud (${filteredApps.length} Kasus)`
                        : statusFilter === "REVISION"
                        ? `Verifikasi (${filteredApps.length} Berkas)`
                        : `Bersih / Lolos (${filteredApps.length} Berkas)`}
                    </strong>
                  </span>
                </div>
              </div>
                  <button type="button" className="px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-revision hover:bg-surface-canvas/60 transition-all flex items-center gap-1.5">
                    <span className="">
                      ⚠️ Sedang / Verifikasi
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-status-revision-bg text-status-revision font-code-sm text-code-sm font-semibold">
                      26
                    </span>
                  </button>
                  <button type="button" className="px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-approved hover:bg-surface-canvas/60 transition-all flex items-center gap-1.5">
                    <span className="">
                      ✅ Bersih / Lolos
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-semibold">
                      364
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-text-muted font-code-sm text-code-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-status-fraud" />
                    Filter Aktif:{' '}
                    <strong className="text-status-fraud">
                      Kritis / Fraud (14 Kasus)
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            {/* Smart Table Container */}
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-slate text-text-muted font-label-md text-label-md">
                    <th className="py-space-md px-space-md">
                      No
                    </th>
                    <th className="py-space-md px-space-md">
                      Tracking ID
                    </th>
                    <th className="py-space-md px-space-md">
                      Nama Calon Siswa
                    </th>
                    <th className="py-space-md px-space-md">
                      NIK
                    </th>
                    <th className="py-space-md px-space-md">
                      Jarak (m)
                    </th>
                    <th className="py-space-md px-space-md">
                      Usia KK
                    </th>
                    <th className="py-space-md px-space-md">
                      Deteksi Bangunan
                    </th>
                    <th className="py-space-md px-space-md">
                      Status AI
                    </th>
                    <th className="py-space-md px-space-md text-right">
                      Tindakan Panitia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-text-body font-body-sm text-body-sm">
                  {filteredApps.map((app, i) => {
                    const isFraud = app.status === "REJECTED";
                    const isRev = app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
                    return (
                      <tr
                        key={app.id}
                        className={
                          isFraud
                            ? "hover:bg-status-fraud-bg/40 transition-colors bg-status-fraud-bg/10"
                            : isRev
                            ? "hover:bg-status-revision-bg/40 transition-colors"
                            : "hover:bg-surface-slate/70 transition-colors"
                        }
                      >
                        <td className="py-space-md px-space-md font-code-sm text-code-sm text-text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td
                          className={`py-space-md px-space-md font-code-sm text-code-sm font-semibold ${
                            isFraud ? "text-status-fraud" : "text-secondary"
                          }`}
                        >
                          {app.tracking_id}
                        </td>
                        <td className="py-space-md px-space-md font-semibold text-text-heading">
                          {app.student_name}
                        </td>
                        <td className="py-space-md px-space-md font-code-sm text-code-sm text-text-muted">
                          {app.student_nik}
                        </td>
                        <td
                          className={`py-space-md px-space-md font-code-sm text-code-sm font-semibold ${
                            isFraud ? "text-status-fraud" : ""
                          }`}
                        >
                          {app.real_route_distance_meters} m
                        </td>
                        <td className="py-space-md px-space-md">
                          {isFraud ? (
                            <span className="px-2 py-0.5 rounded bg-status-fraud-bg text-status-fraud font-code-sm text-code-sm font-bold">
                              {app.kk_age_label}
                            </span>
                          ) : (
                            <span className="font-code-sm text-code-sm text-status-approved">
                              {app.kk_age_label}
                            </span>
                          )}
                        </td>
                        <td className="py-space-md px-space-md">
                          {app.detected_building === "COMMERCIAL" ? (
                            <span className="px-2.5 py-1 rounded-full bg-status-fraud-bg text-status-fraud font-code-sm text-code-sm font-semibold inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">storefront</span>{' '}
                              KOMERSIAL/RUKO
                            </span>
                          ) : app.detected_building === "NO_STREET_VIEW" ? (
                            <span className="px-2.5 py-1 rounded-full bg-surface-slate text-text-muted font-code-sm text-code-sm inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">alt_route</span>{' '}
                              GANG SEMPIT (BLIND SPOT)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-semibold inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">home</span>{' '}
                              RESIDENSIAL
                            </span>
                          )}
                        </td>
                        <td className="py-space-md px-space-md">
                          {isFraud ? (
                            <span className="px-2.5 py-1 rounded-full bg-status-fraud-bg text-status-fraud font-label-md text-label-md font-bold inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">dangerous</span>{' '}
                              REJECTED - FRAUD
                            </span>
                          ) : isRev ? (
                            <span className="px-2.5 py-1 rounded-full bg-status-revision-bg text-status-revision font-label-md text-label-md font-semibold inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">add_a_photo</span>{' '}
                              {app.status}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-label-md text-label-md inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>{' '}
                              APPROVED
                            </span>
                          )}
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          {isFraud ? (
                            <button
                              onClick={() => setModalOpen(true)}
                              className="px-space-md py-1.5 rounded-lg bg-status-fraud text-on-primary font-label-md text-label-md hover:bg-error transition-all shadow-sm"
                              type="button"
                            >
                              Investigasi / Override
                            </button>
                          ) : isRev ? (
                            <button
                              onClick={() =>
                                setNotifiedIds((p) => ({ ...p, [app.tracking_id]: true }))
                              }
                              className="px-space-md py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-label-md transition-all"
                              type="button"
                            >
                              {notifiedIds[app.tracking_id]
                                ? "Notifikasi Terkirim ✓"
                                : "Kirim Notifikasi"}
                            </button>
                          ) : (
                            <Link
                              href={`/track/${encodeURIComponent(app.tracking_id)}`}
                              className="px-space-md py-1.5 rounded-lg bg-surface-container text-secondary font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-all inline-block"
                            >
                              Lihat Detail
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination & Meta */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-sm text-text-muted font-body-sm text-body-sm">
              <span className="">
                Menampilkan 3 dari 18 kasus aktif yang memerlukan tindakan panitia
              </span>
              <div className="flex items-center gap-space-xs">
                <button className="p-1.5 rounded bg-surface-slate hover:bg-surface-container text-text-heading transition-colors" disabled type="button">
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>
                <span className="px-2 font-code-sm text-code-sm font-semibold text-text-heading">
                  Halaman 1 / 6
                </span>
                <button className="p-1.5 rounded bg-surface-slate hover:bg-surface-container text-text-heading transition-colors" type="button">
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </section>
          {/* Panel Aksi Cepat Panitia (Quick Action Toolbar) */}
          <section className="bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-surface-tint-blue flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  security
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading">
                  Aksi Otoritas & Integritas Panitia
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Penyelarasan basis data nasional dan penerbitan berkas berita acara berkekuatan hukum.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              {/* Action 1: Export BA */}
              <button className="flex-1 sm:flex-initial px-space-lg py-2.5 rounded-lg bg-surface-slate hover:bg-surface-container text-text-heading font-label-lg text-label-lg transition-all flex items-center justify-center gap-2" id="btn-export-ba" type="button" onClick={handleExportBa}>
                <span className="material-symbols-outlined text-[20px] text-text-muted">
                  file_download
                </span>
                {' '}
                <span className="">
                  {exportLabel}
                </span>
              </button>
              {/* Action 2: Sync Dukcapil */}
              <button className="flex-1 sm:flex-initial px-space-lg py-2.5 rounded-lg bg-surface-container hover:bg-surface-tint-blue text-secondary font-label-lg text-label-lg transition-all flex items-center justify-center gap-2" id="btn-sync-dukcapil" type="button" onClick={handleSyncDukcapil}>
                <span className="material-symbols-outlined text-[20px]">
                  sync
                </span>
                {' '}
                <span className="">
                  {syncLabel}
                </span>
              </button>
              {/* Action 3: Override Berkas */}
              <button className="flex-1 sm:flex-initial px-space-lg py-2.5 rounded-lg bg-secondary hover:bg-primary text-on-secondary font-label-lg text-label-lg shadow-sm transition-all flex items-center justify-center gap-2" id="btn-override-manual" type="button" onClick={() => setModalOpen(true)}>
                <span className="material-symbols-outlined text-[20px]">
                  edit_note
                </span>
                {' '}
                <span className="">
                  Override Manual Berkas
                </span>
              </button>
            </div>
          </section>
          {/* Interactive Feedback Script */}
        </div>
      </main>
    </div>
    {/* Modal Dialog Investigasi Forensik Kecurangan AI */}
    {modalOpen && (
    <div id="modal-forensic-investigation" className="fixed inset-0 z-50 flex items-center justify-center p-space-md sm:p-space-lg bg-on-surface/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-surface-canvas rounded-xl shadow-xl w-full max-w-5xl my-auto overflow-hidden flex flex-col border border-border-slate transition-all max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-space-lg py-space-md bg-surface-slate border-b border-border-slate flex items-start justify-between gap-space-md shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-code-md text-code-md text-text-heading font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-fraud text-[20px]">
                  gavel
                </span>
                {' '}Berkas Investigasi Forensik Kecurangan AI #FRD-2024-0142
              </span>
              {' '}
              <span className="px-2.5 py-0.5 rounded-full bg-status-fraud text-on-primary font-code-sm text-code-sm font-bold flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">
                  warning
                </span>
                {' '}SKOR RISIKO FRAUD: 94% (KRITIS)
              </span>
            </div>
            <div className="flex items-center gap-space-md text-[13px] text-text-muted flex-wrap pt-0.5">
              <span className="">
                <strong className="text-text-heading">
                  Nama Siswa:
                </strong>
                {' '}Budi Santoso
              </span>
              {' '}
              <span className="">
                <strong className="text-text-heading">
                  NIK:
                </strong>
                {' '}3171032801080004
              </span>
              {' '}
              <span className="">
                <strong className="text-text-heading">
                  Sekolah Tujuan:
                </strong>
                {' '}SMAN 1 Teladan Jakarta
              </span>
              {' '}
              <span className="font-code-sm text-secondary bg-surface-tint-blue px-2 py-0.5 rounded font-semibold">
                PostGIS ID: #238-TIK
              </span>
            </div>
          </div>
          <button type="button" className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-surface-container transition-colors shrink-0" aria-label="Tutup Modal" onClick={() => setModalOpen(false)}>
            <span className="material-symbols-outlined text-[22px]">
              close
            </span>
          </button>
        </div>
        {/* Body Konten Bukti Forensik Multi-Modal (Scrollable) */}
        <div className="p-space-lg overflow-y-auto flex flex-col gap-space-lg space-y-2">
          {/* Summary Banner Alert */}
          <div className="p-space-md rounded-xl bg-status-fraud-bg border border-status-fraud-border flex items-start gap-space-md">
            <div className="w-9 h-9 rounded-lg bg-status-fraud text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                policy
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-label-lg text-label-lg text-status-fraud font-bold">
                Deteksi Anomali Multi-Layer Aktif
              </h4>
              <p className="font-body-sm text-body-sm text-text-body mt-0.5">
                Algoritma PostGIS Geofence & Vision AI menemukan manipulasi titik koordinat domisili dan pemutakhiran KK tidak wajar guna memenuhi ambang batas zonasi (1.200 meter).
              </p>
            </div>
          </div>
          {/* Grid 3 Bukti Forensik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {/* Bukti 1: Forensik Visual Citra Fasad Jalanan */}
            <div className="bg-surface-slate rounded-xl p-space-md border border-border-slate flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">
                    Bukti 1 • Visual Fasad
                  </span>
                  {' '}
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    store
                  </span>
                </div>
                <h5 className="font-label-lg text-label-lg text-text-heading font-bold">
                  Analisis Tata Ruang Visual (Gemini 1.5 Pro)
                </h5>
                {/* Image Preview with Detection Badge */}
                <div className="relative w-full h-40 rounded-lg overflow-hidden my-space-xs border border-status-fraud-border">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD75CPTSZdgWu9WF_nHJaeeHib3XrpB4JyzRic5A75T6XlQEDgVyhZormvYb62S--pOL6GtwUG1ulLWoWE4MmNMpOjJq7R2ZEJBqlMjGmvSlZwBlTfGd8uyEekhzXdCZASpBOAfva7aK1ggH6e3YRQFvytukxiYe6akl-cTDXkHRFj96caHBvKxZA-imjPuKdG6ed1vLPI2hnObIpCgxog8ro5h7GvDOhCWD79c3Us" alt="Visual Citra Fasad Ruko Komersial" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-status-fraud text-on-primary px-2 py-0.5 rounded text-[11px] font-code-sm font-bold shadow">
                    Bukan Hunian Warga (Komersial 98.4%)
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-surface-canvas/90 backdrop-blur px-2 py-1 rounded text-[11px] font-label-md text-text-heading flex items-center justify-between">
                    <span className="">
                      Ruko Sentra Niaga / Ekspedisi
                    </span>
                    {' '}
                    <span className="text-status-fraud font-bold">
                      Non-Residensial
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted text-[13px] leading-relaxed">
                  Titik koordinat terdaftar berada di unit ruko ekspedisi komersial bertingkat dua. Tidak ditemukan ventilasi kamar tidur keluarga atau aktivitas pemukiman siswa.
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs border-t border-border-slate flex items-center justify-between font-code-sm text-code-sm text-status-fraud font-semibold">
                <span className="">
                  Verifikasi Citra:
                </span>
                {' '}
                <span className="">
                  ANOMALI TINGGI
                </span>
              </div>
            </div>
            {/* Bukti 2: Forensik Dokumen Kartu Keluarga */}
            <div className="bg-surface-slate rounded-xl p-space-md border border-border-slate flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">
                    Bukti 2 • Kronologis KK
                  </span>
                  {' '}
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    badge
                  </span>
                </div>
                <h5 className="font-label-lg text-label-lg text-text-heading font-bold">
                  Audit Kronologis Terbit KK (OCR & Dukcapil)
                </h5>
                {/* Timeline Data Details */}
                <div className="bg-surface-canvas rounded-lg p-space-sm border border-border-slate my-space-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Tanggal Terbit KK:
                    </span>
                    {' '}
                    <span className="font-code-sm text-text-heading font-bold">
                      12 Maret 2024
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Masa Berlaku KK:
                    </span>
                    {' '}
                    <span className="font-code-sm text-status-fraud font-bold bg-status-fraud-bg px-1.5 py-0.5 rounded">
                      3 Bln 12 Hari ({'<'} 1 Thn)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Status Hubungan:
                    </span>
                    {' '}
                    <span className="font-label-md text-text-heading font-bold">
                      "Famili Lain" (Bukan Anak)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Sinkron Dukcapil:
                    </span>
                    {' '}
                    <span className="font-code-sm text-status-fraud font-bold">
                      Mutasi Kilat (90 Hari)
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted text-[13px] leading-relaxed">
                  Kepala Keluarga baru memutasi NIK ini 90 hari sebelum pendaftaran PPDB dibuka. Pola sinkronisasi mengindikasikan modus{' '}
                  <em>
                    "Titip KK Kerabat"
                  </em>
                  {' '}tanpa kepindahan riil orang tua.
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs border-t border-border-slate flex items-center justify-between font-code-sm text-code-sm text-status-fraud font-semibold">
                <span className="">
                  Uji Permendikbud:
                </span>
                {' '}
                <span className="">
                  TIDAK MEMENUHI SYARAT
                </span>
              </div>
            </div>
            {/* Bukti 3: Forensik Geospasial Rute Darat PostGIS */}
            <div className="bg-surface-slate rounded-xl p-space-md border border-border-slate flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary font-semibold uppercase tracking-wider">
                    Bukti 3 • Geometri Jalan
                  </span>
                  {' '}
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    route
                  </span>
                </div>
                <h5 className="font-label-lg text-label-lg text-text-heading font-bold">
                  Topologi Akses Jalan & Geometri Geodesik
                </h5>
                {/* Metric Comparison Box */}
                <div className="bg-surface-canvas rounded-lg p-space-sm border border-border-slate my-space-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Garis Lurus (Euclidean):
                    </span>
                    {' '}
                    <span className="font-code-sm text-text-heading font-bold">
                      310 m (Semu)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Rute Darat (ST_ShortestPath):
                    </span>
                    {' '}
                    <span className="font-code-sm text-status-fraud font-bold">
                      1.840 meter
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Deviasi Geospasial:
                    </span>
                    {' '}
                    <span className="font-code-sm text-status-fraud font-bold bg-status-fraud-bg px-1.5 py-0.5 rounded">
                      +1.530 m ({'>'} 1.200m)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">
                      Kendala Rute:
                    </span>
                    {' '}
                    <span className="text-text-muted font-label-md">
                      Terhalang Sungai & Tol
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted text-[13px] leading-relaxed">
                  Rute lurus melintasi sungai tanpa akses jembatan umum dan terhalang separator jalan tol. Rute jalan kaki legal yang sebenarnya adalah 1,84 km, melampaui radius zonasi 1.200 m.
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs border-t border-border-slate flex items-center justify-between font-code-sm text-code-sm text-status-fraud font-semibold">
                <span className="">
                  Batas Zonasi Maks:
                </span>
                {' '}
                <span className="">
                  1.200 m (TERLANGGAR)
                </span>
              </div>
            </div>
          </div>
          {/* Rekomendasi Keputusan AI Formal */}
          <div className="p-space-md rounded-xl bg-surface-slate border-l-4 border-status-fraud flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex flex-col">
              <span className="font-code-sm text-code-sm text-text-muted uppercase tracking-wider font-semibold">
                Rekomendasi Keputusan Sistem
              </span>
              <p className="font-label-lg text-label-lg text-text-heading font-bold mt-0.5">
                Rekomendasi Diskualifikasi Otomatis (Pelanggaran Permendikbud No. 1/2021 & Juknis PPDB DKI)
              </p>
              <span className="text-[12px] text-text-muted font-body-sm">
                Bukti pelanggaran tersimpan permanen dalam immutable audit trail dengan hash SHA-256 terverifikasi.
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-status-fraud-bg px-3 py-1.5 rounded-lg border border-status-fraud-border text-status-fraud font-code-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
              {' '}
              <span className="">
                Keputusan Akurasi: 99.4%
              </span>
            </div>
          </div>
        </div>
        {/* Footer Actions Panitia */}
        <div className="px-space-lg py-space-md bg-surface-slate border-t border-border-slate flex flex-col sm:flex-row items-center justify-between gap-space-sm shrink-0">
          <button type="button" onClick={() => setModalOpen(false)} className="w-full sm:w-auto px-space-lg py-2 rounded-lg bg-surface-canvas border border-border-slate text-text-heading font-label-md text-label-md hover:bg-surface-container transition-colors">
            Tutup / Tinjau Nanti
          </button>
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-space-sm justify-end">
            <button type="button" onClick={() => setSidakScheduled(true)} className="flex-1 sm:flex-initial px-space-md py-2 rounded-lg bg-surface-container text-secondary font-label-md text-label-md hover:bg-surface-tint-blue transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">
                local_shipping
              </span>
              {' '}
              <span className="">
                {sidakScheduled ? "Sidak Posko Terjadwal ✓" : "Jadwalkan Sidak Verifikasi Lapangan (Posko)"}
              </span>
            </button>
            <button type="button" onClick={handleConfirmDisqualify} className="flex-1 sm:flex-initial px-space-lg py-2 rounded-lg bg-status-fraud text-on-primary font-label-md text-label-md hover:opacity-95 shadow transition-all flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">
                gavel
              </span>
              {' '}
              <span className="">
                Konfirmasi Diskualifikasi & Terbitkan Berita Acara
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    )}
    </div>
  );
}
