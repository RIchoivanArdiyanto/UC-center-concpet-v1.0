import React from "react";

interface MobileTableCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  statusBadge?: React.ReactNode;
  fields: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}

export function MobileTableCard({
  title,
  subtitle,
  statusBadge,
  fields,
  actions,
}: MobileTableCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3 md:hidden">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="font-bold text-[#111c2d] text-base">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {statusBadge && <div>{statusBadge}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs py-1">
        {fields.map((field, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-slate-400 font-medium">{field.label}</span>
            <span className="text-slate-800 font-semibold mt-0.5">{field.value || "-"}</span>
          </div>
        ))}
      </div>

      {actions && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}
