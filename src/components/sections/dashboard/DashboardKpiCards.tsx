"use client";

interface Props {
  totalCount: number;
  approvedCount: number;
  revisionCount: number;
  fraudCount: number;
  passRate: number;
}

export function DashboardKpiCards({
  totalCount,
  approvedCount,
  revisionCount,
  fraudCount,
  passRate,
}: Props) {
  return (
    <>
      {/* Banner Ringkasan */}
      <section
        data-gsap="kpi-card"
        className="bg-[#1E3A8A] text-white rounded-2xl border-b-4 border-[#F59E0B] shadow-md p-5 sm:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#F59E0B] font-code-sm text-xs text-[#1E293B] font-extrabold">
              Panel Pengawas Panitia PPDB
            </span>
            <span className="flex items-center gap-1 font-body-sm text-xs sm:text-sm text-white/85">
              <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">my_location</span>
              Sekolah Tujuan: SMA Negeri 12 Surabaya (-7.2468, 112.6358 • Radius 1.200m)
            </span>
          </div>
          <h1 className="font-headline-md text-xl sm:text-2xl text-white font-extrabold">
            Zonasi-Agent — Dashboard Verifikasi Berkas &amp; Pengawasan Zonasi PPDB
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-white/80">
            Panel kerja Panitia PPDB untuk memantau antrean verifikasi Kartu Keluarga (KK), memeriksa jarak rute jalan darat menuju sekolah, dan memperbarui status kelulusan berkas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto shrink-0">
          <div className="bg-[#FFFFFF] text-[#1E293B] rounded-xl p-4 min-w-[210px] border-l-4 border-[#16A34A] shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-[#475569]">Rasio Berkas Lulus</span>
              <span className="font-code-sm text-xs text-[#16A34A] font-extrabold">{passRate}%</span>
            </div>
            <div className="text-lg text-[#1E293B] font-extrabold">
              {approvedCount}{" "}
              <span className="text-xs text-[#475569] font-normal">/ {totalCount} Berkas Diperiksa</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#16A34A] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(10, passRate))}%` }}
              />
            </div>
          </div>

          <div className="bg-[#FFFFFF] text-[#1E293B] rounded-xl p-4 min-w-[210px] border-l-4 border-[#F59E0B] shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-[#D97706] font-extrabold">Antrean Tindakan Panitia</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping" />
            </div>
            <div className="text-lg text-[#1E293B] font-extrabold">
              {revisionCount + fraudCount}{" "}
              <span className="text-xs text-[#475569] font-normal">Kasus Perlu Tinjauan</span>
            </div>
            <span className="font-code-sm text-xs text-[#DC2626] font-bold block mt-2">
              {fraudCount} Ditolak • {revisionCount} Perlu Revisi
            </span>
          </div>
        </div>
      </section>

      {/* 4 Kartu Metrik */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div data-gsap="kpi-card" className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-text-muted uppercase tracking-wider">Total Pendaftar</span>
            <div className="w-9 h-9 rounded-lg bg-surface-tint-blue flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
          </div>
          <div className="my-3">
            <div className="font-headline-lg text-headline-lg text-text-heading font-bold">{totalCount}</div>
            <span className="font-body-sm text-body-sm text-text-muted">Total berkas pendaftaran masuk</span>
          </div>
          <div className="flex items-center gap-1 text-status-approved font-code-sm text-code-sm">
            <span className="material-symbols-outlined text-[16px]">cloud_done</span>
            <span>Tersinkronisasi dengan Server</span>
          </div>
        </div>

        <div data-gsap="kpi-card" className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-status-approved uppercase tracking-wider">Disetujui Otomatis</span>
            <div className="w-9 h-9 rounded-lg bg-status-approved-bg flex items-center justify-center text-status-approved">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
          </div>
          <div className="my-3">
            <div className="font-headline-lg text-headline-lg text-text-heading font-bold">{approvedCount}</div>
            <span className="font-body-sm text-body-sm text-text-muted">Lolos verifikasi KK, Jarak &amp; Hunian</span>
          </div>
          <div className="flex items-center justify-between text-text-muted font-code-sm text-code-sm">
            <span>Rasio Lolos Validasi</span>
            <span className="font-semibold text-status-approved">{passRate}%</span>
          </div>
        </div>

        <div data-gsap="kpi-card" className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-status-revision uppercase tracking-wider">Revisi / Foto Mandiri</span>
            <div className="w-9 h-9 rounded-lg bg-status-revision-bg flex items-center justify-center text-status-revision">
              <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
          </div>
          <div className="my-3">
            <div className="font-headline-lg text-headline-lg text-text-heading font-bold">{revisionCount}</div>
            <span className="font-body-sm text-body-sm text-text-muted">KK dummy/buram atau gang sempit</span>
          </div>
          <div className="flex items-center gap-1 text-status-revision font-code-sm text-code-sm">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Menunggu unggah ulang pendaftar</span>
          </div>
        </div>

        <div data-gsap="kpi-card" className="bg-surface-canvas rounded-xl p-5 border border-border-slate shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-status-fraud uppercase tracking-wider">Ditolak / Anomali</span>
            <div className="w-9 h-9 rounded-lg bg-status-fraud-bg flex items-center justify-center text-status-fraud">
              <span className="material-symbols-outlined text-[20px]">gpp_maybe</span>
            </div>
          </div>
          <div className="my-3">
            <div className="font-headline-lg text-headline-lg text-status-fraud font-bold">{fraudCount}</div>
            <span className="font-body-sm text-body-sm text-text-muted">KK &lt; 1 thn / titik ruko komersial</span>
          </div>
          <div className="flex items-center gap-1 text-status-fraud font-code-sm text-code-sm">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>Wajib investigasi / diskualifikasi</span>
          </div>
        </div>
      </section>
    </>
  );
}
