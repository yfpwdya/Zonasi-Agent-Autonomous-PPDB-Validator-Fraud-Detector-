"use client";

interface Props {
  query: string;
  error: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Seksi 2 — Widget cek status cepat (floating search box) */
export function StatusLookupWidget({ query, error, onChange, onSubmit }: Props) {
  return (
    <section
      id="cek-status-cepat"
      data-gsap="home-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20"
    >
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-md p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1E3A8A]">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">manage_search</span>
              <span>Widget Lacak &amp; Inspeksi Berkas Cepat</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B]">
              Buka Laporan Forensik 3 Pilar Berdasarkan Nomor Berkas / NIK
            </h2>
            <p className="text-xs sm:text-sm text-[#475569]">
              Masukkan Nomor Pendaftaran (<code className="font-code-sm font-bold text-[#1E3A8A]">PPDB-2026-XXXX</code>)
              atau 16 digit NIK untuk melihat hasil audit geospasial, kependudukan KK, dan status kelulusan.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto lg:min-w-[460px]"
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-[20px] text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2">
                badge
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Ketik Nomor Pendaftaran (PPDB-2026-...) atau NIK"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-sm shadow-sm transition-colors inline-flex items-center justify-center gap-2 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>Inspeksi Berkas</span>
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </section>
  );
}
