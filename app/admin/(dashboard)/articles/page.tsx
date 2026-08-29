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
import { Plus, Edit, Trash2, FileText, CheckCircle2, Clock } from "lucide-react";

export default function AdminArticlesPage() {
  const toast = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      setArticles(await fetchJson<any[]>("/api/admin/articles"));
    } catch (err) {
      toast.error("Gagal memuat artikel", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await fetchJson(`/api/admin/articles/${pending.id}`, { method: "DELETE" });
      toast.success("Artikel dihapus", pending.title);
      setPending(null);
      fetchArticles();
    } catch (err) {
      toast.error("Gagal menghapus", errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Artikel & Berita</h1>
          <p className="text-xs text-slate-500 mt-0.5">Tulis opini, rilis riset, dan publikasi wawasan terdepan.</p>
        </div>
        <Link href="/admin/articles/new">
          <Button size="md">
            <Plus className="w-4 h-4 mr-2" />
            <span>Tulis Artikel Baru</span>
          </Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data artikel...</div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-3">
            <p>Belum ada artikel terbit.</p>
            <Link href="/admin/articles/new">
              <Button variant="outline" size="sm">Tulis Artikel Pertama</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Cover & Judul Artikel</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Penulis</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Tanggal Terbit</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {articles.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-10 rounded overflow-hidden bg-slate-100 border flex-shrink-0">
                            {a.coverImageUrl ? (
                              <Image src={a.coverImageUrl} alt={a.title} fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Cover</div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#111c2d] line-clamp-1">{a.title}</div>
                            {a.attachments?.length > 0 && (
                              <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                                <FileText className="w-3 h-3" /> {a.attachments.length} Lampiran PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-[#003366]">{a.category?.name || "Umum"}</td>
                      <td className="p-4 text-slate-600 font-medium">{a.author?.name || "Admin"}</td>
                      <td className="p-4">
                        <Badge variant={a.status === "PUBLISHED" ? "success" : "neutral"}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400">
                        {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/articles/${a.id}`}>
                            <button className="p-1.5 text-slate-500 hover:text-[#0b64b4] rounded hover:bg-slate-100">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setPending({ id: a.id, title: a.title })}
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

            {/* Mobile Card Stack */}
            <div className="p-4 space-y-3 md:hidden">
              {articles.map((a) => (
                <MobileTableCard
                  key={a.id}
                  title={a.title}
                  subtitle={a.category?.name}
                  statusBadge={<Badge variant={a.status === "PUBLISHED" ? "success" : "neutral"}>{a.status}</Badge>}
                  fields={[
                    { label: "Penulis", value: a.author?.name },
                    { label: "Tanggal", value: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("id-ID") : "-" },
                  ]}
                  actions={
                    <>
                      <Link href={`/admin/articles/${a.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setPending({ id: a.id, title: a.title })}>
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
        title="Hapus artikel ini?"
        description={
          <>
            <strong className="text-[#111c2d]">{pending?.title}</strong> akan dihapus
            permanen beserta lampirannya.
          </>
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
