"use client";

import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Popup konfirmasi keberhasilan — dipakai form Kontak dan modal Konsultasi.
 * Sebelumnya keberhasilan hanya mengganti isi form di tempat, sehingga di
 * layar panjang pengguna tidak melihat apa pun berubah setelah menekan kirim.
 */
export function SuccessDialog({
  isOpen,
  onClose,
  title,
  description,
  actionLabel = "Tutup",
  onAction,
  secondaryLabel,
  onSecondary,
}: SuccessDialogProps) {
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    // Fokus dipindah ke tombol utama supaya pengguna keyboard & pembaca layar
    // langsung mendapat konteks dialognya.
    actionRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
        </div>

        <h3 id="success-dialog-title" className="mt-5 text-xl font-bold text-[#111c2d]">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        )}

        <button
          ref={actionRef}
          type="button"
          onClick={onAction ?? onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#233e95] to-[#0b64b4] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0b64b4]/25 transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#0b64b4] focus:ring-offset-2"
        >
          {actionLabel}
        </button>

        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary ?? onClose}
            className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
