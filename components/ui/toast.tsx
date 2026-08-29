"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { clsx } from "clsx";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; variant: ToastVariant; title: string; description?: string };

type ToastContextValue = {
  toast: (t: { variant?: ToastVariant; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Umpan balik aksi di panel admin. Sebelumnya semua halaman admin memakai
 * `alert()` bawaan browser (atau tidak memberi kabar sama sekali), yang memblokir
 * halaman dan tidak bisa dibedakan antara sukses dan gagal.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ variant = "info", title, description }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, variant, title, description }]);
      window.setTimeout(() => dismiss(id), variant === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ variant: "success", title, description }),
      error: (title, description) => toast({ variant: "error", title, description }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const VARIANT_STYLE: Record<ToastVariant, { ring: string; icon: React.ElementType; tone: string }> = {
  success: { ring: "border-emerald-200", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  error: { ring: "border-rose-200", icon: AlertCircle, tone: "text-rose-600 bg-rose-50" },
  info: { ring: "border-slate-200", icon: Info, tone: "text-[#0b64b4] bg-blue-50" },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const style = VARIANT_STYLE[toast.variant];
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-xl animate-slide-up",
        style.ring
      )}
    >
      <span className={clsx("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", style.tone)}>
        <Icon className="h-4.5 w-4.5" />
      </span>

      <div className="min-w-0 flex-grow">
        <div className="text-sm font-bold text-[#111c2d]">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
            {toast.description}
          </div>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="flex-shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}
