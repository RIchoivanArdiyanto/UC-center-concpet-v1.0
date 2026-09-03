/**
 * ============================================================================
 *  Titik masuk aplikasi untuk cPanel (Phusion Passenger).
 *
 *  cPanel menjalankan aplikasi Node lewat Passenger, bukan `npm start`.
 *  Passenger memanggil berkas ini dan menyediakan nomor port lewat
 *  process.env.PORT.
 *
 *  Pemasangan:
 *    1. Salin berkas ini ke ROOT aplikasi (sejajar package.json), bukan
 *       dibiarkan di dalam deploy/cpanel/.
 *    2. Di cPanel > Setup Node.js App, isi "Application startup file"
 *       dengan: server.js
 *
 *  Berkas ini sengaja TIDAK memakai output "standalone". Standalone dipakai
 *  image Docker; di cPanel dipakai server Next biasa agar Passenger dapat
 *  mengelola daur hidup prosesnya.
 * ============================================================================
 */
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  require("http")
    .createServer((req, res) => handle(req, res))
    .listen(port, () => {
      console.log(`UC Centers siap pada port ${port}`);
    });
});
