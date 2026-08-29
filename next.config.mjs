/** @type {import('next').NextConfig} */
const nextConfig = {
  // WAJIB: Dockerfile menyalin .next/standalone — tanpa ini folder tsb tidak
  // dibuat dan `docker compose build` gagal di stage runner.
  output: "standalone",
  reactStrictMode: true,

  // Versi & teknologi server tidak perlu diumumkan ke setiap pengunjung.
  poweredByHeader: false,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  async rewrites() {
    return [
      // Di produksi Nginx menyajikan /uploads/ langsung dari volume sehingga
      // request tidak pernah sampai ke Next. Rewrite ini jalur cadangan untuk
      // `npm run dev` dan deployment tanpa reverse proxy.
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Cegah situs lain membingkai panel admin (clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Cegah browser menebak tipe konten dari isi berkas.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Jangan bocorkan URL internal ke situs pihak ketiga.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // Halaman admin tidak boleh diindeks mesin pencari maupun disimpan
        // cache proxy bersama.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
