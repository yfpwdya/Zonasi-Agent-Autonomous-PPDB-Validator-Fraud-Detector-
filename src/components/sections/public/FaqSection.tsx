"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const FAQ_ITEMS = [
  {
    q: "Apa fungsi utama Zonasi-Agent bagi Panitia PPDB?",
    a: "Zonasi-Agent adalah sistem verifikasi dan deteksi kecurangan PPDB yang membantu panitia memindai Kartu Keluarga (KK) secara instan, memilih otomatis anggota keluarga usia SMA (15–17 tahun), menghitung jarak rute jalan darat ke sekolah tujuan, dan mendeteksi indikasi kecurangan 'titip KK'.",
  },
  {
    q: "Bagaimana perhitungan jarak domisili ke SMA Negeri 12 Surabaya dilakukan?",
    a: "Alamat pada Kartu Keluarga dipetakan secara otomatis terhadap titik koordinat SMA Negeri 12 Surabaya (-7.2468, 112.6358 dengan batas radius zonasi 1.200 meter) untuk menghitung jarak garis lurus sekaligus jarak rute jalan darat secara presisi.",
  },
  {
    q: "Bagaimana jika KK baru diterbitkan kurang dari 1 tahun karena pindah rumah satu keluarga yang sah?",
    a: "Sistem akan menandai berkas sebagai Perlu Revisi / Verifikasi Berkas Bersyarat dan membuka formulir unggah dokumen resmi seperti SKPWNI Dukcapil, SK Pindah Tugas Orang Tua, atau Foto Rumah Geotag untuk disetujui panitia.",
  },
  {
    q: "Apakah riwayat pemindaian KK pengguna lain dapat dilihat oleh publik?",
    a: "Tidak. Tabel riwayat di halaman depan diisolasi hanya untuk sesi perangkat saat ini dan seluruh digit tengah NIK serta Nomor KK disensor otomatis (contoh: 357806******0004). Seluruh antrean lengkap hanya dapat diakses oleh Panitia resmi di halaman Dashboard.",
  },
];

/** Seksi 8 — Accordion FAQ teknis panitia */
export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq-panitia"
      data-gsap="home-section"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 space-y-8"
    >
      <div className="text-center space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E3A8A] text-xs font-extrabold uppercase tracking-wider">
          Dokumentasi &amp; Tanya Jawab Sistem
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
        <p className="text-sm text-[#475569]">
          Panduan singkat mengenai mekanisme kerja Zonasi-Agent, ketentuan radius zonasi SMA Negeri
          12 Surabaya, dan prosedur verifikasi panitia.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={item.q}
              className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <span className="text-sm sm:text-base font-extrabold text-[#1E293B]">{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="material-symbols-outlined text-[#1E3A8A]"
                >
                  expand_more
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9]">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
