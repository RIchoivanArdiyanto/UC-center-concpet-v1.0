#!/usr/bin/env node
/**
 * ============================================================================
 *  QA Suite UC Centers — pengujian fungsional end-to-end.
 *
 *  Menguji SETIAP fitur lewat alur nyata: admin membuat/mengubah data lewat
 *  API, lalu halaman PUBLIK diperiksa untuk memastikan perubahannya benar
 *  muncul. Menguji sisi admin saja tidak cukup — bug paling sering justru di
 *  sambungan antara keduanya (cache, filter isPublished, relasi yang tidak
 *  ikut ter-include).
 *
 *  Jalankan saat stack sudah menyala:
 *      node tests/qa-suite.mjs
 *      BASE_URL=https://uccenters.uc.ac.id node tests/qa-suite.mjs
 *
 *  Keluar dengan kode 1 bila ada yang gagal, supaya bisa dipakai di CI.
 * ============================================================================
 */

const BASE = (process.env.BASE_URL || "http://localhost:8090").replace(/\/$/, "");
const USER = process.env.QA_USER || "superadmin";
const PASS = process.env.QA_PASS || "Password123!";

const results = [];
let cookies = "";

const c = {
  reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m",
  yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m",
};

function record(feature, name, ok, detail = "") {
  results.push({ feature, name, ok, detail });
  const tag = ok ? `${c.green}LULUS${c.reset}` : `${c.red}GAGAL${c.reset}`;
  console.log(`  ${tag}  ${name}${detail ? `\n         ${c.dim}${detail}${c.reset}` : ""}`);
}

function section(title) {
  console.log(`\n${c.bold}${title}${c.reset}`);
}

/** Simpan cookie antar request supaya sesi login bertahan. */
function absorbCookies(res) {
  const set = res.headers.getSetCookie?.() ?? [];
  for (const line of set) {
    const [pair] = line.split(";");
    const [name] = pair.split("=");
    const others = cookies.split("; ").filter((x) => x && !x.startsWith(`${name}=`));
    cookies = [...others, pair].join("; ");
  }
}

async function req(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: {
      ...(cookies ? { cookie: cookies } : {}),
      ...(init.body && !(init.body instanceof FormData)
        ? { "content-type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  absorbCookies(res);
  return res;
}

async function json(path, init) {
  const res = await req(path, init);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function text(path) {
  const res = await req(path);
  return { status: res.status, html: await res.text().catch(() => "") };
}

async function login(identifier = USER, password = PASS) {
  cookies = "";
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  const form = new URLSearchParams({ csrfToken, identifier, password, json: "true" });
  await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const { body } = await json("/api/auth/session");
  return body?.user ?? null;
}

const uniq = () => Math.random().toString(36).slice(2, 8);
const cleanup = [];

// ===========================================================================
async function main() {
  console.log(`${c.bold}QA Suite UC Centers${c.reset} — target: ${BASE}\n`);

  // ── Ketersediaan dasar ───────────────────────────────────────────────────
  section("A. Ketersediaan & Kesehatan");
  const health = await json("/api/health");
  record("health", "GET /api/health balas 200", health.status === 200, `status=${health.status}`);
  record("health", "Database terhubung", health.body?.database === "up",
    `database=${health.body?.database}`);

  for (const p of ["/", "/center", "/portfolio", "/artikel", "/kontak", "/panel/login"]) {
    const r = await text(p);
    record("halaman", `Halaman publik ${p}`, r.status === 200, `status=${r.status}`);
  }

  // ── Autentikasi ──────────────────────────────────────────────────────────
  section("B. Autentikasi & Sesi");
  const anon = await json("/api/admin/centers");
  record("auth", "Tanpa sesi ditolak 401", anon.status === 401, `status=${anon.status}`);

  const badLogin = await login(USER, "PasswordSalahSekali");
  record("auth", "Password salah tidak membuat sesi", badLogin === null);

  const user = await login();
  record("auth", "Login dengan username berhasil", Boolean(user?.id), `role=${user?.roleName}`);
  record("auth", "Sesi membawa daftar permission",
    Array.isArray(user?.permissions) && user.permissions.length > 0,
    `${user?.permissions?.length} permission`);

  if (!user) {
    console.log(`\n${c.red}Login gagal — sisa pengujian dihentikan.${c.reset}`);
    return finish();
  }

  // ── Fitur: Center ────────────────────────────────────────────────────────
  section("C. Fitur Center (admin → halaman publik)");
  const cName = `QA Center ${uniq()}`;
  const created = await json("/api/admin/centers", {
    method: "POST",
    body: JSON.stringify({
      name: cName,
      tagline: "Tagline uji QA",
      aboutContent: "<p>Profil uji QA</p>",
      isPublished: true,
      team: [{ name: "Pengurus QA", role: "Ketua", email: "pengurus.qa@uccenters.id" }],
      services: [{ title: "Layanan QA", description: "Deskripsi layanan uji" }],
    }),
  });
  record("center", "Admin dapat membuat center", created.status === 201, `status=${created.status}`);
  const centerId = created.body?.id;
  const centerSlug = created.body?.slug;
  if (centerId) cleanup.push(() => req(`/api/admin/centers/${centerId}`, { method: "DELETE" }));

  record("center", "Slug dibuat rapi tanpa akhiran acak",
    Boolean(centerSlug) && /^qa-center-[a-z0-9]+$/.test(centerSlug), `slug=${centerSlug}`);

  const dir = await text("/center");
  record("center", "Center baru muncul di direktori publik", dir.html.includes(cName));

  const detail = await text(`/center/${centerSlug}`);
  record("center", "Halaman detail center dapat dibuka", detail.status === 200);
  record("center", "Pengurus Center tampil di halaman publik",
    detail.html.includes("Pengurus QA") && detail.html.includes("Pengurus Center"));
  record("center", "Layanan & Kepakaran tampil di halaman publik",
    detail.html.includes("Layanan QA"));

  // Unpublish harus menyembunyikan dari publik.
  await json(`/api/admin/centers/${centerId}`, {
    method: "PUT", body: JSON.stringify({ isPublished: false }),
  });
  const dirAfter = await text("/center");
  record("center", "Center di-unpublish hilang dari direktori", !dirAfter.html.includes(cName));
  const detailAfter = await text(`/center/${centerSlug}`);
  record("center", "Detail center non-publish tidak menampilkan isinya",
    !detailAfter.html.includes("Layanan QA"));
  await json(`/api/admin/centers/${centerId}`, {
    method: "PUT", body: JSON.stringify({ isPublished: true }),
  });

  // Pengurus & layanan tidak boleh hilang saat hanya toggle publish.
  const stillThere = await text(`/center/${centerSlug}`);
  record("center", "Toggle publish tidak menghapus pengurus/layanan",
    stillThere.html.includes("Pengurus QA") && stillThere.html.includes("Layanan QA"));

  // ── Fitur: Portfolio ─────────────────────────────────────────────────────
  section("D. Fitur Portfolio (admin → halaman publik)");
  const pTitle = `QA Proyek ${uniq()}`;
  const proj = await json("/api/admin/portfolio", {
    method: "POST",
    body: JSON.stringify({
      centerId, title: pTitle, summary: "Ringkasan proyek uji",
      isPublished: true, isHighlighted: true,
    }),
  });
  record("portfolio", "Admin dapat membuat proyek", proj.status === 201, `status=${proj.status}`);
  const projId = proj.body?.id;
  if (projId) cleanup.push(() => req(`/api/admin/portfolio/${projId}`, { method: "DELETE" }));

  const pf = await text("/portfolio");
  record("portfolio", "Proyek muncul di halaman portfolio", pf.html.includes(pTitle));
  const home = await text("/");
  record("portfolio", "Proyek unggulan muncul di beranda", home.html.includes(pTitle));

  await json(`/api/admin/portfolio/${projId}`, {
    method: "PUT", body: JSON.stringify({ isPublished: false }),
  });
  const pfAfter = await text("/portfolio");
  record("portfolio", "Proyek di-unpublish hilang dari publik", !pfAfter.html.includes(pTitle));

  // ── Fitur: Artikel ───────────────────────────────────────────────────────
  section("E. Fitur Artikel (admin → halaman publik)");
  const aTitle = `QA Artikel ${uniq()}`;
  const art = await json("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify({
      title: aTitle, content: "<p>Isi artikel uji QA</p>",
      summary: "Ringkasan uji", status: "DRAFT",
    }),
  });
  record("artikel", "Admin dapat membuat artikel", art.status === 201, `status=${art.status}`);
  const artId = art.body?.id;
  const artSlug = art.body?.slug;
  if (artId) cleanup.push(() => req(`/api/admin/articles/${artId}`, { method: "DELETE" }));

  const listDraft = await text("/artikel");
  record("artikel", "Artikel DRAFT tidak bocor ke publik", !listDraft.html.includes(aTitle));

  await json(`/api/admin/articles/${artId}`, {
    method: "PUT", body: JSON.stringify({ status: "PUBLISHED" }),
  });
  const listPub = await text("/artikel");
  record("artikel", "Artikel PUBLISHED muncul di daftar publik", listPub.html.includes(aTitle));
  const artPage = await text(`/artikel/${artSlug}`);
  record("artikel", "Halaman detail artikel dapat dibuka",
    artPage.status === 200 && artPage.html.includes("Isi artikel uji QA"));

  // ── Fitur: Taksonomi ─────────────────────────────────────────────────────
  section("F. Fitur Taksonomi Expertise");
  const tagName = `QA Tag ${uniq()}`;
  const tag = await json("/api/admin/expertise", {
    method: "POST", body: JSON.stringify({ name: tagName, colorHex: "#123456" }),
  });
  record("tag", "Admin dapat membuat tag", tag.status === 201, `status=${tag.status}`);
  const dup = await json("/api/admin/expertise", {
    method: "POST", body: JSON.stringify({ name: tagName }),
  });
  record("tag", "Tag duplikat ditolak 409 (bukan 500)", dup.status === 409, `status=${dup.status}`);

  const tagId = tag.body?.id;
  // Tag yang sedang dipakai tidak boleh bisa dihapus diam-diam.
  await json(`/api/admin/centers/${centerId}`, {
    method: "PUT", body: JSON.stringify({ tagIds: [tagId] }),
  });
  const delUsed = await json(`/api/admin/expertise/${tagId}`, { method: "DELETE" });
  record("tag", "Tag yang masih dipakai ditolak 409", delUsed.status === 409,
    `status=${delUsed.status}`);

  await json(`/api/admin/centers/${centerId}`, {
    method: "PUT", body: JSON.stringify({ tagIds: [] }),
  });
  const delFree = await json(`/api/admin/expertise/${tagId}`, { method: "DELETE" });
  record("tag", "Tag yang tidak dipakai dapat dihapus", delFree.status === 200,
    `status=${delFree.status}`);

  // ── Fitur: Konten Situs & Kontak ─────────────────────────────────────────
  section("G. Fitur Konten Situs, Kontak & Media Sosial");
  const headline = `QA Headline ${uniq()}`;
  const ig = "https://instagram.com/qa-uccenters";
  // Setting situs adalah state BERSAMA yang tampil di halaman publik. Nilai
  // aslinya disimpan dulu dan dipulihkan saat pembersihan — versi sebelumnya
  // menimpanya dan meninggalkan "(031) 000-QA" terpampang di footer situs.
  const before = (await json("/api/admin/homepage")).body ?? {};
  const restoreKeys = ["hero_headline", "social_instagram", "contact_phone"];
  cleanup.push(() =>
    req("/api/admin/homepage", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(restoreKeys.map((k) => [k, before[k] ?? ""]))),
    })
  );

  const save = await json("/api/admin/homepage", {
    method: "POST",
    body: JSON.stringify({
      hero_headline: headline, social_instagram: ig,
      contact_phone: "(031) 000-QA", kunci_ngawur: "harus diabaikan",
    }),
  });
  record("konten", "Admin dapat menyimpan konten situs", save.status === 200);
  record("konten", "Kunci tak dikenal diabaikan (whitelist)",
    !Object.keys(save.body?.settings ?? {}).includes("kunci_ngawur"));

  const homeAfter = await text("/");
  record("konten", "Judul hero baru tampil di beranda", homeAfter.html.includes(headline));
  const kontak = await text("/kontak");
  record("konten", "Instagram tampil di halaman kontak", kontak.html.includes(ig));
  record("konten", "Instagram tampil di footer", homeAfter.html.includes(ig));
  record("konten", "Telepon baru tampil di kontak", kontak.html.includes("(031) 000-QA"));
  record("konten", "Peta lokasi ter-render", kontak.html.includes("openstreetmap.org/export"));

  // ── Fitur: Form Kontak (lead) ────────────────────────────────────────────
  section("H. Fitur Form Kontak & Konsultasi");
  const email = `qa-${uniq()}@contoh.id`;
  const lead = await json("/api/leads", {
    method: "POST",
    body: JSON.stringify({
      name: "Pengunjung QA", email: email.toUpperCase(),
      subject: "Subjek uji QA", message: "Pesan uji QA",
      source: "GENERAL_CONSULTATION",
    }),
  });
  record("lead", "Pengunjung dapat mengirim pesan", lead.status === 201, `status=${lead.status}`);
  record("lead", "Balasan tidak membocorkan seluruh baris",
    lead.body?.lead && !("email" in lead.body.lead) && !("message" in lead.body.lead));

  const badEmail = await json("/api/leads", {
    method: "POST", body: JSON.stringify({ name: "X", email: "bukan-email", message: "y" }),
  });
  record("lead", "Email tidak valid ditolak 400", badEmail.status === 400);

  const leads = await json("/api/admin/leads");
  const found = (leads.body ?? []).find((l) => l.email === email.toLowerCase());
  record("lead", "Pesan masuk terlihat di panel admin", Boolean(found));
  record("lead", "Email dinormalkan jadi huruf kecil", found?.email === email.toLowerCase());
  record("lead", "Subjek tersimpan sebagai kolom sendiri", found?.subject === "Subjek uji QA");

  if (found) {
    const upd = await json(`/api/admin/leads/${found.id}`, {
      method: "PUT", body: JSON.stringify({ status: "CONTACTED" }),
    });
    record("lead", "Admin dapat mengubah status lead", upd.status === 200);
    const bad = await json(`/api/admin/leads/${found.id}`, {
      method: "PUT", body: JSON.stringify({ status: "NGAWUR" }),
    });
    record("lead", "Status di luar enum ditolak 400", bad.status === 400);
    cleanup.push(() => req(`/api/admin/leads/${found.id}`, { method: "DELETE" }));
  }

  // ── Fitur: User, Role & Hak Akses ────────────────────────────────────────
  section("I. Fitur User, Role & Hak Akses");
  const roleName = `QA Role ${uniq()}`;
  const role = await json("/api/admin/roles", {
    method: "POST",
    body: JSON.stringify({
      name: roleName, scope: "OWN_CENTER",
      permissions: ["dashboard.view", "articles.view", "articles.manage", "izin.palsu"],
    }),
  });
  record("rbac", "Admin dapat membuat role", role.status === 201, `status=${role.status}`);
  record("rbac", "Permission tak dikenal dibuang",
    Array.isArray(role.body?.permissions) && !role.body.permissions.includes("izin.palsu"),
    `permissions=${JSON.stringify(role.body?.permissions)}`);
  const roleId = role.body?.id;

  const uname = `qa${uniq()}`;
  const nu = await json("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      name: "User QA", username: uname, email: `${uname}@uccenters.id`,
      password: "RahasiaQA123", roleId, centerId,
    }),
  });
  record("rbac", "Admin dapat membuat user baru", nu.status === 201, `status=${nu.status}`);
  const newUserId = nu.body?.id;

  const weak = await json("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      name: "X", username: `x${uniq()}`, email: `x${uniq()}@u.id`,
      password: "lemah", roleId, centerId,
    }),
  });
  record("rbac", "Password lemah ditolak 400", weak.status === 400);

  const selfId = user.id;
  const selfDel = await req(`/api/admin/users/${selfId}`, { method: "DELETE" });
  record("rbac", "Tidak bisa menghapus akun sendiri", selfDel.status === 400);

  // Login sebagai user terbatas, uji penegakan izin di server.
  const limited = await login(uname, "RahasiaQA123");
  record("rbac", "User baru dapat login", Boolean(limited?.id), `role=${limited?.roleName}`);

  const denied = [];
  for (const ep of ["users", "roles", "activity", "leads", "centers", "clients"]) {
    const r = await json(`/api/admin/${ep}`);
    denied.push(`${ep}=${r.status}`);
    record("rbac", `User terbatas ditolak di /api/admin/${ep}`, r.status === 403, `status=${r.status}`);
  }
  const allowed = await json("/api/admin/articles");
  record("rbac", "User terbatas tetap boleh akses artikel", allowed.status === 200);

  const escalate = await json("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      name: "Jahat", username: `jahat${uniq()}`, email: `j${uniq()}@u.id`,
      password: "RahasiaQA123", roleId: "role_super_admin",
    }),
  });
  record("rbac", "User terbatas tidak bisa menaikkan hak aksesnya", escalate.status === 403);

  await login();
  if (newUserId) cleanup.push(() => req(`/api/admin/users/${newUserId}`, { method: "DELETE" }));
  if (roleId) cleanup.push(() => req(`/api/admin/roles/${roleId}`, { method: "DELETE" }));

  // ── Fitur: Activity Log ──────────────────────────────────────────────────
  section("J. Fitur Activity Log");
  const act = await json("/api/admin/activity");
  record("audit", "Activity log dapat dibaca", act.status === 200);
  record("audit", "Perubahan tadi tercatat", (act.body?.total ?? 0) > 0, `total=${act.body?.total}`);
  record("audit", "Filter tersedia",
    Array.isArray(act.body?.filters?.entityTypes) && act.body.filters.entityTypes.length > 0,
    `jenis=${JSON.stringify(act.body?.filters?.entityTypes)}`);
  record("audit", "Metadata tersimpan sebagai objek JSON, bukan string",
    act.body?.items?.every((i) => i.metadata === null || typeof i.metadata === "object"));

  // ── Fitur: Unggah Berkas ─────────────────────────────────────────────────
  section("K. Fitur Unggah Berkas");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const fd = new FormData();
  fd.append("file", new Blob([png], { type: "image/png" }), "qa.png");
  const up = await req("/api/admin/upload", { method: "POST", body: fd });
  const upBody = await up.json().catch(() => ({}));
  record("upload", "Unggah PNG valid berhasil", up.status === 201, `status=${up.status}`);

  if (upBody?.url) {
    const served = await req(upBody.url);
    record("upload", "Berkas dapat diakses publik", served.status === 200);
    record("upload", "Content-Type benar (bukan octet-stream)",
      served.headers.get("content-type") === "image/png",
      `content-type=${served.headers.get("content-type")}`);
    record("upload", "Header nosniff terpasang",
      served.headers.get("x-content-type-options") === "nosniff");
  }

  const evil = new FormData();
  evil.append("file", new Blob([Buffer.from("<?php system($_GET[0]); ?>")], { type: "image/png" }), "evil.png");
  const upEvil = await req("/api/admin/upload", { method: "POST", body: evil });
  record("upload", "Berkas menyamar sebagai PNG ditolak 400", upEvil.status === 400,
    `status=${upEvil.status}`);

  return finish();
}

// ===========================================================================
async function finish() {
  section("Z. Pembersihan data uji");
  // Dijalankan sesuai urutan pendaftaran, BUKAN reverse. Sempat dibalik, dan
  // itu membuat Role dihapus sebelum user yang memakainya — server benar
  // menolak 409, tapi datanya jadi tertinggal di database.
  for (const fn of cleanup) {
    try { await fn(); } catch { /* biarkan; dilaporkan lewat sisa data */ }
  }
  console.log(`  ${c.dim}${cleanup.length} objek uji dihapus${c.reset}`);

  const total = results.length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n${"=".repeat(64)}`);
  console.log(`${c.bold}RINGKASAN${c.reset}  ${total - failed.length}/${total} lulus`);
  if (failed.length) {
    console.log(`\n${c.red}${c.bold}GAGAL:${c.reset}`);
    for (const f of failed) console.log(`  - [${f.feature}] ${f.name} ${c.dim}${f.detail}${c.reset}`);
  } else {
    console.log(`${c.green}Semua pengujian lulus.${c.reset}`);
  }
  console.log("=".repeat(64));

  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`\n${c.red}Suite berhenti karena error tak terduga:${c.reset}`, err);
  process.exit(1);
});
