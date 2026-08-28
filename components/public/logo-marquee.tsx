"use client";

import React from "react";
import Image from "next/image";

interface LogoItem {
  id: string;
  name: string;
  logoUrl: string;
}

interface LogoMarqueeProps {
  logos: LogoItem[];
}

export function LogoMarquee({ logos }: LogoMarqueeProps) {
  if (!logos || logos.length === 0) return null;

  // Duplicate list to achieve seamless 100% infinite loop
  const marqueeLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="relative w-full overflow-hidden py-6 bg-slate-900/5 rounded-2xl border border-slate-200/80">
      {/* Gradient Fades on Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#f9f9ff] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f9f9ff] to-transparent z-10 pointer-events-none" />

      {/* Infinite Marquee Track */}
      <div className="animate-marquee flex items-center gap-10">
        {marqueeLogos.map((logo, idx) => (
          <div
            key={`${logo.id}-${idx}`}
            className="flex-shrink-0 relative w-36 h-16 bg-white rounded-xl shadow-sm border border-slate-200/80 p-3 flex items-center justify-center group hover:scale-105 transition-transform"
            title={logo.name}
          >
            <div className="relative w-full h-full">
              <Image
                src={logo.logoUrl}
                alt={logo.name}
                fill
                sizes="144px"
                className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
