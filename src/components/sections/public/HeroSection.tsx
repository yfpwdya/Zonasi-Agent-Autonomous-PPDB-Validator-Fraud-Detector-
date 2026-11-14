"use client";
import Link from "next/link";
import type { ApplicationRecord } from "@/types";

interface Props {
  apps: ApplicationRecord[];
  approvedCount: number;
  revisionCount: number;
  rejectedCount: number;
  onDownloadSOP: () => void;
}

/** Seksi 1 — Hero split-layout (navy + geometri + statistik live) */
export function HeroSection({ apps, approvedCount, revisionCount, rejectedCount, onDownloadSOP }: Props) {
  return (
    <section
      id="beranda"
      data-gsap="home-section"
      className="relative overflow-hidden bg-[#1E3A8A] text-white border-b-4 border-[#F59E0B]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, #1E3A8A 0%, #172554 100%)",
        backgroundSize: "24px 24px, 100% 100%",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
              <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                Zonasi-Agent • Sistem Verifikasi &amp; Audit Panitia PPDB Aktif
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.18]">
              Sistem Verifikasi Berkas &amp;{" "}
              <span className="text-[#F59E0B]">Deteksi Kecurangan</span> Zonasi PPDB Otomatis
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed max-w-2xl">
              Alat bantu resmi bagi <strong>Panitia Verifikator PPDB</strong> untuk memindai Kartu
              Keluarga (KK), memvalidasi usia masuk SMA (<strong>15–17 tahun</strong>), menghitung
              jarak rute jalan darat secara presisi, serta mendeteksi indikasi <em>titip KK</em> di
              wilayah zonasi <strong>SMA Negeri 12 Surabaya (Radius 1.200 m)</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <a
                href="#scanner-kk"
                className="px-6 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                <span>Mulai Pindai &amp; Audit KK</span>
              </a>
              <Link
                href="/dashboard"
                className="px-5 py-3.5 rounded-xl border-2 border-white/80 hover:bg-white hover:text-[#1E3A8A] text-white font-bold text-sm sm:text-base transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                <span>Buka Dashboard Panitia</span>
              </Link>
              <button
                type="button"
                onClick={onDownloadSOP}
                className="px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                <span>Unduh SOP Audit</span>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-white/15 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">bolt</span>
                <span className="text-white/90 font-medium">Pemindaian KK Otomatis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">route</span>
                <span className="text-white/90 font-medium">Peta &amp; Jarak Rute Jalan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">gpp_maybe</span>
                <span className="text-white/90 font-medium">Deteksi Titip KK &amp; Usia</span>
              </div>
            </div>
          </div>

          {/* Right: Panel Pemantauan Live */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-white/10 border border-white/20 p-5 sm:p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">radar</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Panel Pemantauan Zonasi-Agent
                    </div>
                    <div className="text-[11px] text-white/75">
                      Sekolah Tujuan: SMAN 12 Surabaya (Radius Zonasi 1.200 m)
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#16A34A] text-white text-[10px] font-extrabold uppercase tracking-wider">
                  AKTIF
                </span>
              </div>

              <div className="my-4 rounded-xl bg-[#0F172A]/80 border border-white/15 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">person_check</span>
                    Seleksi Usia Calon Siswa SMA
                  </span>
                  <span className="font-code-sm text-xs font-bold text-[#4ADE80]">15 – 17 Tahun (Otomatis)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">straighten</span>
                    Batas Radius Zonasi Sekolah
                  </span>
                  <span className="font-code-sm text-xs font-bold text-white">≤ 1.200 Meter (Rute Jalan)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">history_edu</span>
                    Syarat Masa Terbit KK
                  </span>
                  <span className="font-code-sm text-xs font-bold text-[#F59E0B]">≥ 1 Tahun / SKPWNI Sah</span>
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white/5">
                    <div className="text-[10px] text-white/70 uppercase font-bold">Disetujui</div>
                    <div className="text-base font-extrabold text-[#4ADE80]">{approvedCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <div className="text-[10px] text-white/70 uppercase font-bold">Revisi/SKPWNI</div>
                    <div className="text-base font-extrabold text-[#FBBF24]">{revisionCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <div className="text-[10px] text-white/70 uppercase font-bold">Indikasi Kecurangan</div>
                    <div className="text-base font-extrabold text-[#F87171]">{rejectedCount}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#1E3A8A] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">groups</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">Daya Tampung Sekolah</div>
                    <div className="text-base font-extrabold text-[#1E293B]">Total Kuota: 320 Siswa</div>
                    <div className="text-[11px] text-[#16A34A] font-semibold">{apps.length} Berkas Telah Diverifikasi</div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFFFFF] text-[#1E293B] p-3.5 shadow-md border-l-4 border-[#F59E0B] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">timer</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">Masa Verifikasi Aktif</div>
                    <div className="text-base font-extrabold text-[#1E293B]">Sisa Waktu: 12 Hari</div>
                    <div className="text-[11px] text-[#D97706] font-semibold">
                      {approvedCount} Lulus • {revisionCount} Revisi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
