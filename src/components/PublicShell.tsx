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
    window.addEventListener("zonasi-my-history-change", syncMyIds);
    return () => window.removeEventListener("zonasi-my-history-change", syncMyIds);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Scanner KK & Beranda Audit", matchPrefix: undefined as string | undefined },
    ...(latestTrackingId
      ? [{ href: `/track/${encodeURIComponent(latestTrackingId)}`, label: `Inspeksi Berkas (${latestTrackingId})`, matchPrefix: "/track" }]
      : []),
  ];

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
              SMA Negeri 12 Surabaya • Verifikasi KK
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-space-lg">
          {navItems.map((it) => {
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
          {navItems.map((it) => (
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
              Zonasi-Agent • Sistem Audit Forensik Kartu Keluarga PPDB SMAN 12 Surabaya
            </span>
            <span className="font-body-sm text-xs text-text-muted">
              1x Single-Pass Gemini Vision • Validasi Usia SMA (15–17 Thn) &amp; Rute OSRM OpenStreetMap
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-approved-bg text-status-approved font-code-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
            Gemini Vision + OpenStreetMap Aktif
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
