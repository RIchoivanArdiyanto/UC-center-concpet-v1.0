"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import { Plus, Tags, Trash2 } from "lucide-react";

export default function AdminExpertisePage() {
  const toast = useToast();
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState("#0b64b4");
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      setTags(await fetchJson<any[]>("/api/admin/expertise"));
    } catch (err) {
      toast.error("Gagal memuat tag", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/expertise/${pending.id}`, { method: "DELETE" });
      toast.success("Tag dihapus", pending.name);
      setPending(null);
      fetchTags();
    } catch (err) {
      // Server menolak bila tag masih menempel di center/proyek; pesannya
      // menyebut jumlahnya, jadi ditampilkan apa adanya.
      toast.error("Gagal menghapus", errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchJson("/api/admin/expertise", {
        method: "POST",
        body: JSON.stringify({ name, colorHex }),
      });
      toast.success("Tag ditambahkan", name);
      setName("");
      fetchTags();
    } catch (err) {
      // Nama tag duplikat kini dibalas 409 oleh server dan pesannya tampil di
      // sini. Sebelumnya `if (res.ok)` tanpa else membuat tombol seperti macet.
      toast.error("Gagal menambah tag", errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#003366]">Taksonomi Expertise</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola tag kepakaran lintas Center, Portfolio, dan Artikel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Add Tag */}
        <Card className="lg:col-span-4 p-6 space-y-4 h-fit">
          <h2 className="font-bold text-base text-[#003366] flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Tambah Tag Kepakaran</span>
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="tag-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tag <span className="text-rose-500">*</span>
              </label>
              <input
                id="tag-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kecerdasan Buatan"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Badge (Hex)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Pilih warna badge"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  aria-label="Kode warna heksadesimal"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Preview Badge */}
            <div className="pt-2">
              <span className="block text-xs font-medium text-slate-500 mb-1">Preview Badge:</span>
              <Badge colorHex={colorHex}>{name || "Contoh Tag"}</Badge>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Menyimpan..." : "Tambah Tag"}
            </Button>
          </form>
        </Card>

        {/* Table List Tags */}
        <Card className="lg:col-span-8">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat taksonomi...</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Badge Preview</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Center Terhubung</th>
                      <th className="p-4">Proyek Terhubung</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tags.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <Badge colorHex={t.colorHex}>{t.name}</Badge>
                        </td>
                        <td className="p-4 font-mono text-slate-500">{t.slug}</td>
                        <td className="p-4 font-bold text-[#003366]">{t._count?.centers || 0}</td>
                        <td className="p-4 font-bold text-[#003366]">{t._count?.projects || 0}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setPending({ id: t.id, name: t.name })}
                            disabled={(t._count?.centers || 0) + (t._count?.projects || 0) > 0}
                            title={
                              (t._count?.centers || 0) + (t._count?.projects || 0) > 0
                                ? "Masih dipakai center atau proyek"
                                : "Hapus tag"
                            }
                            aria-label={`Hapus tag ${t.name}`}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="p-4 space-y-3 md:hidden">
                {tags.map((t) => (
                  <MobileTableCard
                    key={t.id}
                    title={<Badge colorHex={t.colorHex}>{t.name}</Badge>}
                    subtitle={t.slug}
                    fields={[
                      { label: "Center Terhubung", value: `${t._count?.centers || 0} Center` },
                      { label: "Proyek Terhubung", value: `${t._count?.projects || 0} Proyek` },
                    ]}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        loading={deleting}
        title="Hapus tag keahlian ini?"
        description={
          <>
            <strong className="text-[#111c2d]">{pending?.name}</strong> akan hilang dari
            deretan filter di halaman Portfolio dan Direktori Center.
          </>
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
