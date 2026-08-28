"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `[Subjek: ${formData.subject}] ${formData.message}`,
          source: "GENERAL_CONSULTATION",
        }),
      });

      if (!res.ok) throw new Error("Gagal mengirim pesan.");

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Hubungi Kami</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003366]">Diskusi & Inisiasi Kerja Sama</h1>
        <p className="text-slate-600 text-sm">
          Sampaikan permohonan konsultasi, riset bersama, atau pelatihan terorganisir kepada tim pakar UC Centers.
        </p>
      </div>

      {/* 2-Column Form & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <Card className="lg:col-span-7 p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-[#003366]">Formulir Konsultasi</h2>

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111c2d]">Pesan Berhasil Terkirim!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Terima kasih. Perwakilan kami akan segera menanggapi permohonan Anda melalui email dalam 1x24 jam kerja.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Kirim Pesan Lain
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Dr. Ir. Budi Santoso"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi Perusahaan / Organisasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subjek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Contoh: Konsultasi Audit Teknologi Manufaktur"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan & Rincian Kebutuhan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Jelaskan kebutuhan riset, konsultasi bisnis, atau program pelatihan organisasi Anda secara detail..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  "Mengirim..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Pesan Konsultasi
                  </>
                )}
              </Button>
            </form>
          )}
        </Card>

        {/* Right Column: HQ Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 bg-gradient-to-br from-[#003366] to-[#233e95] text-white">
            <h2 className="text-xl font-bold text-white">Informasi Kantor Pusat</h2>

            <div className="space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-300 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Alamat Utama</div>
                  <p className="mt-0.5">Jl. Jend. Sudirman Kav. 21, Jakarta Selatan, DKI Jakarta 12930</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-300 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Telepon / WhatsApp</div>
                  <p className="mt-0.5">(021) 555-0199 / +62 812-3456-7890</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-300 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Email Resmi</div>
                  <p className="mt-0.5">contact@uccenters.id</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-300 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Jam Operasional</div>
                  <p className="mt-0.5">Senin – Jumat: 08:00 – 17:00 WIB</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Minimalist Corporate Map Placeholder */}
          <Card className="p-4 space-y-2 text-center bg-white border border-slate-200">
            <div className="relative w-full h-48 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
              <div className="relative z-10 flex flex-col items-center gap-1.5 p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200">
                <MapPin className="w-7 h-7 text-[#0b64b4] animate-bounce" />
                <span className="text-xs font-bold text-[#003366]">UC Centers Headquarters</span>
                <span className="text-[10px] text-slate-500">Jakarta Selatan, Indonesia</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
