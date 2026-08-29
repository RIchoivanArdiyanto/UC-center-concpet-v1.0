"use client";

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Pengganti `window.confirm()` yang sebelumnya dipakai untuk semua aksi hapus di
 * panel admin. Dialog bawaan browser memblokir tab, tidak bisa diberi gaya, dan
 * tidak bisa menampilkan nama data yang akan dihapus — sehingga mudah salah klik.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#111c2d]">{title}</h3>
            {description && (
              <div className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
