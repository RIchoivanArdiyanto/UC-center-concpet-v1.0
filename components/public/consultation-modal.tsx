"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SuccessDialog } from "@/components/ui/success-dialog";
import { Send, AlertCircle } from "lucide-react";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerId?: string;
  centerName?: string;
  source?: "HOMEPAGE" | "CENTER_DETAIL" | "GENERAL_CONSULTATION";
}

const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };

export function ConsultationModal({
  isOpen,
  onClose,
  centerId,
  centerName,
  source = "GENERAL_CONSULTATION",
}: ConsultationModalProps) {
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
        body: JSON.stringify({
          ...formData,
          // Bila diajukan dari halaman center, nama center dipakai sebagai
          // subjek default agar admin langsung tahu konteks permohonannya.
          subject: formData.subject || (centerName ? `Kerja sama — ${centerName}` : ""),
          centerId,
          source,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengirim permohonan konsultasi.");
      }

      // Form modal ditutup dan diganti dialog sukses, supaya pengunjung dapat
      // konfirmasi yang jelas, bukan sekadar isian yang tiba-tiba kosong.
      setFormData(EMPTY_FORM);
      setSubmitted(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError("");
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={centerName ? `Ajukan Kerja Sama — ${centerName}` : "Konsultasi & Layanan UC Centers"}
      >
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
            <label htmlFor="c-name" className="field-label">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              id="c-name"
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
              <label htmlFor="c-email" className="field-label">
                Email Resmi <span className="text-rose-500">*</span>
              </label>
              <input
                id="c-email"
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
              <label htmlFor="c-phone" className="field-label">
                Telepon / WhatsApp
              </label>
              <input
                id="c-phone"
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
            <label htmlFor="c-subject" className="field-label">
              Subjek
            </label>
            <input
              id="c-subject"
              type="text"
              value={formData.subject}
              onChange={setField("subject")}
              placeholder={centerName ? `Kerja sama — ${centerName}` : "Topik permohonan Anda"}
              className="field"
            />
          </div>

          <div>
            <label htmlFor="c-message" className="field-label">
              Pesan / Kebutuhan Konsultasi <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="c-message"
              required
              rows={4}
              value={formData.message}
              onChange={setField("message")}
              placeholder="Jelaskan secara singkat topik riset, pelatihan, atau konsultasi yang Anda butuhkan..."
              className="field resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                "Mengirim..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Permohonan
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <SuccessDialog
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title="Permohonan terkirim"
        description="Tim UC Centers akan menghubungi Anda melalui email atau telepon dalam 1×24 jam kerja."
        actionLabel="Selesai"
      />
    </>
  );
}
