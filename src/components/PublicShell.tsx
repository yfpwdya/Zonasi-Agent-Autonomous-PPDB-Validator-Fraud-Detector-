"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clearPanitiaSession, usePanitiaSession } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/daftar", label: "Pendaftaran Siswa" },
  { href: "/track/PPDB-2026-X89K", label: "Cek Status Berkas", matchPrefix: "/track" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const panitia = usePanitiaSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-margin h-16 flex items-center justify-between">
        <Link className="flex items-center gap-space-sm group" href="/">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[22px]">policy</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight leading-none">
              Zonasi-Agent
            </span>
            <span className="font-code-sm text-code-sm text-secondary font-medium tracking-wider uppercase mt-0.5">
              Portal PPDB Siswa &amp; Audit AI
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-space-lg">
          {NAV_ITEMS.map((it) => {
            const active = it.matchPrefix
              ? pathname?.startsWith(it.matchPrefix)
              : pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "font-label-lg text-label-lg text-primary font-semibold border-b-2 border-secondary pb-1 transition-colors"
                    : "font-label-lg text-label-lg text-text-muted hover:text-primary transition-colors"
                }
              >
                {it.label}
              </Link>
            );
          })}
          {panitia && (
            <Link
              href="/dashboard"
              className="font-label-lg text-label-lg text-secondary font-semibold hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Dashboard Panitia</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-space-sm">
          {panitia ? (
            <>
              <Link
                className="hidden sm:flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-tint-blue text-secondary font-label-md text-label-md hover:bg-surface-container-high transition-colors"
                href="/dashboard"
                title={`Masuk sebagai ${panitia.full_name} (NIP ${panitia.nip})`}
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Posko: {panitia.full_name.split(" ")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={() => clearPanitiaSession()}
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-text-muted hover:text-status-fraud hover:bg-status-fraud-bg font-label-md text-label-md transition-colors"
                title="Keluar dari sesi Panitia"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <Link
              className="hidden sm:flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-low text-text-muted hover:text-secondary hover:bg-surface-container-high font-label-md text-label-md transition-colors"
              href="/login"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Login Panitia</span>
            </Link>
          )}
          <Link
            className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all"
            href="/daftar"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            <span>Daftar PPDB</span>
          </Link>
          <button
            type="button"
            aria-label="Buka menu navigasi"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg bg-surface-slate text-text-heading hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-slate bg-surface-canvas px-margin py-space-md flex flex-col gap-2 shadow-lg">
          {NAV_ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-text-heading hover:bg-surface-slate"
            >
              {it.label}
            </Link>
          ))}
          {panitia ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-secondary font-semibold bg-surface-tint-blue"
              >
                Dashboard Panitia ({panitia.full_name.split(" ")[0]})
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  clearPanitiaSession();
                }}
                className="text-left px-3 py-2 rounded-lg font-label-lg text-label-lg text-status-fraud hover:bg-status-fraud-bg"
              >
                Keluar Sesi Panitia
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg font-label-md text-label-md text-text-muted hover:bg-surface-slate"
            >
              Login Khusus Panitia / Verifikator
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const panitia = usePanitiaSession();
  return (
    <footer className="w-full bg-surface-canvas mt-auto">
      <div className="max-w-7xl mx-auto px-margin py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter pb-space-lg">
          <div className="md:col-span-2 space-y-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[18px]">policy</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                Zonasi-Agent • Portal PPDB 2026
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted max-w-md leading-relaxed">
              Layanan mandiri bagi <strong>Calon Siswa &amp; Orang Tua</strong> untuk mendaftar PPDB jalur zonasi dan melacak audit AI secara transparan, serta ruang kerja pengawasan bagi <strong>Panitia Verifikator Sekolah</strong>.
            </p>
            <div className="flex items-center gap-space-sm pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-code-sm">
                <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
                PostGIS &amp; Gemini 3 Flash Online
              </span>
              <span className="font-code-sm text-code-sm text-text-muted">
                SKB 3 Menteri PPDB 2026
              </span>
            </div>
          </div>
          <div className="space-y-space-xs">
            <h4 className="font-label-lg text-label-lg text-text-heading uppercase tracking-wider">
              Layanan Siswa &amp; Wali Murid
            </h4>
            <ul className="space-y-1.5 font-body-sm text-body-sm text-text-muted">
              <li>
                <Link className="hover:text-secondary transition-colors" href="/">
                  Beranda &amp; Cek Cepat NIK / Tracking ID
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors" href="/daftar">
                  Formulir Pendaftaran Siswa Baru (Tanpa Login)
                </Link>
              </li>
              <li>
                <Link className="hover:text-secondary transition-colors" href="/track/PPDB-2026-X89K">
                  Pelacakan Status &amp; Revisi KK Mandiri
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-space-xs">
            <h4 className="font-label-lg text-label-lg text-text-heading uppercase tracking-wider">
              Otoritas Panitia Sekolah
            </h4>
            <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
              Khusus petugas verifikator ber-NIP resmi untuk audit berkas anomali, jadwal sidak, dan unduh Berita Acara.
            </p>
            <div className="pt-1">
              <Link
                href={panitia ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-1.5 font-label-md text-label-md text-secondary font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {panitia ? "space_dashboard" : "lock"}
                </span>
                <span>{panitia ? "Buka Dashboard Panitia" : "Login Petugas Verifikator →"}</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="pt-space-md bg-surface-slate -mx-margin px-margin py-space-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-text-muted font-body-sm text-body-sm rounded-t-xl">
          <span>© 2026 Kementerian Pendidikan Dasar dan Menengah RI. Hak Cipta Dilindungi.</span>
          <span className="font-code-sm text-code-sm">
            Siswa: Tanpa Akun (Tracking ID) • Panitia: Wajib Login NIP
          </span>
        </div>
      </div>
    </footer>
  );
}
