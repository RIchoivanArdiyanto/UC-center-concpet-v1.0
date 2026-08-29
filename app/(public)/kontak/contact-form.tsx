"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Send, AlertCircle } from "lucide-react";

const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };

/**
 * Bagian interaktif halaman Kontak.
 *
 * Dipisah dari page.tsx supaya halamannya bisa menjadi server component dan
 * membaca informasi kontak langsung dari database. Sebelumnya seluruh halaman
 * ber-"use client", sehingga alamat & telepon terpaksa ditulis permanen di
 * dalam kode dan hanya bisa diubah lewat deploy ulang.
 */
export function ContactForm() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const setField = (field: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "GENERAL_CONSULTATION" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Pesan galat dari server ditampilkan apa adanya supaya pengunjung tahu
        // apa yang harus diperbaiki, bukan "Gagal mengirim pesan." yang generik.
        throw new Error(data?.error || "Gagal mengirim pesan. Silakan coba lagi.");
      }

      setSubmitted(true);
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="k-name" className="field-label">
            Nama Lengkap <span className="text-rose-500">*</span>
          </label>
          <input
            id="k-name"
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={setField("name")}
            placeholder="Contoh: Dr. Ir. Budi Santoso"
            className="field"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="k-email" className="field-label">
              Email Resmi <span className="text-rose-500">*</span>
            </label>
            <input
              id="k-email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={setField("email")}
              placeholder="nama@perusahaan.com"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="k-phone" className="field-label">
              Telepon / WhatsApp
            </label>
            <input
              id="k-phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={setField("phone")}
              placeholder="081234567890"
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="k-subject" className="field-label">
            Subjek <span className="text-rose-500">*</span>
          </label>
          <input
            id="k-subject"
            type="text"
            required
            value={formData.subject}
            onChange={setField("subject")}
            placeholder="Contoh: Konsultasi Audit Teknologi Manufaktur"
            className="field"
          />
        </div>

        <div>
          <label htmlFor="k-message" className="field-label">
            Pesan &amp; Rincian Kebutuhan <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="k-message"
            required
            rows={5}
            value={formData.message}
            onChange={setField("message")}
            placeholder="Jelaskan kebutuhan riset, konsultasi bisnis, atau program pelatihan organisasi Anda secara detail..."
            className="field resize-y"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            "Mengirim..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Kirim Pesan Konsultasi
            </>
          )}
        </Button>
      </form>

      <SuccessDialog
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title="Pesan berhasil terkirim"
        description="Permohonan Anda sudah masuk ke tim UC Centers. Kami akan menghubungi Anda melalui email atau telepon dalam 1×24 jam kerja."
        actionLabel="Selesai"
        secondaryLabel="Kirim pesan lain"
        onSecondary={() => setSubmitted(false)}
      />
    </>
  );
}
