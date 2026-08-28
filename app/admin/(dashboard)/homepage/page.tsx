"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, AlertCircle, Layout, BarChart2 } from "lucide-react";

export default function AdminHomepageConfigPage() {
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");

  const [stat1Number, setStat1Number] = useState("12");
  const [stat1Label, setStat1Label] = useState("CENTER OF EXCELLENCE");

  const [stat2Number, setStat2Number] = useState("500+");
  const [stat2Label, setStat2Label] = useState("PROYEK SELESAI");

  const [stat3Number, setStat3Number] = useState("300+");
  const [stat3Label, setStat3Label] = useState("MITRA KORPORASI");

  const [stat4Number, setStat4Number] = useState("20");
  const [stat4Label, setStat4Label] = useState("TAHUN PENGALAMAN");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/homepage");
      if (res.ok) {
        const data = await res.json();
        setHeroHeadline(data.hero_headline || "Menghubungkan Riset Akademik & Inovasi Industri Terdepan");
        setHeroSubheadline(data.hero_subheadline || "UC Centers menghadirkan solusi kolaboratif...");
        setHeroImageUrl(data.hero_image_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80");

        setStat1Number(data.stat1_number || "12");
        setStat1Label(data.stat1_label || "CENTER OF EXCELLENCE");

        setStat2Number(data.stat2_number || "500+");
        setStat2Label(data.stat2_label || "PROYEK SELESAI");

        setStat3Number(data.stat3_number || "300+");
        setStat3Label(data.stat3_label || "MITRA KORPORASI");

        setStat4Number(data.stat4_number || "20");
        setStat4Label(data.stat4_label || "TAHUN PENGALAMAN");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const payload = {
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline,
        hero_image_url: heroImageUrl,
        stat1_number: stat1Number,
        stat1_label: stat1Label,
        stat2_number: stat2Number,
        stat2_label: stat2Label,
        stat3_number: stat3Number,
        stat3_label: stat3Label,
        stat4_number: stat4Number,
        stat4_label: stat4Label,
      };

      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan perubahan ke database.");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Memuat konfigurasi beranda...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Konten Beranda</h1>
          <p className="text-xs text-slate-500 mt-0.5">Ubah teks headline, deskripsi hero, foto hero, dan 4 label metrik pencapaian (Trust Strip).</p>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Konten Beranda berhasil diperbarui dan langsung tampil di halaman depan!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Section Copy & Image */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-base text-[#003366] flex items-center gap-2">
          <Layout className="w-4 h-4 text-[#0b64b4]" />
          <span>Pengaturan Hero Section Utama</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Utama (Headline Hero)</label>
          <input
            type="text"
            required
            value={heroHeadline}
            onChange={(e) => setHeroHeadline(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
            placeholder="Contoh: Menghubungkan Riset Akademik & Inovasi Industri Terdepan"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat (Sub-Headline)</label>
          <textarea
            rows={3}
            required
            value={heroSubheadline}
            onChange={(e) => setHeroSubheadline(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
            placeholder="Deskripsi singkat layanan UC Centers..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Utama Hero Section</label>
          <input
            type="url"
            required
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
          />
          {heroImageUrl && (
            <div className="mt-2 relative w-48 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <Image src={heroImageUrl} alt="Hero Preview" fill sizes="200px" className="object-cover" />
            </div>
          )}
        </div>
      </Card>

      {/* Trust Strip Counter Metrics & Custom Labels */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-base text-[#003366] flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#0b64b4]" />
          <span>Metrik Pencapaian & Label Trust Strip</span>
        </h2>
        <p className="text-xs text-slate-500">Anda dapat mengubah angka maupun kalimat label yang muncul pada kotak biru di Beranda.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Stat 1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-[#003366]">Metrik Item 1</div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Angka / Jumlah</label>
              <input
                type="text"
                required
                value={stat1Number}
                onChange={(e) => setStat1Number(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: 12"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teks Label</label>
              <input
                type="text"
                required
                value={stat1Label}
                onChange={(e) => setStat1Label(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: CENTER OF EXCELLENCE"
              />
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-[#003366]">Metrik Item 2</div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Angka / Jumlah</label>
              <input
                type="text"
                required
                value={stat2Number}
                onChange={(e) => setStat2Number(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: 500+"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teks Label</label>
              <input
                type="text"
                required
                value={stat2Label}
                onChange={(e) => setStat2Label(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: PROYEK SELESAI"
              />
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-[#003366]">Metrik Item 3</div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Angka / Jumlah</label>
              <input
                type="text"
                required
                value={stat3Number}
                onChange={(e) => setStat3Number(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: 300+"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teks Label</label>
              <input
                type="text"
                required
                value={stat3Label}
                onChange={(e) => setStat3Label(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: MITRA KORPORASI"
              />
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-xs text-[#003366]">Metrik Item 4</div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Angka / Jumlah</label>
              <input
                type="text"
                required
                value={stat4Number}
                onChange={(e) => setStat4Number(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: 20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teks Label</label>
              <input
                type="text"
                required
                value={stat4Label}
                onChange={(e) => setStat4Label(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                placeholder="Contoh: TAHUN PENGALAMAN"
              />
            </div>
          </div>
        </div>
      </Card>
    </form>
  );
}
