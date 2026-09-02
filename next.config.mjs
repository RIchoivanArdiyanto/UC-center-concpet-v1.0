/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone dibutuhkan Dockerfile (menyalin .next/standalone); tanpa itu
  // `docker compose build` gagal di stage runner.
  //
  // Di Vercel mode ini TIDAK dipakai — Vercel punya format keluarannya sendiri
  // dan `standalone` justru membuat build-nya bermasalah. Variabel VERCEL
  // otomatis diisi oleh platformnya saat build.
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,

  // Versi & teknologi server tidak perlu diumumkan ke setiap pengunjung.
  poweredByHeader: false,

  images: {
    // Gambar dari sumber luar (mis. Unsplash pada data contoh) diambil ulang
    // oleh optimizer Next setiap kali cache habis. Ketika sumbernya lambat atau
    // membatasi laju, permintaan itu gagal dengan 500 dan kartunya tampil
    // kosong. TTL panjang membuat satu kali berhasil menutupi 30 hari
    // berikutnya. Gambar yang diunggah lewat panel tersimpan lokal dan tidak
    // terpengaruh sama sekali.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ["image/avif", "image/webp"],
    // CATATAN KEAMANAN: hostname "**" berarti server ini mau mem-proxy gambar
    // dari alamat https mana pun. Itu memang dibutuhkan selama admin masih
    // boleh menempel URL eksternal. Bila nanti seluruh gambar sudah diunggah
    // lewat panel, ganti daftar ini dengan host yang benar-benar dipakai.
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
        source: "/panel/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
