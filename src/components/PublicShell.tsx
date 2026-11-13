"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearPanitiaSession, usePanitiaSession } from "@/hooks/useAuth";

export function PublicHeader() {
  const pathname = usePathname();
  const panitia = usePanitiaSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [latestTrackingId, setLatestTrackingId] = useState<string | null>(null);

  useEffect(() => {
    const syncMyIds = () => {
      try {
        const raw = sessionStorage.getItem("zonasi_my_tracking_ids");
        const parsed: string[] = raw ? JSON.parse(raw) : [];
        setLatestTrackingId(parsed[0] || null);
      } catch {
        setLatestTrackingId(null);
      }
    };
    syncMyIds();
    window.addEventListener("zonasi:my-apps-updated", syncMyIds);
    return () => window.removeEventListener("zonasi:my-apps-updated", syncMyIds);
  }, [pathname]);

  const navItems = [
    { href: "/#beranda", label: "Beranda" },
    { href: "/#alur-pendaftaran", label: "Alur Pendaftaran" },
    { href: "/#jalur-kuota", label: "Jalur & Kuota" },
    { href: "/#syarat-pendaftaran", label: "Syarat" },
    { href: "/#jadwal-penting", label: "Jadwal" },
    { href: "/#faq-ppdb", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FFFFFF]/95 backdrop-blur-md shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Kiri: Logo & Nama Sekolah */}
        <Link className="flex items-center gap-3 group shrink-0" href="/">
          <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1e40af] transition-colors relative">
            <span className="material-symbols-outlined text-[24px]">school</span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#F59E0B] border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg text-[#1E3A8A] font-extrabold tracking-tight leading-none">
              SMA Negeri 12 Surabaya
            </span>
            <span className="text-[11px] text-[#475569] font-semibold tracking-wider uppercase mt-1">
              Portal Resmi PPDB &amp; Verifikasi AI Zonasi
            </span>
          </div>
        </Link>

        {/* Tengah: Menu Navigasi (Beranda, Alur Pendaftaran, Jalur & Kuota, Syarat, Jadwal, FAQ) */}
        <nav className="hidden xl:flex items-center gap-6" aria-label="Navigasi Utama PPDB">
          {navItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="text-sm font-semibold text-[#475569] hover:text-[#1E3A8A] transition-colors py-1"
            >
              {it.label}
            </Link>
          ))}
          {latestTrackingId && (
            <Link
              href={`/track/${encodeURIComponent(latestTrackingId)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200 text-xs font-bold text-[#1E3A8A] hover:border-[#1E3A8A] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Berkas Saya ({latestTrackingId})</span>
            </Link>
          )}
        </nav>

        {/* Kanan: Tombol Login (Outline Biru) & Daftar Sekarang (Solid Amber #F59E0B) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {panitia ? (
            <>
              <Link
                href="/dashboard"
                title={`Masuk sebagai ${panitia.full_name} (NIP ${panitia.nip})`}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-xs sm:text-sm font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                <span>Dashboard Panitia ({panitia.full_name.split(" ")[0]})</span>
              </Link>
              <button
                type="button"
                onClick={() => clearPanitiaSession()}
                className="hidden md:inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-[#DC2626] hover:bg-red-50 transition-colors"
                title="Keluar dari sesi Panitia"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-xs sm:text-sm font-bold transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Login</span>
            </Link>
          )}

          <Link
            href="/#scanner-kk"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            <span>Daftar Sekarang</span>
          </Link>

          <button
            type="button"
            aria-label="Buka menu navigasi"
            onClick={() => setMobileOpen((v) => !v)}
            className="xl:hidden p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[#1E293B] hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Menu Mobile Responsif (Mobile-First) */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-[#FFFFFF] px-4 py-4 flex flex-col gap-1.5 shadow-md">
          {navItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setMobileOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#1E3A8A]"
            >
              {it.label}
            </Link>
          ))}
          {latestTrackingId && (
            <Link
              href={`/track/${encodeURIComponent(latestTrackingId)}`}
              onClick={() => setMobileOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#16A34A] bg-emerald-50"
            >
              Inspeksi Berkas Saya ({latestTrackingId})
            </Link>
          )}
          <div className="pt-2 mt-1 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
            {panitia ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] text-sm font-bold"
                >
                  Buka Dashboard Panitia
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearPanitiaSession();
                    setMobileOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-[#DC2626] text-sm font-bold"
                >
                  Keluar Sesi
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl border-2 border-[#1E3A8A] text-[#1E3A8A] text-sm font-bold"
              >
                Login Panitia PPDB
              </Link>
            )}
            <Link
              href="/#scanner-kk"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] text-sm font-extrabold"
            >
              Daftar Sekarang (Upload KK)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const panitia = usePanitiaSession();
  return (
    <footer className="w-full bg-[#1E3A8A] text-white mt-auto border-t-4 border-[#F59E0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* Kolom 1: Identitas Resmi Sekolah */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#F59E0B]">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight block text-white">
                SMA Negeri 12 Surabaya
              </span>
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                Panitia Resmi PPDB Tahun Ajaran 2026/2027
              </span>
            </div>
          </div>
          <p className="text-sm text-blue-100 leading-relaxed">
            Layanan Penerimaan Peserta Didik Baru (PPDB) berbasis verifikasi cerdas Kartu Keluarga (1x Single-Pass AI Vision), validasi usia SMA (15–17 Tahun), dan pengukuran rute jalan raya OSRM OpenStreetMap secara transparan, akuntabel, dan bebas kecurangan.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>Server Verifikasi AI &amp; Geofence PostGIS Aktif 24 Jam</span>
          </div>
        </div>

        {/* Kolom 2: Kontak Panitia & Helpdesk WhatsApp */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#F59E0B]">
            Layanan Bantuan &amp; Kontak Panitia
          </h3>
          <ul className="space-y-2.5 text-sm text-blue-100">
            <li className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] shrink-0 mt-0.5">
                location_on
              </span>
              <span>
                Jl. Sememi Kidul No.1, Kel. Sememi, Kec. Benowo, Kota Surabaya, Jawa Timur 60198
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] shrink-0">
                support_agent
              </span>
              <span>Helpdesk WhatsApp Panitia: 0812-3456-1212 (Respon Cepat)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] shrink-0">
                call
              </span>
              <span>Telepon Posko Sekolah: (031) 7404812 • info@sman12-sby.sch.id</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B] shrink-0">
                schedule
              </span>
              <span>Jam Layanan Posko: Senin – Sabtu (07.30 – 16.00 WIB)</span>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Peta Lokasi Singkat & Tautan Cepat */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#F59E0B]">
            Titik Koordinat Zonasi &amp; Lokasi Sekolah
          </h3>
          <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span className="font-semibold text-white">Titik Pusat Geofence:</span>
              <span className="font-mono text-amber-300">-7.2468, 112.6358</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Radius Prioritas Zonasi: <strong>1.200 Meter</strong> dari gerbang utama SMA Negeri 12 Surabaya (Kec. Benowo &amp; sekitarnya).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="https://www.openstreetmap.org/?mlat=-7.2468&mlon=112.6358#map=16/-7.2468/112.6358"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] text-xs font-extrabold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
                <span>Buka Peta Lokasi SMAN 12</span>
              </a>
              <Link
                href={panitia ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>{panitia ? "Posko Panitia" : "Portal Panitia"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-white/15 bg-[#172e6e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-200">
          <span>
            © 2026 Panitia Resmi PPDB SMA Negeri 12 Surabaya — Dinas Pendidikan Provinsi Jawa Timur. Hak Cipta Dilindungi.
          </span>
          <div className="flex items-center gap-4">
            <a href="#alur-pendaftaran" className="hover:text-white transition-colors">
              Alur PPDB
            </a>
            <a href="#jalur-kuota" className="hover:text-white transition-colors">
              Kuota Jalur
            </a>
            <a href="#jadwal-penting" className="hover:text-white transition-colors">
              Jadwal Resmi
            </a>
            <a href="#cek-status-cepat" className="hover:text-white transition-colors">
              Cek Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
