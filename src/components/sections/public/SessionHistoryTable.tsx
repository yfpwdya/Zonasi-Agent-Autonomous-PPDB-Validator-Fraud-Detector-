"use client";
import Link from "next/link";
import type { ApplicationRecord } from "@/types";

// ponytail: sensor NIK & KK — privasi sesi publik
function maskSensitiveNumber(val?: string) {
  if (!val) return "-";
  const clean = String(val).trim();
  if (clean.length <= 8) return clean;
  return `${clean.slice(0, 6)}******${clean.slice(-4)}`;
}

interface Props {
  myApps: ApplicationRecord[];
  filtered: ApplicationRecord[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

/** Seksi 6 — Tabel riwayat verifikasi sesi user (terisolasi, NIK disensor) */
export function SessionHistoryTable({ myApps, filtered, isLoading, searchQuery, onSearchChange }: Props) {
  return (
    <section
      id="riwayat-sesi"
      data-gsap="home-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
    >
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#1E293B]">
                Riwayat Pendaftaran &amp; Verifikasi KK Sesi Anda
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-code-sm text-[11px] font-bold">
                Privasi Terlindungi • NIK/KK Disensor
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Hanya menampilkan berkas Kartu Keluarga yang Anda pindai pada sesi perangkat ini (
              {myApps.length} berkas). Seluruh antrean global dikelola di Dashboard Panitia.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined text-[18px] text-[#475569] absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter nama atau nomor berkas..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#CBD5E1] text-xs text-[#1E293B] focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white font-code-sm text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Pendaftaran</th>
                <th className="py-3.5 px-4">Nama Calon Siswa</th>
                <th className="py-3.5 px-4">NIK &amp; No. KK (Disensor)</th>
                <th className="py-3.5 px-4">Jarak Rute Jalan</th>
                <th className="py-3.5 px-4">Usia KK &amp; Bangunan</th>
                <th className="py-3.5 px-4">Status Verifikasi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#475569]">
                    Memuat status verifikasi berkas Anda...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#475569] text-xs sm:text-sm">
                    Belum ada berkas KK yang Anda pindai pada sesi browser ini. Silakan unggah
                    Kartu Keluarga pada panel{" "}
                    <a href="#scanner-kk" className="text-[#1E3A8A] font-bold underline">
                      Pemindai KK
                    </a>{" "}
                    di atas atau gunakan{" "}
                    <a href="#cek-status-cepat" className="text-[#1E3A8A] font-bold underline">
                      Widget Lacak Berkas Cepat
                    </a>
                    .
                  </td>
                </tr>
              )}
              {filtered.map((app) => (
                <tr key={app.tracking_id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-code-sm text-xs font-bold text-[#1E3A8A]">
                    #{app.tracking_id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1E293B]">{app.student_name}</td>
                  <td className="py-3.5 px-4 font-code-sm text-xs text-[#475569]">
                    <div>NIK: {maskSensitiveNumber(app.student_nik)}</div>
                    <div className="text-[11px] opacity-80">KK: {maskSensitiveNumber(app.kk_number)}</div>
                  </td>
                  <td className="py-3.5 px-4 font-code-sm text-xs font-bold text-[#1E293B]">
                    {app.real_route_distance_meters} m
                  </td>
                  <td className="py-3.5 px-4 font-code-sm text-xs text-[#475569]">
                    {app.kk_age_label} • {app.detected_building}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-code-sm text-xs font-bold inline-flex items-center gap-1 ${
                        app.status === "REJECTED"
                          ? "bg-[#FEE2E2] text-[#DC2626]"
                          : app.status === "APPROVED"
                          ? "bg-[#DCFCE7] text-[#16A34A]"
                          : "bg-[#FEF3C7] text-[#D97706]"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {app.status === "APPROVED"
                        ? "TERVERIFIKASI / LULUS"
                        : app.status === "REJECTED"
                        ? "DITOLAK / ANOMALI"
                        : "MENUNGGU PROSES"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/track/${encodeURIComponent(app.tracking_id)}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs hover:bg-[#172554] transition-all inline-flex items-center gap-1"
                    >
                      <span>Buka Inspeksi</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
