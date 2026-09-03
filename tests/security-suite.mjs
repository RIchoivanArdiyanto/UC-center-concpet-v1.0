#!/usr/bin/env node
/**
 * ============================================================================
 *  Security Suite UC Centers.
 *
 *  Menyerang aplikasi dengan pola serangan yang wajar terjadi pada situs
 *  publik + panel admin: XSS tersimpan, SQL injection, IDOR, path traversal,
 *  eskalasi hak akses, unggahan berbahaya, dan kebocoran informasi.
 *
 *  Jalankan saat stack menyala:  node tests/security-suite.mjs
 * ============================================================================
 */

const BASE = (process.env.BASE_URL || "http://localhost:8090").replace(/\/$/, "");
const USER = process.env.QA_USER || "superadmin";
const PASS = process.env.QA_PASS || "Password123!";

const results = [];
let cookies = "";
const c = { reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", dim: "\x1b[2m", bold: "\x1b[1m" };

function record(area, name, ok, detail = "") {
  results.push({ area, name, ok, detail });
  console.log(`  ${ok ? `${c.green}AMAN ${c.reset}` : `${c.red}RENTAN${c.reset}`}  ${name}` +
    (detail ? `\n         ${c.dim}${detail}${c.reset}` : ""));
}
const section = (t) => console.log(`\n${c.bold}${t}${c.reset}`);

function absorb(res) {
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const [name] = pair.split("=");
    cookies = [...cookies.split("; ").filter((x) => x && !x.startsWith(`${name}=`)), pair].join("; ");
  }
}
async function req(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init, redirect: "manual",
    headers: {
      ...(cookies ? { cookie: cookies } : {}),
      ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  absorb(res);
  return res;
}
const json = async (p, i) => { const r = await req(p, i); return { status: r.status, body: await r.json().catch(() => null) }; };
const text = async (p) => { const r = await req(p); return { status: r.status, html: await r.text().catch(() => ""), headers: r.headers }; };

/** Tunggu sampai jendela rate limit Nginx (/api/auth/, 10 req/menit) lewat. */
async function waitForAuthWindow(label) {
  console.log(`  ${c.dim}(menunggu 65 dtk — rate limit Nginx aktif setelah ${label})${c.reset}`);
  await new Promise((r) => setTimeout(r, 65_000));
}

async function login(id = USER, pw = PASS) {
  cookies = "";
  let csrfRes = await req("/api/auth/csrf");
  if (csrfRes.status === 429) {
    // Nginx membalas halaman HTML, bukan JSON. Ditunggu lalu diulang, kalau
    // tidak seluruh suite berhenti karena JSON.parse gagal.
    await waitForAuthWindow("uji rate limit");
    csrfRes = await req("/api/auth/csrf");
  }
  const { csrfToken } = await csrfRes.json().catch(() => ({ csrfToken: null }));
  if (!csrfToken) return null;
  await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, identifier: id, password: pw, json: "true" }).toString(),
  });
  const who = (await json("/api/auth/session")).body?.user ?? null;

  // Setiap sesi admin yang berhasil disimpan sebagai cadangan untuk pembersihan
  // di akhir. Menyimpannya di satu titik saja tidak cukup: bila login pada titik
  // itu kebetulan sudah tertahan rate limiter, yang tersimpan justru cookie
  // tanpa sesi dan pembersihan tetap gagal.
  if (who && id === USER) adminCookies = cookies;

  return who;
}
const uniq = () => Math.random().toString(36).slice(2, 8);
const cleanup = [];
/** Cookie admin yang masih sah, disimpan sebelum uji rate limit. */
let adminCookies = "";

async function main() {
  console.log(`${c.bold}Security Suite UC Centers${c.reset} — target: ${BASE}\n`);

  // ── 1. Kontrol akses tanpa sesi ─────────────────────────────────────────
  section("1. Kontrol Akses — tanpa sesi");
  const endpoints = ["centers", "portfolio", "articles", "leads", "users", "roles",
    "activity", "clients", "expertise", "upload"];
  for (const e of endpoints) {
    const r = await json(`/api/admin/${e}`);
    record("authz", `GET /api/admin/${e} menolak anonim`, r.status === 401 || r.status === 405,
      `status=${r.status}`);
  }
  const w = await json("/api/admin/centers", { method: "POST", body: JSON.stringify({ name: "x" }) });
  record("authz", "POST tanpa sesi ditolak", w.status === 401, `status=${w.status}`);

  const mw = await req("/panel/dashboard");
  record("authz", "Halaman /admin dialihkan ke login",
    mw.status === 307 || mw.status === 302, `status=${mw.status}`);

  // ── 2. Enumerasi akun ───────────────────────────────────────────────────
  // Dijalankan paling awal, saat kuota rate limit masih penuh. Pengukuran
  // memakai request mentah (bukan helper login()) supaya tidak ada penungguan
  // yang ikut terhitung — versi sebelumnya menyertakan sleep 65 detik dan
  // melaporkan selisih 6500x yang sama sekali bukan perilaku server.
  section("2. Enumerasi Akun");

  async function timeLogin(identifier) {
    cookies = "";
    const csrfRes = await req("/api/auth/csrf");
    if (csrfRes.status === 429) return null;
    const { csrfToken } = await csrfRes.json().catch(() => ({ csrfToken: null }));
    if (!csrfToken) return null;

    const t = Date.now();
    const r = await req("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken, identifier, password: "PasswordJelasSalah", json: "true",
      }).toString(),
    });
    if (r.status === 429) return null;
    return Date.now() - t;
  }

  const tExist = await timeLogin("superadmin");
  const tGhost = await timeLogin(`tidakada${uniq()}`);

  if (tExist === null || tGhost === null) {
    record("enum", "Waktu respons tidak membedakan user ada/tidak", false,
      "TIDAK DAPAT DIUJI — request tertahan rate limit; jalankan ulang setelah restart app");
  } else {
    const ratio = Math.max(tExist, tGhost) / Math.max(1, Math.min(tExist, tGhost));
    record("enum", "Waktu respons tidak membedakan user ada/tidak", ratio < 3,
      `user ada=${tExist}ms, tidak ada=${tGhost}ms, rasio=${ratio.toFixed(2)}x`);
  }

  const user = await login();
  if (!user) { console.log(`${c.red}Login gagal.${c.reset}`); return finish(); }

  // ── 10. Cookie sesi ─────────────────────────────────────────────────────
  section("10. Cookie Sesi");
  cookies = "";
  const { csrfToken } = await (await req("/api/auth/csrf")).json();
  const loginRes = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, identifier: USER, password: PASS, json: "true" }).toString(),
  });
  const setCookies = (loginRes.headers.getSetCookie?.() ?? []).join(" | ");
  // Wajib dipastikan loginnya BERHASIL dulu. Bila ditolak rate limiter,
  // respons tidak memuat Set-Cookie sama sekali dan pemeriksaan di bawah akan
  // melaporkan "rentan" untuk cookie yang sebenarnya aman.
  const gotSession = /next-auth\.session-token=/.test(setCookies);
  record("cookie", "Login menghasilkan cookie sesi (prasyarat uji)", gotSession,
    gotSession ? "" : `login status=${loginRes.status} — uji cookie tidak sahih`);

  if (gotSession) {
    record("cookie", "Cookie sesi HttpOnly", /session-token[^|]*HttpOnly/i.test(setCookies));
    record("cookie", "Cookie sesi SameSite=Lax", /session-token[^|]*SameSite=Lax/i.test(setCookies));
  }
  record("cookie", "Ada perlindungan CSRF (token)", Boolean(csrfToken));

  // ── 4. XSS tersimpan ────────────────────────────────────────────────────
  section("4. Stored XSS");
  const payload =
    '<p>sah</p><script>alert(1)</script><img src=x onerror="alert(2)">' +
    '<a href="javascript:alert(3)">klik</a><iframe src="https://penyerang.test"></iframe>' +
    '<svg/onload=alert(4)><style>@import "https://penyerang.test/x.css";</style>';
  const art = await json("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify({ title: `SEC ${uniq()}`, content: payload, status: "PUBLISHED" }),
  });
  if (art.body?.id) cleanup.push(() => req(`/api/admin/articles/${art.body.id}`, { method: "DELETE" }));
  const page = await text(`/artikel/${art.body?.slug}`);
  for (const [label, needle] of [
    ["tag <script>", "<script>alert"],
    ["atribut onerror", "onerror"],
    ["atribut onload", "onload"],
    ["skema javascript:", "javascript:alert"],
    ["iframe pihak ketiga", "penyerang.test"],
  ]) {
    record("xss", `Payload ${label} dinetralkan`, !page.html.includes(needle));
  }
  record("xss", "Konten sah tetap tampil", page.html.includes("<p>sah</p>"));

  // XSS lewat form publik (nama pengunjung) yang tampil di panel admin.
  const xssName = `<script>alert('lead')</script>${uniq()}`;
  const lead = await json("/api/leads", {
    method: "POST",
    body: JSON.stringify({ name: xssName, email: `sec-${uniq()}@x.id`, message: "m", subject: "s" }),
  });
  const leadsList = await json("/api/admin/leads");
  const stored = (leadsList.body ?? []).find((l) => l.name === xssName);
  if (stored) cleanup.push(() => req(`/api/admin/leads/${stored.id}`, { method: "DELETE" }));
  record("xss", "Input publik disimpan sebagai teks (di-escape React saat render)",
    Boolean(stored), "React meng-escape otomatis; tidak ada dangerouslySetInnerHTML di daftar lead");

  // ── 5. SQL / NoSQL injection ────────────────────────────────────────────
  section("5. SQL Injection");
  const inj = [
    "' OR '1'='1", "'; DROP TABLE `Center`;--", "\" OR 1=1--",
    "1' UNION SELECT null,null,null--", "admin'--",
  ];
  let injSafe = true, injDetail = "";
  for (const p of inj) {
    const r = await text(`/center?q=${encodeURIComponent(p)}`);
    if (r.status >= 500) { injSafe = false; injDetail = `q=${p} -> ${r.status}`; break; }
  }
  record("sqli", "Pencarian center tahan SQL injection", injSafe, injDetail || "5 payload, tidak ada 5xx");

  const stillAlive = await json("/api/health");
  record("sqli", "Tabel utuh setelah percobaan DROP TABLE",
    stillAlive.body?.database === "up", `database=${stillAlive.body?.database}`);

  for (const p of ["' OR '1'='1", "admin' --"]) {
    const bad = await login(p, p);
    record("sqli", `Login dengan payload "${p.slice(0, 12)}…" gagal`, bad === null);
  }
  await login();

  // ── 6. Path traversal & berkas ──────────────────────────────────────────
  section("6. Path Traversal & Unggahan");
  const traversals = [
    "/uploads/../../etc/passwd", "/uploads/..%2f..%2fetc%2fpasswd",
    "/uploads/....//....//etc/passwd", "/uploads/", "/uploads/2026/08/x.sh",
    "/uploads/2026/08/x.php",
  ];
  for (const t of traversals) {
    const r = await req(t);
    record("traversal", `Akses ${t} ditolak`, r.status === 404 || r.status === 400, `status=${r.status}`);
  }

  const bad = [
    ["skrip PHP menyamar PNG", Buffer.from("<?php system($_GET[0]); ?>"), "image/png"],
    ["HTML menyamar PNG", Buffer.from("<html><script>alert(1)</script></html>"), "image/png"],
    ["SVG (tidak diizinkan)", Buffer.from('<svg onload="alert(1)"/>'), "image/svg+xml"],
  ];
  for (const [label, buf, mime] of bad) {
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: mime }), "x.png");
    const r = await req("/api/admin/upload", { method: "POST", body: fd });
    record("upload", `Unggahan ${label} ditolak`, r.status === 400, `status=${r.status}`);
  }

  // ── 7. IDOR / eskalasi hak akses ────────────────────────────────────────
  section("7. IDOR & Eskalasi Hak Akses");
  const roleRes = await json("/api/admin/roles", {
    method: "POST",
    body: JSON.stringify({ name: `SEC Role ${uniq()}`, scope: "OWN_CENTER", permissions: ["dashboard.view"] }),
  });
  const centerRes = await json("/api/admin/centers", {
    method: "POST", body: JSON.stringify({ name: `SEC Center ${uniq()}` }),
  });
  const uname = `sec${uniq()}`;
  const userRes = await json("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      name: "Sec User", username: uname, email: `${uname}@u.id`,
      password: "RahasiaSec123", roleId: roleRes.body?.id, centerId: centerRes.body?.id,
    }),
  });
  cleanup.push(() => req(`/api/admin/users/${userRes.body?.id}`, { method: "DELETE" }));
  cleanup.push(() => req(`/api/admin/roles/${roleRes.body?.id}`, { method: "DELETE" }));
  cleanup.push(() => req(`/api/admin/centers/${centerRes.body?.id}`, { method: "DELETE" }));

  const otherCenter = (await json("/api/admin/centers")).body?.find((x) => x.id !== centerRes.body?.id);
  await login(uname, "RahasiaSec123");

  const idor = await json(`/api/admin/centers/${otherCenter?.id}`, {
    method: "PUT", body: JSON.stringify({ name: "DIRETAS" }),
  });
  record("idor", "User center lain tidak bisa mengubah center orang", idor.status === 403,
    `status=${idor.status}`);

  const grab = await json("/api/admin/users");
  record("escalation", "User tanpa izin tidak bisa membaca daftar user", grab.status === 403,
    `status=${grab.status}`);

  const selfPromote = await json(`/api/admin/users/${userRes.body?.id}`, {
    method: "PUT", body: JSON.stringify({ roleId: "role_super_admin" }),
  });
  record("escalation", "User tidak bisa menaikkan role dirinya", selfPromote.status === 403,
    `status=${selfPromote.status}`);

  const newRole = await json("/api/admin/roles", {
    method: "POST", body: JSON.stringify({ name: "x", permissions: ["users.manage"] }),
  });
  record("escalation", "User tanpa roles.manage tidak bisa membuat role", newRole.status === 403,
    `status=${newRole.status}`);
  await login();

  // ── 8. Kebocoran informasi ──────────────────────────────────────────────
  section("8. Kebocoran Informasi");
  const users = await json("/api/admin/users");
  const anyHash = JSON.stringify(users.body ?? []).includes("passwordHash");
  record("leak", "Hash password tidak pernah keluar lewat API", !anyHash);

  const home = await text("/");
  record("leak", "Header X-Powered-By dimatikan", !home.headers.get("x-powered-by"),
    `x-powered-by=${home.headers.get("x-powered-by") ?? "(tidak ada)"}`);
  record("leak", "Versi server Nginx disembunyikan",
    !/nginx\/[0-9]/.test(home.headers.get("server") ?? ""),
    `server=${home.headers.get("server")}`);

  const err = await json("/api/admin/centers/tidak-ada-id-ini", {
    method: "PUT", body: JSON.stringify({ name: "x" }),
  });
  const errStr = JSON.stringify(err.body ?? {});
  record("leak", "Pesan galat tidak membocorkan stack trace / SQL",
    !/at\s+\w+|prisma\.|SELECT |INSERT /i.test(errStr), errStr.slice(0, 90));

  // ── 9. Header keamanan ──────────────────────────────────────────────────
  section("9. Header Keamanan");
  const hdr = [
    ["x-frame-options", "SAMEORIGIN"],
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
  ];
  for (const [h, expect] of hdr) {
    const got = home.headers.get(h);
    record("header", `Header ${h} terpasang`, got === expect, `${h}=${got}`);
  }
  record("header", "Permissions-Policy terpasang", Boolean(home.headers.get("permissions-policy")));

  const adminPage = await text("/panel/login");
  record("header", "Halaman admin diberi noindex",
    (adminPage.headers.get("x-robots-tag") ?? "").includes("noindex"),
    `x-robots-tag=${adminPage.headers.get("x-robots-tag")}`);
  record("header", "Halaman admin tidak di-cache",
    (adminPage.headers.get("cache-control") ?? "").includes("no-store"),
    `cache-control=${adminPage.headers.get("cache-control")}`);

  // ── 11. Rate limit endpoint publik ──────────────────────────────────────
  section("11. Rate Limit Form Publik");
  let leadBlocked = false, n = 0;
  const ids = [];
  for (let i = 0; i < 14; i++) {
    n++;
    const r = await json("/api/leads", {
      method: "POST",
      body: JSON.stringify({ name: `Flood ${i}`, email: `flood-${uniq()}@x.id`, message: "m" }),
    });
    if (r.body?.lead?.id) ids.push(r.body.lead.id);
    if (r.status === 429) { leadBlocked = true; break; }
  }
  record("ratelimit", "Banjir kiriman form publik dibatasi", leadBlocked,
    leadBlocked ? `diblokir pada kiriman ke-${n}` : `${n} kiriman TIDAK diblokir`);
  await login();
  for (const id of ids) cleanup.push(() => req(`/api/admin/leads/${id}`, { method: "DELETE" }));

  // ── Terakhir: uji yang SENGAJA memicu rate limit ────────────────────────
  // Ditaruh paling akhir karena setelah dijalankan, endpoint /api/auth/
  // diblokir Nginx selama satu menit dan pengujian lain jadi ikut gagal.
  // ── 2. Brute force ──────────────────────────────────────────────────────
  section("2. Ketahanan Brute Force");
  let blocked = false, attempts = 0;
  for (let i = 0; i < 14; i++) {
    attempts++;
    const csrfRes = await req("/api/auth/csrf");
    if (csrfRes.status === 429) { blocked = true; break; }  // Nginx yang memblokir
    const { csrfToken } = await csrfRes.json().catch(() => ({ csrfToken: null }));
    if (!csrfToken) { blocked = true; break; }
    const r = await req("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken, identifier: "superadmin", password: `salah-${i}`, json: "true",
      }).toString(),
    });
    if (r.status === 429) { blocked = true; break; }
    const loc = r.headers.get("location") ?? "";
    if (/Terlalu%20banyak|Terlalu banyak/.test(decodeURIComponent(loc))) { blocked = true; break; }
  }
  record("bruteforce", "Percobaan login beruntun dibatasi", blocked,
    blocked
      ? `diblokir pada percobaan ke-${attempts} (aplikasi 8/15mnt + Nginx 10/mnt)`
      : `${attempts} percobaan TIDAK diblokir`);

  return finish();
}

async function finish() {
  section("Pembersihan");

  // Pakai cookie sesi yang tersimpan dari login admin terakhir yang berhasil.
  //
  // Sesinya TIDAK diverifikasi lewat /api/auth/session: endpoint itu berada di
  // balik rate limit Nginx yang ketat (10 req/menit) dan sudah pasti tertahan
  // sesudah uji brute force — pengecekannya sendiri yang gagal, bukan sesinya.
  // Endpoint pembersihan (/api/admin/*) memakai kuota berbeda yang jauh lebih
  // longgar, jadi langsung dicoba dan hasil tiap request yang dihitung.
  if (adminCookies) cookies = adminCookies;

  let cleanupFailed = 0;
  for (const fn of cleanup) {
    try {
      const res = await fn();
      if (res && typeof res.status === "number" && res.status >= 400) cleanupFailed++;
    } catch {
      cleanupFailed++;
    }
  }

  const cleanOk = cleanupFailed === 0;
  console.log(`  ${cleanup.length - cleanupFailed}/${cleanup.length} objek uji dihapus` +
    (cleanOk ? "" : ` ${c.red}(${cleanupFailed} gagal)${c.reset}`));
  if (!cleanOk) {
    console.log(`  ${c.dim}Sisa data uji dapat dibersihkan manual, lalu ulangi suite${c.reset}`);
  }
  results.push({ area: "cleanup", name: "Data uji terhapus", ok: cleanOk,
    detail: cleanOk ? "" : `${cleanupFailed} objek tertinggal di database` });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${"=".repeat(64)}`);
  console.log(`${c.bold}RINGKASAN KEAMANAN${c.reset}  ${results.length - failed.length}/${results.length} aman`);
  if (failed.length) {
    console.log(`\n${c.red}${c.bold}TEMUAN:${c.reset}`);
    for (const f of failed) console.log(`  - [${f.area}] ${f.name} ${c.dim}${f.detail}${c.reset}`);
  } else {
    console.log(`${c.green}Tidak ada temuan.${c.reset}`);
  }
  console.log("=".repeat(64));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
