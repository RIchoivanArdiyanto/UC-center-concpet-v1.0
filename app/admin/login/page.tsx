"use client";

import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error || !res?.ok) {
        throw new Error("Email atau password tidak cocok.");
      }

      // Hard redirect to ensure session token cookie is committed
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat autentikasi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#003366] via-[#233e95] to-[#0b64b4] p-4">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 p-8 space-y-6">
        {/* Header with Official UC Logo */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-amber-400 p-1 mx-auto shadow-lg flex items-center justify-center">
            <Image
              src="/logo-uc.png"
              alt="Universitas Ciputra Logo"
              width={72}
              height={72}
              priority
              style={{ width: "72px", height: "72px", objectFit: "contain" }}
            />
          </div>
          <h1 className="text-2xl font-extrabold text-[#003366] pt-2">UC Centers Admin</h1>
          <p className="text-xs text-slate-500">Masuk untuk mengelola data center, mitra, proyek & artikel</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Admin</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@uccenters.id"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <a href="#" className="text-[11px] font-semibold text-[#0b64b4] hover:underline">
                Lupa Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? (
              "Memproses Login..."
            ) : (
              <>
                <span>Masuk Sistem</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Password Credentials Box */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-slate-700 space-y-1">
          <div className="font-bold text-[#003366]">Kredensial Login Default:</div>
          <div>Email: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[#0b64b4] font-bold">admin@uccenters.id</code></div>
          <div>Password: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[#0b64b4] font-bold">Password123!</code></div>
        </div>
      </div>

      {/* Version Watermark */}
      <div className="mt-8 text-white/70 text-xs font-medium">
        UC Centers Administration Platform — <strong className="text-white">v2.1.0</strong>
      </div>
    </div>
  );
}
