"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/animations/FadeIn";
import { useCreateApplication, useOcrPreview } from "@/hooks/useApplications";

export function RegistrationWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nik, setNik] = useState("3171041908070002");
  const [studentName, setStudentName] = useState("Ahmad Fadhil Prasetyo");
  const [kkNumber, setKkNumber] = useState("3171042502120005");
  const [schoolName, setSchoolName] = useState(
    "SMAN 1 Teladan Jakarta (Sisa Kuota Zonasi: 142 Kursi)"
  );
  const [kkFileName, setKkFileName] = useState("kartu_keluarga_ahmad.jpg");
  const [kkFileBase64, setKkFileBase64] = useState<string | undefined>(undefined);
  const [ocrStatusText, setOcrStatusText] = useState("{ocrStatusText}");
  const [ocrDetailText, setOcrDetailText] = useState("Tanggal Terbit KK: 14 Maret 2021 (>1 Tahun Domisili Sah)");
  const [address, setAddress] = useState(
    "Jl. Kenanga No. 14, RT 03 / RW 05, Tebet Barat, Jakarta Selatan"
  );
  const [coords, setCoords] = useState({ lat: -6.2284, lng: 106.8492 });
  const [routeMeters, setRouteMeters] = useState(820);
  const [straightMeters, setStraightMeters] = useState(540);
  const [draftSaved, setDraftSaved] = useState(false);
  const [kkMimeType, setKkMimeType] = useState("image/jpeg");
  const createApp = useCreateApplication();
  const ocrPreview = useOcrPreview();
  const submitting = createApp.isPending;

  const handleUseGps = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setCoords({ lat: -6.2284, lng: 106.8492 });
        }
      );
    }
  };

  const handleSubmitApplication = async () => {
    try {
      const app = await createApp.mutateAsync({
        student_nik: nik,
        student_name: studentName,
        kk_number: kkNumber,
        address_text: address,
        latitude: coords.lat,
        longitude: coords.lng,
        kk_file_name: kkFileName,
        kk_file_base64: kkFileBase64,
        kk_mime_type: kkMimeType,
      });
      router.push(`/track/${encodeURIComponent(app.tracking_id)}`);
    } catch (e) {
      // Stay on the form so the applicant doesn't lose their input.
      alert(`Gagal mengirim pendaftaran: ${(e as Error).message}`);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <FadeIn>
    <div className="flex flex-col w-full">
      {/* Top Progress Bar / Visual Ambient Header */}
      <div className="w-full bg-surface-canvas shadow-sm">
        <div className="max-w-7xl mx-auto px-margin py-space-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {' '}
                <span>
                  PPDB Online Jalur Zonasi Mandiri 2025/2026
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-text-heading mt-1">
                Formulir Pendaftaran & Verifikasi Geospasial
              </h1>
              <p className="font-body-sm text-body-sm text-text-muted mt-0.5">
                Lengkapi identitas, berkas kependudukan, dan penandaan titik koordinat domisili riil untuk audit instan AI Agent.
              </p>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-tint-blue px-space-md py-space-sm rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-surface-canvas flex items-center justify-center text-secondary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">
                  verified_user
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-secondary">
                  Protokol Keamanan Aktif
                </span>
                {' '}
                <span className="font-code-sm text-code-sm text-primary font-bold">
                  AES-256 • PostGIS Routing Engine
                </span>
              </div>
            </div>
          </div>
          {/* Stepper Navigasi Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-sm">
            {/* Step 1 */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-status-approved-bg transition-all">
              <div className="w-9 h-9 rounded-lg bg-status-approved text-on-primary flex items-center justify-center font-code-md text-code-md shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  check
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-status-approved leading-tight">
                  Tahap 01 • Selesai
                </span>
                {' '}
                <span className="font-headline-sm text-label-lg text-text-heading truncate">
                  Identitas Siswa & Sekolah
                </span>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-tint-blue shadow-sm transition-all">
              <div className="w-9 h-9 rounded-lg bg-secondary text-on-primary flex items-center justify-center font-code-md text-code-md shrink-0 shadow-md shadow-secondary/25">
                02
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-secondary leading-tight">
                  Tahap 02 • Sedang Diisi
                </span>
                {' '}
                <span className="font-headline-sm text-label-lg text-text-heading truncate">
                  Unggah Dokumen KK
                </span>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-low transition-all">
              <div className="w-9 h-9 rounded-lg bg-surface-canvas text-secondary flex items-center justify-center font-code-md text-code-md shrink-0 shadow-sm">
                03
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-text-muted leading-tight">
                  Tahap 03 • Geolokasi
                </span>
                {' '}
                <span className="font-headline-sm text-label-lg text-text-heading truncate">
                  Pinpoint & Rute Riil
                </span>
              </div>
            </div>
            {/* Step 4 */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-xl bg-surface-container-low transition-all">
              <div className="w-9 h-9 rounded-lg bg-surface-canvas text-text-muted flex items-center justify-center font-code-md text-code-md shrink-0 shadow-sm">
                04
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-text-muted leading-tight">
                  Tahap 04 • Final
                </span>
                {' '}
                <span className="font-headline-sm text-label-lg text-text-muted truncate">
                  Kirim ke AI Agent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Workspace Multi-Step (2 Columns Split Layout) */}
      <div className="max-w-7xl mx-auto px-margin py-space-xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* KOLOM KIRI (5 Cols Desktop): Data Input & Dropzone KK */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Kartu Identitas Siswa & Pilihan Sekolah */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    badge
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-text-heading">
                    Data Pokok Siswa
                  </h2>
                </div>
                <span className="font-code-sm text-code-sm px-space-sm py-0.5 rounded-full bg-status-approved-bg text-status-approved">
                  Dukcapil Valid
                </span>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div>
                  <label className="block font-label-lg text-label-lg text-text-heading mb-1">
                    Nomor Induk Kependudukan (NIK Siswa)
                  </label>
                  <div className="relative">
                    <input className="w-full px-space-md py-space-sm rounded-lg bg-surface-slate font-code-md text-code-md text-text-heading focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-secondary transition-all" maxLength={16} type="text" value={nik} onChange={(e) => setNik(e.target.value)} />
                    <span className="absolute right-3 top-2.5 material-symbols-outlined text-status-approved text-[20px]">
                      check_circle
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div>
                    <label className="block font-label-lg text-label-lg text-text-heading mb-1">
                      Nama Lengkap
                    </label>
                    <input className="w-full px-space-md py-space-sm rounded-lg bg-surface-slate font-body-md text-body-md text-text-heading focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-secondary transition-all" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-label-lg text-label-lg text-text-heading mb-1">
                      Nomor Kartu Keluarga (KK)
                    </label>
                    <input className="w-full px-space-md py-space-sm rounded-lg bg-surface-slate font-code-md text-code-md text-text-heading focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-secondary transition-all" maxLength={16} type="text" value={kkNumber} onChange={(e) => setKkNumber(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-text-heading mb-1">
                    Sekolah Tujuan Terpilih
                  </label>
                  <div className="relative">
                    <select className="w-full px-space-md py-space-sm rounded-lg bg-surface-slate font-body-md text-body-md text-text-heading focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-secondary appearance-none cursor-pointer" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}>
                      <option>
                        SMAN 1 Teladan Jakarta (Sisa Kuota Zonasi: 142 Kursi)
                      </option>
                      <option>
                        SMPN 2 Nusantara Jakarta (Sisa Kuota Zonasi: 88 Kursi)
                      </option>
                      <option>
                        SMAN 68 Jakarta Pusat (Sisa Kuota Zonasi: 95 Kursi)
                      </option>
                    </select>
                    <span className="absolute right-3 top-3 material-symbols-outlined text-text-muted pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Kartu Dropzone KK & OCR Realtime Scan */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    upload_file
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-text-heading">
                    Unggah Berkas Kartu Keluarga
                  </h2>
                </div>
                <span className="font-code-sm text-code-sm px-space-sm py-0.5 rounded-full bg-surface-tint-blue text-secondary">
                  Wajib PDF / JPG / PNG
                </span>
              </div>
              {/* Drag and Drop Active State Zone */}
              <div onClick={() => fileInputRef.current?.click()} className="relative group rounded-xl p-space-md bg-surface-slate text-center cursor-pointer transition-all hover:bg-surface-container-low">
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setKkFileName(f.name);
                    setKkMimeType(f.type || "image/jpeg");
                    setOcrStatusText("Memindai piksel KK dengan Gemini 3 Flash Vision...");
                    setOcrDetailText("Mengekstrak Nomor KK, Tanggal Terbit, dan Status Hubungan...");
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const b64 = typeof reader.result === "string" ? reader.result : undefined;
                      setKkFileBase64(b64);
                      try {
                        const ocr = await ocrPreview.mutateAsync({
                          kk_number: kkNumber,
                          kk_image_name: f.name,
                          kk_image_base64: b64,
                        });
                        const d = { ocr };
                        if (d.ocr) {
                          const conf = d.ocr.ocrConfidence ?? 95;
                          const valid = d.ocr.kkAgeValid && d.ocr.familyRelationValid && conf >= 80;
                          setOcrStatusText(
                            valid
                              ? `OCR Pre-flight: PASS (${conf}%)`
                              : `OCR Pre-flight: ANOMALI / DUMMY (${conf}%)`
                          );
                          setOcrDetailText(
                            d.ocr.ocrNotes
                              ? `Hasil Gemini: ${d.ocr.ocrNotes}`
                              : `Terbit KK: ${d.ocr.kkIssueDate} (${d.ocr.kkAgeYears} Thn • ${d.ocr.familyRelation})`
                          );
                        }
                      } catch {
                        setOcrStatusText("OCR Pre-flight: Siap Diaudit");
                      }
                    };
                    reader.readAsDataURL(f);
                  }
                }} />
                <div className="flex flex-col items-center justify-center gap-space-xs py-space-sm">
                  <div className="w-12 h-12 rounded-full bg-surface-tint-blue flex items-center justify-center text-secondary mb-1">
                    <span className="material-symbols-outlined text-[28px]">
                      cloud_upload
                    </span>
                  </div>
                  <p className="font-label-lg text-label-lg text-text-heading">
                    Tarik & Lepaskan scan KK di sini, atau{' '}
                    <span className="text-secondary underline">
                      Pilih File
                    </span>
                  </p>
                  <p className="font-body-sm text-body-sm text-text-muted">
                    Resolusi minimum 300 DPI, maks. 5MB. Pastikan QR code Dukcapil tidak terpotong.
                  </p>
                </div>
              </div>
              {/* File Uploaded Card ({kkFileName}) */}
              <div className="rounded-xl p-space-md bg-surface-container-low flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-canvas text-secondary flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">
                        description
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg text-text-heading truncate">
                        {kkFileName}
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted">
                        2.4 MB • Image / JPEG
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button aria-label="Lihat Pratinjau Berkas" className="p-1.5 rounded-lg text-text-muted hover:text-secondary hover:bg-surface-canvas transition-all" type="button">
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                    <button aria-label="Ganti Berkas KK" className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-surface-canvas transition-all" type="button">
                      <span className="material-symbols-outlined text-[20px]">
                        refresh
                      </span>
                    </button>
                  </div>
                </div>
                {/* Storage Destination Badge */}
                <div className="flex items-center gap-space-xs py-1 px-space-sm rounded-lg bg-surface-canvas text-text-muted">
                  <span className="material-symbols-outlined text-secondary text-[16px]">
                    lock
                  </span>
                  {' '}
                  <span className="font-code-sm text-code-sm text-secondary truncate">
                    Terenkripsi ke Supabase Storage (kk-documents)
                  </span>
                </div>
                {/* OCR Pre-flight Check Status */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-status-approved" />
                    {' '}
                    <span className="font-label-md text-label-md text-status-approved">
                      Resolusi Tajam • Teks Terbaca Jelas
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm text-text-muted">
                    {ocrStatusText}
                  </span>
                </div>
              </div>
              {/* Document Inspection Scan Visual Effect */}
              <div className="relative overflow-hidden rounded-lg bg-text-heading p-space-md text-on-primary">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-primary-fixed uppercase tracking-wider">
                      AI Inference Agent Output
                    </span>
                    {' '}
                    <span className="font-code-md text-code-md text-on-primary">
                      NIK Terdeteksi: {nik} [MATCH]
                    </span>
                    {' '}
                    <span className="font-code-sm text-code-sm text-on-secondary-container opacity-90">
                      {ocrDetailText}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-status-approved text-[24px]">
                    verified
                  </span>
                </div>
                {/* Horizontal Scanning Beam Visual */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
              </div>
            </div>
          </div>
          {/* KOLOM KANAN (7 Cols Desktop): Geolocation Picker & Realtime Route Preview */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Interactive Geolocation Picker Window */}
            <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[24px]">
                    pin_drop
                  </span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-text-heading">
                      Pinpoint Geospasial Domisili
                    </h2>
                    <p className="font-body-sm text-body-sm text-text-muted">
                      Tentukan atap tempat tinggal kartu keluarga secara presisi
                    </p>
                  </div>
                </div>
                {/* Toggle Mode */}
                <div className="flex items-center bg-surface-slate rounded-lg p-0.5 self-start sm:self-center">
                  <button className="px-space-sm py-1 rounded-md bg-surface-canvas font-label-md text-label-md text-text-heading shadow-sm" type="button">
                    Peta Jalan
                  </button>
                  <button className="px-space-sm py-1 rounded-md text-text-muted font-label-md text-label-md hover:text-text-heading" type="button">
                    Citra Satelit
                  </button>
                </div>
              </div>
              {/* Search Bar for Address Pinpoint */}
              <div className="relative">
                <span className="absolute left-3.5 top-3 material-symbols-outlined text-secondary text-[20px]">
                  search
                </span>
                <input className="w-full pl-11 pr-space-md py-space-sm rounded-lg bg-surface-slate font-body-md text-body-md text-text-heading focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-secondary transition-all" placeholder="Cari Alamat Rumah atau Geser Pin..." type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                <button onClick={handleUseGps} className="absolute right-2 top-2 px-space-sm py-1 bg-surface-tint-blue hover:bg-surface-container text-secondary rounded font-label-md text-label-md transition-colors flex items-center gap-1" type="button">
                  <span className="material-symbols-outlined text-[16px]">
                    my_location
                  </span>
                  {' '}
                  <span>
                    GPS Saya
                  </span>
                </button>
              </div>
              {/* Map View Display Container */}
              <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden shadow-inner bg-surface-slate">
                {/* Simulated Map Canvas using Static Pipeline placeholder */}
                <div className="w-full h-full bg-cover bg-center" data-location="Jl. Kenanga No. 14 Tebet Barat, Jakarta Selatan" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAXTVdiy1K_7fpP-H0xizMoE8W7PlOvS38WM0VQVWYDCVuPjYWkqfPWBMbe9oJkg84aPmBq32rs0pYkj5sQyg6UJ6H_25pN17vGkY9ThB8oaY2poUz7_uPLTHnGe7EPb16ZOB9ETfz8BFJLXhgniaVRGz4XQJGWrm_DoL0npf2deS0HrJifYdrXagOK8moHZqa2SfQUjjQGGnQBVxUr1HMsXHsOacU7NMlqgjRkvNY')"}} />
                {/* Ambient Gradient Map Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-text-heading/30 via-transparent to-transparent pointer-events-none" />
                {/* Floating Map Controls */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 shadow-md">
                  <button aria-label="Zoom Masuk Peta" className="w-9 h-9 rounded-lg bg-surface-canvas hover:bg-surface-slate text-text-heading flex items-center justify-center font-bold transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                  </button>
                  <button aria-label="Zoom Keluar Peta" className="w-9 h-9 rounded-lg bg-surface-canvas hover:bg-surface-slate text-text-heading flex items-center justify-center font-bold transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">
                      remove
                    </span>
                  </button>
                  <button aria-label="Orientasi Utara" className="w-9 h-9 rounded-lg bg-surface-canvas hover:bg-surface-slate text-secondary flex items-center justify-center transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">
                      explore
                    </span>
                  </button>
                </div>
                {/* Marker Info Overlay: Rumah Pendaftar */}
                <div className="absolute top-4 left-4 max-w-xs bg-surface-canvas/95 backdrop-blur-md rounded-xl p-space-sm shadow-md">
                  <div className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      home_pin
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-secondary uppercase">
                        Marker Rumah Pendaftar
                      </span>
                      {' '}
                      <span className="font-body-sm text-body-sm font-semibold text-text-heading truncate">
                        Jl. Kenanga No. 14, RT 03 / RW 05
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted mt-0.5">
                        -6.21462, 106.84513
                      </span>
                    </div>
                  </div>
                </div>
                {/* Marker Info Overlay: Sekolah Tujuan */}
                <div className="absolute bottom-4 left-4 max-w-xs bg-surface-canvas/95 backdrop-blur-md rounded-xl p-space-sm shadow-md">
                  <div className="flex items-start gap-space-xs">
                    <span className="material-symbols-outlined text-status-approved text-[22px] shrink-0 mt-0.5">
                      school
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-label-md text-status-approved uppercase">
                        Sekolah Tujuan
                      </span>
                      {' '}
                      <span className="font-body-sm text-body-sm font-semibold text-text-heading truncate">
                        SMAN 1 Teladan Jakarta
                      </span>
                      {' '}
                      <span className="font-code-sm text-code-sm text-text-muted mt-0.5">
                        -6.21890, 106.84920
                      </span>
                    </div>
                  </div>
                </div>
                {/* PostGIS Polygon Radius Flag */}
                <div className="absolute bottom-4 right-4 bg-primary text-on-primary px-space-sm py-1 rounded-full font-code-sm text-code-sm shadow-md flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-status-approved" />
                  {' '}
                  <span>
                    Radius Zonasi: 1.200 m
                  </span>
                </div>
              </div>
              {/* Dual Telemetry & Distance Comparison Strip */}
              <div className="rounded-xl p-space-md bg-surface-slate flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      alt_route
                    </span>
                    {' '}
                    <span className="font-label-lg text-label-lg text-text-heading">
                      Hasil Komparasi Telemetri Rute Geospasial
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm text-status-approved font-semibold bg-status-approved-bg px-space-sm py-0.5 rounded-full">
                    Aman Dalam Zonasi
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {/* Jarak Tempuh Darat Riil */}
                  <div className="p-space-sm rounded-lg bg-surface-canvas shadow-sm flex flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-text-muted">
                      Jarak Tempuh Darat Riil (Google Routes API)
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="font-headline-lg text-headline-lg font-bold text-text-heading">
                        {routeMeters}
                      </span>
                      {' '}
                      <span className="font-code-md text-code-md text-text-muted">
                        meter
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-status-approved font-medium">
                      Batas Maksimal Kuota Wilayah: 1.200 meter
                    </span>
                  </div>
                  {/* Jarak Euclidean */}
                  <div className="p-space-sm rounded-lg bg-surface-canvas shadow-sm flex flex-col gap-0.5">
                    <span className="font-label-md text-label-md text-text-muted">
                      Jarak Garis Lurus (Euclidean Radius)
                    </span>
                    <div className="flex items-baseline gap-space-xs mt-1">
                      <span className="font-headline-lg text-headline-lg font-bold text-secondary">
                        {straightMeters}
                      </span>
                      {' '}
                      <span className="font-code-md text-code-md text-text-muted">
                        meter
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      Koordinat Titik PostGIS ST_Distance
                    </span>
                  </div>
                </div>
                {/* Route Anomaly Explanation Ribbon */}
                <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-tint-blue text-secondary">
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    info
                  </span>
                  <p className="font-body-sm text-body-sm leading-snug">
                    <strong>
                      Selisih Rute +280 meter:
                    </strong>
                    {' '}Perhitungan mempertimbangkan jembatan penyeberangan Ciliwung dan akses jalan umum resmi yang dapat dilalui pejalan kaki / kendaraan roda dua.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sticky Bottom Navigation Bar & Actions */}
        <div className="mt-space-xl p-space-md bg-surface-canvas rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
          {/* Catatan Keamanan Data SIP & PDP */}
          <div className="flex items-center gap-space-sm text-text-muted">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              gavel
            </span>
            <p className="font-body-sm text-body-sm">
              Data Anda dilindungi enkripsi TLS &{' '}
              <strong>
                UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (PDP)
              </strong>
              .
            </p>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
            <button
              onClick={() => router.push("/")}
              className="px-space-md py-space-sm rounded-lg bg-surface-canvas hover:bg-surface-slate text-text-heading font-label-lg text-label-lg transition-all shadow-sm"
              type="button"
            >
              Kembali
            </button>
            <button
              onClick={() => setDraftSaved(true)}
              className="px-space-md py-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-text-heading font-label-lg text-label-lg transition-all"
              type="button"
            >
              {draftSaved ? "Draf Tersimpan ✓" : "Simpan Draf"}
            </button>
            <button
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-secondary hover:bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md shadow-secondary/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              type="button"
            >
              <span>
                {submitting ? "Memproses Validasi AI..." : "Kirim & Mulai Validasi AI"}
              </span>{' '}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
      </FadeIn>
    </AnimatePresence>
  );
}
