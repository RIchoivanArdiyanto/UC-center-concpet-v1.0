import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import {
  Building2,
  FileText,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  ArrowRight,
  Briefcase,
} from "lucide-react";

export const revalidate = 0; // dashboard admin selalu data terbaru

const DATE_TIME = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});
const DATE_ONLY = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export default async function AdminDashboardPage() {
  let totalCenters = 0;
  let totalProjects = 0;
  let publishedArticles = 0;
  let newLeads = 0;
  let activityToday = 0;
  let recentLeads: any[] = [];
  let recentActivities: any[] = [];
  let dbOffline = false;

  // Awal hari waktu Jakarta (UTC+7) — penghitung "hari ini" harus mengikuti
  // zona waktu pengguna, bukan UTC-nya server.
  const startOfDayJakarta = new Date();
  startOfDayJakarta.setUTCHours(startOfDayJakarta.getUTCHours() + 7);
  startOfDayJakarta.setUTCHours(0, 0, 0, 0);
  startOfDayJakarta.setUTCHours(startOfDayJakarta.getUTCHours() - 7);

  try {
    const [centers, projects, articles, leads, todayLogs, latestLeads, latestLogs] =
      await Promise.all([
        prisma.center.count({ where: { isPublished: true } }),
        prisma.portfolioProject.count({ where: { isPublished: true } }),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.lead.count({ where: { status: "NEW" } }),
        prisma.activityLog.count({ where: { createdAt: { gte: startOfDayJakarta } } }),
        prisma.lead.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { center: { select: { name: true } } },
        }),
        prisma.activityLog.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true } } },
        }),
      ]);

    totalCenters = centers;
    totalProjects = projects;
    publishedArticles = articles;
    newLeads = leads;
    activityToday = todayLogs;
    recentLeads = latestLeads;
    recentActivities = latestLogs;
  } catch (err) {
    dbOffline = true;
    console.warn("[Dashboard] Database tidak terbaca:", err);
  }

  const stats = [
    {
      label: "Center Terbit",
      value: totalCenters,
      icon: Building2,
      tone: "bg-blue-50 text-[#0b64b4]",
      href: "/admin/centers",
    },
    {
      label: "Proyek Portfolio",
      value: totalProjects,
      icon: Briefcase,
      tone: "bg-indigo-50 text-[#233e95]",
      href: "/admin/portfolio",
    },
    {
      label: "Artikel Terbit",
      value: publishedArticles,
      icon: FileText,
      tone: "bg-violet-50 text-violet-600",
      href: "/admin/articles",
    },
    {
      label: "Lead Baru",
      value: newLeads,
      icon: Users,
      tone: "bg-amber-50 text-amber-600",
      href: "/admin/leads",
      // Satu-satunya angka yang menuntut tindakan, jadi sengaja ditonjolkan.
      highlight: newLeads > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-[#003366]">Ringkasan Sistem</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pantau publikasi center, aktivitas sistem, dan permohonan yang masuk.
        </p>
      </div>

      {dbOffline && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="space-y-1">
            <div className="text-sm font-bold">Database tidak dapat dihubungi</div>
            <p>
              Angka di bawah belum mencerminkan data sesungguhnya. Pastikan kontainer
              database berjalan:
            </p>
            <code className="mt-1 inline-block rounded border border-amber-300 bg-amber-100/80 px-2 py-1 font-mono text-[11px] font-bold text-amber-950">
              docker compose up -d
            </code>
          </div>
        </div>
      )}

      {/* KPI — tiap kartu adalah tautan ke halaman pengelolanya */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, href, highlight }) => (
          <Link key={label} href={href} className="group">
            <Card className="flex items-center justify-between p-5 transition group-hover:-translate-y-0.5 group-hover:border-[#0b64b4]/30">
              <div className="min-w-0 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </span>
                <div
                  className={`text-3xl font-extrabold ${
                    highlight ? "text-amber-600" : "text-[#003366]"
                  }`}
                >
                  {value}
                </div>
                <div className="flex items-center gap-1 pt-0.5 text-[11px] font-semibold text-slate-400 transition group-hover:text-[#0b64b4]">
                  <span>Kelola</span>
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </div>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-6 w-6" />
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Lead terbaru */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex items-center justify-between">
            <div className="text-base font-bold text-[#003366]">Permohonan Terbaru</div>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1 text-xs font-semibold text-[#0b64b4] hover:underline"
            >
              Lihat semua
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentLeads.length === 0 ? (
              <p className="p-10 text-center text-xs text-slate-400">
                Belum ada permohonan masuk.
              </p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead className="border-b border-slate-100 bg-slate-50/70">
                      <tr>
                        <th className="th">Pengirim</th>
                        <th className="th">Subjek</th>
                        <th className="th">Status</th>
                        <th className="th">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="transition hover:bg-slate-50/70">
                          <td className="td">
                            <div className="font-semibold text-[#111c2d]">{lead.name}</div>
                            <div className="text-[11px] text-slate-500">{lead.email}</div>
                          </td>
                          <td className="td max-w-[220px]">
                            <div className="truncate text-xs text-slate-600">
                              {lead.subject || lead.center?.name || lead.source}
                            </div>
                          </td>
                          <td className="td">
                            <Badge
                              variant={
                                lead.status === "NEW"
                                  ? "warning"
                                  : lead.status === "CONTACTED"
                                    ? "primary"
                                    : "success"
                              }
                            >
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="td whitespace-nowrap text-xs text-slate-400">
                            {DATE_ONLY.format(new Date(lead.createdAt))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {recentLeads.map((lead) => (
                    <MobileTableCard
                      key={lead.id}
                      title={lead.name}
                      subtitle={lead.email}
                      statusBadge={
                        <Badge variant={lead.status === "NEW" ? "warning" : "success"}>
                          {lead.status}
                        </Badge>
                      }
                      fields={[
                        { label: "Subjek", value: lead.subject || lead.source },
                        {
                          label: "Tanggal",
                          value: DATE_ONLY.format(new Date(lead.createdAt)),
                        },
                      ]}
                    />
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Aktivitas sistem */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-[#003366]">Aktivitas Sistem</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Activity className="h-3 w-3" />
                <span>{activityToday} perubahan hari ini</span>
              </div>
            </div>
            <Link
              href="/admin/activity"
              className="flex items-center gap-1 text-xs font-semibold text-[#0b64b4] hover:underline"
            >
              Semua log
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#233e95] to-[#0b64b4] text-[11px] font-bold text-white">
                    {(act.actor?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-grow space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-[#111c2d]">
                        {act.actor?.name ?? "—"}
                      </span>
                      <Badge
                        variant={
                          act.action === "CREATE"
                            ? "success"
                            : act.action === "DELETE"
                              ? "danger"
                              : "primary"
                        }
                      >
                        {act.action}
                      </Badge>
                    </div>
                    <div className="text-slate-600">
                      pada <strong className="text-slate-700">{act.entityType}</strong>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{DATE_TIME.format(new Date(act.createdAt))}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
