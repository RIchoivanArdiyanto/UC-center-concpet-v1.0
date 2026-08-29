"use client";

import React, { useId, useRef, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { UploadCloud, X, Link2, FileText, Loader2 } from "lucide-react";
import { ACCEPT_DOCUMENT, ACCEPT_IMAGE } from "@/lib/upload-constants";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** "image" menampilkan pratinjau gambar, "document" untuk PDF. */
  kind?: "image" | "document";
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Pemilih berkas untuk form admin.
 *
 * Sebelumnya setiap gambar hanya bisa diisi dengan menempel URL eksternal —
 * artinya konten situs bergantung pada server orang lain yang bisa mati atau
 * mengganti gambarnya kapan saja. Komponen ini mengunggah berkas ke server
 * sendiri, sambil tetap menerima URL untuk konten yang memang di-host di luar.
 */
export function FileUploadField({
  label,
  value,
  onChange,
  kind = "image",
  hint,
  required,
  disabled,
}: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  const accept = kind === "image" ? ACCEPT_IMAGE : ACCEPT_DOCUMENT;

  const upload = async (file: File) => {
    setUploading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal mengunggah berkas.");

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah berkas.");
    } finally {
      setUploading(false);
      // Reset supaya berkas yang sama bisa dipilih ulang setelah dihapus.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const isUploadedLocally = value.startsWith("/uploads/");

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#0b64b4] hover:underline"
        >
          <Link2 className="h-3 w-3" />
          {urlMode ? "Unggah berkas" : "Pakai URL"}
        </button>
      </div>

      {urlMode ? (
        <input
          id={inputId}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://contoh.com/gambar.jpg"
          className="field"
        />
      ) : value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {kind === "image" ? (
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {/* unoptimized: berkas lokal sudah kecil dan pratinjau ini hanya
                  muncul di panel admin, jadi tidak perlu pipeline optimasi. */}
              <Image src={value} alt="" fill sizes="64px" className="object-cover" unoptimized />
            </div>
          ) : (
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500">
              <FileText className="h-7 w-7" />
            </span>
          )}

          <div className="min-w-0 flex-grow">
            <div className="truncate text-xs font-semibold text-[#111c2d]">
              {isUploadedLocally ? "Tersimpan di server" : "Sumber eksternal"}
            </div>
            <div className="truncate font-mono text-[11px] text-slate-400">{value}</div>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label={`Hapus ${label}`}
            className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            "rounded-lg border-2 border-dashed p-5 text-center transition",
            dragging ? "border-[#0b64b4] bg-blue-50/60" : "border-slate-300 bg-slate-50/60",
            (disabled || uploading) && "opacity-60"
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            className="sr-only"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#0b64b4]" />
              <span className="text-xs font-semibold">Mengunggah...</span>
            </div>
          ) : (
            <label htmlFor={inputId} className="flex cursor-pointer flex-col items-center gap-1.5">
              <UploadCloud className="h-7 w-7 text-slate-400" />
              <span className="text-xs font-semibold text-[#0b64b4]">
                Pilih berkas
              </span>
              <span className="text-[11px] text-slate-500">atau seret ke sini</span>
              <span className="mt-1 text-[10px] text-slate-400">
                {kind === "image" ? "JPG, PNG, atau WEBP · maks 5 MB" : "PDF · maks 10 MB"}
              </span>
            </label>
          )}
        </div>
      )}

      {hint && !error && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
