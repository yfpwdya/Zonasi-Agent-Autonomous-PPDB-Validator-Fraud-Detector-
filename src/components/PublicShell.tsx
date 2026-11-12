"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clearPanitiaSession, usePanitiaSession } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", label: "Scanner KK & Beranda Audit" },
  { href: "/track/PPDB-2026-X89K", label: "Inspeksi Forensik KK", matchPrefix: "/track" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const panitia = usePanitiaSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md shadow-xs border-b border-border-slate">
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
              Workspace Audit KK Panitia PPDB
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
              <span>Dashboard Posko Panitia</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-space-sm">
          {panitia ? (
            <>
              <Link
                className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all"
                href="/dashboard"
                title={`Masuk sebagai ${panitia.full_name} (NIP ${panitia.nip})`}
              >
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                <span>Buka Dashboard ({panitia.full_name.split(" ")[0]})</span>
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
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all"
              href="/login"
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Login Panitia</span>
            </Link>
          )}
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
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg font-label-lg text-label-lg text-secondary font-semibold bg-surface-tint-blue"
            >
              Dashboard Posko Panitia
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg font-label-md text-label-md text-secondary font-semibold"
            >
              Login Panitia
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
    <footer className="w-full bg-surface-canvas mt-auto border-t border-border-slate">
      <div className="max-w-7xl mx-auto px-margin py-space-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[18px]">policy</span>
          </div>
          <div>
            <span className="font-headline-sm text-sm text-primary font-bold block">
              Zonasi-Agent • Sistem Audit Forensik Kartu Keluarga PPDB
            </span>
            <span className="font-body-sm text-xs text-text-muted">
              Khusus Panitia Verifikator Sekolah • Ekstraksi Otomatis Gemini Vision &amp; Validasi Radius PostGIS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
            Gemini 3.5 Flash Vision + PostGIS Aktif
          </span>
          <Link
            href={panitia ? "/dashboard" : "/login"}
            className="font-label-md text-xs text-secondary font-semibold hover:underline"
          >
            {panitia ? "Buka Posko Panitia →" : "Login Panitia →"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
