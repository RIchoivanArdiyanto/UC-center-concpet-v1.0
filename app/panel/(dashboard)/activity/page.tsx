"use client";

import React, { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Send,
  EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type ActivityRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  actor: { name: string; username: string; email: string } | null;
};

type ActivityResponse = {
  items: ActivityRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    entityTypes: string[];
    actions: string[];
    actors: { id: string; name: string }[];
  };
};

const ACTION_STYLE: Record<
  string,
  { icon: React.ElementType; variant: "success" | "primary" | "danger" | "secondary" | "neutral" }
> = {
  CREATE: { icon: Plus, variant: "success" },
  UPDATE: { icon: Pencil, variant: "primary" },
  DELETE: { icon: Trash2, variant: "danger" },
  PUBLISH: { icon: Send, variant: "secondary" },
  UNPUBLISH: { icon: EyeOff, variant: "neutral" },
};

const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default function ActivityLogPage() {
  const toast = useToast();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ entityType: "", action: "", actorId: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);

      const res = await fetch(`/api/admin/activity?${params}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Gagal memuat activity log.");
      setData(json);
    } catch (err) {
      toast.error("Gagal memuat", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [page, filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (key: keyof typeof filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Kembali ke halaman 1 setiap filter berubah, kalau tidak pengguna bisa
    // terdampar di halaman kosong.
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <History className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#111c2d]">Activity Log</h2>
              <p className="text-xs text-slate-500">
                Jejak audit setiap perubahan data di panel · {data?.total ?? 0} entri
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.entityType}
              onChange={setFilter("entityType")}
              aria-label="Filter jenis data"
              className="field w-auto py-2 text-xs"
            >
              <option value="">Semua jenis data</option>
              {data?.filters.entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filters.action}
              onChange={setFilter("action")}
              aria-label="Filter aksi"
              className="field w-auto py-2 text-xs"
            >
              <option value="">Semua aksi</option>
              {data?.filters.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={filters.actorId}
              onChange={setFilter("actorId")}
              aria-label="Filter pelaku"
              className="field w-auto py-2 text-xs"
            >
              <option value="">Semua pelaku</option>
              {data?.filters.actors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <button
              onClick={load}
              aria-label="Muat ulang"
              className="rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Tabel untuk layar lebar */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <th className="th">Waktu</th>
                <th className="th">Pelaku</th>
                <th className="th">Aksi</th>
                <th className="th">Objek</th>
                <th className="th">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="td" colSpan={5}>
                      <div className="skeleton h-4 w-full" />
                    </td>
                  </tr>
                ))}

              {!loading && data?.items.length === 0 && (
                <tr>
                  <td className="td py-12 text-center text-slate-500" colSpan={5}>
                    Belum ada aktivitas yang tercatat untuk filter ini.
                  </td>
                </tr>
              )}

              {!loading &&
                data?.items.map((row) => {
                  const style = ACTION_STYLE[row.action] ?? {
                    icon: Pencil,
                    variant: "neutral" as const,
                  };
                  const Icon = style.icon;
                  return (
                    <tr key={row.id} className="transition hover:bg-slate-50/70">
                      <td className="td whitespace-nowrap text-xs text-slate-500">
                        {DATE_FORMAT.format(new Date(row.createdAt))}
                      </td>
                      <td className="td">
                        <div className="font-semibold text-[#111c2d]">
                          {row.actor?.name ?? "—"}
                        </div>
                        {row.actor?.username && (
                          <div className="font-mono text-[11px] text-slate-400">
                            @{row.actor.username}
                          </div>
                        )}
                      </td>
                      <td className="td">
                        <Badge variant={style.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {row.action}
                        </Badge>
                      </td>
                      <td className="td">
                        <div className="font-medium text-slate-700">{row.entityType}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {row.entityId.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="td max-w-xs">
                        <MetadataText metadata={row.metadata} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Kartu untuk layar kecil */}
        <div className="divide-y divide-slate-100 md:hidden">
          {!loading &&
            data?.items.map((row) => {
              const style = ACTION_STYLE[row.action] ?? { icon: Pencil, variant: "neutral" as const };
              const Icon = style.icon;
              return (
                <div key={row.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={style.variant} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {row.action}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {DATE_FORMAT.format(new Date(row.createdAt))}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#111c2d]">{row.entityType}</div>
                  <MetadataText metadata={row.metadata} />
                  <div className="text-xs text-slate-500">oleh {row.actor?.name ?? "—"}</div>
                </div>
              );
            })}
          {!loading && data?.items.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">Belum ada aktivitas.</p>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <span className="text-xs text-slate-500">
              Halaman {data.page} dari {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1 || loading}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.page >= data.totalPages || loading}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/** Ringkas metadata JSON jadi teks "kunci: nilai" yang enak dibaca. */
function MetadataText({ metadata }: { metadata: unknown }) {
  if (!metadata || typeof metadata !== "object") {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="space-y-0.5 text-xs text-slate-600">
      {entries.map(([key, value]) => (
        <div key={key} className="truncate">
          <span className="text-slate-400">{key}:</span>{" "}
          <span className="font-medium">
            {Array.isArray(value) ? value.join(", ") : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
