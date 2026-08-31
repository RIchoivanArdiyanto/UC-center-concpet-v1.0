"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2 } from "lucide-react";

interface RepeatableListProps<T> {
  title: string;
  icon: React.ElementType;
  description: React.ReactNode;
  /** Ditampilkan saat daftar kosong. */
  emptyHint: React.ReactNode;
  addLabel: string;
  /** Kata benda tunggal untuk label baris, mis. "Anggota" / "Layanan". */
  itemNoun: string;
  items: T[];
  onChange: (next: T[]) => void;
  createItem: () => T;
  /** Merender kolom-kolom isian untuk satu baris. */
  renderFields: (item: T, index: number) => React.ReactNode;
}

/**
 * Kerangka daftar yang bisa ditambah, diurutkan, dan dihapus.
 *
 * Blok "Tim Pakar" dan "Layanan & Kepakaran" di form center memakai kerangka
 * yang persis sama — hanya kolom isiannya yang berbeda. Disatukan di sini
 * supaya keduanya tidak menyimpang tampilan maupun perilakunya saat salah satu
 * diubah nanti.
 */
export function RepeatableList<T>({
  title,
  icon: Icon,
  description,
  emptyHint,
  addLabel,
  itemNoun,
  items,
  onChange,
  createItem,
  renderFields,
}: RepeatableListProps<T>) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#0b64b4]" />
          <h2 className="text-base font-bold text-[#003366]">{title}</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, createItem()])}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {addLabel}
        </Button>
      </div>

      <p className="text-xs text-slate-500">{description}</p>

      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
          {emptyHint}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              // Indeks dipakai sebagai key karena baris di sini belum punya id
              // sendiri sampai tersimpan; urutan hanya berubah lewat tombol
              // naik/turun yang memang menulis ulang seluruh daftar.
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <GripVertical className="h-3.5 w-3.5" />
                  {itemNoun} {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Naikkan urutan ${itemNoun.toLowerCase()} ${index + 1}`}
                    className="rounded px-2 py-0.5 text-xs font-bold text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Turunkan urutan ${itemNoun.toLowerCase()} ${index + 1}`}
                    className="rounded px-2 py-0.5 text-xs font-bold text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    &darr;
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                    aria-label={`Hapus ${itemNoun.toLowerCase()} ${index + 1}`}
                    className="ml-1 rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {renderFields(item, index)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
