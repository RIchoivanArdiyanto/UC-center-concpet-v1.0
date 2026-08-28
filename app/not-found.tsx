import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <h1 className="text-4xl font-extrabold text-[#003366]">404</h1>
      <h2 className="text-xl font-bold text-slate-800">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-slate-500 max-w-md">
        Halaman yang Anda cari tidak tersedia atau alamat URL telah diperbarui.
      </p>
      <div className="pt-2">
        <Link href="/">
          <Button variant="primary">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
