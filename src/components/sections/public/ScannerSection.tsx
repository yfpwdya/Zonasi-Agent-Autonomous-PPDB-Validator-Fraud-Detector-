"use client";
import { KKScannerPanel } from "@/components/forms/KKScannerPanel";

/** Seksi 5 — Banner aturan KK + KKScannerPanel inti (tidak diubah fungsionalnya) */
export function ScannerSection() {
  return (
    <section
      id="syarat-berkas"
      data-gsap="home-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 space-y-6"
    >
      {/* Banner Parameter */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
              Parameter Validasi &amp; Pemindaian Berkas Kartu Keluarga Otomatis
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
              Unggah dokumen Kartu Keluarga (JPG/PNG) di bawah ini. Sistem Zonasi-Agent otomatis
              memverifikasi <strong>Usia Masuk SMA (15–17 Tahun)</strong>,{" "}
              <strong>Masa Terbit KK (≥ 1 Tahun)</strong>, <strong>Status Anak Kandung</strong>, dan{" "}
              <strong>Jarak Rute Jalan Darat ≤ 1.200 m ke SMA Negeri 12 Surabaya</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#16A34A]">✓ Usia 15–17 Tahun</span>
          <span className="px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">! Pindah Sah &lt;1 Thn Wajib SKPWNI</span>
          <span className="px-3 py-1.5 rounded-lg bg-[#FEE2E2] text-[#DC2626]">✕ Titip KK / Ruko Ditolak</span>
        </div>
      </div>

      {/* Komponen Inti — TIDAK DIUBAH FUNGSINYA */}
      <KKScannerPanel />
    </section>
  );
}
