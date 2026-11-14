"use client";

const AUDIT_TIMELINE = [
  {
    phase: "Tahap 1 • Penetapan Wilayah & Aturan Zonasi",
    actor: "Sistem & Konfigurasi",
    desc: "Penetapan koordinat lokasi sekolah tujuan (SMAN 12 Surabaya: -7.2468, 112.6358), batas radius 1.200 m, dan syarat usia SMA (15–17 tahun).",
    status: "SELESAI",
  },
  {
    phase: "Tahap 2 • Pemindaian KK & Verifikasi Domisili Otomatis",
    actor: "Zonasi-Agent Otomatis",
    desc: "Pembacaan otomatis berkas KK, perhitungan jarak rute jalan darat, deteksi indikasi titip KK, dan pemeriksaan berkas bersyarat SKPWNI.",
    status: "BERLANGSUNG",
  },
  {
    phase: "Tahap 3 • Peninjauan Berkas & Keputusan Panitia",
    actor: "Verifikator Panitia PPDB",
    desc: "Pemeriksaan berkas yang memerlukan revisi atau terindikasi kecurangan pada Dashboard Panitia serta peninjauan bukti foto rumah ber-geotag.",
    status: "BERLANGSUNG",
  },
  {
    phase: "Tahap 4 • Ekspor Berita Acara & Penetapan Final",
    actor: "Ketua Verifikator Panitia",
    desc: "Penguncian hasil verifikasi dan pengunduhan Berita Acara resmi (CSV/Excel) oleh Ketua Verifikator Panitia PPDB.",
    status: "SIAP_EKSPOR",
  },
];

/** Seksi 7 — Tabel alur tahapan operasional (tanpa tanggal) */
export function AuditTimelineSection() {
  return (
    <section
      id="jadwal-verifikasi"
      data-gsap="home-section"
      className="bg-[#FFFFFF] border-y border-[#E2E8F0] py-12 sm:py-14"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
            Alur Operasional Panitia PPDB
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Alur Tahapan Pemindaian &amp; Verifikasi Berkas
          </h2>
          <p className="text-sm text-[#475569]">
            Urutan kerja operasional sistem Zonasi-Agent mulai dari penetapan wilayah zonasi,
            pemindaian Kartu Keluarga otomatis, hingga penguncian Berita Acara panitia.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E3A8A] text-white text-xs font-extrabold uppercase tracking-wider">
                <th className="py-4 px-5">Tahapan Alur Verifikasi</th>
                <th className="py-4 px-5">Pelaksana / Modul</th>
                <th className="py-4 px-5 hidden md:table-cell">Rincian Proses Verifikasi</th>
                <th className="py-4 px-5 text-right">Status Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-[#FFFFFF] text-sm">
              {AUDIT_TIMELINE.map((row) => (
                <tr key={row.phase} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-4 px-5 font-extrabold text-[#1E293B]">
                    <div>{row.phase}</div>
                    <div className="text-xs font-normal text-[#475569] md:hidden mt-1">{row.desc}</div>
                  </td>
                  <td className="py-4 px-5 font-code-sm text-xs sm:text-sm font-bold text-[#1E3A8A] whitespace-nowrap">
                    {row.actor}
                  </td>
                  <td className="py-4 px-5 text-xs sm:text-sm text-[#475569] hidden md:table-cell">
                    {row.desc}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    {row.status === "BERLANGSUNG" ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#16A34A] text-xs font-extrabold border border-[#86EFAC]">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]" />
                        </span>
                        Aktif Berjalan
                      </span>
                    ) : row.status === "SELESAI" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-bold">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        Terkonfigurasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-semibold">
                        <span className="material-symbols-outlined text-[15px]">fact_check</span>
                        Siap Diekspor
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
