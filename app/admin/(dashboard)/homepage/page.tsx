"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2 } from "lucide-react";

export default function AdminHomepageConfigPage() {
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [centersCount, setCentersCount] = useState(12);
  const [projectsCount, setProjectsCount] = useState(500);
  const [clientsCount, setClientsCount] = useState(300);
  const [yearsCount, setYearsCount] = useState(20);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch initial homepage config from API or seed defaults
    setHeadline("Menghubungkan Riset Akademik & Inovasi Industri Terdepan");
    setSubheadline("UC Centers menghadirkan solusi kolaboratif melalui riset berstandar internasional, konsultasi bisnis strategis, dan pelatihan terpadu.");
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      // Simulate endpoint update
      await new Promise((res) => setTimeout(res, 600));
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Konten Beranda</h1>
          <p className="text-xs text-slate-500 mt-0.5">Konfigurasi hero section, trust strip counter, dan partner showcase.</p>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Konten Beranda berhasil diperbarui!</span>
        </div>
      )}

      {/* Hero Section Copy */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-base text-[#003366]">Hero Section</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Headline Utama</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Headline / Deskripsi</label>
          <textarea
            rows={3}
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
      </Card>

      {/* Trust Strip Counter Metrics */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-base text-[#003366]">Trust Strip Metrics Counter</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Center</label>
            <input
              type="number"
              value={centersCount}
              onChange={(e) => setCentersCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Proyek</label>
            <input
              type="number"
              value={projectsCount}
              onChange={(e) => setProjectsCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Mitra Client</label>
            <input
              type="number"
              value={clientsCount}
              onChange={(e) => setClientsCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pengalaman</label>
            <input
              type="number"
              value={yearsCount}
              onChange={(e) => setYearsCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </Card>
    </form>
  );
}
