import React from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { Building2, FileText, Users, Activity, TrendingUp, Clock, AlertTriangle } from "lucide-react";

export const revalidate = 0; // dynamic admin dashboard

export default async function AdminDashboardPage() {
  let totalCenters = 0;
  let publishedArticles = 0;
  let totalLeads = 0;
  let recentLeads: any[] = [];
  let recentActivities: any[] = [];
  let dbOffline = false;

  try {
    const [centersCount, articlesCount, leadsCount, leads, activities] = await Promise.all([
      prisma.center.count({ where: { isPublished: true } }),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { center: { select: { name: true } } },
      }),
      prisma.activityLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

    totalCenters = centersCount;
    publishedArticles = articlesCount;
    totalLeads = leadsCount;
    recentLeads = leads;
    recentActivities = activities;
  } catch (err) {
    dbOffline = true;
    console.warn("DB offline during admin dashboard metrics query");
  }

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#003366]">Dashboard Ringkasan</h1>
        <p className="text-xs text-slate-500 mt-1">Pantau performa publikasi center, aktivitas sistem, dan masuknya lead permohonan.</p>
      </div>

      {/* DB Offline Alert Banner */}
      {dbOffline && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900">Database PostgreSQL Sedang Offline / Belum Berjalan</div>
            <p className="text-amber-800">
              Sistem saat ini berjalan dalam mode pratinjau aman (*Safe Preview Mode*). Untuk mengaktifkan koneksi database penuh dan mengelola data real-time, pastikan kontainer Docker database dinyalakan dengan perintah:
            </p>
            <code className="inline-block bg-amber-100/80 px-2 py-1 rounded text-amber-950 font-mono text-[11px] font-bold border border-amber-300">
              docker compose up -d
            </code>
          </div>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Center</span>
            <div className="text-3xl font-extrabold text-[#003366]">{totalCenters}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2 Bulan Ini</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0b64b4] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Artikel Terbit</span>
            <div className="text-3xl font-extrabold text-[#003366]">{publishedArticles}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4 Minggu Ini</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#233e95] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Baru</span>
            <div className="text-3xl font-extrabold text-amber-600">{totalLeads}</div>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold pt-1">
              <span>Perlu Ditindaklanjuti</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktivitas Harian</span>
            <div className="text-3xl font-extrabold text-[#003366]">{recentActivities.length}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium pt-1">
              <span>Catatan Log Terdaftar</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Lead Terbaru */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex items-center justify-between">
            <div className="font-bold text-[#003366] text-base">Permohonan Lead Terbaru</div>
            <span className="text-xs text-slate-500">Real-time Form Entries</span>
          </CardHeader>
          <CardBody className="p-0">
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada data lead masuk atau database belum terhubung.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-3.5">Nama & Contact</th>
                        <th className="p-3.5">Sumber</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50">
                          <td className="p-3.5">
                            <div className="font-bold text-[#111c2d]">{lead.name}</div>
                            <div className="text-[11px] text-slate-500">{lead.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-slate-600">
                              {lead.center?.name || lead.source}
                            </span>
                          </td>
                          <td className="p-3.5">
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
                          <td className="p-3.5 text-slate-400">
                            {new Date(lead.createdAt).toLocaleDateString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Fallback Card Stack */}
                <div className="p-4 space-y-3 md:hidden">
                  {recentLeads.map((lead) => (
                    <MobileTableCard
                      key={lead.id}
                      title={lead.name}
                      subtitle={lead.email}
                      statusBadge={<Badge variant={lead.status === "NEW" ? "warning" : "success"}>{lead.status}</Badge>}
                      fields={[
                        { label: "Sumber", value: lead.center?.name || lead.source },
                        { label: "Tanggal", value: new Date(lead.createdAt).toLocaleDateString("id-ID") },
                      ]}
                    />
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Right: Activity Log */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="font-bold text-[#003366] text-base">Aktivitas Sistem Terbaru</div>
          </CardHeader>
          <CardBody className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada aktivitas tercatat.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0b64b4] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {act.actor?.name?.charAt(0) || "A"}
                  </div>
                  <div className="text-xs space-y-1 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111c2d]">{act.actor?.name || "System Admin"}</span>
                      <Badge variant={act.action === "CREATE" ? "success" : act.action === "DELETE" ? "danger" : "primary"}>
                        {act.action}
                      </Badge>
                    </div>
                    <div className="text-slate-600">
                      {act.entityType} ID: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">{act.entityId.slice(0, 8)}...</code>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(act.createdAt).toLocaleString("id-ID")}</span>
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
