"use client";
import { motion } from "framer-motion";

const VERIFICATION_STEPS = [
  {
    step: "01",
    icon: "upload_file",
    title: "Input / Unggah KK",
    desc: "Panitia atau pendaftar mengunggah foto/scan Kartu Keluarga (JPG/PNG) atau memilih skenario sampel uji berkas.",
  },
  {
    step: "02",
    icon: "document_scanner",
    title: "Pembacaan Data KK Otomatis",
    desc: "Sistem membaca seluruh tabel anggota keluarga, NIK, tanggal terbit KK, dan memilih kandidat usia SMA (15–17 tahun).",
  },
  {
    step: "03",
    icon: "route",
    title: "Perhitungan Jarak & Rute Jalan",
    desc: "Koordinat alamat KK dihitung terhadap lokasi sekolah tujuan menggunakan pengukuran garis lurus dan rute jalan darat aktual.",
  },
  {
    step: "04",
    icon: "policy",
    title: "Deteksi Kecurangan & Titip KK",
    desc: "Sistem mengevaluasi usia domisili KK (<1 tahun), status hubungan keluarga (Anak Kandung vs Famili Lain), dan jenis bangunan tempat tinggal.",
  },
  {
    step: "05",
    icon: "gavel",
    title: "Keputusan & Peninjauan Panitia",
    desc: "Status kelayakan berkas terbit otomatis dan dapat ditinjau atau ditetapkan ulang melalui Dashboard Pengawas Panitia.",
  },
];

/** Seksi 3 — 5 Tahap Alur Verifikasi (card horizontal) */
export function VerificationStepsSection() {
  return (
    <section
      id="alur-verifikasi"
      data-gsap="home-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14"
    >
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
          Alur Verifikasi Otomatis
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
          5 Tahap Alur Kerja Verifikasi &amp; Deteksi Kecurangan Zonasi-Agent
        </h2>
        <p className="text-sm text-[#475569]">
          Dirancang agar Panitia PPDB maupun orang tua siswa dapat menguji kelayakan berkas Kartu
          Keluarga secara transparan, objektif, dan bebas manipulasi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {VERIFICATION_STEPS.map((item, idx) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
            className="relative bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md hover:border-[#1E3A8A]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-sm ring-4 ring-[#F59E0B]/30">
                  <span className="material-symbols-outlined text-[22px] text-[#F59E0B]">{item.icon}</span>
                </div>
                <span className="font-code-sm text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">
                  TAHAP {item.step}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#1E293B] mb-1.5">
                {idx + 1}. {item.title}
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">{item.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-semibold text-[#1E3A8A]">
              <span>Otomatis &amp; Terukur</span>
              <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">arrow_forward</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
