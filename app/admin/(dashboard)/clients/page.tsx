"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [centerId, setCenterId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [resClients, resCenters] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/centers"),
      ]);

      if (resClients.ok) setClients(await resClients.json());
      if (resCenters.ok) setCenters(await resCenters.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate file extensions
    const lowerUrl = logoUrl.toLowerCase();
    if (!lowerUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i) && !lowerUrl.includes("images.unsplash.com")) {
      setError("Format logo wajib bertipe JPG, PNG, atau WEBP.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl, centerId: centerId || null }),
      });

      if (!res.ok) throw new Error("Gagal menambah logo mitra.");

      setName("");
      setLogoUrl("");
      setCenterId("");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus logo mitra ini?")) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Logo Mitra Kerja Sama</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola logo perusahaan (JPG, PNG, WEBP) yang tampil pada Marquee Banner Beranda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Add Client Logo Form */}
        <Card className="lg:col-span-4 p-6 space-y-4 h-fit">
          <h2 className="font-bold text-base text-[#003366] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Logo Mitra Baru</span>
          </h2>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Instansi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: PT Ciputra Development Tbk"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Logo (Wajib JPG, PNG, WEBP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo-perusahaan.png"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Penempatan Logo</label>
              <select
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Global (Tampil di Marquee Beranda)</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>Khusus: {c.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Menyimpan..." : "Simpan Logo Mitra"}
            </Button>
          </form>
        </Card>

        {/* Client Logos List */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <h2 className="font-bold text-base text-[#003366]">Daftar Mitra Terdaftar ({clients.length})</h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data mitra...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Belum ada logo mitra terdaftar.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {clients.map((c) => (
                <div key={c.id} className="relative p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-between text-center space-y-3 group">
                  <div className="relative w-full h-16 bg-white rounded-lg p-2 border flex items-center justify-center">
                    <Image src={c.logoUrl} alt={c.name} fill sizes="120px" className="object-contain p-1" />
                  </div>

                  <div className="w-full text-center">
                    <div className="font-bold text-xs text-[#111c2d] truncate">{c.name}</div>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      {c.center ? c.center.name : "Marquee Beranda"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    title="Hapus Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
