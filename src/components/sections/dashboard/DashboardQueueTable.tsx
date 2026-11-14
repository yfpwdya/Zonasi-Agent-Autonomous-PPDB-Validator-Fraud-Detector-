"use client";
import Link from "next/link";
import type { ApplicationRecord } from "@/types";

interface Props {
  totalCount: number;
  filteredApps: ApplicationRecord[];
  pagedApps: ApplicationRecord[];
  activeCase: ApplicationRecord | null;
  searchQuery: string;
  statusFilter: "ALL" | "FRAUD" | "REVISION" | "APPROVED";
  currentPage: number;
  totalPages: number;
  safePage: number;
  pageSize: number;
  fraudCount: number;
  revisionCount: number;
  approvedCount: number;
  notifiedIds: Record<string, boolean>;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: "ALL" | "FRAUD" | "REVISION" | "APPROVED") => void;
  onPageChange: (p: number) => void;
  onSelectApp: (a: ApplicationRecord) => void;
  onOpenModal: (a: ApplicationRecord) => void;
  onNotifyApplicant: (a: ApplicationRecord) => void;
}

export function DashboardQueueTable({
  totalCount,
  filteredApps,
  pagedApps,
  activeCase,
  searchQuery,
  statusFilter,
  safePage,
  totalPages,
  pageSize,
  fraudCount,
  revisionCount,
  approvedCount,
  notifiedIds,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onSelectApp,
  onOpenModal,
  onNotifyApplicant,
}: Props) {
  return (
    <section
      id="antrean"
      className="bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col gap-5 min-w-0"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-heading font-bold">
              Daftar Antrean Verifikasi Berkas Pendaftar
            </h2>
            <span className="font-body-sm text-body-sm text-text-muted">
              Daftar berkas pendaftar diurutkan berdasarkan waktu pendaftaran terbaru
            </span>
          </div>
          <div className="relative min-w-[260px] sm:w-80">
            <span className="material-symbols-outlined text-[18px] text-text-muted absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onFilterChange("ALL")}
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
              onClick={() => onFilterChange("FRAUD")}
              className={
                statusFilter === "FRAUD"
                  ? "px-3 py-1.5 rounded-lg font-label-md text-label-md bg-surface-canvas text-status-fraud font-bold shadow-sm border border-status-fraud-border transition-all flex items-center gap-1.5"
                  : "px-3 py-1.5 rounded-lg font-label-md text-label-md text-text-muted hover:text-status-fraud transition-all flex items-center gap-1.5"
              }
            >
              <span>🚨 Ditolak</span>
              <span className="px-1.5 py-0.5 rounded-full bg-status-fraud-bg text-status-fraud font-code-sm text-code-sm font-semibold">
                {fraudCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange("REVISION")}
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
              onClick={() => onFilterChange("APPROVED")}
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border-slate">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1E3A8A] text-white font-code-sm text-xs uppercase tracking-wider">
              <th className="py-3.5 px-4">No</th>
              <th className="py-3.5 px-4">Tracking ID</th>
              <th className="py-3.5 px-4">Nama Calon Siswa</th>
              <th className="py-3.5 px-4">NIK / No. KK</th>
              <th className="py-3.5 px-4">Jarak Rute</th>
              <th className="py-3.5 px-4">Usia KK</th>
              <th className="py-3.5 px-4">Deteksi Bangunan</th>
              <th className="py-3.5 px-4">Status Verifikasi</th>
              <th className="py-3.5 px-4 text-right">Tindakan Panitia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-slate text-text-body font-body-sm text-body-sm">
            {pagedApps.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 px-4 text-center text-text-muted">
                  Belum ada berkas KK yang diunggah. Unggah berkas KK untuk memunculkan riwayat pemindaian dan deteksi anomali secara otomatis di tabel ini.
                </td>
              </tr>
            ) : null}
            {pagedApps.map((app, i) => {
              const isFraud = app.status === "REJECTED";
              const isRev = app.status === "NEEDS_LIVE_PHOTO" || app.status === "NEEDS_REVISION";
              const rowNum = (safePage - 1) * pageSize + i + 1;
              return (
                <tr
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className={`cursor-pointer transition-colors ${
                    activeCase?.tracking_id === app.tracking_id
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
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-text-heading">{app.student_name}</div>
                    <div
                      className={`font-code-sm text-[11px] font-bold ${
                        (app.student_age_valid ?? true) ? "text-status-approved" : "text-status-fraud"
                      }`}
                    >
                      Lahir: {app.student_birth_date || "-"} ({Math.floor(app.student_age_years ?? 16)} Thn{" "}
                      {(app.student_age_valid ?? true) ? "✓" : "✗ Anomali Usia"})
                    </div>
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
                        DITOLAK (REJECTED)
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
                            onSelectApp(app);
                            onOpenModal(app);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-status-fraud text-on-primary font-label-md text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                          type="button"
                        >
                          Investigasi / Override
                        </button>
                      ) : isRev ? (
                        <>
                          <button
                            onClick={() => onNotifyApplicant(app)}
                            className="px-3 py-1.5 rounded-lg bg-surface-slate hover:bg-surface-container text-secondary font-label-md text-xs font-semibold transition-all"
                            type="button"
                          >
                            {notifiedIds[app.tracking_id]
                              ? "Notifikasi Terkirim ✓"
                              : "Kirim Notifikasi"}
                          </button>
                          <button
                            onClick={() => {
                              onSelectApp(app);
                              onOpenModal(app);
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
                              onSelectApp(app);
                              onOpenModal(app);
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-text-muted font-body-sm text-body-sm">
        <span>
          Menampilkan <strong>{pagedApps.length}</strong> dari{" "}
          <strong>{filteredApps.length}</strong> berkas hasil filter (Total Database:{" "}
          {totalCount} berkas)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
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
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded bg-surface-slate hover:bg-surface-container text-text-heading disabled:opacity-40 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
