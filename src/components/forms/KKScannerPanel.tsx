"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";
import type { ApplicationRecord, KKMemberExtracted } from "@/types";
import { useCreateApplication, useOcrPreview } from "@/hooks/useApplications";

type Props = {
  onAuditCompleted?: (app: ApplicationRecord) => void;
  compact?: boolean;
};

// Generator SVG Kartu Keluarga uji coba agar Panitia bisa langsung menguji 3 jenis berkas KK nyata selain mengunggah file sendiri
function makeSampleKKDataUrl(kind: "valid" | "fraud_titip" | "fraud_baru"): {
  fileName: string;
  dataUrl: string;
} {
  if (kind === "valid") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" style="background:#f8fafc;font-family:Arial,sans-serif">
      <rect x="15" y="15" width="870" height="510" fill="#ffffff" stroke="#1e293b" stroke-width="3"/>
      <text x="450" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="#0f172a">KARTU KELUARGA</text>
      <text x="450" y="82" text-anchor="middle" font-size="18" font-weight="bold" fill="#1e293b">No. 3171041504190002</text>
      <text x="40" y="120" font-size="14" fill="#0f172a">Nama Kepala Keluarga : BUDI RAHMAWAN</text>
      <text x="40" y="145" font-size="14" fill="#0f172a">Alamat : JL. TEBET UTARA DALAM NO. 14, RT 004/RW 002, TEBET TIMUR, JAKARTA SELATAN</text>
      <rect x="40" y="175" width="820" height="160" fill="none" stroke="#334155" stroke-width="1.5"/>
      <text x="55" y="205" font-size="13" font-weight="bold">1. BUDI RAHMAWAN | NIK: 3171041105780001 | Status: KEPALA KELUARGA</text>
      <text x="55" y="245" font-size="13" font-weight="bold">2. SITI NURHALIZA | NIK: 3171045408810002 | Status: ISTRI</text>
      <text x="55" y="285" font-size="14" font-weight="bold" fill="#047857">3. NADIA PUTRI RAHMAWATI | NIK: 3171041405080002 | Status: ANAK KANDUNG</text>
      <text x="40" y="420" font-size="14" font-weight="bold" fill="#0f172a">Dikeluarkan Tanggal : 15-04-2019 (Lebih dari 1 Tahun - Domisili Sah)</text>
    </svg>`;
    return {
      fileName: "KK_Valid_Nadia_Tebet.svg",
      dataUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    };
  }
  if (kind === "fraud_titip") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" style="background:#fff1f2;font-family:Arial,sans-serif">
      <rect x="15" y="15" width="870" height="510" fill="#ffffff" stroke="#be123c" stroke-width="3"/>
      <text x="450" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="#0f172a">KARTU KELUARGA</text>
      <text x="450" y="82" text-anchor="middle" font-size="18" font-weight="bold" fill="#be123c">No. 3171041002260004</text>
      <text x="40" y="120" font-size="14" fill="#0f172a">Nama Kepala Keluarga : HENDRA WIJAYA</text>
      <text x="40" y="145" font-size="14" fill="#0f172a">Alamat : RUKO CASABLANCA NIAGA BLOK C-12, TEBET, JAKARTA SELATAN</text>
      <rect x="40" y="175" width="820" height="160" fill="none" stroke="#334155" stroke-width="1.5"/>
      <text x="55" y="205" font-size="13" font-weight="bold">1. HENDRA WIJAYA | NIK: 3171041105780009 | Status: KEPALA KELUARGA</text>
      <text x="55" y="260" font-size="14" font-weight="bold" fill="#be123c">2. KEVIN PRATAMA WIJAYA | NIK: 3171042809090004 | Status: FAMILI LAIN</text>
      <text x="40" y="420" font-size="14" font-weight="bold" fill="#be123c">Dikeluarkan Tanggal : 10-02-2026 (Baru Terbit 4 Bulan &amp; Status FAMILI LAIN)</text>
    </svg>`;
    return {
      fileName: "KK_Fraud_TitipKK_Kevin_2026.svg",
      dataUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    };
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" style="background:#fef3c7;font-family:Arial,sans-serif">
    <rect x="15" y="15" width="870" height="510" fill="#ffffff" stroke="#d97706" stroke-width="3"/>
    <text x="450" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="#0f172a">KARTU KELUARGA (CONTOH / SPECIMEN)</text>
    <text x="450" y="82" text-anchor="middle" font-size="18" font-weight="bold" fill="#b45309">No. 19010XXXXXXXXXXX</text>
    <text x="40" y="120" font-size="14" fill="#0f172a">Nama Kepala Keluarga : XXXXXXX</text>
    <text x="40" y="145" font-size="14" fill="#0f172a">Alamat : XXXXXXX, RT 000/RW 000</text>
    <text x="55" y="240" font-size="14" font-weight="bold" fill="#b45309">1. XXXXXXX | NIK: 3578XXXXXXXX0002 | Status: XXXXXXX</text>
    <text x="40" y="420" font-size="14" font-weight="bold" fill="#b45309">Dikeluarkan Tanggal : 00-00-2023</text>
  </svg>`;
  return {
    fileName: "KK_Dummy_Disensor_XXXXX.svg",
    dataUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
  };
}

export function KKScannerPanel({ onAuditCompleted, compact = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ocrMutation = useOcrPreview();
  const createAppMutation = useCreateApplication();

  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanningState, setScanningState] = useState<"IDLE" | "SCANNING" | "DONE" | "ERROR">("IDLE");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<ApplicationRecord | null>(null);
  const [familyMembers, setFamilyMembers] = useState<KKMemberExtracted[]>([]);
  const [headOfFamily, setHeadOfFamily] = useState<string>("-");
  const [ocrNotes, setOcrNotes] = useState<string>("");
  const [modelUsed, setModelUsed] = useState<string>("gemini-3.5-flash");

  const processKKDataUrl = async (name: string, mimeType: string, dataUrl: string) => {
    setFileName(name);
    setPreviewUrl(dataUrl);
    setScanningState("SCANNING");
    setErrorText(null);

    try {
      // 1) Jalankan ekstraksi OCR Gemini Vision langsung dari gambar KK yang diunggah
      const ocr = await ocrMutation.mutateAsync({
        kk_number: "",
        kk_image_name: name,
        kk_image_base64: dataUrl,
      });

      setFamilyMembers(ocr.familyMembers || []);
      setHeadOfFamily(ocr.headOfFamilyName || "-");
      setOcrNotes(ocr.ocrNotes || "");
      setModelUsed(ocr.modelUsed || "gemini-3.5-flash");

      // 2) Simpan dan jalankan pipeline audit penuh (OCR + PostGIS Route Distance + Building Audit) ke Supabase
      const created = await createAppMutation.mutateAsync({
        student_nik: ocr.studentNikDetected || "3578XXXXXXXX0002",
        student_name: ocr.studentNameDetected || "Peserta Didik (Lihat KK)",
        kk_number: ocr.kkNumberDetected || "19010XXXXXXXXXXX",
        kk_issued_date: ocr.kkIssueDate,
        address_text: ocr.addressDetected || "Alamat Hasil Ekstraksi KK",
        latitude: ocr.estimatedLat ?? -6.2297,
        longitude: ocr.estimatedLng ?? 106.8532,
        kk_file_name: name,
        kk_file_base64: dataUrl,
        kk_mime_type: mimeType,
      });

      setAuditResult(created);
      setScanningState("DONE");
      if (onAuditCompleted) onAuditCompleted(created);
    } catch (err) {
      setScanningState("ERROR");
      setErrorText(err instanceof Error ? err.message : "Gagal memindai dokumen Kartu Keluarga.");
    }
  };

  const handleFileInput = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      void processKKDataUrl(file.name, file.type || "image/jpeg", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSample = (kind: "valid" | "fraud_titip" | "fraud_baru") => {
    const sample = makeSampleKKDataUrl(kind);
    void processKKDataUrl(sample.fileName, "image/svg+xml", sample.dataUrl);
  };

  return (
    <section
      id="scanner-kk"
      className="bg-surface-canvas rounded-2xl border-2 border-secondary/30 shadow-md p-5 sm:p-6 space-y-5"
    >
      {/* Header Scanner Khusus Panitia */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-slate">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-tint-blue text-secondary font-code-sm text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">document_scanner</span>
            <span>AI INSTANT KK FORENSIC SCANNER • KHUSUS PANITIA VERIFIKATOR</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-text-heading font-bold">
            Unggah File Kartu Keluarga (KK) — Deteksi Anomali &amp; Jarak Otomatis
          </h2>
          <p className="font-body-sm text-body-sm text-text-muted max-w-3xl">
            Tanpa perlu mengisi form manual: cukup unggah foto/scan Kartu Keluarga.{" "}
            <strong>Gemini Vision AI</strong> otomatis membaca <strong>Nomor KK, NIK, Nama Anak, Alamat, Tanggal Terbit, Status Hubungan Keluarga</strong>, menghitung jarak ke sekolah, dan mendeteksi indikasi kecurangan zonasi.
          </p>
        </div>

        {/* Tombol Sampel Cepat untuk Demo Hackathon */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="font-code-sm text-[11px] text-text-muted uppercase tracking-wider mr-1">
            Uji Cepat Sampel KK:
          </span>
          <button
            type="button"
            onClick={() => handlePresetSample("valid")}
            disabled={scanningState === "SCANNING"}
            className="px-3 py-1.5 rounded-lg bg-status-approved-bg border border-status-approved-border text-status-approved font-code-sm text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            + KK Valid (Anak Kandung)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSample("fraud_titip")}
            disabled={scanningState === "SCANNING"}
            className="px-3 py-1.5 rounded-lg bg-status-fraud-bg border border-status-fraud-border text-status-fraud font-code-sm text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            + KK Fraud (Titip KK &amp; Ruko)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSample("fraud_baru")}
            disabled={scanningState === "SCANNING"}
            className="px-3 py-1.5 rounded-lg bg-status-revision-bg border border-status-revision-border text-status-revision font-code-sm text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            + KK Dummy / Disensor (XXXXX)
          </button>
        </div>
      </div>

      {/* Dropzone Upload KK + Live Extraction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Dropzone & Preview File KK yang Diunggah */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileInput(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileInput(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center text-center gap-3 ${
              scanningState === "SCANNING"
                ? "border-secondary bg-surface-tint-blue/40 animate-pulse"
                : "border-secondary/50 bg-surface-slate/70 hover:bg-surface-tint-blue/30 hover:border-secondary"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[30px]">
                {scanningState === "SCANNING" ? "sync" : "upload_file"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-headline-sm text-headline-sm text-text-heading font-bold block">
                {scanningState === "SCANNING"
                  ? `Memindai "${fileName}" dengan Gemini Vision...`
                  : fileName
                  ? `Berkas Aktif: ${fileName} (Klik untuk Ganti File KK)`
                  : "Klik atau Seret File Kartu Keluarga (JPG / PNG) ke Sini"}
              </span>
              <span className="font-body-sm text-xs text-text-muted block">
                Begitu file dipilih, seluruh data identitas, alamat, peta jarak, dan status anomali di kanan langsung berubah mengikuti isi file KK.
              </span>
            </div>
            <span className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-xs font-bold shadow-sm">
              Pilih File Kartu Keluarga dari Komputer
            </span>
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-border-slate bg-surface-slate p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-code-sm text-text-muted">
                <span>Pratinjau Dokumen KK yang Diunggah:</span>
                <span className="font-semibold text-secondary truncate max-w-[220px]">{fileName}</span>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-border-slate bg-black/5 max-h-56 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt={fileName || "Pratinjau Kartu Keluarga"}
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Hasil Deteksi Real-Time dari File KK yang Diinput */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {scanningState === "IDLE" && (
            <div className="rounded-xl border border-border-slate bg-surface-slate p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-[38px] text-secondary">
                fact_check
              </span>
              <h3 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                Menunggu File Kartu Keluarga Diunggah
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted max-w-lg mx-auto">
                Silakan unggah file Kartu Keluarga Anda (misal <code>KK dummy.jpg</code> atau foto KK asli) atau klik salah satu tombol <strong>Uji Cepat Sampel KK</strong> di atas untuk melihat hasil ekstraksi otomatis.
              </p>
            </div>
          )}

          {scanningState === "SCANNING" && (
            <div className="rounded-xl bg-text-heading text-on-primary p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[28px] animate-spin">
                  progress_activity
                </span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold">
                    AI Sedang Membaca Isi Dokumen KK ({fileName})...
                  </h3>
                  <p className="font-code-sm text-xs text-slate-300">
                    Mengekstrak Nomor KK, NIK, Nama Anak, Alamat, Tanggal Terbit, dan memetakan koordinat PostGIS...
                  </p>
                </div>
              </div>
            </div>
          )}

          {scanningState === "ERROR" && (
            <div className="rounded-xl bg-status-fraud-bg border border-status-fraud-border p-5 text-status-fraud space-y-1">
              <div className="font-headline-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span>Gagal Memproses Dokumen KK</span>
              </div>
              <p className="font-body-sm text-sm">{errorText}</p>
            </div>
          )}

          {scanningState === "DONE" && auditResult && (
            <div className="rounded-xl bg-text-heading text-on-primary p-5 space-y-4 shadow-lg border border-secondary/40">
              {/* Baris Status Keputusan Utama */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15">
                <div className="space-y-0.5">
                  <span className="font-code-sm text-[11px] text-primary-fixed uppercase tracking-wider block">
                    HASIL DETEKSI FILE: {fileName} • ENGINE: {modelUsed.toUpperCase()}
                  </span>
                  <h3 className="font-headline-sm text-lg font-bold text-white">
                    {auditResult.student_name}{" "}
                    <span className="font-code-sm text-sm font-normal text-slate-300">
                      (NIK: {auditResult.student_nik})
                    </span>
                  </h3>
                </div>
                <span
                  className={`px-3.5 py-1.5 rounded-full font-code-sm text-xs font-bold ${
                    auditResult.status === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                      : auditResult.status === "REJECTED"
                      ? "bg-rose-500/25 text-rose-300 border border-rose-400/40"
                      : "bg-amber-500/25 text-amber-300 border border-amber-400/40"
                  }`}
                >
                  {auditResult.status === "APPROVED"
                    ? "LOLOS VERIFIKASI ZONASI (APPROVED)"
                    : auditResult.status === "REJECTED"
                    ? "TERINDIKASI ANOMALI / FRAUD (REJECTED)"
                    : `PERLU TINJAUAN (${auditResult.status})`}
                </span>
              </div>

              {/* Grid Data Hasil Bacaan KK (Berubah 100% Sesuai File yang Diupload) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Nomor KK Terbaca
                  </span>
                  <span className="font-code-md text-sm font-bold text-white">
                    {auditResult.kk_number}
                  </span>
                  <span className="font-code-sm text-[11px] text-slate-300 block mt-1">
                    Kepala Keluarga: {headOfFamily}
                  </span>
                </div>

                <div className="rounded-lg bg-white/10 p-3">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Tanggal Terbit &amp; Usia KK
                  </span>
                  <span className="font-code-md text-sm font-bold text-white">
                    {auditResult.kk_issue_date} ({auditResult.kk_age_label})
                  </span>
                  <span
                    className={`font-code-sm text-[11px] font-bold block mt-1 ${
                      auditResult.kk_age_valid ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {auditResult.kk_age_valid
                      ? "✓ Memenuhi Syarat >= 1 Tahun"
                      : "✗ Anomali: KK < 1 Tahun / Dummy"}
                  </span>
                </div>

                <div className="rounded-lg bg-white/10 p-3">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Status Hubungan &amp; Skor OCR
                  </span>
                  <span className="font-code-md text-sm font-bold text-white">
                    {auditResult.family_relation || "FAMILI_LAIN"} ({auditResult.ocr_confidence}%)
                  </span>
                  <span
                    className={`font-code-sm text-[11px] font-bold block mt-1 ${
                      auditResult.family_relation_valid ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {auditResult.family_relation_valid
                      ? "✓ Anak Kandung Sah"
                      : "✗ Anomali: Indikasi Titip KK / Disensor"}
                  </span>
                </div>
              </div>

              {/* Alamat Terbaca & Jarak PostGIS */}
              <div className="rounded-lg bg-white/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Alamat pada Kartu Keluarga &amp; Titik Koordinat Otomatis:
                  </span>
                  <span className="font-body-sm text-sm font-semibold text-white block">
                    {auditResult.address_text || auditResult.address}
                  </span>
                  <span className="font-code-sm text-xs text-cyan-300 block">
                    GPS: {(auditResult.latitude ?? auditResult.home_lat).toFixed(4)},{" "}
                    {(auditResult.longitude ?? auditResult.home_lng).toFixed(4)} • Bangunan:{" "}
                    {auditResult.detected_building}
                  </span>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Jarak ke Sekolah (Batas 1.200m)
                  </span>
                  <span
                    className={`font-code-lg text-base font-bold ${
                      auditResult.real_route_distance_meters <= 1200
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    Rute: {auditResult.real_route_distance_meters}m
                  </span>
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Garis Lurus: {auditResult.straight_line_distance_meters}m
                  </span>
                </div>
              </div>

              {/* Daftar Anggota Keluarga yang Terbaca di Tabel KK */}
              {familyMembers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-code-sm text-[11px] text-slate-300 block">
                    Anggota Keluarga yang Terbaca pada Tabel KK:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {familyMembers.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-white/10 font-code-sm text-xs text-white"
                      >
                        {idx + 1}. {m.name} (NIK: {m.nik}) •{" "}
                        <strong
                          className={
                            m.relation === "ANAK_KANDUNG" ? "text-emerald-300" : "text-amber-300"
                          }
                        >
                          {m.relation}
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kesimpulan Forensik AI */}
              <div className="rounded-lg bg-black/30 p-3 border border-white/10 space-y-1">
                <span className="font-code-sm text-[11px] text-amber-300 uppercase tracking-wider block">
                  Ringkasan Forensik AI &amp; Deteksi Anomali:
                </span>
                <p className="font-code-sm text-xs text-slate-200 leading-relaxed">
                  {ocrNotes ? `${ocrNotes} — ` : ""}
                  {auditResult.rejection_reason || auditResult.ai_reasoning_summary}
                </p>
              </div>

              {/* Aksi Lanjutan Panitia */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="font-code-sm text-xs text-emerald-300">
                  ✓ Berkas otomatis masuk ke Tabel Antrean &amp; Peta PostGIS di bawah (ID:{" "}
                  <strong>{auditResult.tracking_id}</strong>)
                </span>
                {!compact && (
                  <Link
                    href={`/track/${encodeURIComponent(auditResult.tracking_id)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-xs font-bold hover:opacity-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>Buka Lembar Forensik Lengkap ({auditResult.tracking_id})</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
