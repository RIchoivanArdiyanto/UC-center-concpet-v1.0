"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { ArrowLeft, Save, Plus, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminArticleEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([]);

  const [newAttName, setNewAttName] = useState("");
  const [newAttUrl, setNewAttUrl] = useState("");

  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isNew) {
      fetch("/api/admin/articles")
        .then((res) => res.json())
        .then((articles) => {
          const a = articles.find((item: any) => item.id === params.id);
          if (a) {
            setTitle(a.title || "");
            setSummary(a.summary || "");
            setContent(a.content || "");
            setCoverImageUrl(a.coverImageUrl || "");
            setCategoryId(a.categoryId || "");
            setStatus(a.status || "DRAFT");
            setSeoTitle(a.seoTitle || "");
            setSeoDescription(a.seoDescription || "");
            if (a.attachments) {
              setAttachments(a.attachments.map((att: any) => ({ fileName: att.fileName, fileUrl: att.fileUrl })));
            }
          }
        });
    }
  }, [isNew, params.id]);

  const handleAddAttachment = () => {
    if (!newAttName || !newAttUrl) return;
    setAttachments((prev) => [...prev, { fileName: newAttName, fileUrl: newAttUrl }]);
    setNewAttName("");
    setNewAttUrl("");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        summary,
        content,
        coverImageUrl,
        categoryId: categoryId || null,
        status,
        seoTitle,
        seoDescription,
        attachments,
      };

      const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan artikel.");

      router.push("/panel/articles");
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
            {isNew ? "Tulis Artikel Baru" : "Edit Workspace Artikel"}
          </h1>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Artikel"}
        </Button>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Judul & Ringkasan</h2>

            <div>
              <label htmlFor="art-title" className="block text-xs font-semibold text-slate-700 mb-1">Judul Artikel <span className="text-rose-500">*</span></label>
              <input
                id="art-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tren Kecerdasan Buatan Sektor Industri 2026"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan / Excerpt</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ringkasan singkat yang tampil di daftar artikel & preview sosmed..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </Card>

          {/* Tiptap Article Editor */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Konten Utama Artikel (Rich Text)</h2>
            <TiptapEditor content={content} onChange={setContent} />
          </Card>

          {/* Collapsible SEO Settings with Character Counters */}
          <Card className="overflow-hidden border border-slate-200">
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full p-4 bg-slate-50 flex items-center justify-between font-bold text-sm text-[#003366] hover:bg-slate-100 transition-colors"
            >
              <span>Pengaturan SEO (Meta Title & Meta Description)</span>
              {seoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {seoOpen && (
              <div className="p-6 space-y-4 bg-white border-t border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="art-seo-title" className="text-xs font-semibold text-slate-700">SEO Meta Title</label>
                    <span className="text-[11px] text-slate-400">{seoTitle.length} / 60 Karakter</span>
                  </div>
                  <input
                    id="art-seo-title"
                    type="text"
                    maxLength={60}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Judul khusus untuk mesin pencari Google..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">SEO Meta Description</label>
                    <span className="text-[11px] text-slate-400">{seoDescription.length} / 160 Karakter</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Deskripsi singkat yang muncul pada hasil pencarian Google..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Status Publikasi</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published (Terbit)</option>
              </select>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Cover Image</h2>
            <FileUploadField
              label="Gambar Header"
              kind="image"
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              hint="Tampil di daftar artikel dan bagian atas halaman artikel."
            />
          </Card>

          {/* Downloadable Attachments Manager */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Lampiran Dokumen (PDF)</h2>

            <div className="space-y-2">
              <input
                type="text"
                value={newAttName}
                onChange={(e) => setNewAttName(e.target.value)}
                aria-label="Nama dokumen lampiran"
                placeholder="Nama Dokumen (mis. Laporan Riset.pdf)"
                className="w-full px-3 py-1.5 text-xs border rounded-lg"
              />
              <input
                type="url"
                value={newAttUrl}
                onChange={(e) => setNewAttUrl(e.target.value)}
                aria-label="URL berkas lampiran"
                placeholder="URL File Storage (https://...)"
                className="w-full px-3 py-1.5 text-xs border rounded-lg"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddAttachment} className="w-full">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Lampiran
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs">
                  <div className="truncate font-semibold text-[#111c2d] max-w-[180px]">{att.fileName}</div>
                  <button type="button" onClick={() => handleRemoveAttachment(idx)} className="text-rose-600 hover:bg-rose-50 p-1 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
