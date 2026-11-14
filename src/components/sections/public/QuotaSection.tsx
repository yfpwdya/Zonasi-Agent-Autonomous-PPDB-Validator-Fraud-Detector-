"use client";
import { motion } from "framer-motion";

const PPDB_QUOTA_PATHS = [
  {
    id: "zonasi",
    name: "Jalur Zonasi (Fokus Utama Zonasi-Agent)",
    pct: 50,
    quota: 160,
    filledBase: 142,
    icon: "my_location",
    badge: "Prioritas Verifikasi Zonasi",
    desc: "Verifikasi otomatis radius ≤ 1.200 m dari lokasi sekolah tujuan (SMAN 12 Surabaya), masa terbit KK minimal 1 tahun, & status hubungan keluarga Anak Kandung.",
  },
  {
    id: "perpindahan",
    name: "Perpindahan Domisili / Tugas Orang Tua (Terkait KK < 1 Tahun)",
    pct: 5,
    quota: 16,
    filledBase: 11,
    icon: "transfer_within_a_station",
    badge: "Verifikasi Berkas Bersyarat",
    desc: "Validasi berkas bersyarat SKPWNI Dukcapil / SK Pindah Tugas Orang Tua bagi pendaftar zonasi yang Kartu Keluarganya terbit kurang dari 1 tahun.",
  },
];

interface Props {
  approvedCount: number;
}

/** Seksi 4 — Kartu kuota jalur PPDB (hanya Zonasi & Perpindahan) */
export function QuotaSection({ approvedCount }: Props) {
  return (
    <section
      id="kuota-jalur"
      data-gsap="home-section"
      className="bg-[#FFFFFF] border-y border-[#E2E8F0] py-12 sm:py-14"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-extrabold uppercase tracking-wider">
              Informasi Daya Tampung &amp; Kuota Zonasi PPDB
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Kuota &amp; Cakupan Verifikasi Zonasi SMA Negeri 12 Surabaya
            </h2>
            <p className="text-sm text-[#475569] max-w-2xl">
              Fokus utama <strong>Zonasi-Agent</strong> adalah memverifikasi berkas{" "}
              <strong>Jalur Zonasi</strong> serta berkas bersyarat perpindahan domisili (SKPWNI /
              Pindah Tugas) secara akurat dan transparan.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#16A34A]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Kuota Tersedia
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706]">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              Hampir Penuh (&gt;85%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PPDB_QUOTA_PATHS.map((path) => {
            const dynamicFilled =
              path.id === "zonasi"
                ? Math.min(path.quota, path.filledBase + approvedCount)
                : path.filledBase;
            const fillRatio = Math.min(100, Math.round((dynamicFilled / path.quota) * 100));
            const isNearFull = fillRatio >= 85;

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md hover:border-[#1E3A8A] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px] text-[#F59E0B]">{path.icon}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] font-extrabold text-xs">
                      {path.pct}% Kuota
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1E293B]">{path.name}</h3>
                    <p className="text-xs text-[#475569] mt-1 leading-relaxed">{path.desc}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#475569]">
                      Terverifikasi:{" "}
                      <strong className="text-[#1E293B]">
                        {dynamicFilled} / {path.quota} Kursi
                      </strong>
                    </span>
                    <span className={`font-code-sm font-bold ${isNearFull ? "text-[#D97706]" : "text-[#16A34A]"}`}>
                      {fillRatio}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${fillRatio}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${isNearFull ? "bg-[#F59E0B]" : "bg-[#16A34A]"}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#475569] pt-1">
                    <span>Sisa Kuota: {Math.max(0, path.quota - dynamicFilled)} Kursi</span>
                    <a href="#scanner-kk" className="font-bold text-[#1E3A8A] hover:underline">
                      Uji Jalur Ini →
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
