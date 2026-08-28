import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UC Centers — Research, Consultation & Professional Training",
  description: "Platform terpadu pusat keunggulan akademik dan industri: Riset Terapan, Konsultasi Bisnis Strategis, dan Pelatihan Profesional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-[#f9f9ff] text-[#111c2d]">{children}</body>
    </html>
  );
}
