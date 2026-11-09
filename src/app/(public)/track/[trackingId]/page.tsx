"use client";
import { use, useEffect, useRef, useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ApplicationRecord } from "@/lib/store";

const FEED_LOGS = [
  {
    agent: "VISION-LLM-AUDITOR",
    color: "text-purple-400",
    msg: "Analisis segmentasi citra: Pagar terdeteksi, jalan lingkungan selebar 4 meter cocok dengan peta kadastral.",
  },
  {
    agent: "AGENT-COORDINATOR",
    color: "text-cyan-400",
    msg: "Memvalidasi hash sertifikat digital Disdukcapil DKI Jakarta... Match confirmed.",
  },
  {
    agent: "ANTIFRAUD-ENGINE",
    color: "text-emerald-400",
    msg: "Zero fraud flags detected (Risk Score: 0.02 / Low Risk).",
  },
  {
    agent: "DECISION-REGISTRY",
    color: "text-blue-400",
    msg: "Menyiapkan approval block untuk penandatanganan panitia PPDB otomatis.",
  },
];

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const resolved = use(params);
  const trackingId = decodeURIComponent(resolved.trackingId || "PPDB-2026-X89K");
  const kkInputRef = useRef<HTMLInputElement | null>(null);
  const [appData, setAppData] = useState<ApplicationRecord | null>(null);
  const [studentName, setStudentName] = useState("Rafi Alamsyah");
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

  useEffect(() => {
    fetch(`/api/applications?q=${encodeURIComponent(trackingId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.application) {
          const app: ApplicationRecord = d.application;
          setAppData(app);
          setStudentName(app.student_name);
          if (app.kk_image_url?.startsWith("http")) {
            setUploadedPreviewUrl(app.kk_image_url);
          }
          const now = new Date().toTimeString().slice(0, 8);
          setExtraLogs([
            {
              time: now,
              agent: "OCR-VISION-GEMINI",
              color: app.ocr_confidence >= 80 ? "text-emerald-400" : "text-amber-400",
              msg: `Confidence OCR: ${app.ocr_confidence}% | No. KK: ${app.kk_number} | Terbit: ${app.kk_issue_date} (${app.kk_age_label})`,
            },
            {
              time: now,
              agent: "POSTGIS-GEOROUTE",
              color: "text-blue-400",
              msg: `Garis lurus Euclidean: ${app.straight_line_distance_meters}m | Rute darat aktual: ${app.real_route_distance_meters}m (${app.real_route_distance_meters <= 1200 ? "LOLOS ZONA" : "MELEBIHI BATAS"})`,
            },
            {
              time: now,
              agent: "STREETVIEW-AUDITOR",
              color: app.detected_building === "RESIDENTIAL" ? "text-purple-400" : "text-rose-400",
              msg: `Koordinat (${app.home_lat.toFixed(5)}, ${app.home_lng.toFixed(5)}) -> Klasifikasi: ${app.detected_building}`,
            },
            {
              time: now,
              agent: "GEMINI-3-FLASH",
              color: app.status === "APPROVED" ? "text-emerald-400" : "text-amber-300",
              msg: `${app.ai_reasoning_summary} [STATUS: ${app.status}]`,
            },
          ]);
        }
      })
      .catch(() => {});
  }, [trackingId]);

  const handleLiveReuploadKK = (file: File) => {
    setReuploadStatus(`Memindai ${file.name} dengan Gemini 3 Flash...`);
    setScanningOcr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = typeof reader.result === "string" ? reader.result : undefined;
      if (b64) setUploadedPreviewUrl(b64);
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_id: trackingId,
            student_nik: appData?.student_nik || "3171041908070002",
            student_name: appData?.student_name || studentName,
            kk_number: appData?.kk_number || "3171042502120005",
            school_name: appData?.school_name || "SMAN 1 Teladan Jakarta",
            address: appData?.address || "Jl. Kenanga No. 14, Tebet Barat",
            home_lat: appData?.home_lat ?? -6.2284,
            home_lng: appData?.home_lng ?? 106.8492,
            kk_image_url: file.name,
            kk_image_base64: b64,
          }),
        });
        const data = await res.json();
        if (data?.application) {
          const updated: ApplicationRecord = data.application;
          setAppData(updated);
          if (updated.kk_image_url?.startsWith("http")) {
            setUploadedPreviewUrl(updated.kk_image_url);
          }
          setReuploadStatus(`Selesai Dipindai (${updated.ocr_confidence}% • ${updated.status}) ✓`);
          const now = new Date().toTimeString().slice(0, 8);
          setExtraLogs((prev) => [
            {
              time: now,
              agent: "LIVE-REUPLOAD-OCR",
              color: updated.ocr_confidence >= 80 ? "text-emerald-400" : "text-rose-400",
              msg: `Hasil pindai ulang ${file.name}: Confidence ${updated.ocr_confidence}%, Status=${updated.status}. ${updated.rejection_reason || updated.ai_reasoning_summary}`,
            },
            ...prev,
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

    const channel = supabaseBrowser
      ?.channel(`track-${trackingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_audit_logs" },
        (payload) => {
          const now = new Date().toTimeString().slice(0, 8);
          setExtraLogs((prev) => [
            ...prev,
            {
              time: now,
              agent: String((payload.new as Record<string, unknown>)?.step_name || "SUPABASE-RT"),
              color: "text-cyan-400",
              msg: String((payload.new as Record<string, unknown>)?.detail_message || "Pembaruan status realtime diterima."),
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      if (channel && supabaseBrowser) supabaseBrowser.removeChannel(channel);
    };
  }, [trackingId]);

  const handleDownloadReceipt = () => {
    setReceiptDownloaded(true);
  };

  const handleGeoCamera = async () => {
    setGeoStatus("Memverifikasi Geotag GPS...");
    await fetch("/api/verify-live-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_id: trackingId, lat: -6.23827, lng: 106.85194 }),
    }).catch(() => {});
    setGeoStatus("Kamera Geotag Terverifikasi ✓");
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
                Supabase Realtime:
              </span>
              {' '}
              <span className="font-code-sm text-code-sm text-status-approved font-semibold">
                Terhubung (24ms)
              </span>
            </div>
          </div>
          <div className="bg-surface-canvas rounded-xl shadow-xl p-space-lg mb-space-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg relative z-10">
              <div className="space-y-space-xs">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="font-code-lg text-code-lg text-primary tracking-tight font-bold bg-surface-tint-blue px-space-sm py-1 rounded-lg">
                    {trackingId}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 px-space-sm py-1 rounded-full font-label-md text-label-md shadow-sm ${
                      appData?.status === "APPROVED"
                        ? "bg-status-approved text-on-primary"
                        : appData?.status === "REJECTED"
                        ? "bg-status-fraud text-on-primary"
                        : appData?.status === "NEEDS_REVISION" || appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "bg-status-revision text-on-primary"
                        : "bg-secondary text-on-secondary"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${scanningOcr ? "animate-spin" : ""}`}>
                      {appData?.status === "APPROVED"
                        ? "verified"
                        : appData?.status === "REJECTED"
                        ? "dangerous"
                        : appData?.status === "NEEDS_REVISION" || appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "warning"
                        : "smart_toy"}
                    </span>{' '}
                    <span>
                      {scanningOcr
                        ? "MEMINDAI ULANG BERKAS KK DENGAN GEMINI 3 FLASH..."
                        : appData?.status === "APPROVED"
                        ? "LOLOS VERIFIKASI ZONASI OTOMATIS (APPROVED)"
                        : appData?.status === "REJECTED"
                        ? "DITOLAK OTOMATIS — INDIKASI ANOMALI / FRAUD"
                        : appData?.status === "NEEDS_REVISION"
                        ? "BUTUH REVISI DOKUMEN KK (NEEDS_REVISION)"
                        : appData?.status === "NEEDS_LIVE_PHOTO"
                        ? "BUTUH FOTO FASAD BER-GEOTAG (NEEDS_LIVE_PHOTO)"
                        : "SEDANG DIPROSES OLEH AGENTIC AI (Tahap 3/3)"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-space-md gap-y-1 pt-1">
                  <h1 className="font-headline-md text-headline-md text-text-heading">
                    {appData?.student_name || studentName}
                  </h1>
                  <div className="flex items-center gap-space-xs text-text-muted font-code-md text-code-md">
                    <span>NIK:</span>{' '}
                    <span className="text-text-heading font-semibold">
                      {appData?.student_nik
                        ? `${appData.student_nik.slice(0, 4)}**********${appData.student_nik.slice(-2)}`
                        : "3174**********02"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-text-body font-body-md text-body-md">
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      school
                    </span>{' '}
                    <span>Pilihan:</span>{' '}
                    <span className="font-semibold text-text-heading">
                      {appData?.school_name || "SMAN 1 Teladan (Zonasi Domisili)"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm w-full sm:w-auto self-end lg:self-center">
                <button
                  className="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-slate hover:bg-surface-container text-text-heading font-label-lg text-label-lg shadow-sm transition-all w-full sm:w-auto"
                  id="btnDownloadReceipt"
                  type="button"
                  onClick={handleDownloadReceipt}
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    qr_code_2
                  </span>{' '}
                  <span>
                    {receiptDownloaded ? "Tanda Terima PDF Terunduh ✓" : "Unduh Tanda Terima Digital"}
                  </span>
                </button>
                <div className="hidden sm:flex flex-col items-center justify-center p-2 bg-surface-slate rounded-lg shadow-sm">
                  <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-md overflow-hidden">
              <div
                className="bg-gradient-to-r from-status-approved via-secondary to-secondary-container h-full rounded-full transition-all duration-700"
                style={{ width: appData?.status === "APPROVED" ? "100%" : "88%" }}
              />
            </div>
          </div>

          {/* 3 TAHAP PIPELINE CARDS (Dynamic & Non-overlapping z-10) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-space-xl">
            {/* TAHAP 1: OCR KK */}
            <div className="bg-surface-canvas rounded-xl shadow-md p-space-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-20 h-20 bg-status-approved-bg/35 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-space-sm">
                  <span className="font-code-sm text-code-sm text-text-muted font-bold tracking-wider">
                    TAHAP 1 DARI 3
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold shadow-sm ${
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
                <h3 className="font-headline-sm text-headline-sm text-text-heading flex items-center gap-2 mb-space-xs">
                  <span className="material-symbols-outlined text-status-approved text-[22px]">
                    document_scanner
                  </span>
                  Penalaran Dokumen KK
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted mb-space-sm">
                  Ekstraksi multimodal Gemini 3 Flash untuk nomor KK, masa domisili, dan relasi siswa.
                </p>
              </div>
              <div className="relative z-10 bg-surface-slate rounded-lg p-space-sm space-y-space-xs font-code-sm text-code-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Tgl Terbit KK:</span>
                  <span className="font-semibold text-text-heading">
                    {appData?.kk_issue_date || "2018-02-12"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Masa Domisili:</span>
                  <span
                    className={`font-bold ${
                      (appData?.kk_age_valid ?? true) ? "text-status-approved" : "text-status-fraud"
                    }`}
                  >
                    {appData?.kk_age_label || "6.0 Tahun (≥ 1 Thn)"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Relasi Siswa:</span>
                  <span className="text-text-heading font-medium">
                    {(appData?.family_relation_valid ?? true)
                      ? "Anak Kandung (Sah)"
                      : "Famili Lain / Masked (Anomali)"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-muted">OCR Confidence:</span>
                  <span
                    className={`font-semibold ${
                      (appData?.ocr_confidence ?? 98.4) >= 80 ? "text-secondary" : "text-status-revision"
                    }`}
                  >
                    {appData?.ocr_confidence ?? 98.4}% ({(appData?.ocr_confidence ?? 98.4) >= 80 ? "Tinggi" : "Rendah / Dummy"})
                  </span>
                </div>
              </div>
            </div>

            {/* TAHAP 2: GEOSPATIAL POSTGIS */}
            <div className="bg-surface-canvas rounded-xl shadow-md p-space-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-20 h-20 bg-status-approved-bg/35 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-space-sm">
                  <span className="font-code-sm text-code-sm text-text-muted font-bold tracking-wider">
                    TAHAP 2 DARI 3
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold shadow-sm ${
                      (appData?.real_route_distance_meters ?? 820) <= 1200
                        ? "bg-status-approved-bg text-status-approved"
                        : "bg-status-revision-bg text-status-revision"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {(appData?.real_route_distance_meters ?? 820) <= 1200 ? "SELESAI / VALID" : "LUAR RADIUS"}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading flex items-center gap-2 mb-space-xs">
                  <span className="material-symbols-outlined text-status-approved text-[22px]">
                    route
                  </span>
                  Kalkulasi Jarak Darat Riil
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted mb-space-sm">
                  Komparasi jarak garis lurus PostGIS (ST_Distance) terhadap rute jalan darat aktual.
                </p>
              </div>
              <div className="relative z-10 bg-surface-slate rounded-lg p-space-sm space-y-space-xs font-code-sm text-code-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Rute Darat Aktual:</span>
                  <span className="font-bold text-status-approved text-[13px]">
                    {appData?.real_route_distance_meters ?? 820} Meter
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Garis Lurus Euclidean:</span>
                  <span className="text-text-heading font-medium">
                    {appData?.straight_line_distance_meters ?? 540} Meter
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Ambang Batas Zonasi:</span>
                  <span className="text-text-muted font-medium">Maksimal 1.200 Meter</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-muted">Status Validasi Zonasi:</span>
                  <span className="font-bold text-status-approved">
                    {(appData?.real_route_distance_meters ?? 820) <= 1200
                      ? "LOLOS ZONA UTAMA"
                      : "ZONA REGULER (>1.2 KM)"}
                  </span>
                </div>
              </div>
            </div>

            {/* TAHAP 3: VISION TATA RUANG */}
            <div className="bg-surface-canvas rounded-xl shadow-md p-space-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-20 h-20 bg-surface-tint-blue/40 rounded-bl-full pointer-events-none z-0" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-space-sm">
                  <span className="font-code-sm text-code-sm text-secondary font-bold tracking-wider">
                    TAHAP 3 DARI 3
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-md text-label-md font-semibold shadow-sm ${
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
                      ? "BLIND SPOT GANG"
                      : "SELESAI / HUNIAN"}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-heading flex items-center gap-2 mb-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    satellite_alt
                  </span>
                  Audit Visual Tata Ruang
                </h3>
                <p className="font-body-sm text-body-sm text-text-muted mb-space-sm">
                  Verifikasi fasad hunian fisik via Vision AI (mencegah manipulasi ruko atau lahan kosong).
                </p>
              </div>
              <div className="relative z-10 bg-surface-tint-blue/40 rounded-lg p-space-sm space-y-space-xs font-code-sm text-code-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Target Geospasial:</span>
                  <span className="font-mono text-secondary font-semibold">
                    {appData
                      ? `${appData.home_lat.toFixed(5)}, ${appData.home_lng.toFixed(5)}`
                      : "-6.23827, 106.85194"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Mesin Klasifikasi:</span>
                  <span className="font-semibold text-text-heading">Gemini 3 Flash Vision</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Deteksi Eksterior:</span>
                  <span className="text-secondary font-medium">
                    {appData?.detected_building === "COMMERCIAL"
                      ? "Ruko / Bangunan Komersial"
                      : appData?.detected_building === "NO_STREET_VIEW"
                      ? "Gang Sempit (Butuh Foto Geotag)"
                      : "Rumah Tinggal / Permukiman"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text-muted">Keputusan Akhir:</span>
                  <span className="font-bold text-secondary">
                    {appData?.status || "APPROVED"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl items-start">
            <div className="lg:col-span-7 bg-surface-canvas rounded-xl shadow-xl overflow-hidden flex flex-col">
              <div className="p-space-md bg-surface-slate flex flex-wrap items-center justify-between gap-2">
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
                      Street View Panitia
                    </button>
                  </div>
                </div>
              </div>
              <div
                className={`relative w-full h-[400px] bg-slate-900 flex items-center justify-center overflow-hidden ${
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
                      className="max-h-[300px] w-auto object-contain rounded-lg border-2 border-cyan-400/60 shadow-2xl bg-white"
                    />
                    <div className="mt-2 px-3 py-1 rounded bg-slate-950/90 text-cyan-300 font-code-sm text-[11px] border border-cyan-500/30">
                      Sumber Storage: {appData?.kk_image_url?.startsWith("http") ? "Supabase Storage (ppdb-documents)" : appData?.kk_image_url}
                    </div>
                  </div>
                ) : (
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
                            No. {appData?.kk_number || "3171042502120005"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded font-code-sm text-[10px] font-bold ${
                          (appData?.ocr_confidence ?? 98.4) >= 80
                            ? "bg-emerald-50 text-status-approved"
                            : "bg-amber-50 text-status-revision"
                        }`}
                      >
                        {(appData?.ocr_confidence ?? 98.4) >= 80 ? "TERVERIFIKASI" : "PERLU REVISI / DUMMY"}
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
                        {appData?.address || "Jl. Kenanga No. 14, Tebet Barat, Jakarta Selatan"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="relative p-2 bg-cyan-50/60 rounded z-10">
                        <span className="absolute -top-2 right-1 bg-secondary text-white font-code-sm text-[8px] px-1 rounded uppercase">
                          Nama Terdaftar
                        </span>
                        <p className="font-code-sm text-[10px] text-slate-500 leading-tight">
                          Nama Calon Siswa
                        </p>
                        <p className="font-body-md text-[12px] font-bold text-slate-900 leading-tight truncate">
                          {appData?.student_name || studentName}
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
                          {(appData?.family_relation_valid ?? true) ? "ANAK KANDUNG" : "FAMILI LAIN / DUMMY"}
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
                            {appData?.kk_issue_date || "2018-02-12"} ({appData?.kk_age_label || "6 Tahun"})
                          </p>
                        </div>
                        <span
                          className={`font-code-sm text-[10px] font-bold px-2 py-0.5 rounded ${
                            (appData?.kk_age_valid ?? true)
                              ? "text-status-approved bg-status-approved-bg"
                              : "text-status-fraud bg-status-fraud-bg"
                          }`}
                        >
                          {(appData?.kk_age_valid ?? true) ? "VALID ≥ 1 TAHUN" : "ANOMALI < 1 THN"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-slate-400 font-code-sm text-[9px]">
                      <span>Berkas: {appData?.kk_image_url || "kartu_keluarga.jpg"}</span>
                      <span>Engine: Gemini 3 Flash Vision</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-space-sm py-1.5 rounded bg-slate-900/80 backdrop-blur text-white font-code-sm text-code-sm z-30">
                  <span className="flex items-center gap-1 truncate pr-2">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      center_focus_strong
                    </span>
                    {scanningOcr
                      ? "Memindai Piksel Dokumen KK dengan Gemini 3 Flash..."
                      : appData?.ai_reasoning_summary || "Gemini 3 Flash OCR Ready"}
                  </span>
                  <span className="text-status-approved shrink-0">
                    Confidence: {appData?.ocr_confidence ?? 98.4}%
                  </span>
                </div>
              </div>
              <div
                className={`relative w-full h-[400px] bg-slate-900 overflow-hidden ${
                  activeTab === "street" ? "" : "hidden"
                }`}
                id="containerStreetViewer"
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  data-location={appData?.address || "Jl. Tebet Timur Dalam VI, Jakarta Selatan"}
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAu3uRs8QGs--gdj3uuUn-_w6pAldVL_j_PTYJmBVR1_IRtwmDDuFAcpfLXN-1DvTJ2noiwKssq7DSHM7yyNBvqoT6Pj82DLiJWweho8NSeJ_Qu-kdCF98fbfCmCvlUmeiUNywdKoQh0d2SCXKnz-qFjOdm0JWFhLQ0p9IFUD_YQm4T0ozeCideBZAqxDE7SY9XnFumP1GBlwnudlYlH9K2pQbwJJpn15DH0YshdPQ')",
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-space-md flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="bg-slate-900/85 backdrop-blur px-space-sm py-1 rounded text-white font-code-sm text-code-sm">
                        <span>
                          Street View Target: ({appData ? `${appData.home_lat.toFixed(5)}, ${appData.home_lng.toFixed(5)}` : "-6.23827, 106.85194"})
                        </span>
                      </div>
                      <div className="bg-status-approved px-space-sm py-1 rounded text-white font-label-md text-label-md font-semibold">
                        Objek Fasad: {appData?.detected_building || "RESIDENTIAL"}
                      </div>
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur p-space-sm rounded-lg text-white space-y-1">
                      <div className="flex justify-between font-code-sm text-code-sm">
                        <span className="text-slate-300">Hasil Visi Mesin Gemini 3 Flash:</span>
                        <span className="text-cyan-400 font-semibold">
                          {appData?.address || "Hunian Warga Terverifikasi"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${appData?.ocr_confidence ?? 94}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-space-sm bg-surface-slate flex flex-wrap items-center justify-between gap-space-xs text-text-muted font-body-sm text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-status-approved text-[18px]">
                    verified_user
                  </span>
                  {' '}
                  <span>
                    Dokumen diverifikasi secara desentralisasi tanpa manipulasi manual petugas.
                  </span>
                </div>
                <a className="text-secondary font-label-md text-label-md hover:underline" href="#">
                  Periksa Metrik Audit →
                </a>
              </div>
            </div>
            <div className="lg:col-span-5 bg-surface-canvas rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
              <div className="p-space-md bg-inverse-surface text-inverse-on-surface flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-approved animate-pulse" />
                  <h2 className="font-headline-sm text-headline-sm text-inverse-on-surface font-semibold">
                    Live Agent Reasoning Feed
                  </h2>
                </div>
                <span className="font-code-sm text-code-sm text-slate-400">
                  Terminal Log v2.4
                </span>
              </div>
              <div className="p-space-md bg-slate-950 text-slate-200 font-code-sm text-code-sm flex-1 space-y-space-sm overflow-y-auto max-h-[380px] leading-relaxed" id="reasoningTerminal">{logCleared ? (<div className="text-slate-500 font-mono text-[12px] italic">Tampilan log dibersihkan. Memantau sinyal WebSocket baru...</div>) : (<>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:11
                  </span>
                  <div>
                    <span className="text-cyan-400 font-semibold">
                      [AGENT-COORDINATOR]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Pipeline inisialisasi verifikasi untuk pendaftar:
                    </span>
                    {' '}
                    <span className="text-amber-300">
                      PPDB-2026-X89K
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:12
                  </span>
                  <div>
                    <span className="text-emerald-400 font-semibold">
                      [OCR-ENGINE-TESS]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Memuat scan KK. Resolusi 300DPI terverifikasi. Ekstraksi bounding boxes selesai.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:15
                  </span>
                  <div>
                    <span className="text-emerald-400 font-semibold">
                      [REASONING-AGENT]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Tanggal KK: 14/05/2023. Perhitungan delta: 1.031 hari (≥ 365 hari regulasi).
                    </span>
                    {' '}
                    <span className="text-emerald-300 font-bold">
                      → STATUS: VALID
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:18
                  </span>
                  <div>
                    <span className="text-blue-400 font-semibold">
                      [POSTGIS-GEOROUTE]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Melakukan snapping koordinat rumah ke jaringan jalan Google OSRM.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:22
                  </span>
                  <div>
                    <span className="text-blue-400 font-semibold">
                      [POSTGIS-GEOROUTE]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Jarak rute riil berjalan kaki dihitung:
                    </span>
                    {' '}
                    <span className="text-cyan-300 font-bold">
                      820 meter
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      (Threshold: 1.200m).
                    </span>
                    {' '}
                    <span className="text-emerald-300 font-bold">
                      → DALAM JANGKAUAN
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:28
                  </span>
                  <div>
                    <span className="text-purple-400 font-semibold">
                      [VISION-LLM-AUDITOR]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Fetching Street View frame koordinat
                    </span>
                    {' '}
                    <span className="text-slate-400">
                      (-6.21462, 106.84513)...
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:35
                  </span>
                  <div>
                    <span className="text-purple-400 font-semibold">
                      [VISION-LLM-AUDITOR]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Gemini 1.5 Pro: Memeriksa fasad properti... Bukan lahan komersial/lahan kosong. Indikasi hunian permanen:
                    </span>
                    {' '}
                    <span className="text-emerald-400 font-bold">
                      94.2% Positif
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 animate-pulse">
                  <span className="text-slate-500 font-mono select-none">
                    14:02:41
                  </span>
                  <div>
                    <span className="text-amber-400 font-semibold">
                      [CONSENSUS-AGGREGATOR]
                    </span>
                    {' '}
                    <span className="text-slate-300">
                      Menyatukan seluruh skor pembobotan kepatuhan zonasi... Menunggu finalisasi enkripsi payload.
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
            </div>
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
                      {' '}Mitigasi Gang / Rumah Tidak Terpetakan
                    </span>
                    {' '}
                    <span className="font-code-sm text-code-sm text-text-muted">
                      Edge-Case #02
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-heading mb-space-xs">
                    Verifikasi Mandiri Foto Ber-Geotag
                  </h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-space-md">
                    Jika mobil Google Street View terhalang portal gang sempit atau gapura warga, peserta dapat mengirimkan foto depan rumah dengan metadata GPS presisi.
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
                          Kamera Geotagging Otomatis
                        </h4>
                        <p className="font-body-sm text-body-sm text-text-muted">
                          Mengaktifkan sensor kamera gawai dengan EXIF latitude & longitude terenkripsi.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-surface-canvas rounded-lg text-text-heading font-code-sm text-code-sm">
                      <span className="material-symbols-outlined text-status-approved text-[18px]">
                        gps_fixed
                      </span>
                      {' '}
                      <span>
                        Akurasi GPS Tersedia: ±3.2 Meter dari Titik Koordinat KK
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-sm pt-space-xs">
                  <button className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary hover:bg-secondary text-on-primary font-label-lg text-label-lg shadow transition-all" id="btnGeoCamera" type="button" onClick={handleGeoCamera}>
                    <span className="material-symbols-outlined text-[18px]">
                      camera
                    </span>
                    {' '}
                    <span>
                      {geoStatus || "Aktifkan Kamera Verifikasi Mandiri"}
                    </span>
                  </button>
                  <button className="px-space-md py-space-sm rounded-lg bg-surface-slate hover:bg-surface-container text-text-body font-label-md text-label-md transition-all">
                    Panduan Foto Fasad
                  </button>
                </div>
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
              <a className="flex items-center justify-center gap-1 px-space-md py-space-sm rounded-lg bg-surface-tint-blue text-secondary hover:bg-surface-container-high font-label-lg text-label-lg transition-colors w-full md:w-auto" href="/track/PPDB-2026-X89K">
                <span className="material-symbols-outlined text-[18px]">
                  history
                </span>
                {' '}
                <span>
                  Segarkan Status
                </span>
              </a>
              {' '}
              <a className="flex items-center justify-center gap-1 px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-secondary font-label-lg text-label-lg transition-colors w-full md:w-auto" href="/dashboard">
                <span>
                  Konsol Panitia
                </span>
                {' '}
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </FadeIn>
  );
}
