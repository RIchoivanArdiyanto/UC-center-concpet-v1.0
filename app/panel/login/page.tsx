"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";


function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/panel/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });

      if (res?.error || !res?.ok) {
        // Pesan dari server (mis. kena rate limit) ditampilkan apa adanya;
        // selain itu dipakai pesan netral yang tidak membocorkan apakah
        // username-nya ada atau tidak.
        throw new Error(
          res?.error && res.error !== "CredentialsSignin"
            ? res.error
            : "Username/email atau password tidak cocok."
        );
      }

      // Redirect keras agar cookie sesi benar-benar tertulis sebelum halaman
      // berikutnya membacanya. Tujuan dibatasi ke path internal supaya
      // parameter callbackUrl tidak bisa dipakai mengarahkan ke situs lain.
      const safeTarget = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/panel/dashboard";
      window.location.href = safeTarget;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat autentikasi.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-tr from-[#00284f] via-[#233e95] to-[#0b64b4] p-4">
      {/* Ornamen latar lembut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#0b64b4]/30 blur-3xl"
      />

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-white/20 bg-white p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-white p-1 shadow-lg">
            <Image
              src="/logo-uc.png"
              alt="Logo Universitas Ciputra"
              width={72}
              height={72}
              priority
              style={{ width: "72px", height: "72px", objectFit: "contain" }}
            />
          </div>
          <h1 className="pt-2 text-2xl font-extrabold text-[#003366]">UC Centers Admin</h1>
          <p className="text-xs text-slate-500">
            Masuk untuk mengelola data center, mitra, proyek &amp; artikel
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="field-label">
              Username atau Email
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="masukkan username atau email"
                className="field pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-2 top-1.5 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#233e95] to-[#0b64b4] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0b64b4]/25 transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? (
              "Memproses login..."
            ) : (
              <>
                <span>Masuk Sistem</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Kotak "Kredensial Login Default" sebelumnya menampilkan email dan
            password admin di halaman yang bisa diakses siapa pun. Dihapus —
            kredensial diberikan lewat jalur pribadi, bukan dipajang di UI. */}
        <p className="text-center text-[11px] leading-relaxed text-slate-400">
          Akses panel hanya untuk pengelola terdaftar. Hubungi administrator sistem
          bila Anda belum memiliki akun.
        </p>
      </div>

      <div className="mt-8 text-xs font-medium text-white/70">
        UC Centers Administration Platform — <strong className="text-white">v2.1.0</strong>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  // useSearchParams butuh Suspense boundary di App Router.
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#00284f]" />}>
      <LoginForm />
    </Suspense>
  );
}
