import React from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-gradient-to-r from-[#233e95] to-[#0b64b4] hover:opacity-95 text-white shadow-md focus:ring-[#0b64b4]",
    secondary: "bg-[#003366] hover:bg-[#002244] text-white shadow-sm focus:ring-[#003366]",
    outline: "border border-[#c3c6d1] text-[#111c2d] hover:bg-[#f9f9ff] hover:border-[#233e95] focus:ring-[#233e95]",
    ghost: "text-[#111c2d] hover:bg-[#f9f9ff] focus:ring-[#0b64b4]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs font-medium",
    md: "px-4 py-2.5 text-sm font-medium",
    lg: "px-6 py-3.5 text-base font-semibold",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
