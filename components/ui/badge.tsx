import React from "react";
import { clsx } from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  colorHex?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
}

export function Badge({ colorHex, variant = "neutral", className, children, ...props }: BadgeProps) {
  if (colorHex) {
    return (
      <span
        style={{ backgroundColor: `${colorHex}15`, color: colorHex, borderColor: `${colorHex}40` }}
        className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", className)}
        {...props}
      >
        {children}
      </span>
    );
  }

  const variants = {
    primary: "bg-blue-50 text-[#0b64b4] border-blue-200",
    secondary: "bg-indigo-50 text-[#233e95] border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
