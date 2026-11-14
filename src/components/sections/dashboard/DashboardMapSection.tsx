"use client";
import Link from "next/link";
import type { ApplicationRecord } from "@/types";

interface Props {
  applications: ApplicationRecord[];
  activeCase: ApplicationRecord | null;
  onSelectApp: (app: ApplicationRecord) => void;
  onOpenModal: () => void;
}

export function DashboardMapSection({
  applications,
  activeCase,
  onSelectApp,
  onOpenModal,
}: Props) {
  const lat = activeCase ? (activeCase.latitude ?? activeCase.home_lat ?? -7.2468) : -7.2468;
  const lng = activeCase ? (activeCase.longitude ?? activeCase.home_lng ?? 112.6358) : 112.6358;
  const d = 0.005;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - d).toFixed(5)}%2C${(lat - d).toFixed(5)}%2C${(lng + d).toFixed(5)}%2C${(lat + d).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;

  return (
    <section id="radar" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Map Column */}
      <div className="xl:col-span-8 bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-heading font-bold">
              Peta Lokasi Domisili &amp; Jarak Rute Jalan Darat (Radius Zonasi 1.200m)
            </h2>
            <span className="font-body-sm text-body-sm text-text-muted">
              Lokasi Sekolah: <strong>SMA Negeri 12 Surabaya</strong> (-7.2468, 112.6358) • Klik nama pendaftar untuk melihat titik rumah
            </span>
          </div>
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat.toFixed(5)}&mlon=${lng.toFixed(5)}#map=16/${lat.toFixed(5)}/${lng.toFixed(5)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-tint-blue text-secondary font-code-sm text-xs font-bold hover:opacity-90 self-start"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Buka Peta Penuh</span>
          </a>
        </div>

        <div className="relative w-full h-[380px] rounded-xl overflow-hidden bg-slate-900 border border-border-slate flex flex-col">
          <iframe
            key={`${activeCase?.tracking_id || "sman12"}-${lat}-${lng}`}
            title="Peta Interaktif Zonasi SMAN 12 Surabaya"
            src={osmEmbed}
            className="w-full flex-1 border-0"
            loading="lazy"
          />
          <div className="bg-slate-900/95 backdrop-blur px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
            {activeCase ? (
              <>
                <div className="font-code-sm text-xs truncate max-w-xl">
                  <span className="text-cyan-400 font-bold">Pin Domisili KK ({activeCase.student_name}):</span>{" "}
                  {activeCase.address_text || activeCase.address || "-"} ({lat.toFixed(5)}, {lng.toFixed(5)})
                </div>
                <div className="flex items-center gap-2 font-code-sm text-xs">
                  <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-bold">
                    Jarak Rute ke SMAN 12: {activeCase.real_route_distance_meters}m
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                    Fasad: {activeCase.detected_building || "RESIDENTIAL"}
                  </span>
                </div>
              </>
            ) : (
              <div className="font-code-sm text-xs text-slate-300">
                <span className="text-cyan-400 font-bold">Lokasi Sekolah:</span> SMA Negeri 12 Surabaya, Jl. Sememi Kidul No.1, Benowo (-7.24680, 112.63580) • Belum ada berkas KK yang diunggah.
              </div>
            )}
          </div>
        </div>

        {/* Pin Cepat */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-code-sm text-xs text-text-muted mr-1">
            Pilih Titik Rumah Berkas ({applications.length}):
          </span>
          {applications.length === 0 ? (
            <span className="font-code-sm text-xs text-text-muted italic">
              Belum ada berkas KK diunggah — unggah KK untuk memunculkan pin domisili siswa secara otomatis.
            </span>
          ) : (
            applications.slice(0, 10).map((a) => {
              const isFraud = a.status === "REJECTED";
              const isRev = a.status === "NEEDS_LIVE_PHOTO" || a.status === "NEEDS_REVISION";
              const isSelected = activeCase?.tracking_id === a.tracking_id;
              return (
                <button
                  key={a.tracking_id}
                  type="button"
                  onClick={() => onSelectApp(a)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-code-sm text-xs transition-all border ${
                    isFraud
                      ? "bg-status-fraud-bg text-status-fraud border-status-fraud-border font-bold"
                      : isRev
                      ? "bg-status-revision-bg text-status-revision border-status-revision-border font-semibold"
                      : "bg-status-approved-bg text-status-approved border-status-approved-border font-semibold"
                  } ${isSelected ? "ring-2 ring-secondary scale-[1.03]" : "opacity-85 hover:opacity-100"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFraud ? "bg-status-fraud" : isRev ? "bg-status-revision" : "bg-status-approved"
                    }`}
                  />
                  <span>
                    {a.student_name.split(" ")[0]} ({a.real_route_distance_meters}m)
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Telemetry Inspector Column */}
      <div className="xl:col-span-4 bg-surface-canvas rounded-xl border border-border-slate shadow-sm p-5 sm:p-6 flex flex-col justify-between gap-4 min-w-0">
        {activeCase ? (
          <>
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
                Klik baris pada tabel atau nama pendaftar di peta untuk memeriksa rincian berkas.
              </p>

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
                        activeCase.status === "REJECTED" ? "text-status-fraud" : "text-status-approved"
                      }`}
                    >
                      {activeCase.kk_age_label}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-surface-canvas border border-border-slate p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Tgl Lahir &amp; Usia SMA:</span>
                    <span
                      className={`font-code-sm font-bold ${
                        (activeCase.student_age_valid ?? true) ? "text-status-approved" : "text-status-fraud"
                      }`}
                    >
                      {activeCase.student_birth_date || "-"} ({Math.floor(activeCase.student_age_years ?? 16)} Thn{" "}
                      {(activeCase.student_age_valid ?? true) ? "✓ 15–17 Thn" : "✗ Anomali Usia"})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">No. KK &amp; Terbit:</span>
                    <span className="font-code-sm font-semibold text-text-heading">
                      {activeCase.kk_number} ({activeCase.kk_issued_date || activeCase.kk_issue_date})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Relasi &amp; Bangunan:</span>
                    <span className="font-code-sm font-bold text-secondary">
                      {activeCase.family_relation || (activeCase.family_relation_valid ? "ANAK_KANDUNG" : "FAMILI_LAIN")} • {activeCase.detected_building}
                    </span>
                  </div>
                  <div className="text-text-heading pt-1 border-t border-border-slate">
                    <span className="text-text-muted block text-[11px]">Alamat Domisili KK:</span>
                    <span className="font-medium">{activeCase.address_text || activeCase.address}</span>
                  </div>
                </div>

                <p className="text-xs text-text-body leading-relaxed bg-surface-canvas p-2.5 rounded-lg border border-border-slate">
                  {activeCase.ai_reasoning_summary}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onOpenModal}
                className="flex-1 py-2.5 px-3 rounded-lg bg-status-fraud text-on-primary font-label-md text-label-md font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>Investigasi &amp; Override</span>
              </button>
              <Link
                href={`/track/${encodeURIComponent(activeCase.tracking_id)}`}
                className="py-2.5 px-3 rounded-lg bg-surface-slate hover:bg-surface-container text-text-heading font-label-md text-label-md transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span>Tracker</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-border-slate bg-surface-slate/40 gap-3">
            <span className="material-symbols-outlined text-[36px] text-text-muted">folder_off</span>
            <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold">
              Belum Ada Berkas KK Masuk
            </h3>
            <p className="font-body-sm text-xs text-text-muted max-w-xs">
              Belum ada berkas KK yang diunggah pendaftar. Silakan buka Halaman Scan KK Publik untuk mengunggah atau menguji sampel berkas KK.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-xs font-bold hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Buka Halaman Scan KK →</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
