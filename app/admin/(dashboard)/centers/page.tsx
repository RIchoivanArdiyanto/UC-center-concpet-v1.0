"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminCentersPage() {
  const toast = useToast();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCenters = useCallback(async () => {
    try {
      setCenters(await fetchJson<any[]>("/api/admin/centers"));
    } catch (err) {
      // Sebelumnya kegagalan hanya masuk console.error, jadi halaman tampak
      // "kosong" padahal sebenarnya request-nya gagal.
      toast.error("Gagal memuat center", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const handleToggleStatus = async (center: any) => {
    const next = !center.isPublished;
    // Perbarui tampilan lebih dulu supaya toggle terasa responsif; dikembalikan
    // lagi kalau server menolak.
    setCenters((prev) =>
      prev.map((c) => (c.id === center.id ? { ...c, isPublished: next } : c))
    );

    try {
      await fetchJson(`/api/admin/centers/${center.id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: next }),
      });
      toast.success(next ? "Center dipublikasikan" : "Center disembunyikan", center.name);
    } catch (err) {
      setCenters((prev) =>
        prev.map((c) => (c.id === center.id ? { ...c, isPublished: !next } : c))
      );
      toast.error("Gagal mengubah status", errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/centers/${pending.id}`, { method: "DELETE" });
      toast.success("Center dihapus", pending.name);
      setPending(null);
      fetchCenters();
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
          <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Center of Excellence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Daftar pusat studi, kepakaran, dan status publikasi.</p>
        </div>
        <Link href="/admin/centers/new">
          <Button size="md">
            <Plus className="w-4 h-4 mr-2" />
            <span>Tambah Center Baru</span>
          </Button>
        </Link>
      </div>

      {/* Main Data Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data center...</div>
        ) : centers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-3">
            <p>Belum ada data Center terdaftar.</p>
            <Link href="/admin/centers/new">
              <Button variant="outline" size="sm">Tambah Center Sekarang</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Center & Logo</th>
                    <th className="p-4">Taxonomy Expertise</th>
                    <th className="p-4">Statistik Proyek</th>
                    <th className="p-4">Status Publikasi</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centers.map((center) => (
                    <tr key={center.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-blue-50 border flex-shrink-0 flex items-center justify-center font-bold text-[#003366]">
                            {center.logoUrl ? (
                              <Image src={center.logoUrl} alt={center.name} fill sizes="40px" className="object-cover" />
                            ) : (
                              center.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#111c2d] text-sm">{center.name}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{center.tagline}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {center.expertiseTags?.map((et: any) => (
                            <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                              {et.tag.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#003366]">{center._count?.projects || 0}</span> Proyek
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(center)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors"
                        >
                          {center.isPublished ? (
                            <Badge variant="success">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                            </Badge>
                          ) : (
                            <Badge variant="neutral">
                              <XCircle className="w-3 h-3 mr-1" /> Draft
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/centers/${center.id}`}>
                            <button className="p-1.5 text-slate-500 hover:text-[#0b64b4] rounded hover:bg-slate-100">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setPending({ id: center.id, name: center.name })}
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

            {/* Mobile Card-Stack Fallback */}
            <div className="p-4 space-y-3 md:hidden">
              {centers.map((center) => (
                <MobileTableCard
                  key={center.id}
                  title={center.name}
                  subtitle={center.tagline}
                  statusBadge={
                    <button onClick={() => handleToggleStatus(center)}>
                      <Badge variant={center.isPublished ? "success" : "neutral"}>
                        {center.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </button>
                  }
                  fields={[
                    { label: "Proyek", value: `${center._count?.projects || 0} Proyek` },
                    {
                      label: "Expertise",
                      value: center.expertiseTags?.map((et: any) => et.tag.name).join(", "),
                    },
                  ]}
                  actions={
                    <>
                      <Link href={`/admin/centers/${center.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setPending({ id: center.id, name: center.name })}>
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
        title="Hapus center ini?"
        description={
          <>
            <strong className="text-[#111c2d]">{pending?.name}</strong> beserta seluruh
            proyek, tim, dan layanannya akan ikut terhapus permanen.
          </>
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
