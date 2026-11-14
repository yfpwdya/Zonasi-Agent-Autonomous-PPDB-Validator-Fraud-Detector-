"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useApplications } from "@/hooks/useApplications";

import { HeroSection } from "@/components/sections/public/HeroSection";
import { StatusLookupWidget } from "@/components/sections/public/StatusLookupWidget";
import { VerificationStepsSection } from "@/components/sections/public/VerificationStepsSection";
import { QuotaSection } from "@/components/sections/public/QuotaSection";
import { ScannerSection } from "@/components/sections/public/ScannerSection";
import { SessionHistoryTable } from "@/components/sections/public/SessionHistoryTable";
import { AuditTimelineSection } from "@/components/sections/public/AuditTimelineSection";
import { FaqSection } from "@/components/sections/public/FaqSection";

export default function PublicTrackingPage() {
  const router = useRouter();
  const { data, isLoading } = useApplications();
  const apps = data?.applications ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [statusLookupQuery, setStatusLookupQuery] = useState("");
  const [statusLookupError, setStatusLookupError] = useState("");
  const [myTrackingIds, setMyTrackingIds] = useState<string[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  // GSAP stagger reveal (prefers-reduced-motion safe)
  useEffect(() => {
    if (!mainRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-gsap='home-section']",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out", clearProps: "transform,opacity" },
      );
    }, mainRef);
    return () => ctx.revert();
  }, []);

  // Sinkronisasi tracking_id milik sesi browser saat ini
  useEffect(() => {
    const syncMyIds = () => {
      try {
        const raw = sessionStorage.getItem("zonasi_my_tracking_ids");
        setMyTrackingIds(raw ? JSON.parse(raw) : []);
      } catch {
        setMyTrackingIds([]);
      }
    };
    syncMyIds();
    window.addEventListener("zonasi-session-updated", syncMyIds);
    window.addEventListener("zonasi:my-apps-updated", syncMyIds);
    window.addEventListener("storage", syncMyIds);
    return () => {
      window.removeEventListener("zonasi-session-updated", syncMyIds);
      window.removeEventListener("zonasi:my-apps-updated", syncMyIds);
      window.removeEventListener("storage", syncMyIds);
    };
  }, [apps.length]);

  const myApps = apps.filter((a) => myTrackingIds.includes(a.tracking_id));
  const filtered = myApps.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.tracking_id.toLowerCase().includes(q) ||
      a.student_name.toLowerCase().includes(q) ||
      a.student_nik.toLowerCase().includes(q) ||
      a.kk_number.toLowerCase().includes(q)
    );
  });

  const approvedCount = apps.filter((a) => a.status === "APPROVED").length;
  const revisionCount = apps.filter(
    (a) => a.status === "NEEDS_REVISION" || a.status === "NEEDS_LIVE_PHOTO",
  ).length;
  const rejectedCount = apps.filter((a) => a.status === "REJECTED").length;

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusLookupError("");
    const q = statusLookupQuery.trim();
    if (!q) {
      setStatusLookupError("Masukkan Nomor Berkas (contoh: PPDB-2026-8821) atau 16 digit NIK/KK.");
      return;
    }
    const found = apps.find(
      (a) =>
        a.tracking_id.toLowerCase() === q.toLowerCase() ||
        a.student_nik === q ||
        a.kk_number === q,
    );
    if (found) { router.push(`/track/${encodeURIComponent(found.tracking_id)}`); return; }
    if (q.toUpperCase().startsWith("PPDB-")) { router.push(`/track/${encodeURIComponent(q.toUpperCase())}`); return; }
    setStatusLookupError(`Berkas dengan nomor "${q}" belum ditemukan di antrean. Silakan pindai Kartu Keluarga terlebih dahulu di bawah.`);
  };

  const handleDownloadSOP = () => {
    const content = [
      "DOKUMEN SOP TEKNIS PANITIA — ZONASI-AGENT (SISTEM VERIFIKASI & DETEKSI KECURANGAN PPDB)",
      "=======================================================================================",
      "1. LOKASI SEKOLAH TUJUAN ZONASI:",
      "   - Sekolah Tujuan       : SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Kec. Benowo)",
      "   - Koordinat Sekolah    : -7.2468, 112.6358",
      "   - Radius Zonasi Resmi  : Maksimal 1.200 Meter",
      "",
      "2. PARAMETER VERIFIKASI OTOMATIS:",
      "   - Usia Calon Siswa SMA : 15 s.d. 17 Tahun (otomatis memilih kandidat Anak Kandung yang memenuhi usia)",
      "   - Masa Terbit KK       : Minimal 1 tahun sebelum pendaftaran",
      "   - Hubungan Keluarga    : Anak Kandung (status Famili Lain dengan KK baru ditandai sebagai indikasi titip KK)",
      "   - Validasi Tempat Tinggal: Rumah Tinggal vs Bangunan Komersial/Ruko",
      "",
      "3. PROSEDUR PENANGANAN BERKAS BERSYARAT (PERLU REVISI):",
      "   - Untuk pindah rumah satu keluarga sah (< 1 tahun), unggah SKPWNI Dukcapil / SK Pindah Tugas Orang Tua.",
      "   - Panitia melakukan verifikasi akhir atau keputusan di halaman /dashboard.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "SOP-Panitia-Zonasi-Agent-2026.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main ref={mainRef} className="flex-1 w-full">
      <HeroSection
        apps={apps}
        approvedCount={approvedCount}
        revisionCount={revisionCount}
        rejectedCount={rejectedCount}
        onDownloadSOP={handleDownloadSOP}
      />
      <StatusLookupWidget
        query={statusLookupQuery}
        error={statusLookupError}
        onChange={setStatusLookupQuery}
        onSubmit={handleQuickLookup}
      />
      <VerificationStepsSection />
      <QuotaSection approvedCount={approvedCount} />
      <ScannerSection />
      <SessionHistoryTable
        myApps={myApps}
        filtered={filtered}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <AuditTimelineSection />
      <FaqSection />
    </main>
  );
}
