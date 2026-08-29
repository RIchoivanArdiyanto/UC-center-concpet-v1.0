"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileTableCard } from "@/components/ui/mobile-table-card";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import { Mail, Phone, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function AdminLeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      setLeads(await fetchJson<any[]>("/api/admin/leads"));
    } catch (err) {
      toast.error("Gagal memuat lead", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchJson(`/api/admin/leads/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Status lead diperbarui", `Ditandai sebagai ${newStatus}.`);
      fetchLeads();
    } catch (err) {
      toast.error("Gagal memperbarui status", errorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003366]">Kelola Permohonan Lead</h1>
        <p className="text-xs text-slate-500 mt-0.5">Daftar permohonan konsultasi & kerja sama dari calon mitra.</p>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data lead...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Belum ada lead masuk.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama & Subjek</th>
                    <th className="p-4">Kontak</th>
                    <th className="p-4">Target Center / Sumber</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Tanggal Masuk</th>
                    <th className="p-4 text-right">Ubah Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-[#111c2d]">{lead.name}</div>
                        {/* Subjek kini kolom tersendiri di database, jadi bisa
                            ditonjolkan alih-alih terkubur di dalam isi pesan. */}
                        {lead.subject && (
                          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#0b64b4]">
                            {lead.subject}
                          </div>
                        )}
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">{lead.message}</div>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Mail className="w-3 h-3 text-[#0b64b4]" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-[#003366]">
                        {lead.center?.name || lead.source}
                      </td>
                      <td className="p-4">
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
                      <td className="p-4 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Fallback Card Stack */}
            <div className="p-4 space-y-3 md:hidden">
              {leads.map((lead) => (
                <MobileTableCard
                  key={lead.id}
                  title={lead.name}
                  subtitle={lead.subject || lead.email}
                  statusBadge={
                    <Badge variant={lead.status === "NEW" ? "warning" : "success"}>
                      {lead.status}
                    </Badge>
                  }
                  fields={[
                    { label: "Pesan", value: lead.message },
                    { label: "Telepon", value: lead.phone },
                    { label: "Target Center", value: lead.center?.name || lead.source },
                  ]}
                  actions={
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  }
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
