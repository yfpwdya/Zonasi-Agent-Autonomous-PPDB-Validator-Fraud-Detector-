"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KKScannerPanel } from "@/components/forms/KKScannerPanel";
import { useApplications } from "@/hooks/useApplications";
import { usePanitiaSession } from "@/hooks/useAuth";

export default function HomePage() {
  const panitia = usePanitiaSession();
  const { data } = useApplications();
  const allApps = data?.applications ?? [];
  const [myTrackingIds, setMyTrackingIds] = useState<string[]>([]);

  useEffect(() => {
    const syncMyIds = () => {
      try {
        const raw = window.sessionStorage.getItem("zonasi_my_tracking_ids");
        setMyTrackingIds(raw ? JSON.parse(raw) : []);
      } catch {
        setMyTrackingIds([]);
      }
    };
    syncMyIds();
    window.addEventListener("zonasi:my-apps-updated", syncMyIds);
    return () => window.removeEventListener("zonasi:my-apps-updated", syncMyIds);
  }, []);

  // ponytail: di halaman publik (user), hanya tampilkan berkas yang baru saja dimasukkan oleh user pada sesi ini agar privasi pendaftar lain terjaga. Seluruh berkas lintas user tetap masuk otomatis ke /dashboard panitia.
  const myIdSet = new Set(myTrackingIds.map((id) => id.toUpperCase()));
  const apps = allApps.filter((a) => myIdSet.has(a.tracking_id.toUpperCase()));

  return (
    <div className="max-w-7xl w-full mx-auto px-margin py-space-xl space-y-10 text-text-body">
        {/* Hero Khusus Verifikasi PPDB */}
        <section className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-fixed font-code-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AUTONOMOUS PPDB AUDITOR • SMA NEGERI 12 SURABAYA</span>
            </div>
            <h1 className="font-display-md text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Cukup Upload File Kartu Keluarga — Deteksi Otomatis Anomali, Usia Siswa (15–17 Thn) &amp; Radius Zonasi
            </h1>
            <p className="font-body-md text-sm sm:text-base text-slate-200 leading-relaxed">
              Unggah file <strong>Kartu Keluarga (KK)</strong> Anda; agen AI langsung mengekstrak{" "}
              <strong>Nomor KK, NIK, Nama Anak Usia SMA (15–17 Tahun), Alamat Rumah, Tanggal Terbit KK, dan Status Hubungan Keluarga</strong> dalam 1x proses, menghitung jarak rute ke{" "}
              <strong>SMA Negeri 12 Surabaya</strong>, serta mengirimkan hasil verifikasi secara otomatis ke Dashboard Panitia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            {panitia && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-on-secondary font-label-lg text-sm font-bold shadow-md hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
                <span>Buka Dashboard Panitia</span>
              </Link>
            )}
            <a
              href="#scanner-kk"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-label-lg text-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Langsung Scan File KK di Bawah ↓</span>
            </a>
          </div>
        </section>

        {/* Mesin Utama: Upload File Kartu Keluarga & Deteksi Real-Time */}
        <KKScannerPanel
          onAuditCompleted={(createdApp) => {
            setMyTrackingIds((prev) =>
              Array.from(new Set([createdApp.tracking_id, ...prev])),
            );
          }}
        />

        {/* Daftar Berkas KK Milik User Ini Saja (Privasi Terjaga, Data User Lain Disensor/Disembunyikan) */}
        <section className="bg-surface-canvas rounded-2xl border border-border-slate shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm text-text-heading font-bold">
                  Riwayat Berkas Kartu Keluarga Anda ({apps.length} Berkas)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-status-approved font-code-sm text-[10px] font-bold border border-emerald-200">
                  Privasi Aktif • Hanya Menampilkan Berkas Sesi Anda
                </span>
              </div>
              <p className="font-body-sm text-xs text-text-muted">
                Demi privasi data kependudukan (UU PDP), riwayat di halaman ini hanya menampilkan berkas KK yang Anda unggah sendiri. Seluruh data pendaftar terintegrasi penuh di Dashboard Panitia.
              </p>
            </div>
            <Link
              href={panitia ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 font-label-md text-xs text-secondary font-bold hover:underline"
            >
              <span>Lihat Semua Berkas di Dashboard Panitia →</span>
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-slate bg-surface-slate/50 p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-text-muted text-[32px]">
                lock_person
              </span>
              <p className="font-label-lg text-sm font-bold text-text-heading">
                Belum Ada Berkas Kartu Keluarga yang Anda Unggah di Sesi Ini
              </p>
              <p className="font-body-sm text-xs text-text-muted max-w-md mx-auto">
                Data pendaftar lain disembunyikan demi keamanan NIK &amp; Nomor KK. Silakan unggah file Kartu Keluarga Anda pada panel di atas untuk melihat hasil audit dan riwayat Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-slate text-text-muted font-code-sm text-[11px] uppercase">
                    <th className="py-2.5 px-3">ID Audit</th>
                    <th className="py-2.5 px-3">Nama Anak &amp; NIK (Hasil OCR KK)</th>
                    <th className="py-2.5 px-3">No. KK &amp; Terbit</th>
                    <th className="py-2.5 px-3">Relasi &amp; Skor OCR</th>
                    <th className="py-2.5 px-3">Alamat KK &amp; Jarak</th>
                    <th className="py-2.5 px-3">Keputusan AI</th>
                    <th className="py-2.5 px-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-slate font-body-sm text-xs">
                  {apps.map((a) => (
                    <tr key={a.tracking_id} className="hover:bg-surface-slate/60">
                      <td className="py-3 px-3 font-code-sm font-bold text-secondary">
                        {a.tracking_id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-heading">{a.student_name}</div>
                        <div className="font-code-sm text-[11px] text-text-muted">
                          NIK: {a.student_nik ? `${a.student_nik.slice(0, 6)}******${a.student_nik.slice(-4)}` : "-"}
                        </div>
                        <div
                          className={`font-code-sm text-[11px] font-bold ${
                            (a.student_age_valid ?? true)
                              ? "text-status-approved"
                              : "text-status-fraud"
                          }`}
                        >
                          Lahir: {a.student_birth_date || "-"} ({Math.floor(a.student_age_years ?? 16)} Thn{" "}
                          {(a.student_age_valid ?? true) ? "✓" : "✗ Anomali Usia"})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-code-sm">
                        <div>
                          {a.kk_number ? `${a.kk_number.slice(0, 6)}******${a.kk_number.slice(-4)}` : "-"}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {a.kk_issue_date} ({a.kk_age_label})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-code-sm">
                        <div>{a.family_relation || "ANAK_KANDUNG"}</div>
                        <div className="text-[11px] text-text-muted">
                          OCR: {a.ocr_confidence}%
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="truncate text-text-heading">
                          {a.address_text || a.address}
                        </div>
                        <div className="font-code-sm text-[11px] text-text-muted">
                          Rute: {a.real_route_distance_meters}m • {a.detected_building}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-code-sm text-[11px] font-bold ${
                            a.status === "APPROVED"
                              ? "bg-status-approved-bg text-status-approved"
                              : a.status === "REJECTED"
                              ? "bg-status-fraud-bg text-status-fraud"
                              : "bg-status-revision-bg text-status-revision"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/track/${encodeURIComponent(a.tracking_id)}`}
                          className="px-2.5 py-1 rounded bg-surface-slate hover:bg-surface-container font-code-sm text-xs text-secondary font-semibold"
                        >
                          Inspeksi →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}
