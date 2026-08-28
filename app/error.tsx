"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-2xl font-bold text-[#003366]">Terjadi Kendala Teknis</h2>
      <p className="text-xs text-slate-500 max-w-md">
        Sistem sedang memulihkan halaman secara otomatis. Silakan coba muat ulang halaman.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => reset()} variant="primary">
          Coba Muat Ulang
        </Button>
        <Link href="/">
          <Button variant="outline">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
