"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("panitia.ppdb@sman12-sby.sch.id");
  const [password, setPassword] = useState("Panitia2026!");
  const [fullName, setFullName] = useState("Drs. H. Bambang Sudibyo, M.Pd");
  const [nip, setNip] = useState("197608142003121004");
  const [role, setRole] = useState("KETUA_VERIFIKATOR");
  const auth = useAuth();
  const loading = auth.isPending;
  const error = auth.error?.message ?? null;
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    const data = await auth
      .mutateAsync({ action: mode, email, password, fullName, nip, role })
      .catch(() => null); // error message is exposed via auth.error
    if (!data) return;
    setSuccessMsg(
      mode === "register"
        ? `Akun ${data.user.full_name} berhasil terdaftar di Supabase Auth! Mengalihkan ke Dashboard...`
        : `Selamat datang kembali, ${data.user.full_name}! Mengalihkan ke Dashboard...`,
    );
    setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <div className="bg-surface-slate flex items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-4xl bg-surface-canvas rounded-2xl shadow-lg border border-border-slate overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Civic Identity Banner */}
          <div className="lg:col-span-5 bg-primary text-on-primary p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 flex flex-col gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/30 text-on-primary font-code-sm text-[11px] w-fit border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SUPABASE AUTHENTICATION
              </span>
              <h1 className="font-headline-md text-headline-md font-bold leading-snug text-white">
                Portal Otoritas Panitia & Verifikator PPDB
              </h1>
              <p className="font-body-sm text-body-sm text-slate-300 leading-relaxed">
                Seluruh tindakan investigasi kecurangan, verifikasi berkas bersyarat, dan override keputusan panitia pada PPDB SMA Negeri 12 Surabaya dicatat dalam audit trail berkekuatan hukum dengan identitas NIP terverifikasi.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex flex-col gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified_user</span>
                <span>Terintegrasi langsung ke tabel <code>auth.users</code> Supabase Cloud</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-sky-400 text-[18px]">gavel</span>
                <span>Otorisasi berita acara diskualifikasi & sinkronisasi Dukcapil</span>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-slate border border-border-slate mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  auth.reset();
                  setSuccessMsg(null);
                }}
                className={
                  mode === "login"
                    ? "py-2.5 rounded-lg bg-surface-canvas text-text-heading font-label-lg text-label-lg font-bold shadow-sm transition-all"
                    : "py-2.5 rounded-lg text-text-muted hover:text-text-heading font-label-lg text-label-lg transition-all"
                }
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  auth.reset();
                  setSuccessMsg(null);
                }}
                className={
                  mode === "register"
                    ? "py-2.5 rounded-lg bg-surface-canvas text-text-heading font-label-lg text-label-lg font-bold shadow-sm transition-all"
                    : "py-2.5 rounded-lg text-text-muted hover:text-text-heading font-label-lg text-label-lg transition-all"
                }
              >
                Daftar Akun Baru (Register)
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block font-label-md text-label-md text-text-heading mb-1.5">
                      Nama Lengkap & Gelar Verifikator
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Drs. H. Bambang Sudibyo, M.Pd"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-slate border border-border-slate text-text-heading font-body-sm focus:bg-surface-canvas focus:border-secondary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-label-md text-label-md text-text-heading mb-1.5">
                        NIP / Nomor Induk Panitia
                      </label>
                      <input
                        type="text"
                        required
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="197608142003121004"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-slate border border-border-slate text-text-heading font-code-sm focus:bg-surface-canvas focus:border-secondary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-text-heading mb-1.5">
                        Peran Otoritas
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-slate border border-border-slate text-text-heading font-body-sm focus:bg-surface-canvas focus:border-secondary focus:outline-none"
                      >
                        <option value="KETUA_VERIFIKATOR">Ketua Verifikator</option>
                        <option value="AUDITOR_FORENSIK">Auditor Forensik AI</option>
                        <option value="OPERATOR_PPDB">Operator Verifikasi PPDB</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-label-md text-label-md text-text-heading mb-1.5">
                  Email Kedinasan / Panitia
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sman12-sby.sch.id"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-slate border border-border-slate text-text-heading font-body-sm focus:bg-surface-canvas focus:border-secondary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-text-heading mb-1.5">
                  Kata Sandi (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-24 py-2.5 rounded-lg bg-surface-slate border border-border-slate text-text-heading font-body-sm focus:bg-surface-canvas focus:border-secondary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-surface-canvas hover:bg-surface-container border border-border-slate text-xs font-label-md text-text-heading flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-status-fraud-bg border border-status-fraud-border text-status-fraud font-body-sm text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-status-approved-bg border border-status-approved-border text-status-approved font-body-sm text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-secondary hover:bg-primary text-on-secondary font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mode === "login" ? "login" : "person_add"}
                </span>
                <span>
                  {loading
                    ? "Memproses ke Supabase Auth..."
                    : mode === "login"
                    ? "Masuk ke Dashboard Panitia"
                    : "Daftarkan Akun & Masuk"}
                </span>
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-border-slate flex items-center justify-between text-xs text-text-muted">
              <span>Akun Demo Siap Pakai: <code>panitia.ppdb@sman12-sby.sch.id</code></span>
              <span className="font-code-sm text-secondary">Sesi dikunci HttpOnly Cookie</span>
            </div>
          </div>
        </div>
    </div>
  );
}
