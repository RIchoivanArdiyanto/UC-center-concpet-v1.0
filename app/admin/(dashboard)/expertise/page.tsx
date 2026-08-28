"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { Plus, Tags, Trash2 } from "lucide-react";

export default function AdminExpertisePage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState("#0b64b4");
  const [submitting, setSubmitting] = useState(false);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/expertise");
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/expertise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, colorHex }),
      });
      if (res.ok) {
        setName("");
        fetchTags();
      }
    } catch (err) {
      console.error(err);
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tag <span className="text-rose-500">*</span>
              </label>
              <input
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
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
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
    </div>
  );
}
