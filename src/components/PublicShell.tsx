"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCP82MliC1pINdpVeIABNsQF3W3U00v866HTudaniST1nlWzh255_xuUrIjrSbxRJEvk0Pce7jfaUQKtq1-SX_b0SDyILpmhDB6ruWazV92FKnpjQ2Tm8HzuLp1NqhDptwKmsP2EIEYQP_GLoZ5rsFCIC8vo3iAXwsCcacUOksxTYkXB8_oG6mHz0IHs0btY3N97OFbnjsLi08felaL4DsUov4iNib8CHaAVGkojrM";

export function PublicHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDaftar = pathname.startsWith("/daftar");
  const isTrack = pathname.startsWith("/track");
  const isDashboard = pathname.startsWith("/dashboard");

  const activeCls =
    "px-space-md py-space-sm transition-colors bg-surface-tint-blue text-secondary font-headline-sm rounded-lg";
  const idleCls =
    "px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:text-on-surface transition-colors";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-canvas/85 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <Link className="flex items-center gap-space-sm" href="/">
            <img
              alt="Zonasi-Agent Emblem Logo"
              className="h-8 w-auto object-contain"
              src={LOGO_URL}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-text-heading leading-tight">
                  Zonasi-Agent
                </span>
                <span className="font-code-sm text-code-sm px-space-xs py-0.5 rounded-full bg-surface-tint-blue text-secondary">
                  AI-GOV
                </span>
              </div>
              <span className="font-label-md text-label-md text-text-muted hidden sm:inline-block leading-tight">
                Kementerian Pendidikan &amp; Dinas Pendidikan
              </span>
            </div>
          </Link>
        </div>
        <nav
          className="hidden lg:flex items-center gap-space-sm"
          data-active-classes="bg-surface-tint-blue text-secondary font-headline-sm rounded-lg"
        >
          <Link aria-current={isHome ? "page" : undefined} className={isHome ? activeCls : idleCls} href="/">
            Beranda
          </Link>
          <Link aria-current={isDaftar ? "page" : undefined} className={isDaftar ? activeCls : idleCls} href="/daftar">
            Pendaftaran PPDB
          </Link>
          <Link
            aria-current={isTrack ? "page" : undefined}
            className={isTrack ? activeCls : idleCls}
            href="/track/PPDB-2026-X89K"
          >
            Live Tracking AI
          </Link>
          <Link
            aria-current={isDashboard ? "page" : undefined}
            className={isDashboard ? activeCls : idleCls}
            href="/dashboard"
          >
            Dashboard Panitia
          </Link>
        </nav>
        <div className="flex items-center gap-space-md">
          <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-status-approved-bg">
            <span className="w-2 h-2 rounded-full bg-status-approved animate-pulse" />
            <span className="font-code-sm text-code-sm text-status-approved">
              Supabase Realtime: Terhubung
            </span>
          </div>
          <Link
            href="/track/PPDB-2026-X89K"
            aria-label="Notifikasi Terkini"
            className="relative p-space-sm rounded-lg hover:bg-surface-slate text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-fraud" />
          </Link>
          <Link
            className="hidden sm:flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-canvas hover:bg-surface-slate text-text-heading font-label-lg text-label-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all"
            href="/dashboard"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">lock</span>
            <span>Portal Petugas</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="w-full bg-surface-slate py-space-xl mt-auto">
      <div className="max-w-7xl mx-auto px-margin">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-space-lg">
          <div className="md:col-span-2 flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <img
                alt="Zonasi-Agent Emblem Logo"
                className="h-7 w-auto object-contain"
                src={LOGO_URL}
              />
              <span className="font-headline-sm text-headline-sm text-text-heading">
                Zonasi-Agent
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted max-w-lg">
              Sistem Verifikasi Berbasis Multi-Agent Geospasial PPDB Mandiri. Mengintegrasikan algoritma inferensi OCR dokumen kependudukan, kalkulasi rute PostGIS, dan validasi visual Google Street View secara berkeadilan, transparan, dan akuntabel.
            </p>
            <div className="flex flex-wrap items-center gap-space-xs mt-space-sm">
              <span className="font-code-sm text-code-sm px-space-sm py-1 rounded-full bg-status-approved-bg text-status-approved">
                PostGIS ISO 19125-1
              </span>
              <span className="font-code-sm text-code-sm px-space-sm py-1 rounded-full bg-surface-tint-blue text-secondary">
                Vision AI Validated
              </span>
              <span className="font-code-sm text-code-sm px-space-sm py-1 rounded-full bg-surface-container-high text-primary">
                AES-256 Encrypted
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-lg text-label-lg text-text-heading">Navigasi Resmi</span>
            <Link className="font-body-sm text-body-sm text-text-muted hover:text-on-surface" href="/">
              Beranda Sistem
            </Link>
            <Link className="font-body-sm text-body-sm text-text-muted hover:text-on-surface" href="/daftar">
              Formulir Verifikasi NIK
            </Link>
            <Link
              className="font-body-sm text-body-sm text-text-muted hover:text-on-surface"
              href="/track/PPDB-2026-X89K"
            >
              Status Audit Terbuka
            </Link>
            <Link className="font-body-sm text-body-sm text-text-muted hover:text-on-surface" href="/dashboard">
              Konsol Panitia Wilayah
            </Link>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-lg text-label-lg text-text-heading">
              Bantuan &amp; Layanan Sipil
            </span>
            <p className="font-body-sm text-body-sm text-text-muted">Posko Bantuan PPDB Terpadu</p>
            <span className="font-code-md text-code-md text-text-heading">
              0800-140-9000 (Toll-Free)
            </span>
            <span className="font-body-sm text-body-sm text-text-muted">
              Senin - Jumat: 08:00 - 16:00 WIB
            </span>
            <span className="font-body-sm text-body-sm text-secondary">
              helpdesk@zonasi-agent.kemdikbud.go.id
            </span>
          </div>
        </div>
        <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-body-sm text-body-sm text-text-muted text-center sm:text-left">
            © 2025 Zonasi-Agent. Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi RI bersama Dinas Pendidikan Daerah.
          </p>
          <div className="flex items-center gap-space-md font-body-sm text-body-sm text-text-muted">
            <Link className="hover:text-on-surface" href="/track/PPDB-2026-X89K">
              Kebijakan Privasi
            </Link>
            <Link className="hover:text-on-surface" href="/dashboard">
              Standar Geospasial
            </Link>
            <Link className="hover:text-on-surface" href="/daftar">
              Buku Panduan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
