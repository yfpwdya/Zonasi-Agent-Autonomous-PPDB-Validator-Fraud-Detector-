"use client";
import { useState } from "react";
import type { ApplicationRecord, AuthUser } from "@/types";

interface Props {
  activeCase: ApplicationRecord;
  authUser: AuthUser;
  isPendingVerify: boolean;
  onClose: () => void;
  onUpdateStatus: (
    targetApp: ApplicationRecord,
    nextStatus: ApplicationRecord["status"],
    reasonNote: string,
  ) => Promise<void>;
  onSubmitConditional: (args: {
    tracking_id: string;
    lat: number;
    lng: number;
    photo_name: string;
    doc_type: string;
    doc_number: string;
    note: string;
  }) => Promise<void>;
}

export function DashboardOverrideModal({
  activeCase,
  authUser,
  isPendingVerify,
  onClose,
  onUpdateStatus,
  onSubmitConditional,
}: Props) {
  const [condDocType, setCondDocType] = useState("SKPWNI_DUKCAPIL");
  const [condDocNumber, setCondDocNumber] = useState("");
  const [condNote, setCondNote] = useState("");
  const [condFileName, setCondFileName] = useState("");

  const lat = activeCase.latitude ?? activeCase.home_lat ?? -7.2489;
  const lng = activeCase.longitude ?? activeCase.home_lng ?? 112.6382;
  const d = 0.005;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - d).toFixed(5)}%2C${(lat - d).toFixed(5)}%2C${(lng + d).toFixed(5)}%2C${(lat + d).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-on-surface/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-canvas rounded-2xl shadow-xl w-full max-w-5xl my-auto overflow-hidden flex flex-col border border-border-slate max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-[#1E3A8A] text-white border-b-2 border-[#F59E0B] flex items-start justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-code-md text-code-md text-white font-extrabold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">gavel</span>
                Berkas Investigasi &amp; Override Panitia #{activeCase.tracking_id}
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
            <div className="flex items-center gap-4 text-[13px] text-white/85 flex-wrap pt-0.5">
              <span>
                <strong className="text-white">Nama Siswa:</strong> {activeCase.student_name}
              </span>
              <span>
                <strong className="text-white">NIK:</strong> {activeCase.student_nik}
              </span>
              <span>
                <strong className="text-white">No. KK:</strong> {activeCase.kk_number}
              </span>
              <span className="font-code-sm text-[#1E293B] bg-[#F59E0B] px-2 py-0.5 rounded font-extrabold">
                Verifikator Aktif: {authUser.full_name}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body Konten */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          <div className="p-4 rounded-xl bg-surface-slate border border-border-slate flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div className="flex-1">
              <h4 className="font-label-lg text-label-lg text-text-heading font-bold">
                Ringkasan Analisis Verifikasi Sistem
              </h4>
              <p className="font-body-sm text-body-sm text-text-body mt-0.5">
                {activeCase.ai_reasoning_summary}
              </p>
            </div>
          </div>

          {/* Grid 3 Bukti Forensik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bukti 1 */}
            <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                  Bukti 1 • Peta Lokasi Domisili KK
                </span>
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border-slate bg-slate-900">
                  <iframe
                    title="Mini Map Investigasi"
                    src={osmEmbed}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-surface-canvas/95 px-2 py-0.5 rounded text-[10px] font-code-sm text-text-heading flex items-center justify-between">
                    <span>Fasad: {activeCase.detected_building}</span>
                    <span className="font-bold text-secondary">OCR {activeCase.ocr_confidence}%</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Alamat: {activeCase.address_text || activeCase.address || "-"}
                </p>
              </div>
            </div>

            {/* Bukti 2 */}
            <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                  Bukti 2 • Audit Kependudukan KK
                </span>
                <div className="bg-surface-canvas rounded-lg p-3 border border-border-slate flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Tanggal Terbit KK:</span>
                    <span className="font-code-sm text-text-heading font-bold">
                      {activeCase.kk_issued_date || activeCase.kk_issue_date || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Usia Domisili KK:</span>
                    <span className="font-code-sm font-bold text-secondary">{activeCase.kk_age_label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Status Hubungan:</span>
                    <span className="font-code-sm text-text-heading font-bold">
                      {activeCase.family_relation || (activeCase.family_relation_valid ? "ANAK_KANDUNG" : "FAMILI_LAIN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Nomor KK:</span>
                    <span className="font-code-sm text-text-heading">{activeCase.kk_number}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bukti 3 */}
            <div className="bg-surface-slate rounded-xl p-4 border border-border-slate flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-xs text-secondary font-bold uppercase tracking-wider">
                  Bukti 3 • Perhitungan Jarak Zonasi
                </span>
                <div className="bg-surface-canvas rounded-lg p-3 border border-border-slate flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Jarak Garis Lurus:</span>
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
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Verifikasi Berkas Bersyarat */}
          <div className="bg-surface-slate rounded-xl p-4 border border-border-slate space-y-3">
            <div>
              <h4 className="font-label-lg text-label-lg text-text-heading font-bold">
                Form Verifikasi Berkas Bersyarat (Pindah Rumah Sah &lt; 1 Tahun / Mitigasi Gang Sempit)
              </h4>
              <p className="font-body-sm text-xs text-text-muted">
                Unggah bukti SKPWNI Dukcapil, SK Pindah Tugas Orang Tua, atau Foto Rumah Geotag untuk meloloskan berkas ke status APPROVED:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-code-sm text-[11px] text-text-muted block mb-1">Jenis Surat Pembuktian</label>
                <select
                  value={condDocType}
                  onChange={(e) => setCondDocType(e.target.value)}
                  className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-body-sm text-xs"
                >
                  <option value="SKPWNI_DUKCAPIL">1. SKPWNI Dukcapil (Pindah 1 Keluarga)</option>
                  <option value="SK_PINDAH_TUGAS_ORTU">2. SK Pindah Tugas Ortu + SKD</option>
                  <option value="SURAT_DOMISILI_BENCANA">3. Surat Domisili Bencana (BPBD)</option>
                  <option value="FOTO_FASAD_GEOTAG">4. Foto Fasad Rumah Geotag</option>
                </select>
              </div>
              <div>
                <label className="font-code-sm text-[11px] text-text-muted block mb-1">Nomor Surat Resmi</label>
                <input
                  type="text"
                  value={condDocNumber}
                  onChange={(e) => setCondDocNumber(e.target.value)}
                  placeholder="470/192/SKPWNI/436.7.19/2026"
                  className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-code-sm text-xs"
                />
              </div>
              <div>
                <label className="font-code-sm text-[11px] text-text-muted block mb-1">File Surat / Foto Geotag</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCondFileName(f.name);
                  }}
                  className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2 py-1.5 text-text-heading font-code-sm text-xs file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-secondary file:text-white file:text-xs"
                />
              </div>
              <div>
                <label className="font-code-sm text-[11px] text-text-muted block mb-1">Catatan Pemeriksaan</label>
                <input
                  type="text"
                  value={condNote}
                  onChange={(e) => setCondNote(e.target.value)}
                  placeholder="Pindah 1 keluarga sah ke Sememi"
                  className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-body-sm text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isPendingVerify}
                onClick={() =>
                  onSubmitConditional({
                    tracking_id: activeCase.tracking_id,
                    lat,
                    lng,
                    photo_name: condFileName || `${condDocType.toLowerCase()}_verified.pdf`,
                    doc_type: condDocType,
                    doc_number: condDocNumber || "470/SKPWNI-SBY/2026",
                    note: condNote || `Disetujui oleh ${authUser.full_name}`,
                  })
                }
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-primary text-on-secondary font-label-md text-xs font-bold shadow transition-all disabled:opacity-50"
              >
                {isPendingVerify ? "Memvalidasi Berkas..." : "✓ Validasi Berkas Bersyarat & Setujui (APPROVED)"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-slate border-t border-border-slate flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-canvas border border-border-slate text-text-heading font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            Tutup
          </button>
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() =>
                onUpdateStatus(
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
                onUpdateStatus(
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
                onUpdateStatus(
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
  );
}
