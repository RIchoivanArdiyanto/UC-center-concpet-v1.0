"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { useToast } from "@/components/ui/toast";
import { errorMessage, fetchJson } from "@/lib/fetch-json";
import {
  DEFAULT_SITE_SETTINGS,
  SETTING_KEYS,
  SETTING_SECTIONS,
  type SettingField,
  type SiteSettings,
} from "@/lib/site-settings";
import { Save, Layout, BarChart2, Phone, Share2 } from "lucide-react";

// Ikon per seksi. Kunci-kunci teksnya sendiri didefinisikan di
// lib/site-settings.ts supaya menambah pengaturan baru cukup satu baris di sana.
const SECTION_ICONS: Record<string, React.ElementType> = {
  "Hero Beranda": Layout,
  "Trust Strip": BarChart2,
  "Informasi Kontak": Phone,
  "Media Sosial": Share2,
};

export default function AdminSiteContentPage() {
  const toast = useToast();
  const [values, setValues] = useState<SiteSettings>({ ...DEFAULT_SITE_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson<SiteSettings>("/api/admin/homepage");
      // Nilai dari server ditumpuk di atas default agar kunci yang belum pernah
      // disimpan tetap terisi, bukan menjadi input kosong.
      setValues({ ...DEFAULT_SITE_SETTINGS, ...data });
    } catch (err) {
      toast.error("Gagal memuat konfigurasi", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Hanya kunci yang memang dikenal yang dikirim, bukan seluruh isi state.
      const payload = Object.fromEntries(
        SETTING_KEYS.map((key) => [key, values[key] ?? ""])
      );
      await fetchJson("/api/admin/homepage", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Konfigurasi tersimpan", "Perubahan langsung tampil di situs publik.");
    } catch (err) {
      // Versi lama menampilkan "Gagal menyimpan perubahan ke database." untuk
      // semua kegagalan, termasuk 403 karena hak akses.
      toast.error("Gagal menyimpan", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#003366]">Konten Situs</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Teks beranda, informasi kontak, dan media sosial — dipakai di halaman
            publik dan footer.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {SETTING_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.section] ?? Layout;
        return (
          <Card key={section.section} className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0b64b4]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#003366]">{section.section}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{section.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                  <SettingInput
                    field={field}
                    value={values[field.key] ?? ""}
                    onChange={(v) => setValue(field.key, v)}
                  />
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Tombol simpan kedua di bawah: form ini panjang, dan setelah menggulir
          sampai bawah pengguna tidak perlu naik lagi ke header. */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}

function SettingInput({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "image") {
    return (
      <FileUploadField
        label={field.label}
        kind="image"
        value={value}
        onChange={onChange}
        hint={field.hint}
      />
    );
  }

  const id = `setting-${field.key}`;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {field.label}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="field resize-y"
        />
      ) : (
        <input
          id={id}
          type={field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="field"
        />
      )}

      {field.hint && <p className="mt-1 text-[11px] text-slate-500">{field.hint}</p>}
    </div>
  );
}
