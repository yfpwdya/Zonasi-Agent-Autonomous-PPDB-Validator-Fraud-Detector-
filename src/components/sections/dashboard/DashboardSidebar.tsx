"use client";
import Link from "next/link";
import type { ApplicationRecord, AuthUser } from "@/types";

interface Props {
  dataSource: string;
  activeCase: ApplicationRecord | null;
  onLogout: () => void;
}

export function DashboardSidebar({ dataSource, activeCase, onLogout }: Props) {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#1E3A8A] text-white border-r border-white/10 shadow-xl z-50 hidden lg:flex flex-col pt-5 pb-6">
      <div className="px-6 mb-6 flex items-center gap-3 pb-4 border-b border-white/15">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B] flex items-center justify-center text-[#1E293B] shadow-sm shrink-0 font-extrabold">
          <span className="material-symbols-outlined text-[22px]">shield_person</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base text-white font-extrabold tracking-tight leading-none">
            Zonasi-Agent
          </span>
          <span className="font-code-sm text-[11px] text-[#F59E0B] font-bold mt-1">
            PORTAL PENGAWAS PANITIA
          </span>
        </div>
      </div>
      <div className="px-6 mb-2">
        <span className="font-code-sm text-[11px] text-white/65 uppercase tracking-wider font-bold">
          Modul Verifikator
        </span>
      </div>
      <nav className="flex-1 px-4 flex flex-col gap-1.5">
        <a
          aria-current="page"
          className="flex items-center gap-3 px-4 py-3 transition-all bg-[#F59E0B] text-[#1E293B] font-extrabold rounded-xl shadow-sm text-sm"
          href="#ringkasan"
        >
          <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
          <span>Dashboard Pengawas</span>
        </a>
        {activeCase && (
          <Link
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/85 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold"
            href={`/track/${encodeURIComponent(activeCase.tracking_id)}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#F59E0B]">history_edu</span>
            <span>Detail Verifikasi ({activeCase.tracking_id})</span>
          </Link>
        )}
        <Link
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white hover:bg-white/15 font-semibold bg-white/10 border border-white/15 transition-all text-sm mt-1"
          href="/"
        >
          <span className="material-symbols-outlined text-[20px] text-[#F59E0B]">document_scanner</span>
          <span>Buka Halaman Pindai KK</span>
        </Link>
      </nav>
      <div className="px-4 pt-4 mt-auto flex flex-col gap-2.5 border-t border-white/15">
        <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-code-sm text-[11px] text-white/75">Status Server Data</span>
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
          </div>
          <span className="font-code-sm text-xs text-white font-bold">
            {dataSource === "supabase" ? "Server Data Terhubung" : "Penyimpanan Lokal"}
          </span>
          <span className="text-[10px] text-[#F59E0B] font-semibold">
            SMA Negeri 12 Sby (Radius 1.200m)
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15"
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            <span>Akun</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#DC2626] hover:opacity-90 text-white font-bold text-xs transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
