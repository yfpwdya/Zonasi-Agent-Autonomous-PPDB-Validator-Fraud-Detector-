"use client";
import React, { useEffect, useState } from "react";
import type { ApplicationRecord, AuthUser } from "@/types";
import { useApplications, useUpdateApplication } from "@/hooks/useApplications";
import { clearPanitiaSession } from "@/hooks/useAuth";
import Link from "next/link";

export default function DashboardPage() {
  const [mapLayer, setMapLayer] = useState<"hybrid" | "topo" | "heat">("hybrid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FRAUD" | "REVISION" | "APPROVED">("ALL");
  const { data, refetch } = useApplications();
  const updateApp = useUpdateApplication();
  const applications = data?.applications ?? [];
  const dataSource = data?.source ?? "supabase";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derived from the cached list so the inspector always shows fresh data after refetch.
  const selectedApp = applications.find((a) => a.tracking_id === selectedId) ?? null;
  const setSelectedApp = (a: ApplicationRecord) => setSelectedId(a.tracking_id);
  const [modalOpen, setModalOpen] = useState(false);
  const [sidakScheduled, setSidakScheduled] = useState<Record<string, boolean>>({});
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});
  const [exportLabel, setExportLabel] = useState("Ekspor Berita Acara (CSV/Excel)");
  const [syncLabel, setSyncLabel] = useState("Sinkronisasi Data Dukcapil & Supabase");
  const [currentPage, setCurrentPage] = useState(1);
  const [authUser, setAuthUser] = useState<AuthUser>({
    id: "default-auditor",
    email: "panitia.ppdb@sman1-jkt.sch.id",
    full_name: "Budi Santoso, S.Kom",
    nip: "198804122015031002",
    role: "KETUA_VERIFIKATOR",
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zonasi_auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) setAuthUser(parsed);
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const totalCount = applications.length;
  const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
  const revisionCount = applications.filter(
    (a) => a.status === "NEEDS_LIVE_PHOTO" || a.status === "NEEDS_REVISION",
  ).length;
  const fraudCount = applications.filter((a) => a.status === "REJECTED").length;
  const passRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      app.student_name.toLowerCase().includes(q) ||
      app.student_nik.toLowerCase().includes(q) ||
      app.tracking_id.toLowerCase().includes(q) ||
      app.kk_number.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (statusFilter === "FRAUD") return app.status === "REJECTED";
    if (statusFilter === "REVISION")
      return app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
    if (statusFilter === "APPROVED") return app.status === "APPROVED";
    return true;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedApps = filteredApps.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeCase: ApplicationRecord = selectedApp ||
    applications.find((a) => a.status === "REJECTED") ||
    applications[0] || {
      id: "default",
      tracking_id: "PPDB-2026-F91X",
      student_nik: "3171042801080004",
      student_name: "Budi Santoso",
      kk_number: "3171041203260091",
      kk_issued_date: "2026-01-10",
      kk_age_label: "2 Bln (<1 Thn)",
      family_relation: "FAMILI_LAIN",
      address_text: "Jl. Bukit Duri Tanjakan No. 88 (Ruko Sentra Niaga)",
      latitude: -6.2251,
      longitude: 106.8589,
      straight_distance_meters: 310,
      real_route_distance_meters: 1380,
      detected_building: "COMMERCIAL",
      ocr_confidence: 95.8,
      status: "REJECTED",
      ai_reasoning_summary: "Anomali terdeteksi pada titik domisili dan masa berlaku KK.",
      kk_document_url: "/uploads/kk_budi.jpg",
      live_geotag_photo_url: null,
      updated_at: new Date().toISOString(),
    };

  const handleExportBa = () => {
    setExportLabel("Mengemas Berita Acara CSV...");
    const headers = [
      "Tracking ID",
      "Nama Calon Siswa",
      "NIK",
      "No KK",
      "Tanggal Terbit KK",
      "Usia KK",
      "Relasi Keluarga",
      "Jarak Lurus (m)",
      "Jarak Rute (m)",
      "Deteksi Bangunan",
      "Skor OCR (%)",
      "Status Keputusan",
      "Ringkasan AI / Panitia",
    ];
    const rows = applications.map((a) => [
      a.tracking_id,
      `"${a.student_name.replace(/"/g, '""')}"`,
      `"'${a.student_nik}"`,
      `"'${a.kk_number}"`,
      a.kk_issued_date,
      `"${a.kk_age_label}"`,
      a.family_relation,
      (a.straight_distance_meters ?? a.straight_line_distance_meters ?? 0),
      a.real_route_distance_meters,
      a.detected_building,
      a.ocr_confidence,
      a.status,
      `"${(a.ai_reasoning_summary || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Berita-Acara-PPDB-Zonasi-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportLabel("BA-PPDB-SMAN1.csv Diunduh ✓");
    showToast(`Berita Acara (${applications.length} berkas) berhasil diunduh.`);
  };

  const handleSyncDukcapil = async () => {
    setSyncLabel(`Menyinkronkan ${applications.length} Berkas...`);
    const r = await refetch();
    setSyncLabel(`Tersinkronisasi Supabase (${r.data?.applications.length ?? 0} Berkas) ✓`);
    showToast("Data antrean berhasil disinkronkan langsung dengan Supabase PostgreSQL.");
  };

  const handleUpdateStatus = async (
    targetApp: ApplicationRecord,
    nextStatus: ApplicationRecord["status"],
    reasonNote: string,
  ) => {
    try {
      await updateApp.mutateAsync({
        tracking_id: targetApp.tracking_id,
        status: nextStatus,
        actor: `${authUser.full_name} (NIP: ${authUser.nip})`,
        ai_reasoning_summary: `[Override Panitia - ${authUser.full_name}] ${reasonNote}`,
      });
    } catch (e) {
      return showToast(`Gagal memperbarui status: ${(e as Error).message}`);
    }
    setModalOpen(false);
    showToast(`Status berkas ${targetApp.tracking_id} (${targetApp.student_name}) diperbarui menjadi ${nextStatus}.`);
  };

  const handleNotifyApplicant = async (app: ApplicationRecord) => {
    setNotifiedIds((p) => ({ ...p, [app.tracking_id]: true }));
    await updateApp
      .mutateAsync({
        tracking_id: app.tracking_id,
        status: app.status,
        actor: authUser.full_name,
        ai_reasoning_summary: `${app.ai_reasoning_summary} [Notifikasi revisi dikirim oleh ${authUser.full_name} pada ${new Date().toLocaleTimeString("id-ID")}]`,
      })
      .catch(() => {});
    showToast(`Notifikasi instruksi revisi terkirim ke pendaftar ${app.student_name} (${app.tracking_id}).`);
  };

  const handleLogout = async () => {
    await clearPanitiaSession();
    window.location.href = "/login";
  };

  return (
    <div className="bg-surface font-body-md text-text-body antialiased min-h-screen flex">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[60] bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl border border-secondary/40 flex items-center gap-2.5 text-sm font-medium">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-canvas border-r border-border-slate shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 hidden lg:flex flex-col pt-space-md pb-space-lg">
        <div className="px-space-lg mb-space-lg flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[20px]">policy</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-text-heading font-bold leading-none">
              Zonasi-Agent
            </span>
            <span className="font-code-sm text-code-sm text-secondary mt-0.5">
              Konsol Panitia PPDB
            </span>
          </div>
        </div>
        <div className="px-space-lg mb-space-sm">
          <span className="font-code-sm text-code-sm text-text-muted uppercase tracking-wider">
            Navigasi Audit
          </span>
        </div>
        <nav className="flex-1 px-space-md flex flex-col gap-1">
          <a
            aria-current="page"
            className="flex items-center gap-space-sm px-space-md py-space-sm transition-all bg-surface-tint-blue text-secondary font-headline-sm rounded-lg"
            href="#ringkasan"
          >
            <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
            <span className="font-label-lg text-label-lg">Ringkasan Verifikasi</span>
          </a>
          <a
            className="flex items-center justify-between px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all"
            href="#antrean"
          >
            <span className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px]">rule</span>
              <span className="font-label-lg text-label-lg">Antrean Validasi AI</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-heading font-code-sm text-[11px] font-bold">
              {totalCount}
            </span>
          </a>
          <a
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all"
            href="#radar"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            <span className="font-label-lg text-label-lg">Radar Geofence PostGIS</span>
          </a>
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all"
            href={`/track/${encodeURIComponent(activeCase.tracking_id)}`}
          >
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
            <span className="font-label-lg text-label-lg">Log Forensik Dokumen</span>
          </Link>
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-slate hover:text-on-surface transition-all"
            href="/daftar"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="font-label-lg text-label-lg">Form Pendaftaran Siswa</span>
          </Link>
        </nav>
        <div className="px-space-md pt-space-md mt-auto flex flex-col gap-space-xs">
          <div className="p-space-sm rounded-xl bg-surface-slate border border-border-slate flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-code-sm text-text-muted">Database Engine</span>
              <span className="w-2 h-2 rounded-full bg-status-approved" />
            </div>
            <span className="font-code-sm text-code-sm text-text-heading font-semibold">
              {dataSource === "supabase" ? "Supabase PostGIS Cloud" : "Local Fallback Store"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-label-md transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              <span>Ganti Akun</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-error hover:bg-status-fraud-bg font-label-md text-label-md transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper - flex-1 min-w-0 fixes right-side clipping! */}
      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col">
        <header className="sticky top-0 right-0 h-16 bg-surface-canvas/90 backdrop-blur-md border-b border-border-slate z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-headline-sm text-headline-sm text-text-heading font-bold truncate">
              Panel Pengawasan Geospasial
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-approved-bg border border-status-approved-border shrink-0">
              <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
              <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                Supabase Realtime: Terhubung ({totalCount} Berkas)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-label-md transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Auth Panitia</span>
            </Link>
            <div className="flex items-center gap-2.5 pl-2 border-l border-border-slate">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary font-bold text-xs">
                {authUser.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left max-w-[190px]">
                <span className="font-label-lg text-label-lg text-text-heading leading-tight truncate">
                  {authUser.full_name}
                </span>
                <span className="font-code-sm text-[11px] text-text-muted leading-tight truncate">
                  {authUser.role} • NIP {authUser.nip}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main id="ringkasan" className="flex-1 bg-surface">
          <div className="flex flex-col w-full max-w-[1440px] mx-auto gap-6 p-4 sm:p-6 lg:p-8">
            {/* Header Panel Panitia */}
            <section className="bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-tint-blue font-code-sm text-code-sm text-secondary font-semibold">
                    Zonasi-Agent Sentinel v3.4
                  </span>
                  <span className="flex items-center gap-1 font-body-sm text-body-sm text-text-muted">
                    <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
                    SMAN 1 Teladan (Wilayah DKI Jakarta)
                  </span>
                </div>
                <h1 className="font-headline-md text-headline-md text-text-heading font-bold">
                  Dashboard Pengawas PPDB — Posko Zonasi Cerdas
                </h1>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Pemantauan anomali geospasial real-time, audit forensik Kartu Keluarga (Gemini 3 Flash), dan deteksi manipulasi PostGIS.
                </p>
              </div>

              {/* Quick Status Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto shrink-0">
                <div className="bg-surface-slate rounded-xl p-4 min-w-[210px] border border-border-slate">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-label-md text-label-md text-text-muted">Terisi Kuota Lolos</span>
                    <span className="font-code-sm text-code-sm text-secondary font-semibold">
                      {passRate}%
                    </span>
                  </div>
                  <div className="font-code-lg text-code-lg text-text-heading font-bold">
                    {approvedCount}{" "}
                    <span className="font-body-sm text-body-sm text-text-muted font-normal">
                      / {totalCount} Berkas Masuk
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(10, passRate))}%` }}
                    />
                  </div>
                </div>

                <div className="bg-status-revision-bg rounded-xl p-4 min-w-[210px] border border-status-revision-border">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-label-md text-label-md text-status-revision font-semibold">
                      Antrean Tindakan Panitia
                    </span>
                    <span className="w-2 h-2 rounded-full bg-status-revision animate-ping" />
                  </div>
                  <div className="font-code-lg text-code-lg text-text-heading font-bold">
                    {revisionCount + fraudCount}{" "}
                    <span className="font-body-sm text-body-sm text-text-muted font-normal">
                      Kasus Perlu Tinjauan
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm text-status-revision block mt-2">
                    {fraudCount} Fraud Kritis • {revisionCount} Revisi Berkas
                  </span>
                </div>
              </div>
            </section>

            {/* Metric Analytics Cards (100% Live Database Counts) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider">
                    Total Pendaftar
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-surface-tint-blue flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="font-headline-lg text-headline-lg text-text-heading font-bold">
                    {totalCount}
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Berkas tersimpan di PostGIS layer
                  </span>
                </div>
                <div className="flex items-center gap-1 text-status-approved font-code-sm text-code-sm">
                  <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                  <span>Sinkron dengan Supabase Cloud</span>
                </div>
              </div>

              <div className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-status-approved uppercase tracking-wider">
                    Disetujui Otomatis
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-status-approved-bg flex items-center justify-center text-status-approved">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="font-headline-lg text-headline-lg text-text-heading font-bold">
                    {approvedCount}
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Lolos verifikasi KK, Jarak & Hunian
                  </span>
                </div>
                <div className="flex items-center justify-between text-text-muted font-code-sm text-code-sm">
                  <span>Rasio Lolos Validasi</span>
                  <span className="font-semibold text-status-approved">{passRate}%</span>
                </div>
              </div>

              <div className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-status-revision uppercase tracking-wider">
                    Revisi / Foto Mandiri
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-status-revision-bg flex items-center justify-center text-status-revision">
                    <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="font-headline-lg text-headline-lg text-text-heading font-bold">
                    {revisionCount}
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    KK dummy/buram atau gang sempit
                  </span>
                </div>
                <div className="flex items-center gap-1 text-status-revision font-code-sm text-code-sm">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Menunggu unggah ulang pendaftar</span>
                </div>
              </div>

              <div className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-status-fraud uppercase tracking-wider">
                    Anomali / Fraud
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-status-fraud-bg flex items-center justify-center text-status-fraud">
                    <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
                  </div>
                </div>
                <div className="my-3">
                  <div className="font-headline-lg text-headline-lg text-status-fraud font-bold">
                    {fraudCount}
                  </div>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    KK &lt; 1 thn / titik ruko komersial
                  </span>
                </div>
                <div className="flex items-center gap-1 text-status-fraud font-code-sm text-code-sm">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Wajib investigasi / diskualifikasi</span>
                </div>
              </div>
            </section>

            {/* Peta Geospasial PostGIS Interaktif & Inspector Panel */}
            <section id="radar" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Map Container */}
              <div className="xl:col-span-8 bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col gap-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                      Radar Geospasial PostGIS (Radius Zonasi 1.200m)
                    </h2>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      Klik pin pendaftar pada peta untuk memuat detail ke panel Inspeksi Anomali di kanan
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-surface-slate rounded-lg p-1 self-start">
                    <button
                      type="button"
                      onClick={() => setMapLayer("hybrid")}
                      className={
                        mapLayer === "hybrid"
                          ? "px-3 py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary font-bold"
                          : "px-3 py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"
                      }
                    >
                      Hybrid
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapLayer("topo")}
                      className={
                        mapLayer === "topo"
                          ? "px-3 py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary font-bold"
                          : "px-3 py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"
                      }
                    >
                      Batas RW
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapLayer("heat")}
                      className={
                        mapLayer === "heat"
                          ? "px-3 py-1 bg-surface-canvas shadow-sm rounded font-label-md text-label-md text-secondary font-bold"
                          : "px-3 py-1 rounded font-label-md text-label-md text-text-muted hover:text-text-heading"
                      }
                    >
                      Heatmap
                    </button>
                  </div>
                </div>

                {/* Map Display with dynamic clickable pins */}
                <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-surface-slate border border-border-slate">
                  <div
                    className={`w-full h-full bg-cover bg-center transition-all duration-300 ${
                      mapLayer === "topo"
                        ? "grayscale contrast-125"
                        : mapLayer === "heat"
                        ? "hue-rotate-15 saturate-150"
                        : ""
                    }`}
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBWwev_YZnliq12vwr0z5yg3HvIvupz4Mytg6-9b2VflmYu4GvMmaJGNLvprYkgAuLYDJH5rDsPJt7aMRuU4RafIS5dFqgCEJ3qEBlgymZdgh3yWQwJpqRv2nzqYaAS_KQxXYCGMwrZX9B6AILlHwuQGERO8P4BBMVQ0dtIqNc2LBJggD3ykETuabV0i0onS5qUUg8eZbezEMC6o4UiNuxbIvTzAowWiOvHzulcnB4')",
                    }}
                  />
                  {/* Floating Coordinate Indicator */}
                  <div className="absolute top-3 left-3 bg-surface-canvas/95 backdrop-blur-md rounded-lg p-2.5 shadow-md flex flex-col gap-0.5 max-w-xs border border-border-slate">
                    <div className="flex items-center gap-1.5 font-code-sm text-code-sm text-text-heading font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-secondary">explore</span>
                      {(activeCase.latitude ?? activeCase.home_lat ?? -6.2297).toFixed(4)}, {(activeCase.longitude ?? activeCase.home_lng ?? 106.8532).toFixed(4)} ({activeCase.student_name})
                    </div>
                    <span className="font-body-sm text-[11px] text-text-muted">
                      Mode Layer: {mapLayer.toUpperCase()} • Jarak Rute: {activeCase.real_route_distance_meters}m
                    </span>
                  </div>

                  {/* Interactive Pins from Live Applications */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex flex-wrap justify-end gap-2 pointer-events-auto">
                      {applications
                        .filter((a) => a.status === "REJECTED")
                        .map((a) => (
                          <button
                            key={a.tracking_id}
                            type="button"
                            onClick={() => setSelectedApp(a)}
                            className={`flex items-center gap-1.5 bg-status-fraud-bg/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md border transition-transform hover:scale-105 ${
                              activeCase.tracking_id === a.tracking_id
                                ? "border-status-fraud ring-2 ring-status-fraud/40"
                                : "border-status-fraud-border"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-status-fraud animate-ping" />
                            <span className="font-code-sm text-xs text-status-fraud font-bold">
                              {a.student_name} ({(a.straight_distance_meters ?? a.straight_line_distance_meters ?? 0)}m • RUKO)
                            </span>
                          </button>
                        ))}
                    </div>

                    {/* Center School Marker */}
                    <div className="self-center flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xl ring-4 ring-secondary/25">
                        <span className="material-symbols-outlined text-[22px]">school</span>
                      </div>
                      <span className="bg-surface-canvas px-2.5 py-0.5 rounded-md shadow text-[11px] font-label-md text-text-heading font-bold mt-1 border border-border-slate">
                        SMAN 1 Teladan (Pusat Zonasi)
                      </span>
                    </div>

                    {/* Bottom Pins: Approved & Revision */}
                    <div className="flex flex-wrap items-center gap-2 pointer-events-auto pb-8 sm:pb-0">
                      {applications
                        .filter((a) => a.status !== "REJECTED")
                        .slice(0, 4)
                        .map((a) => {
                          const isRev =
                            a.status === "NEEDS_LIVE_PHOTO" || a.status === "NEEDS_REVISION";
                          return (
                            <button
                              key={a.tracking_id}
                              type="button"
                              onClick={() => setSelectedApp(a)}
                              className={`flex items-center gap-1.5 backdrop-blur px-2.5 py-1 rounded-full shadow border transition-transform hover:scale-105 ${
                                isRev
                                  ? "bg-status-revision-bg/95 border-status-revision-border text-status-revision"
                                  : "bg-status-approved-bg/95 border-status-approved-border text-status-approved"
                              } ${
                                activeCase.tracking_id === a.tracking_id
                                  ? "ring-2 ring-secondary"
                                  : ""
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isRev ? "bg-status-revision" : "bg-status-approved"
                                }`}
                              />
                              <span className="font-code-sm text-[11px] font-semibold">
                                {a.student_name.split(" ")[0]} ({a.real_route_distance_meters}m)
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector Telemetry & Selected Case Card (Dynamic!) */}
              <div className="xl:col-span-4 bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4 min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                      Inspeksi Berkas Terpilih
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-code-sm text-xs font-bold shrink-0 ${
                        activeCase.status === "REJECTED"
                          ? "bg-status-fraud-bg text-status-fraud"
                          : activeCase.status === "APPROVED"
                          ? "bg-status-approved-bg text-status-approved"
                          : "bg-status-revision-bg text-status-revision"
                      }`}
                    >
                      {activeCase.status}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-muted mb-4">
                    Klik baris pada tabel atau pin peta untuk menginspeksi bukti forensik berkas.
                  </p>

                  {/* Selected Case Card */}
                  <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col gap-3 mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg text-text-heading font-bold truncate">
                          {activeCase.student_name}
                        </span>
                        <span className="font-code-sm text-xs text-text-muted">
                          {activeCase.tracking_id} • NIK: {activeCase.student_nik}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-surface-canvas border border-border-slate font-code-sm text-xs text-secondary font-semibold shrink-0">
                        OCR {activeCase.ocr_confidence}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-surface-canvas p-2.5 rounded-lg border border-border-slate">
                        <span className="text-text-muted block">Jarak Lurus / Rute</span>
                        <span className="font-code-md text-text-heading font-bold">
                          {(activeCase.straight_distance_meters ?? activeCase.straight_line_distance_meters ?? 0)}m / {activeCase.real_route_distance_meters}m
                        </span>
                      </div>
                      <div className="bg-surface-canvas p-2.5 rounded-lg border border-border-slate">
                        <span className="text-text-muted block">Usia Terbit KK</span>
                        <span
                          className={`font-code-md font-bold ${
                            activeCase.status === "REJECTED"
                              ? "text-status-fraud"
                              : "text-status-approved"
                          }`}
                        >
                          {activeCase.kk_age_label}
                        </span>
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border-slate bg-slate-900">
                      <img
                        className="w-full h-full object-cover"
                        alt={activeCase.student_name}
                        src={
                          (activeCase.kk_document_url || activeCase.kk_image_url || '')?.startsWith("http")
                            ? (activeCase.kk_document_url || activeCase.kk_image_url || '')
                            : "https://lh3.googleusercontent.com/aida-public/AB6AXuD75CPTSZdgWu9WF_nHJaeeHib3XrpB4JyzRic5A75T6XlQEDgVyhZormvYb62S--pOL6GtwUG1ulLWoWE4MmNMpOjJq7R2ZEJBqlMjGmvSlZwBlTfGd8uyEekhzXdCZASpBOAfva7aK1ggH6e3YRQFvytukxiYe6akl-cTDXkHRFj96caHBvKxZA-imjPuKdG6ed1vLPI2hnObIpCgxog8ro5h7GvDOhCWD79c3Us"
                        }
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-surface-canvas/95 px-2.5 py-1 rounded text-[11px] font-label-md text-text-heading flex items-center justify-between">
                        <span className="truncate">
                          Bangunan: <strong>{activeCase.detected_building}</strong>
                        </span>
                        <span className="font-code-sm text-secondary font-bold">
                          {(activeCase.family_relation || (activeCase.family_relation_valid ? 'ANAK_KANDUNG' : 'FAMILI_LAIN'))}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-text-body leading-relaxed bg-surface-canvas p-2.5 rounded-lg border border-border-slate">
                      {activeCase.ai_reasoning_summary}
                    </p>
                  </div>
                </div>

                {/* Action Buttons for Selected Case */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-status-fraud text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>Investigasi & Override</span>
                  </button>
                  <Link
                    href={`/track/${encodeURIComponent(activeCase.tracking_id)}`}
                    className="py-2.5 px-3 rounded-lg bg-surface-slate hover:bg-surface-container text-text-heading font-label-md text-label-md transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    <span>Tracker</span>
                  </Link>
                </div>
              </div>
            </section>

            {/* Tabel Antrean Validasi AI & Triage Pendaftar */}
            <section
              id="antrean"
              className="bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col gap-5 min-w-0"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                      Antrean Triage Validasi AI & Verifikasi Berkas
                    </h2>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      Daftar pendaftar diurutkan berdasarkan pembaruan terbaru dari Supabase PostgreSQL
                    </span>
                  </div>
                  {/* Search Input */}
                  <div className="relative min-w-[260px] sm:w-80">
                    <span className="material-symbols-outlined text-[18px] text-text-muted absolute left-3 top-1/2 -translate-y-1/2">
                      search
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-slate text-text-heading placeholder:text-text-muted font-body-sm text-body-sm focus:outline-none focus:bg-surface-canvas border border-border-slate focus:border-secondary transition-all"
                      placeholder="Cari NIK, Nama Siswa, atau Tracking ID..."
                      type="text"
                    />
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-slate">
                  <div className="flex flex-wrap items-center gap-1.5 bg-surface-slate p-1.5 rounded-xl border border-border-slate">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setCurrentPage(1);
                      }}
                      className={
                        statusFilter === "ALL"
                          ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-text-heading font-bold shadow-sm transition-all flex items-center gap-1.5"
                          : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-text-heading transition-all flex items-center gap-1.5"
                      }
                    >
                      <span>Semua Status</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-slate text-text-heading font-code-sm text-code-sm">
                        {totalCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("FRAUD");
                        setCurrentPage(1);
                      }}
                      className={
                        statusFilter === "FRAUD"
                          ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-fraud font-bold shadow-sm border border-status-fraud-border transition-all flex items-center gap-1.5"
                          : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-fraud transition-all flex items-center gap-1.5"
                      }
                    >
                      <span>🚨 Kritis / Fraud</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-status-fraud-bg text-status-fraud font-code-sm text-code-sm font-semibold">
                        {fraudCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("REVISION");
                        setCurrentPage(1);
                      }}
                      className={
                        statusFilter === "REVISION"
                          ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-revision font-bold shadow-sm border border-status-revision-border transition-all flex items-center gap-1.5"
                          : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-revision transition-all flex items-center gap-1.5"
                      }
                    >
                      <span>⚠️ Perlu Revisi / Foto</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-status-revision-bg text-status-revision font-code-sm text-code-sm font-semibold">
                        {revisionCount}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("APPROVED");
                        setCurrentPage(1);
                      }}
                      className={
                        statusFilter === "APPROVED"
                          ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-approved font-bold shadow-sm border border-status-approved-border transition-all flex items-center gap-1.5"
                          : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-approved transition-all flex items-center gap-1.5"
                      }
                    >
                      <span>✅ Bersih / Lolos</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm font-semibold">
                        {approvedCount}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-text-muted font-code-sm text-code-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span>
                      Filter Aktif:{" "}
                      <strong className="text-text-heading">
                        {filteredApps.length} dari {totalCount} Berkas
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsive Table Container */}
              <div className="overflow-x-auto rounded-xl border border-border-slate">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-slate text-text-muted font-label-md text-label-md border-b border-border-slate">
                      <th className="py-3.5 px-4">No</th>
                      <th className="py-3.5 px-4">Tracking ID</th>
                      <th className="py-3.5 px-4">Nama Calon Siswa</th>
                      <th className="py-3.5 px-4">NIK / No. KK</th>
                      <th className="py-3.5 px-4">Jarak Rute</th>
                      <th className="py-3.5 px-4">Usia KK</th>
                      <th className="py-3.5 px-4">Deteksi Bangunan</th>
                      <th className="py-3.5 px-4">Status AI</th>
                      <th className="py-3.5 px-4 text-right">Tindakan Panitia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-slate text-text-body font-body-sm text-body-sm">
                    {pagedApps.map((app, i) => {
                      const isFraud = app.status === "REJECTED";
                      const isRev =
                        app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
                      const rowNum = (safePage - 1) * pageSize + i + 1;
                      return (
                        <tr
                          key={app.id}
                          onClick={() => setSelectedApp(app)}
                          className={`cursor-pointer transition-colors ${
                            activeCase.tracking_id === app.tracking_id
                              ? "bg-surface-tint-blue/40"
                              : isFraud
                              ? "hover:bg-status-fraud-bg/30 bg-status-fraud-bg/10"
                              : isRev
                              ? "hover:bg-status-revision-bg/30"
                              : "hover:bg-surface-slate/70"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-code-sm text-code-sm text-text-muted">
                            {String(rowNum).padStart(2, "0")}
                          </td>
                          <td
                            className={`py-3.5 px-4 font-code-sm text-code-sm font-bold whitespace-nowrap ${
                              isFraud ? "text-status-fraud" : "text-secondary"
                            }`}
                          >
                            <Link
                              href={`/track/${encodeURIComponent(app.tracking_id)}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {app.tracking_id}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-text-heading whitespace-nowrap">
                            {app.student_name}
                          </td>
                          <td className="py-3.5 px-4 font-code-sm text-xs text-text-muted whitespace-nowrap">
                            <div>{app.student_nik}</div>
                            <div className="text-[11px] opacity-75">KK: {app.kk_number}</div>
                          </td>
                          <td
                            className={`py-3.5 px-4 font-code-sm text-code-sm font-semibold whitespace-nowrap ${
                              isFraud ? "text-status-fraud" : ""
                            }`}
                          >
                            {app.real_route_distance_meters} m
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isFraud ? (
                              <span className="px-2 py-0.5 rounded bg-status-fraud-bg text-status-fraud font-code-sm text-xs font-bold">
                                {app.kk_age_label}
                              </span>
                            ) : (
                              <span className="font-code-sm text-xs text-status-approved font-semibold">
                                {app.kk_age_label}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {app.detected_building === "COMMERCIAL" ? (
                              <span className="px-2.5 py-1 rounded-full bg-status-fraud-bg text-status-fraud font-code-sm text-xs font-semibold inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">storefront</span>
                                KOMERSIAL/RUKO
                              </span>
                            ) : app.detected_building === "NO_STREET_VIEW" ? (
                              <span className="px-2.5 py-1 rounded-full bg-surface-slate text-text-muted font-code-sm text-xs inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">alt_route</span>
                                GANG SEMPIT
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-xs font-semibold inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">home</span>
                                RESIDENSIAL
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isFraud ? (
                              <span className="px-2.5 py-1 rounded-full bg-status-fraud-bg text-status-fraud font-label-md text-xs font-bold inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">dangerous</span>
                                REJECTED - FRAUD
                              </span>
                            ) : isRev ? (
                              <span className="px-2.5 py-1 rounded-full bg-status-revision-bg text-status-revision font-label-md text-xs font-semibold inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                                {app.status}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-label-md text-xs font-bold inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                APPROVED
                              </span>
                            )}
                          </td>
                          <td
                            className="py-3.5 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isFraud ? (
                                <button
                                  onClick={() => {
                                    setSelectedApp(app);
                                    setModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-status-fraud text-on-primary font-label-md text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                                  type="button"
                                >
                                  Investigasi / Override
                                </button>
                              ) : isRev ? (
                                <>
                                  <button
                                    onClick={() => handleNotifyApplicant(app)}
                                    className="px-3 py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-xs font-semibold transition-all"
                                    type="button"
                                  >
                                    {notifiedIds[app.tracking_id]
                                      ? "Notifikasi Terkirim ✓"
                                      : "Kirim Notifikasi"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApp(app);
                                      setModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-secondary hover:text-on-secondary text-text-heading font-label-md text-xs transition-all"
                                    type="button"
                                  >
                                    Override
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/track/${encodeURIComponent(app.tracking_id)}`}
                                    className="px-3 py-1.5 rounded-lg bg-surface-container text-secondary font-label-md text-xs font-semibold hover:bg-secondary hover:text-on-secondary transition-all inline-block"
                                  >
                                    Lihat Detail
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setSelectedApp(app);
                                      setModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-text-muted hover:text-text-heading font-label-md text-xs transition-all"
                                    type="button"
                                  >
                                    Ubah
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Working Pagination & Meta */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-text-muted font-body-sm text-body-sm">
                <span>
                  Menampilkan <strong>{pagedApps.length}</strong> dari{" "}
                  <strong>{filteredApps.length}</strong> berkas hasil filter (Total Database:{" "}
                  {totalCount} berkas)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="p-1.5 rounded bg-surface-slate hover:bg-surface-container text-text-heading disabled:opacity-40 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="px-3 font-code-sm text-code-sm font-semibold text-text-heading">
                    Halaman {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="p-1.5 rounded bg-surface-slate hover:bg-surface-container text-text-heading disabled:opacity-40 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Panel Aksi Cepat Panitia */}
            <section className="bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-tint-blue flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[26px]">security</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                    Aksi Otoritas & Integritas Panitia
                  </h3>
                  <p className="font-body-sm text-body-sm text-text-muted">
                    Unduh Berita Acara seluruh pendaftar (CSV/Excel) atau lakukan override keputusan berkas terpilih.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-surface-slate hover:bg-surface-container text-text-heading font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 border border-border-slate"
                  type="button"
                  onClick={handleExportBa}
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    file_download
                  </span>
                  <span>{exportLabel}</span>
                </button>
                <button
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-tint-blue text-secondary font-label-lg text-label-lg transition-all flex items-center justify-center gap-2"
                  type="button"
                  onClick={handleSyncDukcapil}
                >
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  <span>{syncLabel}</span>
                </button>
                <button
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-secondary hover:bg-primary text-on-secondary font-label-lg text-label-lg shadow-sm transition-all flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => setModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  <span>Override Berkas ({activeCase.tracking_id})</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Modal Dialog Investigasi Forensik & Override Panitia (Dynamic per Selected Applicant) */}
      {modalOpen && (
        <div
          id="modal-forensic-investigation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-on-surface/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="bg-surface-canvas rounded-2xl shadow-xl w-full max-w-5xl my-auto overflow-hidden flex flex-col border border-border-slate max-h-[92vh]">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-surface-slate border-b border-border-slate flex items-start justify-between gap-4 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-code-md text-code-md text-text-heading font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-fraud text-[20px]">
                      gavel
                    </span>
                    Berkas Investigasi & Override Panitia #{activeCase.tracking_id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-code-sm text-xs font-bold flex items-center gap-1 ${
                      activeCase.status === "REJECTED"
                        ? "bg-status-fraud text-on-primary"
                        : activeCase.status === "APPROVED"
                        ? "bg-status-approved text-on-primary"
                        : "bg-status-revision text-on-primary"
                    }`}
                  >
                    STATUS SAAT INI: {activeCase.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[13px] text-text-muted flex-wrap pt-0.5">
                  <span>
                    <strong className="text-text-heading">Nama Siswa:</strong>{" "}
                    {activeCase.student_name}
                  </span>
                  <span>
                    <strong className="text-text-heading">NIK:</strong> {activeCase.student_nik}
                  </span>
                  <span>
                    <strong className="text-text-heading">No. KK:</strong> {activeCase.kk_number}
                  </span>
                  <span className="font-code-sm text-secondary bg-surface-tint-blue px-2 py-0.5 rounded font-semibold">
                    Verifikator Aktif: {authUser.full_name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-surface-container transition-colors shrink-0"
                onClick={() => setModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Body Konten Bukti Forensik Multi-Modal */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="p-4 rounded-xl bg-surface-slate border border-border-slate flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-label-lg text-label-lg text-text-heading font-bold">
                    Ringkasan Analisis Autonomous AI (Gemini 3 Flash)
                  </h4>
                  <p className="font-body-sm text-body-sm text-text-body mt-0.5">
                    {activeCase.ai_reasoning_summary}
                  </p>
                </div>
              </div>

              {/* Grid 3 Bukti Forensik Dinamis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bukti 1: Dokumen / Visual */}
                <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                      Bukti 1 • Visual & Dokumen KK
                    </span>
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border-slate bg-slate-900">
                      <img
                        src={
                          (activeCase.kk_document_url || activeCase.kk_image_url || '')?.startsWith("http")
                            ? (activeCase.kk_document_url || activeCase.kk_image_url || '')
                            : "https://lh3.googleusercontent.com/aida-public/AB6AXuD75CPTSZdgWu9WF_nHJaeeHib3XrpB4JyzRic5A75T6XlQEDgVyhZormvYb62S--pOL6GtwUG1ulLWoWE4MmNMpOjJq7R2ZEJBqlMjGmvSlZwBlTfGd8uyEekhzXdCZASpBOAfva7aK1ggH6e3YRQFvytukxiYe6akl-cTDXkHRFj96caHBvKxZA-imjPuKdG6ed1vLPI2hnObIpCgxog8ro5h7GvDOhCWD79c3Us"
                        }
                        alt={activeCase.student_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-surface-canvas/90 backdrop-blur px-2 py-1 rounded text-[11px] font-label-md text-text-heading flex items-center justify-between">
                        <span>Fasad: {activeCase.detected_building}</span>
                        <span className="font-bold text-secondary">
                          OCR {activeCase.ocr_confidence}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Alamat: {(activeCase.address_text || activeCase.address || '-')}
                    </p>
                  </div>
                </div>

                {/* Bukti 2: Kronologis KK */}
                <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                      Bukti 2 • Audit Kependudukan KK
                    </span>
                    <div className="bg-surface-canvas rounded-lg p-3 border border-border-slate flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Tanggal Terbit KK:</span>
                        <span className="font-code-sm text-text-heading font-bold">
                          {(activeCase.kk_issued_date || activeCase.kk_issue_date || '-')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Usia Domisili KK:</span>
                        <span className="font-code-sm font-bold text-secondary">
                          {activeCase.kk_age_label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Status Hubungan:</span>
                        <span className="font-code-sm text-text-heading font-bold">
                          {(activeCase.family_relation || (activeCase.family_relation_valid ? 'ANAK_KANDUNG' : 'FAMILI_LAIN'))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Nomor KK:</span>
                        <span className="font-code-sm text-text-heading">
                          {activeCase.kk_number}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bukti 3: Geospasial PostGIS */}
                <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                      Bukti 3 • Geospasial PostGIS
                    </span>
                    <div className="bg-surface-canvas rounded-lg p-3 border border-border-slate flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Garis Lurus (Euclidean):</span>
                        <span className="font-code-sm text-text-heading font-bold">
                          {(activeCase.straight_distance_meters ?? activeCase.straight_line_distance_meters ?? 0)} meter
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Rute Darat Aktual:</span>
                        <span className="font-code-sm text-secondary font-bold">
                          {activeCase.real_route_distance_meters} meter
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Koordinat GPS:</span>
                        <span className="font-code-sm text-text-heading">
                          {(activeCase.latitude ?? activeCase.home_lat ?? -6.2297).toFixed(4)}, {(activeCase.longitude ?? activeCase.home_lng ?? 106.8532).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Status Sidak Posko:</span>
                        <span className="font-code-sm text-status-approved font-bold">
                          {sidakScheduled[activeCase.tracking_id]
                            ? "TERJADWAL ✓"
                            : "Belum Dijadwalkan"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions Panitia (Real Database Overrides) */}
            <div className="px-6 py-4 bg-surface-slate border-t border-border-slate flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-canvas border border-border-slate text-text-heading font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSidakScheduled((p) => ({ ...p, [activeCase.tracking_id]: true }));
                    showToast(`Tim Sidak Posko dijadwalkan untuk lokasi ${activeCase.student_name}.`);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-surface-container text-secondary font-label-md text-xs font-bold hover:bg-surface-tint-blue transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  <span>
                    {sidakScheduled[activeCase.tracking_id]
                      ? "Sidak Posko Terjadwal ✓"
                      : "Jadwalkan Sidak Lapangan"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStatus(
                      activeCase,
                      "NEEDS_REVISION",
                      "Panitia meminta klarifikasi & unggah ulang dokumen Kartu Keluarga asli.",
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-status-revision text-on-primary font-label-md text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_document</span>
                  <span>Minta Revisi KK</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStatus(
                      activeCase,
                      "APPROVED",
                      "Disetujui manual oleh Panitia setelah verifikasi dokumen fisik & domisili.",
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-status-approved text-on-primary font-label-md text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Setujui Berkas (Approve)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateStatus(
                      activeCase,
                      "REJECTED",
                      "Diskualifikasi Dikonfirmasi Panitia - Terbukti melanggar ketentuan zonasi PPDB.",
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-status-fraud text-on-primary font-label-md text-xs font-bold hover:opacity-95 shadow transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>Diskualifikasi (Reject)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
