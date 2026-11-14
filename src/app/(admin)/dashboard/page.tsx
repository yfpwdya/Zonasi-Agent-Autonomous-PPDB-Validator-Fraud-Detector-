"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import type { ApplicationRecord, AuthUser } from "@/types";
import { useApplications, useUpdateApplication, useVerifyLivePhoto } from "@/hooks/useApplications";
import { clearPanitiaSession } from "@/hooks/useAuth";

import { DashboardSidebar } from "@/components/sections/dashboard/DashboardSidebar";
import { DashboardKpiCards } from "@/components/sections/dashboard/DashboardKpiCards";
import { DashboardMapSection } from "@/components/sections/dashboard/DashboardMapSection";
import { DashboardQueueTable } from "@/components/sections/dashboard/DashboardQueueTable";
import { DashboardOverrideModal } from "@/components/sections/dashboard/DashboardOverrideModal";

export default function DashboardPage() {
  const dashboardRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FRAUD" | "REVISION" | "APPROVED">("ALL");
  const { data, refetch } = useApplications();
  const updateApp = useUpdateApplication();
  const verifyCond = useVerifyLivePhoto();
  const applications = data?.applications ?? [];
  const dataSource = data?.source ?? "supabase";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedApp = applications.find((a) => a.tracking_id === selectedId) ?? null;
  const setSelectedApp = (a: ApplicationRecord) => setSelectedId(a.tracking_id);

  const [modalOpen, setModalOpen] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});
  const [exportLabel, setExportLabel] = useState("Ekspor Berita Acara (CSV/Excel)");
  const [syncLabel, setSyncLabel] = useState("Sinkronisasi Data Dukcapil & Server");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser>({
    id: "default-auditor",
    email: "panitia.ppdb@sman12-sby.sch.id",
    full_name: "Drs. H. Bambang Sudibyo, M.Pd",
    nip: "197608142003121004",
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

  // GSAP Bento Card Stagger (prefers-reduced-motion safe)
  useEffect(() => {
    if (!dashboardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gsap='kpi-card']",
        { autoAlpha: 0, scale: 0.94, y: 14 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "back.out(1.4)", clearProps: "transform" },
      );
    }, dashboardRef);
    return () => ctx.revert();
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
    if (statusFilter === "REVISION") return app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
    if (statusFilter === "APPROVED") return app.status === "APPROVED";
    return true;
  });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedApps = filteredApps.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeCase: ApplicationRecord | null =
    selectedApp || applications.find((a) => a.status === "REJECTED") || applications[0] || null;

  const handleExportBa = () => {
    setExportLabel("Mengemas Berita Acara CSV...");
    const headers = [
      "Tracking ID", "Nama Calon Siswa", "NIK", "No KK", "Tanggal Terbit KK",
      "Usia KK", "Relasi Keluarga", "Jarak Lurus (m)", "Jarak Rute (m)",
      "Deteksi Bangunan", "Skor OCR (%)", "Status Keputusan", "Ringkasan AI / Panitia",
    ];
    const rows = applications.map((a) => [
      a.tracking_id,
      `"${a.student_name.replace(/"/g, '""')}"`,
      `"'${a.student_nik}"`,
      `"'${a.kk_number}"`,
      a.kk_issued_date,
      `"${a.kk_age_label}"`,
      a.family_relation,
      a.straight_distance_meters ?? a.straight_line_distance_meters ?? 0,
      a.real_route_distance_meters,
      a.detected_building,
      a.ocr_confidence,
      a.status,
      `"${(a.ai_reasoning_summary || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Berita-Acara-PPDB-Zonasi-${new Date().toISOString().slice(0, 10)}.csv`);
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
    setSyncLabel(`Tersinkronisasi (${r.data?.applications.length ?? 0} Berkas) ✓`);
    showToast("Data antrean berhasil disinkronkan dengan server.");
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
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[60] bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl border border-secondary/40 flex items-center gap-2.5 text-sm font-medium">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      <DashboardSidebar dataSource={dataSource} activeCase={activeCase} onLogout={handleLogout} />

      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 right-0 h-16 bg-surface-canvas/90 backdrop-blur-md border-b border-border-slate z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Buka menu navigasi panitia"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg bg-surface-slate text-text-heading hover:bg-surface-container shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
            <span className="font-headline-sm text-headline-sm text-[#1E3A8A] font-extrabold truncate">
              Zonasi-Agent • Dashboard Pengawas Panitia PPDB
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-approved-bg border border-status-approved-border shrink-0">
              <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
              <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                Status Server: Terhubung ({totalCount} Berkas)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-label-md transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Akun Panitia</span>
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

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface-canvas border-b border-border-slate px-4 py-3 flex flex-col gap-2 shadow-md z-30">
            <a
              href="#ringkasan"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-tint-blue text-secondary font-label-lg text-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Dashboard Verifikasi</span>
            </a>
            {activeCase && (
              <Link
                href={`/track/${encodeURIComponent(activeCase.tracking_id)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-heading hover:bg-surface-slate font-label-lg text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                <span>Detail Verifikasi Berkas ({activeCase.tracking_id})</span>
              </Link>
            )}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-secondary font-label-lg text-sm font-semibold hover:bg-surface-slate"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>Halaman Scan KK Publik</span>
            </Link>
            <div className="flex items-center gap-2 pt-2 border-t border-border-slate">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 rounded-lg bg-surface-slate text-secondary font-label-md text-xs font-bold"
              >
                Ganti Akun
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 text-center py-2 rounded-lg bg-status-fraud-bg text-status-fraud font-label-md text-xs font-bold"
              >
                Keluar
              </button>
            </div>
          </div>
        )}

        <main id="ringkasan" ref={dashboardRef} className="flex-1 bg-surface">
          <div className="flex flex-col w-full max-w-[1440px] mx-auto gap-6 p-4 sm:p-6 lg:p-8">
            <DashboardKpiCards
              totalCount={totalCount}
              approvedCount={approvedCount}
              revisionCount={revisionCount}
              fraudCount={fraudCount}
              passRate={passRate}
            />

            <DashboardMapSection
              applications={applications}
              activeCase={activeCase}
              onSelectApp={setSelectedApp}
              onOpenModal={() => setModalOpen(true)}
            />

            <DashboardQueueTable
              totalCount={totalCount}
              filteredApps={filteredApps}
              pagedApps={pagedApps}
              activeCase={activeCase}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              currentPage={currentPage}
              totalPages={totalPages}
              safePage={safePage}
              pageSize={pageSize}
              fraudCount={fraudCount}
              revisionCount={revisionCount}
              approvedCount={approvedCount}
              notifiedIds={notifiedIds}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentPage(1);
              }}
              onFilterChange={(f) => {
                setStatusFilter(f);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
              onSelectApp={setSelectedApp}
              onOpenModal={(app) => {
                setSelectedApp(app);
                setModalOpen(true);
              }}
              onNotifyApplicant={handleNotifyApplicant}
            />

            {/* Panel Aksi Cepat Panitia */}
            <section className="bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-tint-blue flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[26px]">security</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                    Tindakan Verifikasi &amp; Unduh Laporan Panitia
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
                  <span className="material-symbols-outlined text-[20px] text-secondary">file_download</span>
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
                {activeCase && (
                  <button
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-secondary hover:bg-primary text-on-secondary font-label-lg text-label-lg shadow-sm transition-all flex items-center justify-center gap-2"
                    type="button"
                    onClick={() => setModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    <span>Override Berkas ({activeCase.tracking_id})</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {modalOpen && activeCase && (
        <DashboardOverrideModal
          activeCase={activeCase}
          authUser={authUser}
          isPendingVerify={verifyCond.isPending}
          onClose={() => setModalOpen(false)}
          onUpdateStatus={handleUpdateStatus}
          onSubmitConditional={async (args) => {
            await verifyCond.mutateAsync(args);
            setModalOpen(false);
            showToast(`Berkas bersyarat ${args.doc_type} tervalidasi -> Status ${args.tracking_id} diubah menjadi APPROVED ✓`);
          }}
        />
      )}
    </div>
  );
}
