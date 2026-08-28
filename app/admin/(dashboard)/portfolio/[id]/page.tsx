"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminPortfolioEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";

  const [centers, setCenters] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);

  const [centerId, setCenterId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [caseStudyContent, setCaseStudyContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/centers")
      .then((res) => res.json())
      .then((data) => {
        setCenters(data);
        if (data.length > 0 && !centerId) setCenterId(data[0].id);
      });

    fetch("/api/admin/expertise")
      .then((res) => res.json())
      .then((data) => setAllTags(data));

    if (!isNew) {
      fetch("/api/admin/portfolio")
        .then((res) => res.json())
        .then((projects) => {
          const p = projects.find((item: any) => item.id === params.id);
          if (p) {
            setCenterId(p.centerId);
            setTitle(p.title);
            setSummary(p.summary || "");
            setCaseStudyContent(p.caseStudyContent || "");
            setCoverImageUrl(p.coverImageUrl || "");
            setVideoEmbedUrl(p.videoEmbedUrl || "");
            setIsHighlighted(p.isHighlighted ?? false);
            setIsPublished(p.isPublished ?? true);
            if (p.expertiseTags) {
              setSelectedTagIds(p.expertiseTags.map((et: any) => et.tagId));
            }
          }
        });
    }
  }, [isNew, params.id]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        centerId,
        title,
        summary,
        caseStudyContent,
        coverImageUrl,
        videoEmbedUrl,
        isHighlighted,
        isPublished,
        tagIds: selectedTagIds,
      };

      const url = isNew ? "/api/admin/portfolio" : `/api/admin/portfolio/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan proyek.");

      router.push("/admin/portfolio");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
          <h1 className="text-2xl font-extrabold text-[#003366]">
            {isNew ? "Tambah Proyek Baru" : "Edit Portfolio Proyek"}
          </h1>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Proyek"}
        </Button>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Detail Proyek</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Center Pemilik <span className="text-rose-500">*</span></label>
              <select
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Proyek <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Transformasi Digital dan Otomatisasi Perbankan"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Dampak / Excerpt</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Jelaskan secara singkat latar belakang dan dampak hasil kerja sama..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Studi Kasus Lengkap (Rich Text)</h2>
            <TiptapEditor content={caseStudyContent} onChange={setCaseStudyContent} />
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Pengaturan Tampilan</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Tampilkan di Beranda (Highlight)</span>
                <input
                  type="checkbox"
                  checked={isHighlighted}
                  onChange={(e) => setIsHighlighted(e.target.checked)}
                  className="w-4 h-4 accent-[#0b64b4]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Status Published</span>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#0b64b4]"
                />
              </label>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Taksonomi Expertise</h2>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => {
                const sel = selectedTagIds.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => handleToggleTag(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      sel ? "bg-[#0b64b4] text-white border-[#0b64b4]" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {t.name} {sel && "✓"}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Media Cover & Embed</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Gambar Cover</label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Embed Video (Opsional)</label>
              <input
                type="url"
                value={videoEmbedUrl}
                onChange={(e) => setVideoEmbedUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
