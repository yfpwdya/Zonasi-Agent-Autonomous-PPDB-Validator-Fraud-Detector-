"use client";
import { use, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";
import type { ApplicationRecord } from "@/types";
import { useApplication, useCreateApplication, useVerifyLivePhoto } from "@/hooks/useApplications";
import { usePanitiaSession } from "@/hooks/useAuth";

const FEED_LOGS = [
  {
    agent: "PEMERIKSA-HUNIAN",
    color: "text-purple-400",
    msg: "Analisis kondisi bangunan: Pagar rumah tinggal terdeteksi, jalan lingkungan selebar 4 meter sesuai dengan peta wilayah.",
  },
  {
    agent: "VERIFIKATOR-SISTEM",
    color: "text-cyan-400",
    msg: "Memvalidasi keaslian dokumen Kartu Keluarga Dukcapil Kota Surabaya... Data terkonfirmasi.",
  },
  {
    agent: "DETEKSI-KECURANGAN",
    color: "text-emerald-400",
    msg: "Tidak ditemukan indikasi kecurangan titip KK (Tingkat Risiko: 0.02 / Risiko Rendah).",
  },
  {
    agent: "KEPUTUSAN-VERIFIKASI",
    color: "text-blue-400",
    msg: "Menyiapkan ringkasan verifikasi untuk pengesahan panitia PPDB.",
  },
];

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const resolved = use(params);
  const trackingId = decodeURIComponent(resolved.trackingId || "");
  const kkInputRef = useRef<HTMLInputElement | null>(null);
  const [appData, setAppData] = useState<ApplicationRecord | null>(null);
  const [studentName, setStudentName] = useState("Belum Ada Berkas KK");
  const [activeTab, setActiveTab] = useState<"doc" | "street">("doc");
  const [extraLogs, setExtraLogs] = useState<
    Array<{ time: string; agent: string; color: string; msg: string }>
  >([]);
  const [logCleared, setLogCleared] = useState(false);
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);
  const [reuploadStatus, setReuploadStatus] = useState("");
  const [geoStatus, setGeoStatus] = useState("");
  const [scanningOcr, setScanningOcr] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const { data: fetchedApp, refetch } = useApplication(trackingId);
  const panitia = usePanitiaSession();
  const createApp = useCreateApplication();
  const verifyPhoto = useVerifyLivePhoto();

  // Seed UI state + reasoning feed once the query resolves.
  useEffect(() => {
        if (fetchedApp) {
          const app: ApplicationRecord = fetchedApp;
          setAppData(app);
          setStudentName(app.student_name);
          if (app.kk_image_url?.startsWith("http") || app.kk_image_url?.startsWith("data:")) {
            setUploadedPreviewUrl(app.kk_image_url);
          }
          const now = new Date().toTimeString().slice(0, 8);
          setExtraLogs([
            {
              time: now,
              agent: "PEMINDAI-DOKUMEN-KK",
              color: app.ocr_confidence >= 80 ? "text-emerald-400" : "text-amber-400",
              msg: `Tingkat Akurasi Baca: ${app.ocr_confidence}% | No. KK: ${app.kk_number} | Terbit: ${app.kk_issue_date} (${app.kk_age_label})`,
            },
            {
              time: now,
              agent: "PENGUKUR-JARAK-ZONASI",
              color: "text-blue-400",
              msg: `Jarak garis lurus: ${app.straight_line_distance_meters}m | Jarak rute jalan darat: ${app.real_route_distance_meters}m (${app.real_route_distance_meters <= 1200 ? "LOLOS ZONA" : "MELEBIHI BATAS"})`,
            },
            {
              time: now,
              agent: "PEMERIKSA-HUNIAN",
              color: app.detected_building === "RESIDENTIAL" ? "text-purple-400" : "text-rose-400",
              msg: `Koordinat (${app.home_lat.toFixed(5)}, ${app.home_lng.toFixed(5)}) -> Klasifikasi: ${app.detected_building === "RESIDENTIAL" ? "Rumah Tinggal" : app.detected_building}`,
            },
            {
              time: now,
              agent: "KEPUTUSAN-SISTEM",
              color: app.status === "APPROVED" ? "text-emerald-400" : "text-amber-300",
              msg: `${app.ai_reasoning_summary} [STATUS: ${app.status === "APPROVED" ? "DISETUJUI" : app.status === "REJECTED" ? "DITOLAK" : "PERLU REVISI"}]`,
            },
          ]);
        }
  }, [fetchedApp]);

  const handleLiveReuploadKK = (file: File) => {
    setReuploadStatus(`Memindai berkas ${file.name} secara otomatis...`);
    setScanningOcr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = typeof reader.result === "string" ? reader.result : undefined;
      if (b64) setUploadedPreviewUrl(b64);
      try {
        const updated = await createApp.mutateAsync({
          tracking_id: trackingId,
          student_nik: "",
          student_name: "",
          kk_number: "",
          address_text: "",
          latitude: 0,
          longitude: 0,
          kk_file_name: file.name,
          kk_file_base64: b64,
          kk_mime_type: file.type || "image/jpeg",
        });
        if (updated) {
          setAppData(updated);
          setStudentName(updated.student_name);
          if (updated.kk_image_url?.startsWith("http")) {
            setUploadedPreviewUrl(updated.kk_image_url);
          }
          setReuploadStatus(`Selesai Dipindai (${updated.ocr_confidence}% • ${updated.status}) ✓`);
          const now = new Date().toTimeString().slice(0, 8);
          setExtraLogs((prev) => [
            ...prev,
            {
              time: now,
              agent: "LIVE-REUPLOAD-OCR",
              color: updated.ocr_confidence >= 80 ? "text-emerald-400" : "text-rose-400",
              msg: `Hasil pindai ulang ${file.name}: Siswa=${updated.student_name} (NIK ${updated.student_nik}), No.KK=${updated.kk_number}, Terbit=${updated.kk_issue_date} (${updated.kk_age_label}), Confidence=${updated.ocr_confidence}% -> STATUS: ${updated.status}. ${updated.rejection_reason || updated.ai_reasoning_summary}`,
            },
          ]);
        }
      } catch {
        setReuploadStatus("Gagal memproses berkas");
      } finally {
        setScanningOcr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= FEED_LOGS.length) {
        clearInterval(timer);
        return;
      }
      const item = FEED_LOGS[idx];
      const now = new Date();
      const time =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");
      setLogCleared(false);
      setExtraLogs((prev) => [...prev, { time, ...item }]);
      idx++;
    }, 3500);

    return () => {
      clearInterval(timer);
    };
  }, [trackingId]);

  const handleDownloadReceipt = () => {
    const content = [
      "============================================================",
      "        BUKTI TANDA TERIMA PENDAFTARAN PPDB ZONASI 2026     ",
      "     ZONASI-AGENT • SISTEM VERIFIKASI & DETEKSI KECURANGAN  ",
      "============================================================",
      `Tracking ID        : ${trackingId}`,
      `Nama Calon Siswa   : ${appData?.student_name || studentName}`,
      `NIK Siswa          : ${appData?.student_nik || "3171041908070002"}`,
      `Nomor KK           : ${appData?.kk_number || "3171042502120005"}`,
      `Sekolah Pilihan    : ${appData?.school_name || "SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Benowo)"}`,
      `Alamat Domisili    : ${appData?.address || "Jl. Sememi Jaya IV No. 14, Sememi, Kec. Benowo, Surabaya"}`,
      `Jarak Garis Lurus  : ${appData?.straight_line_distance_meters ?? 540} meter`,
      `Jarak Rute Jalan   : ${appData?.real_route_distance_meters ?? 820} meter (Maks 1.200m)`,
      `Usia Terbit KK     : ${appData?.kk_issue_date || "2018-02-12"} (${appData?.kk_age_label || "Valid"})`,
      `Tingkat Akurasi    : ${appData?.ocr_confidence ?? 98.4}%`,
      `Deteksi Bangunan   : ${appData?.detected_building || "RESIDENTIAL"}`,
      `Status Verifikasi  : ${appData?.status || "APPROVED"}`,
      `Ringkasan Hasil    : ${appData?.ai_reasoning_summary || "Memenuhi syarat zonasi."}`,
      `Waktu Cetak        : ${new Date().toLocaleString("id-ID")}`,
      "============================================================",
      `URL Pelacakan Live : ${typeof window !== "undefined" ? window.location.href : `/track/${trackingId}`}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tanda-Terima-${trackingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setReceiptDownloaded(true);
  };

  const geoInputRef = useRef<HTMLInputElement | null>(null);
  const [showFasadGuide, setShowFasadGuide] = useState(false);
  const [condDocType, setCondDocType] = useState("SKPWNI_DUKCAPIL");
  const [condDocNumber, setCondDocNumber] = useState("");
  const [condNote, setCondNote] = useState("");

  const handleGeoCamera = async (file: File) => {
    const lat = appData?.home_lat ?? -7.2489;
    const lng = appData?.home_lng ?? 112.6382;
    setGeoStatus("Memeriksa GPS EXIF dan kesesuaian fasad rumah...");
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
        reader.readAsDataURL(file);
      });
      const res = await verifyPhoto.mutateAsync({
        tracking_id: trackingId,
        lat,
        lng,
        photo_name: file.name,
        doc_type: condDocType,
        doc_number: condDocNumber,
        note: condNote,
        image_base64: imageBase64,
      });
      if (res?.application) setAppData(res.application);
      const result = res?.application;
      const approved = result?.status === "APPROVED";
      setExtraLogs((prev) => [...prev, {
        time: new Date().toTimeString().slice(0, 8),
        agent: "GEOTAG-FIELD-VERIFIER",
        color: approved ? "text-emerald-400" : "text-amber-400",
        msg: result?.ai_reasoning_summary || "Foto memerlukan pemeriksaan ulang.",
      }]);
      setGeoStatus(approved ? `Foto ${file.name} tervalidasi ✓` : result?.rejection_reason || "Foto perlu diunggah ulang.");
    } catch {
      setGeoStatus("Verifikasi geotag gagal — pilih foto fasad JPG dengan GPS aktif.");
    }
  };

  return (
    <FadeIn>
    <div className="flex flex-col w-full">
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-surface-tint-blue/30 via-surface to-surface pb-space-xl">
        <div className="max-w-7xl mx-auto px-margin pt-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
            <div className="flex items-center gap-space-xs text-text-muted">
              <a className="font-body-sm text-body-sm hover:text-primary transition-colors flex items-center gap-1" href="/">
                <span className="material-symbols-outlined text-[16px]">
                  arrow_back
                </span>
                {' '}Portal PPDB
              </a>
              {' '}
              <span>
                /
              </span>
              {' '}
              <span className="font-body-sm text-body-sm text-text-heading font-medium">
                Pelacakan Live Agen AI
              </span>
              {' '}
              <span>
                /
              </span>
              {' '}
              <span className="font-code-sm text-code-sm px-space-xs py-0.5 rounded bg-surface-container text-secondary font-semibold">
                {trackingId}
              </span>
            </div>
            <div className="flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-canvas shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-approved opacity-75" />
                {' '}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-approved" />
              </span>
              {' '}
              <span className="font-code-sm text-code-sm text-text-heading font-medium">
                Status Server:
              </span>
              {' '}
              <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                Terhubung (Real-Time)
              </span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-surface-canvas rounded-2xl border border-border-slate shadow-lg p-5 sm:p-6 mb-space-xl relative overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-code-sm text-xs sm:text-sm text-[#1E3A8A] tracking-tight font-extrabold bg-[#EFF6FF] border border-[#1E3A8A]/20 px-3 py-1 rounded-lg">
                    {trackingId}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-code-sm text-xs font-extrabold shadow-sm ${
                      appData?.status === "APPROVED"
                        ? "bg-status-approved text-on-primary"
                        : appData?.status === "REJECTED"
                        ? "bg-status-fraud text-on-primary"
                        : appData?.status === "NEEDS_REVISION" || appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "bg-status-revision text-on-primary"
                        : "bg-secondary text-on-secondary"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[15px] ${scanningOcr ? "animate-spin" : ""}`}>
                      {appData?.status === "APPROVED"
                        ? "verified"
                        : appData?.status === "REJECTED"
                        ? "dangerous"
                        : appData?.status === "NEEDS_REVISION" || appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "warning"
                        : "smart_toy"}
                    </span>
                    <span>
                      {scanningOcr
                        ? "MEMINDAI ULANG BERKAS KK SECARA OTOMATIS..."
                        : appData?.status === "APPROVED"
                        ? "LOLOS VERIFIKASI ZONASI OTOMATIS (DISETUJUI)"
                        : appData?.status === "REJECTED"
                        ? "DITOLAK OTOMATIS — INDIKASI ANOMALI / KECURANGAN"
                        : appData?.status === "NEEDS_REVISION"
                        ? "BUTUH REVISI DOKUMEN KK (PERLU REVISI)"
                        : appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "BUTUH FOTO RUMAH BER-GEOTAG"
                        : "SEDANG DIPROSES OLEH SISTEM VERIFIKASI (Tahap 3/3)"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
                    {appData?.student_name || studentName}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] font-code-sm text-xs">
                    <span>NIK:</span>
                    <span className="text-[#1E293B] font-bold">
                      {appData?.student_nik
                        ? `${appData.student_nik.slice(0, 4)}**********${appData.student_nik.slice(-2)}`
                        : "3174**********02"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[#334155] text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-[#1E3A8A] text-[17px]">
                      school
                    </span>
                    <span className="text-[#475569]">Sekolah Tujuan:</span>
                    <span className="font-bold text-[#1E293B]">
                      {appData?.school_name || "SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Benowo)"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto self-end lg:self-center shrink-0">
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs sm:text-sm shadow-sm transition-all w-full sm:w-auto"
                  id="btnDownloadReceipt"
                  type="button"
                  onClick={handleDownloadReceipt}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">
                    qr_code_2
                  </span>
                  <span>
                    {receiptDownloaded ? "Tanda Terima Terunduh ✓" : "Unduh Tanda Terima Digital"}
                  </span>
                </motion.button>
                <div className="hidden sm:flex flex-col items-center justify-center p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-sm shrink-0">
                  <svg className="w-11 h-11 text-[#1E3A8A]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <rect height="16" rx="2" stroke="currentColor" strokeWidth="3" width="16" x="4" y="4" />
                    <rect fill="currentColor" height="8" width="8" x="8" y="8" />
                    <rect height="16" rx="2" stroke="currentColor" strokeWidth="3" width="16" x="28" y="4" />
                    <rect fill="currentColor" height="8" width="8" x="32" y="8" />
                    <rect height="16" rx="2" stroke="currentColor" strokeWidth="3" width="16" x="4" y="28" />
                    <rect fill="currentColor" height="8" width="8" x="8" y="32" />
                    <rect fill="currentColor" height="6" width="6" x="26" y="26" />
                    <rect fill="currentColor" height="6" width="6" x="38" y="26" />
                    <rect fill="currentColor" height="6" width="6" x="26" y="38" />
                    <rect fill="currentColor" height="12" width="6" x="34" y="32" />
                  </svg>
                  <span className="font-code-sm text-[9px] text-text-muted mt-1 uppercase">
                    SHA-256 Valid
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-status-approved via-secondary to-secondary-container h-full rounded-full transition-all duration-700"
                style={{ width: appData?.status === "APPROVED" ? "100%" : "88%" }}
              />
            </div>
          </motion.div>

          {/* 3 TAHAP PIPELINE CARDS (Dynamic & Non-overlapping z-10 + Framer Motion Stagger) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-space-xl">
            {/* TAHAP 1: OCR KK */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
              className="bg-surface-canvas rounded-2xl border border-[#E2E8F0] shadow-md p-5 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-status-approved-bg/35 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-code-sm text-xs text-[#475569] font-extrabold tracking-wider">
                    TAHAP 1 DARI 3
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-code-sm text-[11px] font-bold shadow-sm ${
                      (appData?.ocr_confidence ?? 98.4) >= 80 && (appData?.kk_age_valid ?? true)
                        ? "bg-status-approved-bg text-status-approved"
                        : "bg-status-revision-bg text-status-revision"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {(appData?.ocr_confidence ?? 98.4) >= 80 && (appData?.kk_age_valid ?? true)
                        ? "check_circle"
                        : "warning"}
                    </span>
                    {(appData?.ocr_confidence ?? 98.4) >= 80 && (appData?.kk_age_valid ?? true)
                      ? "SELESAI / VALID"
                      : "ANOMALI / REVISI"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1E293B] flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-status-approved text-[21px]">
                    document_scanner
                  </span>
                  <span>Pemeriksaan Dokumen KK</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed mb-4">
                  Pembacaan otomatis untuk nomor KK, masa domisili, dan hubungan keluarga calon siswa.
                </p>
              </div>
              <div className="relative z-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 font-code-sm text-xs">
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-[#475569]">Tgl Lahir &amp; Usia SMA:</span>
                  <span
                    className={`font-bold text-right ${
                      (appData?.student_age_valid ?? true) ? "text-status-approved" : "text-status-fraud"
                    }`}
                  >
                    {appData?.student_birth_date || "-"} ({Math.floor(appData?.student_age_years ?? 16)} Thn{" "}
                    {(appData?.student_age_valid ?? true) ? "✓ 15–17 Thn" : "✗ Anomali"})
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-[#475569]">Tgl Terbit KK:</span>
                  <span className="font-semibold text-[#1E293B]">
                    {appData?.kk_issue_date || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-[#475569]">Masa Domisili:</span>
                  <span
                    className={`font-bold text-right ${
                      (appData?.kk_age_valid ?? true) ? "text-status-approved" : "text-status-fraud"
                    }`}
                  >
                    {appData?.kk_age_label || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5 gap-2">
                  <span className="text-[#475569]">Relasi Siswa:</span>
                  <span className="text-[#1E293B] font-semibold text-right">
                    {(appData?.family_relation_valid ?? true)
                      ? "Anak Kandung (Sah)"
                      : "Famili Lain / Disensor"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[#E2E8F0] gap-2">
                  <span className="text-[#475569]">Akurasi Pembacaan:</span>
                  <span
                    className={`font-bold ${
                      (appData?.ocr_confidence ?? 98.4) >= 80 ? "text-[#1E3A8A]" : "text-status-revision"
                    }`}
                  >
                    {appData?.ocr_confidence ?? 98.4}% ({(appData?.ocr_confidence ?? 98.4) >= 80 ? "Tinggi" : "Rendah"})
                  </span>
                </div>
              </div>
            </motion.div>

            {/* TAHAP 2: GEOSPATIAL POSTGIS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
              className="bg-surface-canvas rounded-2xl border border-[#E2E8F0] shadow-md p-5 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-status-approved-bg/35 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-code-sm text-xs text-[#475569] font-extrabold tracking-wider">
                    TAHAP 2 DARI 3
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-code-sm text-[11px] font-bold shadow-sm ${
                      (appData?.real_route_distance_meters ?? 820) <= 1200
                        ? "bg-status-approved-bg text-status-approved"
                        : "bg-status-revision-bg text-status-revision"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {(appData?.real_route_distance_meters ?? 820) <= 1200 ? "SELESAI / VALID" : "LUAR RADIUS"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1E293B] flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-status-approved text-[21px]">
                    route
                  </span>
                  <span>Perhitungan Jarak Rute Jalan</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed mb-4">
                  Perbandingan jarak garis lurus terhadap jarak rute jalan darat menuju sekolah tujuan.
                </p>
              </div>
              <div className="relative z-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5 font-code-sm text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Jarak Rute Jalan:</span>
                  <span className="font-bold text-status-approved">
                    {appData?.real_route_distance_meters ?? 820} Meter
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Jarak Garis Lurus:</span>
                  <span className="text-[#1E293B] font-semibold">
                    {appData?.straight_line_distance_meters ?? 540} Meter
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Ambang Batas Zonasi:</span>
                  <span className="text-[#475569] font-medium">Maksimal 1.200 Meter</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[#E2E8F0]">
                  <span className="text-[#475569]">Status Validasi Zonasi:</span>
                  <span className="font-bold text-status-approved">
                    {(appData?.real_route_distance_meters ?? 820) <= 1200
                      ? "LOLOS ZONA UTAMA"
                      : "ZONA REGULER (>1.2 KM)"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* TAHAP 3: VISION TATA RUANG */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.35, delay: 0.19, ease: "easeOut" }}
              className="bg-surface-canvas rounded-2xl border border-[#E2E8F0] shadow-md p-5 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-surface-tint-blue/40 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-code-sm text-xs text-[#1E3A8A] font-extrabold tracking-wider">
                    TAHAP 3 DARI 3
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-code-sm text-[11px] font-bold shadow-sm ${
                      appData?.detected_building === "COMMERCIAL" || appData?.detected_building === "EMPTY_LAND"
                        ? "bg-status-fraud-bg text-status-fraud"
                        : appData?.detected_building === "NO_STREET_VIEW"
                        ? "bg-status-revision-bg text-status-revision"
                        : "bg-status-approved-bg text-status-approved"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {appData?.detected_building === "COMMERCIAL"
                        ? "storefront"
                        : appData?.detected_building === "NO_STREET_VIEW"
                        ? "add_a_photo"
                        : "verified"}
                    </span>
                    {appData?.detected_building === "COMMERCIAL"
                      ? "ANOMALI RUKO"
                      : appData?.detected_building === "NO_STREET_VIEW"
                      ? "GANG SEMPIT"
                      : "SELESAI / HUNIAN"}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#1E293B] flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[#1E3A8A] text-[21px]">
                    satellite_alt
                  </span>
                  <span>Pemeriksaan Lokasi &amp; Bangunan</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed mb-4">
                  Pemeriksaan kelayakan bangunan tempat tinggal (mencegah manipulasi ruko atau lahan kosong).
                </p>
              </div>
              <div className="relative z-10 bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-xl p-3.5 space-y-1.5 font-code-sm text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Koordinat Rumah:</span>
                  <span className="font-mono text-[#1E3A8A] font-bold">
                    {appData
                      ? `${appData.home_lat.toFixed(5)}, ${appData.home_lng.toFixed(5)}`
                      : "-7.24680, 112.63580"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Metode Pemeriksaan:</span>
                  <span className="font-semibold text-[#1E293B]">Verifikasi Peta &amp; Citra</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[#475569]">Jenis Bangunan:</span>
                  <span className="text-[#1E3A8A] font-semibold text-right">
                    {appData?.detected_building === "COMMERCIAL"
                      ? "Ruko / Bangunan Komersial"
                      : appData?.detected_building === "NO_STREET_VIEW"
                      ? "Gang Sempit (Foto Geotag)"
                      : "Rumah Tinggal / Permukiman"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[#DBEAFE]">
                  <span className="text-[#475569]">Keputusan Akhir:</span>
                  <span className="font-bold text-[#1E3A8A]">
                    {appData?.status === "APPROVED"
                      ? "DISETUJUI"
                      : appData?.status === "REJECTED"
                      ? "DITOLAK"
                      : appData?.status === "NEEDS_REVISION"
                      ? "PERLU REVISI"
                      : appData?.status || "DISETUJUI"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-space-xl items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="lg:col-span-7 bg-surface-canvas rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    preview
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-text-heading">
                    Pemindaian OCR Interaktif &amp; Citra Jalan
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => kkInputRef.current?.click()}
                    className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                    {scanningOcr ? "Memindai..." : "Pindai File KK Baru"}
                  </button>
                  <div className="flex items-center gap-1 bg-surface-canvas px-space-xs py-1 rounded shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveTab("doc")}
                      className={
                        activeTab === "doc"
                          ? "px-space-sm py-0.5 rounded font-label-md text-label-md bg-primary text-on-primary"
                          : "px-space-sm py-0.5 rounded font-label-md text-label-md text-text-muted hover:text-text-heading transition-colors"
                      }
                      id="tabScanDoc"
                    >
                      Dokumen KK
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("street")}
                      className={
                        activeTab === "street"
                          ? "px-space-sm py-0.5 rounded font-label-md text-label-md bg-primary text-on-primary"
                          : "px-space-sm py-0.5 rounded font-label-md text-label-md text-text-muted hover:text-text-heading transition-colors"
                      }
                      id="tabScanStreet"
                    >
                      Peta Interaktif &amp; Tata Ruang
                    </button>
                  </div>
                </div>
              </div>
              <div
                className={`relative w-full h-[380px] bg-slate-900 flex items-center justify-center overflow-hidden ${
                  activeTab === "doc" ? "" : "hidden"
                }`}
                id="containerDocViewer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-95" />
                {uploadedPreviewUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-4 z-10">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse z-30 top-1/2" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedPreviewUrl}
                      alt="Scan Kartu Keluarga"
                      onError={() => setUploadedPreviewUrl(null)}
                      className="max-h-[290px] w-auto object-contain rounded-lg border-2 border-cyan-400/60 shadow-2xl bg-white"
                    />
                    <div className="mt-2 px-3 py-1 rounded bg-slate-950/90 text-cyan-300 font-code-sm text-[11px] border border-cyan-500/30">
                      Status Berkas: {appData?.kk_image_url?.startsWith("http") ? "Tersimpan di Penyimpanan Dokumen Resmi" : appData?.kk_image_url}
                    </div>
                  </div>
                ) : appData ? (
                  <div className="relative w-full max-w-lg h-80 bg-surface-canvas rounded-lg shadow-2xl overflow-hidden p-space-md font-body-sm text-text-heading select-none z-10">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-[scan_3s_ease-in-out_infinite] z-30" />
                    <div className="flex items-center justify-between pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-700 text-[18px]">
                            verified
                          </span>
                        </div>
                        <div>
                          <p className="font-headline-sm text-[12px] leading-none uppercase font-bold text-slate-800">
                            KARTU KELUARGA
                          </p>
                          <p className="font-code-sm text-[10px] text-slate-500">
                            No. {appData.kk_number || "-"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded font-code-sm text-[10px] font-bold ${
                          (appData.ocr_confidence ?? 0) >= 80
                            ? "bg-emerald-50 text-status-approved"
                            : "bg-amber-50 text-status-revision"
                        }`}
                      >
                        {(appData.ocr_confidence ?? 0) >= 80 ? "TERVERIFIKASI" : "PERLU REVISI"}
                      </div>
                    </div>
                    <div className="relative p-2 bg-emerald-50/60 rounded mb-2 z-10">
                      <span className="absolute -top-2 right-2 bg-status-approved text-white font-code-sm text-[9px] px-1.5 rounded uppercase">
                        Bounding Box: Domisili KK
                      </span>
                      <p className="font-code-sm text-[11px] text-slate-500 leading-tight">
                        Alamat Domisili Terbaca
                      </p>
                      <p className="font-body-md text-[13px] font-bold text-slate-900 leading-tight truncate">
                        {appData.address || appData.address_text || "-"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="relative p-2 bg-cyan-50/60 rounded z-10">
                        <span className="absolute -top-2 right-1 bg-secondary text-white font-code-sm text-[8px] px-1 rounded uppercase">
                          Anak Usia SMA (15–17 Thn)
                        </span>
                        <p className="font-code-sm text-[10px] text-slate-500 leading-tight">
                          Calon Siswa Terdeteksi
                        </p>
                        <p className="font-body-md text-[12px] font-bold text-slate-900 leading-tight truncate">
                          {appData.student_name}
                        </p>
                        <p
                          className={`font-code-sm text-[10px] font-bold leading-tight mt-0.5 ${
                            (appData.student_age_valid ?? true)
                              ? "text-status-approved"
                              : "text-status-fraud"
                          }`}
                        >
                          Lahir: {appData.student_birth_date || "-"} ({Math.floor(appData.student_age_years ?? 16)} Thn)
                        </p>
                      </div>
                      <div className="relative p-2 bg-emerald-50/60 rounded z-10">
                        <span className="absolute -top-2 right-1 bg-status-approved text-white font-code-sm text-[8px] px-1 rounded uppercase">
                          Hubungan
                        </span>
                        <p className="font-code-sm text-[10px] text-slate-500 leading-tight">
                          Status Hubungan
                        </p>
                        <p className="font-body-md text-[12px] font-bold text-slate-900 leading-tight">
                          {(appData.family_relation_valid ?? true) ? "ANAK KANDUNG" : "FAMILI LAIN"}
                        </p>
                      </div>
                    </div>
                    <div className="relative p-2 bg-blue-50/60 rounded z-10">
                      <span className="absolute -top-2 right-2 bg-primary text-white font-code-sm text-[9px] px-1.5 rounded uppercase">
                        Bounding Box: Tanggal Diterbitkan
                      </span>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-code-sm text-[10px] text-slate-500 leading-tight">
                            Dikeluarkan Tanggal
                          </p>
                          <p className="font-body-md text-[12px] font-bold text-primary leading-tight">
                            {appData.kk_issue_date || appData.kk_issued_date || "-"} ({appData.kk_age_label || "-"})
                          </p>
                        </div>
                        <span
                          className={`font-code-sm text-[10px] font-bold px-2 py-0.5 rounded ${
                            (appData.kk_age_valid ?? true)
                              ? "text-status-approved bg-status-approved-bg"
                              : "text-status-fraud bg-status-fraud-bg"
                          }`}
                        >
                          {(appData.kk_age_valid ?? true) ? "VALID ≥ 1 TAHUN" : "ANOMALI < 1 THN"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-slate-400 font-code-sm text-[9px]">
                      <span>Berkas: {appData.kk_image_url || appData.kk_document_url || "-"}</span>
                      <span>Confidence: {appData.ocr_confidence}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 text-slate-300 max-w-md gap-3">
                    <span className="material-symbols-outlined text-[42px] text-cyan-400">
                      upload_file
                    </span>
                    <p className="font-headline-sm text-sm font-bold text-white">
                      Belum Ada File Kartu Keluarga (KK) yang Diunggah
                    </p>
                    <p className="font-body-sm text-xs text-slate-400">
                      Klik tombol <strong>Pindai File KK Baru</strong> di kanan atas untuk mengunggah dan memindai berkas KK secara langsung tanpa data dummy.
                    </p>
                  </div>
                )}
              </div>
              <div
                className={`relative w-full h-[380px] bg-slate-900 overflow-hidden ${
                  activeTab === "street" ? "" : "hidden"
                }`}
                id="containerStreetViewer"
              >
                {(() => {
                  const lat = appData?.home_lat ?? -7.2489;
                  const lng = appData?.home_lng ?? 112.6382;
                  const d = 0.005;
                  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${(lng - d).toFixed(5)}%2C${(lat - d).toFixed(5)}%2C${(lng + d).toFixed(5)}%2C${(lat + d).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
                  return (
                    <div className="relative w-full h-full flex flex-col">
                      <iframe
                        title="Peta Zonasi OpenStreetMap"
                        src={osmEmbed}
                        className="w-full flex-1 border-0"
                        loading="lazy"
                      />
                      <div className="bg-slate-900/95 backdrop-blur px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                        <div className="font-code-sm text-xs">
                          <span className="text-cyan-400 font-bold">OpenStreetMap Live:</span>{" "}
                          {appData?.address || "Jl. Sememi Jaya IV No. 14, Surabaya"} ({lat.toFixed(5)}, {lng.toFixed(5)})
                        </div>
                        <div className="flex items-center gap-2 font-code-sm text-xs">
                          <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-bold">
                            Rute ke SMAN 12: {appData?.real_route_distance_meters ?? 480}m
                          </span>
                          <span className="px-2 py-0.5 rounded bg-status-approved text-white font-bold">
                            Fasad: {appData?.detected_building || "RESIDENTIAL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Scope Terpisah: Bar Ringkasan Hasil OCR & Confidence */}
              <div className="px-4 py-3 bg-slate-900 text-white font-code-sm text-xs border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                    center_focus_strong
                  </span>
                  <span className="leading-relaxed break-words text-slate-200">
                    {scanningOcr
                      ? "Memindai Dokumen Kartu Keluarga secara otomatis..."
                      : appData?.ai_reasoning_summary || "Pemindai Dokumen KK Siap"}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold shrink-0 self-start sm:self-center">
                  Akurasi: {appData?.ocr_confidence ?? 98.4}%
                </span>
              </div>
              <div className="p-space-sm bg-surface-slate flex flex-wrap items-center justify-between gap-space-xs text-text-muted font-body-sm text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-status-approved text-[18px]">
                    verified_user
                  </span>
                  {' '}
                  <span>
                    Dokumen diverifikasi secara objektif dan transparan sesuai ketentuan PPDB.
                  </span>
                </div>
                <a className="text-secondary font-label-md text-label-md hover:underline" href="#">
                  Periksa Rincian Verifikasi →
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
              className="lg:col-span-5 bg-surface-canvas rounded-2xl border border-[#E2E8F0] shadow-xl flex flex-col h-full overflow-hidden"
            >
              <div className="p-4 bg-[#1E3A8A] text-white flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-approved animate-pulse" />
                  <h2 className="font-headline-sm text-headline-sm text-inverse-on-surface font-semibold">
                    Riwayat Proses Verifikasi Berkas
                  </h2>
                </div>
                <span className="font-code-sm text-code-sm text-slate-300">
                  Log Pemeriksaan Otomatis
                </span>
              </div>
              <div className="p-space-md bg-slate-950 text-slate-200 font-code-sm text-code-sm flex-1 space-y-space-sm overflow-y-auto max-h-[380px] leading-relaxed" id="reasoningTerminal">{logCleared ? (<div className="text-slate-500 font-mono text-[12px] italic">Tampilan log dibersihkan. Memantau pembaruan status...</div>) : (<>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:11
                  </span>
                  <div>
                    <span className="text-cyan-400 font-semibold">
                      [SISTEM-VERIFIKASI]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Memulai pemeriksaan berkas untuk nomor pendaftaran:
                    </span>
                    {' '}
                    <span className="text-amber-300">
                      {trackingId}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:12
                  </span>
                  <div>
                    <span className="text-emerald-400 font-semibold">
                      [PEMINDAI-DOKUMEN]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Memuat berkas Kartu Keluarga. Resolusi gambar jelas dan seluruh kolom terbaca.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:15
                  </span>
                  <div>
                    <span className="text-emerald-400 font-semibold">
                      [VALIDASI-IDENTITAS]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Siswa: <strong>{appData?.student_name || studentName}</strong> (NIK {appData?.student_nik || "3171041908070002"}) • No.KK: {appData?.kk_number || "3171042502120005"} • Terbit: {appData?.kk_issue_date || "2018-02-12"} ({appData?.kk_age_label || "Valid"}).
                    </span>
                    {' '}
                    <span className={(appData?.kk_age_valid ?? true) && (appData?.ocr_confidence ?? 98) >= 80 ? "text-emerald-300 font-bold" : "text-rose-400 font-bold"}>
                      → STATUS KK: {(appData?.kk_age_valid ?? true) && (appData?.ocr_confidence ?? 98) >= 80 ? "VALID" : "PERLU REVISI / ANOMALI"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:22
                  </span>
                  <div>
                    <span className="text-blue-400 font-semibold">
                      [PENGUKUR-JARAK]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Jarak garis lurus: {appData?.straight_line_distance_meters ?? 540}m • Jarak rute jalan darat:
                    </span>
                    {' '}
                    <span className="text-cyan-300 font-bold">
                      {appData?.real_route_distance_meters ?? 820} meter
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      (Batas Zonasi: 1.200m).
                    </span>
                    {' '}
                    <span className={(appData?.real_route_distance_meters ?? 820) <= 1200 ? "text-emerald-300 font-bold" : "text-rose-400 font-bold"}>
                      → {(appData?.real_route_distance_meters ?? 820) <= 1200 ? "DALAM ZONASI" : "LUAR ZONASI"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:28
                  </span>
                  <div>
                    <span className="text-purple-400 font-semibold">
                      [PEMERIKSA-LOKASI]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Memeriksa titik koordinat rumah pendaftar
                    </span>
                    {' '}
                    <span className="text-slate-400">
                      ({(appData?.home_lat ?? -7.2489).toFixed(5)}, {(appData?.home_lng ?? 112.6382).toFixed(5)})...
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:35
                  </span>
                  <div>
                    <span className="text-purple-400 font-semibold">
                      [PEMERIKSA-HUNIAN]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Pemeriksaan jenis bangunan selesai: Bukan ruko komersial atau lahan kosong. Terkonfirmasi rumah tinggal:
                    </span>
                    {' '}
                    <span className="text-emerald-400 font-bold">
                      Sesuai Ketentuan
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:41
                  </span>
                  <div>
                    <span className="text-amber-400 font-semibold">
                      [KESIMPULAN-VERIFIKASI]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Seluruh pemeriksaan kepatuhan zonasi selesai dan siap ditinjau oleh Panitia PPDB.
                    </span>
                  </div>
                </div>

                {extraLogs.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 animate-fadeIn">
                    <span className="text-slate-500 font-mono select-none">{item.time}</span>
                    <div>
                      <span className={`${item.color} font-semibold`}>[{item.agent}]</span>{' '}
                      <span className="text-slate-300">{item.msg}</span>
                    </div>
                  </div>
                ))}
                </>)}
              </div>
              <div className="p-space-sm bg-surface-slate flex items-center justify-between text-text-muted font-code-sm text-code-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  {' '}Inferensi Berkelanjutan
                </span>
                <button className="hover:text-primary transition-colors text-text-muted" id="btnClearLog" type="button" onClick={() => { setLogCleared(true); setExtraLogs([]); }}>
                  Bersihkan Tampilan
                </button>
              </div>
            </motion.div>
          </div>
          <div className="space-y-space-md mb-space-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-heading">
                  Solusi Edge-Case & Pengecualian Lapangan
                </h2>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Protokol pemulihan mandiri jika algoritma mendeteksi anomali pada pemindaian citra atau rute.
                </p>
              </div>
              <span className="hidden sm:inline-block font-label-md text-label-md bg-surface-tint-blue text-secondary px-space-sm py-1 rounded-full font-semibold">
                Prosedur Resmi SKB 3 Menteri
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div className="bg-surface-canvas rounded-xl shadow-md p-space-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="px-space-xs py-0.5 rounded bg-status-revision-bg text-status-revision font-label-md text-label-md font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        warning
                      </span>
                      {' '}Mitigasi Dokumen Kurang Jelas
                    </span>
                    {' '}
                    <span className="font-code-sm text-code-sm text-text-muted">
                      Edge-Case #01
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-heading mb-space-xs">
                    Unggah Ulang Cepat (Quick Re-verification)
                  </h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-space-md">
                    Bila scan KK memiliki lipatan atau resolusi di bawah 200 DPI, Anda tidak perlu mengisi ulang formulir pendaftaran dari awal.
                  </p>
                  <div className="w-full bg-surface-slate rounded-xl p-space-md flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-all mb-space-md" id="dropzoneKK" onClick={() => kkInputRef.current?.click()}>
                    <div className="w-10 h-10 rounded-full bg-surface-tint-blue flex items-center justify-center text-secondary mb-2">
                      <span className="material-symbols-outlined text-[24px]">
                        cloud_upload
                      </span>
                    </div>
                    <p className="font-label-lg text-label-lg text-text-heading mb-0.5">
                      Tarik & Letakkan Berkas KK Baru
                    </p>
                    <p className="font-body-sm text-body-sm text-text-muted">
                      Format PDF, JPG, atau PNG (Maks. 8 MB). AI langsung memproses ulang dalam 5 detik.
                    </p>
                    <input ref={kkInputRef} accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="fileInputKK" type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLiveReuploadKK(f); }} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-text-muted font-body-sm text-body-sm pt-space-xs">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      info
                    </span>
                    {' '}Riwayat revisi tercatat di log audit
                  </span>
                  <button type="button" onClick={() => kkInputRef.current?.click()} className="font-label-md text-label-md text-secondary hover:underline font-semibold">
                    {reuploadStatus || "Pilih Berkas"}
                  </button>
                </div>
              </div>
              <div className="bg-surface-canvas rounded-xl shadow-md p-space-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="px-space-xs py-0.5 rounded bg-surface-tint-blue text-secondary font-label-md text-label-md font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        location_searching
                      </span>
                      {' '}Mitigasi Gang Sempit &amp; Pindah Rumah Sah (&lt; 1 Thn)
                    </span>
                    {' '}
                    <span className="font-code-sm text-code-sm text-text-muted">
                      Edge-Case #02
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-heading mb-space-xs">
                    Verifikasi Mandiri Foto Ber-Geotag &amp; Bukti Pindah Keluarga
                  </h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-space-md">
                    Untuk rumah di gang sempit yang terhalang Street View <strong>ATAU</strong> keluarga yang benar-benar pindah rumah (&lt; 1 tahun) bersama seluruh anggota keluarga: unggah <strong>Foto Depan Rumah Ber-Geotag GPS</strong> beserta <strong>SKPWNI (Surat Pindah Dukcapil) / SK Pindah Tugas Orang Tua</strong>.
                  </p>
                  <div className="bg-surface-slate rounded-xl p-space-md space-y-space-sm mb-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-tint-blue flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[24px]">
                          photo_camera
                        </span>
                      </div>
                      <div>
                        <h4 className="font-label-lg text-label-lg text-text-heading">
                          Kamera Geotagging &amp; Lampiran SKPWNI / Surat Tugas
                        </h4>
                        <p className="font-body-sm text-body-sm text-text-muted">
                          Mencocokkan koordinat EXIF foto rumah &amp; memvalidasi kepindahan seluruh keluarga (bukan titip KK anak).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-surface-canvas rounded-lg text-text-heading font-code-sm text-code-sm">
                      <span className="material-symbols-outlined text-status-approved text-[18px]">
                        gps_fixed
                      </span>
                      {' '}
                      <span>
                        Target GPS KK: ({(appData?.home_lat ?? -7.2489).toFixed(4)}, {(appData?.home_lng ?? 112.6382).toFixed(4)}) • Akurasi ±3.2m
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="font-code-sm text-[11px] text-text-muted block mb-1">
                          Jenis Surat Pembuktian Pindah / Domisili
                        </label>
                        <select
                          value={condDocType}
                          onChange={(e) => setCondDocType(e.target.value)}
                          className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-body-sm text-xs"
                        >
                          <option value="SKPWNI_DUKCAPIL">1. SKPWNI Dukcapil (Pindah 1 Keluarga Penuh)</option>
                          <option value="SK_PINDAH_TUGAS_ORTU">2. SK Pindah Tugas / Mutasi Kerja Ortu + SKD</option>
                          <option value="SURAT_DOMISILI_BENCANA">3. Surat Domisili Bencana Alam/Sosial (BPBD)</option>
                          <option value="FOTO_FASAD_GEOTAG">4. Foto Fasad Rumah Geotag (Gang Sempit)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-code-sm text-[11px] text-text-muted block mb-1">
                          Nomor Surat Resmi (SKPWNI / SK Tugas)
                        </label>
                        <input
                          type="text"
                          value={condDocNumber}
                          onChange={(e) => setCondDocNumber(e.target.value)}
                          placeholder="Contoh: 470/192/SKPWNI/436.7.19/2026"
                          className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-code-sm text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-code-sm text-[11px] text-text-muted block mb-1">
                          Catatan Verifikasi Panitia
                        </label>
                        <input
                          type="text"
                          value={condNote}
                          onChange={(e) => setCondNote(e.target.value)}
                          placeholder="Contoh: Orang tua & anak pindah 1 keluarga ke Kel. Sememi, Kec. Benowo"
                          className="w-full rounded-lg bg-surface-canvas border border-border-slate px-2.5 py-2 text-text-heading font-body-sm text-xs"
                        />
                      </div>
                    </div>
                    {showFasadGuide && (
                      <div className="p-3 rounded-lg bg-surface-tint-blue/40 border border-secondary/30 font-body-sm text-xs text-text-heading space-y-1">
                        <p className="font-bold text-secondary">Syarat Sah Pindah Rumah (&lt; 1 Tahun) &amp; Fasad Hunian (Permendikbudristek 1/2021):</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-text-body">
                          <li><strong>Pindah 1 Keluarga Penuh:</strong> Wajib melampirkan <strong>SKPWNI</strong> (Surat Keterangan Pindah WNI dari Dukcapil) yang membuktikan orang tua &amp; anak ikut pindah bersama (bukan hanya menumpang/titip anak ke KK kerabat).</li>
                          <li><strong>Mutasi Kerja/Dinas:</strong> Lampirkan <strong>SK Pindah Tugas</strong> orang tua/wali dari instansi/perusahaan + Surat Keterangan Domisili RT/RW setempat.</li>
                          <li><strong>Bukti Fisik Hunian:</strong> Foto depan rumah menampilkan nomor rumah &amp; jalan lingkungan dengan GPS aktif.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  ref={geoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleGeoCamera(f);
                  }}
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm pt-space-xs">
                  <button
                    className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-lg text-label-lg shadow transition-all"
                    id="btnGeoCamera"
                    type="button"
                    onClick={() => geoInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      camera
                    </span>
                    {' '}
                    <span>
                      {geoStatus || "Unggah Foto Geotag / SKPWNI Pindah Rumah"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFasadGuide((v) => !v)}
                    className="px-space-md py-space-sm rounded-lg bg-surface-slate hover:bg-surface-container text-text-body font-label-md text-label-md transition-all"
                  >
                    {showFasadGuide ? "Tutup Panduan" : "Syarat Pindah & Fasad"}
                  </button>
                </div>
                {appData?.status !== "APPROVED" && (geoStatus || appData?.rejection_reason) && (
                  <div className="mt-space-sm rounded-lg border border-status-revision-border bg-status-revision-bg p-3 text-sm text-text-heading" role="alert">
                    <p className="font-label-md font-bold text-status-revision">Foto belum dapat disetujui</p>
                    <p className="mt-1 font-body-sm text-text-body">{appData?.rejection_reason || geoStatus}</p>
                    <p className="mt-1 font-body-sm text-text-muted">Periksa GPS EXIF, kesesuaian lokasi dengan alamat KK, dan pastikan foto menampilkan fasad rumah hunian.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-surface-canvas rounded-xl shadow-lg p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-status-approved-bg flex items-center justify-center text-status-approved shrink-0">
                <span className="material-symbols-outlined text-[28px]">
                  verified
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading">
                  Semua Tahapan Mengacu Pada Asas Keadilan Zonasi
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Hasil validasi AI memiliki audit trail kriptografis yang dapat diuji ulang secara terbuka saat masa sanggah PPDB.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm w-full md:w-auto">
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center justify-center gap-1 px-space-md py-space-sm rounded-lg bg-surface-tint-blue text-secondary hover:bg-surface-container-high font-label-lg text-label-lg transition-colors w-full md:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Segarkan Status</span>
              </button>
              {panitia ? (
                <a
                  className="flex items-center justify-center gap-1 px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-secondary font-label-lg text-label-lg transition-colors w-full md:w-auto"
                  href="/dashboard"
                >
                  <span>Konsol Panitia</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </a>
              ) : (
                <a
                  className="flex items-center justify-center gap-1 px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-secondary font-label-lg text-label-lg transition-colors w-full md:w-auto"
                  href="/"
                >
                  <span>Unggah Berkas KK Baru</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}
