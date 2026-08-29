"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import { ArrowLeft, Save, Plus, Trash2, Users, GripVertical } from "lucide-react";

type TeamRow = { name: string; role: string; email: string; photoUrl: string };

export default function AdminCenterEditPage() {
  const toast = useToast();
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

  // Tim pakar. Sebelumnya hanya bisa diisi lewat seed — tidak ada UI-nya sama
  // sekali padahal blok "Tim Pakar" tampil di halaman center publik.
  const [team, setTeam] = useState<TeamRow[]>([]);

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
            setTeam(
              (current.team ?? []).map((t: any) => ({
                name: t.name ?? "",
                role: t.role ?? "",
                email: t.email ?? "",
                photoUrl: t.photoUrl ?? "",
              }))
            );
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isNew, params.id]);

  const updateMember = (index: number, field: keyof TeamRow, value: string) =>
    setTeam((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  const moveMember = (index: number, delta: number) =>
    setTeam((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

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
        team,
      };

      const url = isNew ? "/api/admin/centers" : `/api/admin/centers/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      await fetchJson(url, { method, body: JSON.stringify(payload) });

      toast.success(isNew ? "Center dibuat" : "Perubahan tersimpan", name);
      router.push("/admin/centers");
      router.refresh();
    } catch (err) {
      // Pesan asli dari server ditampilkan (mis. "Jabatan X wajib diisi"),
      // bukan "Gagal menyimpan data center." yang menutupi penyebabnya.
      setError(errorMessage(err));
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

            <FileUploadField
              label="Logo Badge"
              kind="image"
              value={logoUrl}
              onChange={setLogoUrl}
              hint="Tampil di kartu direktori center dan halaman detail."
            />
          </Card>

          {/* Tiptap About Editor */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Deskripsi Profil & Metodologi (Rich Text)</h2>
            <TiptapEditor content={aboutContent} onChange={setAboutContent} />
          </Card>

          {/* Tim Pakar */}
          <Card className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0b64b4]" />
                <h2 className="text-base font-bold text-[#003366]">Tim Pakar</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTeam((prev) => [...prev, { name: "", role: "", email: "", photoUrl: "" }])
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Anggota
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Tampil di kolom Tim Pakar halaman center. Urutan di sini menentukan
              urutan tampil. Email opsional &mdash; bila diisi, alamatnya tampil di
              halaman publik saat nama diklik, jadi isi hanya alamat yang memang
              boleh dipublikasikan.
            </p>

            {team.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                Belum ada anggota tim. Blok Tim Pakar tidak akan tampil di halaman publik.
              </div>
            ) : (
              <ul className="space-y-3">
                {team.map((member, index) => (
                  <li key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <GripVertical className="h-3.5 w-3.5" />
                        Anggota {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveMember(index, -1)}
                          aria-label="Naikkan urutan"
                          className="rounded px-2 py-0.5 text-xs font-bold text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          &uarr;
                        </button>
                        <button
                          type="button"
                          disabled={index === team.length - 1}
                          onClick={() => moveMember(index, 1)}
                          aria-label="Turunkan urutan"
                          className="rounded px-2 py-0.5 text-xs font-bold text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          &darr;
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeam((prev) => prev.filter((_, i) => i !== index))}
                          aria-label={`Hapus anggota ${index + 1}`}
                          className="ml-1 rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`tm-name-${index}`} className="field-label">
                          Nama <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`tm-name-${index}`}
                          value={member.name}
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                          placeholder="Prof. Sari Handayani"
                          className="field"
                        />
                      </div>
                      <div>
                        <label htmlFor={`tm-role-${index}`} className="field-label">
                          Jabatan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id={`tm-role-${index}`}
                          value={member.role}
                          onChange={(e) => updateMember(index, "role", e.target.value)}
                          placeholder="Lead Strategist"
                          className="field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor={`tm-email-${index}`} className="field-label">
                          Email (opsional)
                        </label>
                        <input
                          id={`tm-email-${index}`}
                          type="email"
                          value={member.email}
                          onChange={(e) => updateMember(index, "email", e.target.value)}
                          placeholder="nama@uccenters.id"
                          className="field"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FileUploadField
                          label="Foto (opsional)"
                          kind="image"
                          value={member.photoUrl}
                          onChange={(url) => updateMember(index, "photoUrl", url)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

            {heroMediaType === "IMAGE" ? (
              <FileUploadField
                label="Gambar Hero"
                kind="image"
                value={heroMediaUrl}
                onChange={setHeroMediaUrl}
                hint="Gambar besar di bagian atas halaman center."
              />
            ) : (
              // Video tetap berupa URL: yang disimpan adalah alamat embed
              // YouTube/Vimeo, bukan berkas video yang di-host sendiri.
              <div>
                <label htmlFor="hero-video" className="field-label">URL Embed Video</label>
                <input
                  id="hero-video"
                  type="url"
                  value={heroMediaUrl}
                  onChange={(e) => setHeroMediaUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="field"
                />
              </div>
            )}
          </Card>

          {/* PDF Company Profile */}
          <Card className="p-6 space-y-4">
            <h2 className="font-bold text-base text-[#003366]">Company Profile (PDF)</h2>
            <FileUploadField
              label="Dokumen PDF"
              kind="document"
              value={profilePdfUrl}
              onChange={setProfilePdfUrl}
              hint="Muncul sebagai tombol 'Unduh Profil' di halaman center."
            />
          </Card>
        </div>
      </div>
    </form>
  );
}
