"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import { Plus, Edit, Trash2, Star, CheckCircle2, XCircle } from "lucide-react";

export default function AdminPortfolioPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setProjects(await fetchJson<any[]>("/api/admin/portfolio"));
    } catch (err) {
      toast.error("Gagal memuat portfolio", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleHighlight = async (project: any) => {
    const next = !project.isHighlighted;
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, isHighlighted: next } : p))
    );

    try {
      // Hanya field yang berubah yang dikirim. Versi lama mengirim balik seluruh
      // objek hasil GET — termasuk relasi `center` dan `expertiseTags` yang bukan
      // kolom tabel — sehingga rawan menimpa data dengan bentuk yang salah.
      await fetchJson(`/api/admin/portfolio/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ isHighlighted: next }),
      });
      toast.success(next ? "Ditandai sebagai unggulan" : "Dihapus dari unggulan", project.title);
    } catch (err) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, isHighlighted: !next } : p))
      );
      toast.error("Gagal mengubah status", errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/portfolio/${pending.id}`, { method: "DELETE" });
      toast.success("Proyek dihapus", pending.title);
      setPending(null);
      fetchProjects();
    } catch (err) {
      toast.error("Gagal menghapus", errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Portfolio Proyek</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola dokumentasi proyek realisasi & sorotan Beranda.</p>
        </div>
        <Link href="/panel/portfolio/new">
          <Button size="md">
            <Plus className="w-4 h-4 mr-2" />
            <span>Tambah Proyek Baru</span>
          </Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data portfolio...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-3">
            <p>Belum ada proyek terdaftar.</p>
            <Link href="/panel/portfolio/new">
              <Button variant="outline" size="sm">Tambah Proyek Pertama</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Cover & Judul</th>
                    <th className="p-4">Center Pemilik</th>
                    <th className="p-4">Taxonomy</th>
                    <th className="p-4">Sorot Beranda</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-10 rounded overflow-hidden bg-slate-100 border flex-shrink-0">
                            {p.coverImageUrl ? (
                              <Image src={p.coverImageUrl} alt={p.title} fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Cover</div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#111c2d] line-clamp-1">{p.title}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{p.summary}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-[#003366]">{p.center?.name}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.expertiseTags?.map((et: any) => (
                            <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                              {et.tag.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleHighlight(p)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            p.isHighlighted ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                          title="Toggle Sorotan Beranda"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/panel/portfolio/${p.id}`}>
                            <button className="p-1.5 text-slate-500 hover:text-[#0b64b4] rounded hover:bg-slate-100">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setPending({ id: p.id, title: p.title })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Fallback Card Stack */}
            <div className="p-4 space-y-3 md:hidden">
              {projects.map((p) => (
                <MobileTableCard
                  key={p.id}
                  title={p.title}
                  subtitle={p.center?.name}
                  statusBadge={
                    <button onClick={() => handleToggleHighlight(p)}>
                      <Badge variant={p.isHighlighted ? "warning" : "neutral"}>
                        {p.isHighlighted ? "Sorotan Beranda" : "Reguler"}
                      </Badge>
                    </button>
                  }
                  fields={[
                    { label: "Ringkasan", value: p.summary },
                    { label: "Expertise", value: p.expertiseTags?.map((et: any) => et.tag.name).join(", ") },
                  ]}
                  actions={
                    <>
                      <Link href={`/panel/portfolio/${p.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setPending({ id: p.id, title: p.title })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={pending !== null}
        loading={deleting}
        title="Hapus proyek ini?"
        description={
          <>
            <strong className="text-[#111c2d]">{pending?.title}</strong> akan dihapus permanen
            dari portfolio publik.
          </>
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
