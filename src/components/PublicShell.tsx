"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearPanitiaSession, usePanitiaSession } from "@/hooks/usePanitiaSession";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTrack = pathname.startsWith("/track");
  const isLogin = pathname.startsWith("/login");
  const authUser = usePanitiaSession();
  const [recentTrackId, setRecentTrackId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncMyTrackId = () => {
      try {
        const raw = sessionStorage.getItem("zonasi_my_tracking_ids");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        setRecentTrackId(ids[0] || "");
      } catch {
        setRecentTrackId("");
      }
    };
    syncMyTrackId();
    window.addEventListener("zonasi:my-apps-updated", syncMyTrackId);
    window.addEventListener("zonasi-session-updated", syncMyTrackId);
    window.addEventListener("storage", syncMyTrackId);
    return () => {
      window.removeEventListener("zonasi:my-apps-updated", syncMyTrackId);
      window.removeEventListener("zonasi-session-updated", syncMyTrackId);
      window.removeEventListener("storage", syncMyTrackId);
    };
  }, [pathname]);

  const navLinks = [
    { href: "/#beranda", label: "Beranda" },
    { href: "/#alur-verifikasi", label: "Alur Verifikasi AI" },
    { href: "/#kuota-jalur", label: "Parameter & Kuota" },
    { href: "/#syarat-berkas", label: "Aturan Forensik" },
    { href: "/#jadwal-verifikasi", label: "Jadwal Audit" },
    { href: "/#faq-panitia", label: "Panduan & FAQ" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B]">
      {/* Top Official Utility Strip — Zonasi-Agent Tool Identity */}
      <div className="bg-[#1E3A8A] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#1E293B] font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E293B] animate-pulse" />
              AUTONOMOUS AI VALIDATOR ACTIVE
            </span>
            <span className="hidden md:inline text-white/90">
              Zonasi-Agent v2.6 • Mesin Verifikasi Berkas &amp; Deteksi Kecurangan KK Panitia PPDB
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/90 font-code-sm text-[11px]">
            <span className="hidden sm:inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#F59E0B]">my_location</span>
              Patokan Ukur Geospasial: SMAN 12 Surabaya (-7.2468, 112.6358 • Radius 1.200 m)
            </span>
            {recentTrackId && (
              <Link
                href={`/track/${encodeURIComponent(recentTrackId)}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[13px] text-[#F59E0B]">fact_check</span>
                Inspeksi Sesi ({recentTrackId})
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Navbar (Zonasi-Agent Committee Tool Brand left, menu center, Login + Scan KK right) */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Logo & Nama Sistem Zonasi-Agent */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#172554] transition-colors relative">
              <span className="material-symbols-outlined text-[24px]">shield_person</span>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#F59E0B] border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E293B]" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-base sm:text-lg font-extrabold text-[#1E3A8A] tracking-tight leading-none">
                  Zonasi-Agent
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E3A8A] border border-[#1E3A8A]/20 font-code-sm text-[10px] font-bold">
                  PANITIA TOOLS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#475569] font-medium mt-0.5">
                Autonomous PPDB Validator &amp; Fraud Detector
              </p>
            </div>
          </Link>

          {/* Center: Menu Navigasi */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden xl:flex items-center gap-1"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[#475569] hover:text-[#1E3A8A] hover:bg-[#F8FAFC] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {isTrack && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#EFF6FF] text-[#1E3A8A] border border-[#1E3A8A]/20">
                Mode Inspeksi Forensik
              </span>
            )}
          </nav>

          {/* Right: Tombol Login/Dashboard Panitia (Outline Biru) & Pindai KK Sekarang (Solid Amber) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {authUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                  <span>Dashboard Panitia ({authUser.full_name.split(" ")[0]})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => clearPanitiaSession()}
                  title="Keluar Sesi Panitia"
                  className="p-2.5 rounded-xl border border-[#CBD5E1] text-[#475569] hover:text-[#DC2626] hover:border-[#DC2626] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5 ${
                  isLogin
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-white text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Login Panitia</span>
              </Link>
            )}

            <Link
              href="/#scanner-kk"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              <span>Pindai KK Sekarang</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Buka menu navigasi"
              className="xl:hidden p-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#FFFFFF] border-t border-[#E2E8F0] px-4 py-4 shadow-md space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-xs font-semibold text-[#1E293B] hover:text-[#1E3A8A] border border-[#E2E8F0]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              {authUser ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold text-center"
                >
                  Buka Dashboard Pengawas Panitia ({authUser.full_name})
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] text-xs font-bold text-center"
                >
                  Login / Registrasi Akun Panitia Verifikator
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Footer Resmi — Zonasi-Agent Autonomous PPDB Validator & Fraud Detector */}
      <footer className="bg-[#1E3A8A] text-white mt-auto border-t-4 border-[#F59E0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/15">
            {/* Kolom 1: Identitas Tools Zonasi-Agent */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-[#1E293B] flex items-center justify-center font-extrabold shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">shield_person</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-white">
                    Zonasi-Agent
                  </h3>
                  <p className="text-xs text-white/80">
                    Autonomous PPDB Validator &amp; Fraud Detector
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Sistem bantu verifikasi otonom untuk Panitia PPDB dalam mengaudit keaslian Kartu Keluarga (KK), memvalidasi usia calon siswa (15–17 tahun), menghitung jarak rute darat OSRM + PostGIS, serta mendeteksi anomali titip KK.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] font-code-sm text-[#F59E0B]">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Single-Pass Gemini Vision + PostGIS + OSRM</span>
              </div>
            </div>

            {/* Kolom 2: Navigasi Modul & Pintasan Panitia */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B]">
                Modul &amp; Pintasan Sistem
              </h4>
              <ul className="space-y-2 text-xs text-white/85">
                <li>
                  <Link href="/#scanner-kk" className="hover:text-[#F59E0B] transition-colors">
                    → AI KK Forensic Scanner (1x Single-Pass)
                  </Link>
                </li>
                <li>
                  <Link href="/#cek-status-cepat" className="hover:text-[#F59E0B] transition-colors">
                    → Lacak Nomor Berkas / Inspeksi 3 Pilar
                  </Link>
                </li>
                <li>
                  <Link href="/#alur-verifikasi" className="hover:text-[#F59E0B] transition-colors">
                    → 5 Tahap Pipeline Audit Otonom
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-[#F59E0B] transition-colors">
                    → Dashboard Pengawas &amp; Override Panitia
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#F59E0B] transition-colors">
                    → Portal Autentikasi Panitia Verifikator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Dukungan Teknis & Posko Verifikator */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B]">
                Dukungan Teknis &amp; Posko Audit
              </h4>
              <div className="space-y-2 text-xs text-white/85">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B] shrink-0 mt-0.5">
                    support_agent
                  </span>
                  <span>
                    Helpdesk Tim Verifikator:{" "}
                    <strong className="text-white">+62 811-3400-1200</strong>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B] shrink-0 mt-0.5">
                    schedule
                  </span>
                  <span>
                    Operasional Server AI: <strong>24 Jam Real-Time</strong> (Posko Fisik: 07.30 – 16.00 WIB)
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#F59E0B] shrink-0 mt-0.5">
                    mail
                  </span>
                  <span>auditor@zonasi-agent.id</span>
                </p>
              </div>
            </div>

            {/* Kolom 4: Titik Tolak Ukur Geospasial Saat Ini */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B]">
                Titik Tolak Ukur Geospasial Aktif
              </h4>
              <p className="text-xs text-white/85 leading-relaxed">
                <strong>Patokan Sekolah Uji:</strong> SMA Negeri 12 Surabaya (Jl. Sememi Kidul No.1, Kec. Benowo, Surabaya 60198)
              </p>
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/75">Koordinat Titik Nol:</span>
                  <span className="font-code-sm font-bold text-[#F59E0B]">-7.2468, 112.6358</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/75">Batas Radius Zonasi:</span>
                  <span className="font-code-sm font-bold text-white">1.200 Meter</span>
                </div>
                <a
                  href="https://www.openstreetmap.org/?mlat=-7.2468&mlon=112.6358#map=16/-7.2468/112.6358"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[#F59E0B] hover:underline font-bold"
                >
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  <span>Buka Titik Ukur di OpenStreetMap ↗</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/75">
            <p>
              © 2026 <strong className="text-white">Zonasi-Agent</strong> — Autonomous PPDB Validator &amp; Fraud Detector. Digunakan untuk Otomasi Verifikasi &amp; Audit Panitia PPDB.
            </p>
            <div className="flex items-center gap-3 font-code-sm text-[11px]">
              <span className="px-2.5 py-1 rounded bg-white/10 text-white">
                WCAG AA Compliant
              </span>
              <span className="px-2.5 py-1 rounded bg-white/10 text-[#F59E0B]">
                PostGIS + OSRM Active
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
