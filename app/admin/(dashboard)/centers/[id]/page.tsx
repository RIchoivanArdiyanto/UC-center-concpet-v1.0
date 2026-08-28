"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Video, FileText, CheckCircle2 } from "lucide-react";

export default function AdminCenterEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroMediaType, setHeroMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [heroMediaUrl, setHeroMediaUrl] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [profilePdfUrl, setProfilePdfUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Taxonomy Tags
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load expertise tags
    fetch("/api/admin/expertise")
      .then((res) => res.json())
      .then((data) => setAllTags(data))
      .catch((err) => console.error(err));

    if (!isNew) {
      setLoading(true);
      fetch(`/api/admin/centers`)
        .then((res) => res.json())
        .then((centers) => {
          const current = centers.find((c: any) => c.id === params.id);
          if (current) {
            setName(current.name || "");
            setTagline(current.tagline || "");
            setLogoUrl(current.logoUrl || "");
            setHeroMediaType(current.heroMediaType || "IMAGE");
            setHeroMediaUrl(current.heroMediaUrl || "");
            setAboutContent(current.aboutContent || "");
            setProfilePdfUrl(current.profilePdfUrl || "");
            setIsPublished(current.isPublished ?? true);
            if (current.expertiseTags) {
              setSelectedTagIds(current.expertiseTags.map((et: any) => et.tagId));
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isNew, params.id]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name,
        tagline,
        logoUrl,
        heroMediaType,
        heroMediaUrl,
        aboutContent,
        profilePdfUrl,
        isPublished,
        tagIds: selectedTagIds,
      };

      const url = isNew ? "/api/admin/centers" : `/api/admin/centers/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data center.");

      router.push("/admin/centers");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Memuat data center...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#003366]">
              {isNew ? "Tambah Center Baru" : `Edit Center: ${name}`}
            </h1>
            <p className="text-xs text-slate-500">Isi detail profil, kepakaran, dan media utama.</p>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* 2-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Basic Info & Rich Text */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Informasi Dasar Center</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Center <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Center for Innovation & Tech Transfer"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline Singkat</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Contoh: Mendorong Akselerasi Riset & Komersialisasi Teknologi Masa Depan"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Logo Badge</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>
          </Card>

          {/* Tiptap About Editor */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Deskripsi Profil & Metodologi (Rich Text)</h2>
            <TiptapEditor content={aboutContent} onChange={setAboutContent} />
          </Card>
        </div>

        {/* Right Column: Status, Taxonomy, Media, PDF */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Switch */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Status Publikasi</h2>
            <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
              <span className="text-xs font-semibold text-slate-700">Tampilkan di Publik</span>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 accent-[#0b64b4] rounded cursor-pointer"
              />
            </div>
          </Card>

          {/* Taxonomy Expertise Tags */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Taksonomi Expertise</h2>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-[#0b64b4] text-white border-[#0b64b4] shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tag.name} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Media & Hero Config */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Hero Media</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Media</label>
              <select
                value={heroMediaType}
                onChange={(e: any) => setHeroMediaType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="IMAGE">Gambar Cover</option>
                <option value="VIDEO">Video Embed (YouTube / Vimeo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL {heroMediaType === "IMAGE" ? "Gambar" : "Embed Video"}
              </label>
              <input
                type="url"
                value={heroMediaUrl}
                onChange={(e) => setHeroMediaUrl(e.target.value)}
                placeholder={heroMediaType === "IMAGE" ? "https://images.unsplash.com/..." : "https://www.youtube.com/embed/..."}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>
          </Card>

          {/* PDF Company Profile */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Company Profile (PDF)</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Dokumen PDF</label>
              <input
                type="url"
                value={profilePdfUrl}
                onChange={(e) => setProfilePdfUrl(e.target.value)}
                placeholder="https://example.com/company-profile.pdf"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
