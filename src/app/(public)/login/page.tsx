"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";

export default function PanitiaLoginPage() {
  const router = useRouter();
  const authMutation = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("panitia.ppdb@sman12-sby.sch.id");
  const [password, setPassword] = useState("PanitiaPPDB2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nip, setNip] = useState("");
  const [roleTitle, setRoleTitle] = useState("AUDITOR_FORENSIK");
  const [schoolName, setSchoolName] = useState("SMA Negeri 12 Surabaya");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await authMutation.mutateAsync({
        action: mode,
        email,
        password,
        fullName,
        nip,
        role: roleTitle,
      });
      setSuccessMsg(
        mode === "register"
          ? "Registrasi Akun Panitia Berhasil! Mengalihkan ke Dashboard..."
          : "Login Berhasil! Mengalihkan ke Dashboard Pengawas...",
      );
      // ponytail: hard navigation ensures Next.js proxy middleware immediately reads the newly set zonasi_session HttpOnly cookie without RSC cache bounce
      window.location.assign("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(String(err.response.data.error));
      } else {
        setError(String(err));
      }
    }
  };
  const loading = authMutation.isPending;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14 bg-[#F8FAFC]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-lg bg-[#FFFFFF]">
        {/* Left Brand Panel — Biru Navy #1E3A8A + Pola Geometris + Aksen Amber #F59E0B */}
        <div
          className="lg:col-span-5 bg-[#1E3A8A] text-white p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(155deg, #1E3A8A 0%, #172554 100%)",
            backgroundSize: "22px 22px, 100% 100%",
          }}
        >
          <div className="space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-extrabold text-[#F59E0B]">
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              <span>PORTAL OTORITAS PANITIA</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
                Zonasi-Agent <span className="text-[#F59E0B]">Portal Panitia</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/85 mt-2 leading-relaxed">
                Akses khusus <strong>Panitia Verifikator &amp; Pengawas PPDB</strong> untuk memeriksa hasil pemindaian Kartu Keluarga, memantau peta radius zonasi, menetapkan keputusan berkas, serta mengunduh Berita Acara resmi.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#F59E0B] text-[18px] mt-0.5">
                  fact_check
                </span>
                <div className="text-xs">
                  <div className="font-bold text-white">Pemeriksaan 3 Tahap &amp; Keputusan Panitia</div>
                  <div className="text-white/75">
                    Setujui berkas bersyarat (SKPWNI) atau tolak berkas yang terindikasi titip KK secara langsung.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#F59E0B] text-[18px] mt-0.5">
                  my_location
                </span>
                <div className="text-xs">
                  <div className="font-bold text-white">Sekolah Tujuan Zonasi</div>
                  <div className="text-white/75">
                    SMA Negeri 12 Surabaya (-7.2468, 112.6358 • Radius Zonasi 1.200 m).
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80 relative z-10">
            <span>Akses Resmi Panitia Verifikator</span>
            <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-[#1E293B] font-bold">
              PORTAL TERPROTEKSI
            </span>
          </div>
        </div>

        {/* Right Form Panel — Putih Bersih #FFFFFF */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-[#FFFFFF]">
          <div>
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                  mode === "login"
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "text-[#475569] hover:text-[#1E293B]"
                }`}
              >
                Masuk Akun Panitia
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
                  mode === "register"
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "text-[#475569] hover:text-[#1E293B]"
                }`}
              >
                Registrasi Panitia Baru
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                      Nama Lengkap &amp; Gelar Verifikator
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Drs. Hendra Wijaya, M.Pd."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                        NIP / ID Petugas
                      </label>
                      <input
                        type="text"
                        required
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="19820412 200901 1 004"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-code-sm text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                        Jabatan Kepanitiaan
                      </label>
                      <select
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                      >
                        <option value="KETUA_VERIFIKATOR">Ketua Verifikator</option>
                        <option value="AUDITOR_FORENSIK">Auditor Forensik AI</option>
                        <option value="OPERATOR_PPDB">Operator Verifikasi PPDB</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                      Instansi / Sekolah Tujuan
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                  Email Kedinasan / Panitia Verifikator
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sman12-sby.sch.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1E293B] mb-1.5">
                  Kata Sandi Otoritas (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm text-[#1E293B] focus:bg-[#FFFFFF] focus:border-[#1E3A8A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#EFF6FF] border border-[#CBD5E1] text-xs font-bold text-[#1E3A8A] flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] text-sm font-extrabold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mode === "login" ? "login" : "person_add"}
                </span>
                <span>
                  {loading
                    ? "Memverifikasi Kredensial Panitia..."
                    : mode === "login"
                    ? "Masuk ke Dashboard Pengawas Panitia"
                    : "Daftarkan Akun Panitia & Masuk"}
                </span>
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
            <span>
              Akun Demo Panitia: <code className="font-code-sm font-bold text-[#1E3A8A]">panitia.ppdb@sman12-sby.sch.id</code>
            </span>
            <span className="font-code-sm text-[#16A34A] font-bold">
              ✓ Sesi Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
