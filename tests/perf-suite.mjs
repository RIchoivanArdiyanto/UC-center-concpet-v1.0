#!/usr/bin/env node
/**
 * ============================================================================
 *  Performance Suite UC Centers.
 *
 *  Mengukur tiga hal yang benar-benar dirasakan pengguna:
 *    1. Waktu respons tiap halaman (median & p95, bukan rata-rata — rata-rata
 *       menyembunyikan request lambat yang justru paling mengganggu).
 *    2. Ukuran payload yang harus diunduh.
 *    3. Perilaku saat banyak pengunjung bersamaan.
 *
 *  Jalankan saat stack menyala:  node tests/perf-suite.mjs
 * ============================================================================
 */

const BASE = (process.env.BASE_URL || "http://localhost:8090").replace(/\/$/, "");
const ROUNDS = Number(process.env.PERF_ROUNDS || 12);
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY || 25);

const c = { reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m" };
const section = (t) => console.log(`\n${c.bold}${t}${c.reset}`);

// Ambang berdasarkan pedoman umum pengalaman pengguna: di bawah 1 detik terasa
// mulus, di atas 3 detik pengunjung mulai meninggalkan halaman.
const BUDGET_MS = { good: 800, warn: 1500 };

const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const findings = [];

async function measure(path, rounds = ROUNDS) {
  const times = [];
  let bytes = 0, status = 0;

  // Sekali pemanasan: request pertama menanggung kompilasi rute dan koneksi
  // database awal, angkanya tidak mewakili kondisi normal.
  await fetch(`${BASE}${path}`).then((r) => r.arrayBuffer()).catch(() => {});

  for (let i = 0; i < rounds; i++) {
    const t = Date.now();
    const res = await fetch(`${BASE}${path}`);
    const buf = await res.arrayBuffer();
    times.push(Date.now() - t);
    bytes = buf.byteLength;
    status = res.status;
  }
  return { path, status, bytes, median: pct(times, 50), p95: pct(times, 95), min: Math.min(...times) };
}

function verdict(ms) {
  if (ms <= BUDGET_MS.good) return `${c.green}BAIK${c.reset}`;
  if (ms <= BUDGET_MS.warn) return `${c.yellow}CUKUP${c.reset}`;
  return `${c.red}LAMBAT${c.reset}`;
}

async function main() {
  console.log(`${c.bold}Performance Suite UC Centers${c.reset} — target: ${BASE}`);
  console.log(`${c.dim}${ROUNDS} request per halaman, konkurensi ${CONCURRENCY}${c.reset}`);

  // ── 1. Waktu respons per halaman ─────────────────────────────────────────
  section("1. Waktu Respons Halaman (dingin → hangat)");
  console.log(`  ${"Halaman".padEnd(34)} ${"Status".padEnd(7)} ${"Median".padEnd(9)} ${"p95".padEnd(9)} Ukuran`);
  console.log(`  ${"-".repeat(76)}`);

  const pages = ["/", "/center", "/portfolio", "/artikel", "/kontak", "/panel/login", "/api/health"];
  const measured = [];
  for (const p of pages) {
    const m = await measure(p);
    measured.push(m);
    console.log(
      `  ${p.padEnd(34)} ${String(m.status).padEnd(7)} ` +
      `${(m.median + "ms").padEnd(9)} ${(m.p95 + "ms").padEnd(9)} ${kb(m.bytes)}  ${verdict(m.p95)}`
    );
    if (m.p95 > BUDGET_MS.warn) {
      findings.push(`${p}: p95 ${m.p95}ms melebihi ambang ${BUDGET_MS.warn}ms`);
    }
    if (m.bytes > 300 * 1024) {
      findings.push(`${p}: payload ${kb(m.bytes)} tergolong besar (>300 KB)`);
    }
  }

  // ── 2. Halaman detail (query relasi paling berat) ────────────────────────
  section("2. Halaman Detail — query paling banyak relasi");
  const detail = await measure("/center/center-for-innovation");
  console.log(`  Detail center  median=${detail.median}ms  p95=${detail.p95}ms  ${kb(detail.bytes)}  ${verdict(detail.p95)}`);
  if (detail.p95 > BUDGET_MS.warn) findings.push(`Detail center: p95 ${detail.p95}ms`);

  // ── 3. Beban bersamaan ───────────────────────────────────────────────────
  section(`3. Beban Bersamaan — ${CONCURRENCY} pengunjung serentak ke beranda`);
  const t0 = Date.now();
  const batch = await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      const t = Date.now();
      try {
        const r = await fetch(`${BASE}/`);
        await r.arrayBuffer();
        return { ms: Date.now() - t, status: r.status };
      } catch (e) {
        return { ms: Date.now() - t, status: 0 };
      }
    })
  );
  const wall = Date.now() - t0;
  const okCount = batch.filter((b) => b.status === 200).length;
  const times = batch.map((b) => b.ms);

  console.log(`  Berhasil        : ${okCount}/${CONCURRENCY}`);
  console.log(`  Total waktu     : ${wall}ms`);
  console.log(`  Median / p95    : ${pct(times, 50)}ms / ${pct(times, 95)}ms`);
  console.log(`  Throughput      : ${(CONCURRENCY / (wall / 1000)).toFixed(1)} request/detik`);

  if (okCount < CONCURRENCY) {
    findings.push(`Beban bersamaan: hanya ${okCount}/${CONCURRENCY} berhasil`);
  }
  if (pct(times, 95) > 5000) {
    findings.push(`Beban bersamaan: p95 ${pct(times, 95)}ms terlalu lambat`);
  }

  // ── 4. Efektivitas cache ─────────────────────────────────────────────────
  section("4. Cache Aset Statis");
  const html = await (await fetch(`${BASE}/`)).text();
  const asset = html.match(/\/_next\/static\/[^"']+\.(?:js|css)/)?.[0];
  if (asset) {
    const r = await fetch(`${BASE}${asset}`);
    const cc = r.headers.get("cache-control") ?? "";
    const enc = r.headers.get("content-encoding") ?? "(tanpa kompresi)";
    const immutable = cc.includes("immutable");
    console.log(`  Aset            : ${asset.slice(0, 52)}…`);
    console.log(`  Cache-Control   : ${cc}`);
    console.log(`  Kompresi        : ${enc}`);
    if (!immutable) findings.push("Aset statis tidak ditandai immutable — diunduh ulang tiap kunjungan");
  }

  const htmlRes = await fetch(`${BASE}/`, { headers: { "accept-encoding": "gzip" } });
  const gz = htmlRes.headers.get("content-encoding");
  console.log(`  HTML dikompresi : ${gz ?? "TIDAK"}`);
  if (!gz) findings.push("HTML tidak dikompresi gzip — payload jauh lebih besar dari perlunya");

  // ── 5. Jejak N+1 query ───────────────────────────────────────────────────
  section("5. Indikasi N+1 Query");
  // Halaman direktori memuat banyak center sekaligus. Bila waktunya naik
  // proporsional terhadap jumlah data, kemungkinan ada query per baris.
  const dir = await measure("/center", 8);
  const one = await measure("/center/center-for-innovation", 8);
  const ratio = dir.median / Math.max(1, one.median);
  console.log(`  Direktori (banyak center) : ${dir.median}ms`);
  console.log(`  Detail (satu center)      : ${one.median}ms`);
  console.log(`  Rasio                     : ${ratio.toFixed(2)}x`);
  console.log(`  ${c.dim}Rasio jauh di atas 3x pada data kecil menandakan query per baris.${c.reset}`);
  if (ratio > 3) findings.push(`Kemungkinan N+1: direktori ${ratio.toFixed(1)}x lebih lambat dari halaman detail`);

  // ── Ringkasan ────────────────────────────────────────────────────────────
  const slowest = [...measured].sort((a, b) => b.p95 - a.p95)[0];
  const heaviest = [...measured].sort((a, b) => b.bytes - a.bytes)[0];

  console.log(`\n${"=".repeat(76)}`);
  console.log(`${c.bold}RINGKASAN PERFORMA${c.reset}`);
  console.log(`  Halaman terlambat : ${slowest.path} (p95 ${slowest.p95}ms)`);
  console.log(`  Payload terbesar  : ${heaviest.path} (${kb(heaviest.bytes)})`);
  if (findings.length) {
    console.log(`\n${c.yellow}${c.bold}CATATAN:${c.reset}`);
    for (const f of findings) console.log(`  - ${f}`);
  } else {
    console.log(`\n${c.green}Tidak ada masalah performa yang melewati ambang.${c.reset}`);
  }
  console.log("=".repeat(76));
}

main().catch((e) => { console.error(e); process.exit(1); });
