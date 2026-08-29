// ============================================================================
//  Cache & rate-limit in-memory (pengganti Redis).
//
//  File ini dulu bernama `lib/redis.ts` padahal isinya sama sekali tidak
//  menyentuh Redis — penamaan itu menyesatkan dan menyisakan dependensi
//  `ioredis` + satu kontainer yang tidak pernah dipakai. Redis sudah dihapus
//  dari stack; modul ini adalah satu-satunya lapisan cache aplikasi.
//
//  Batasan yang disengaja: state hidup di memori proses Node. Cocok untuk
//  deployment satu kontainer `app` seperti compose ini. Kalau nanti aplikasi
//  di-scale ke beberapa replica, ganti implementasi di file ini saja —
//  antarmuka publiknya (getCachedData / setCachedData / invalidateCachePattern
//  / checkRateLimit) tidak perlu berubah.
// ============================================================================

type CacheEntry = { data: unknown; expiresAt: number };
type RateEntry = { count: number; expiresAt: number };

const cacheStore = new Map<string, CacheEntry>();
const rateStore = new Map<string, RateEntry>();

// Batas jumlah key supaya proses yang hidup lama tidak bocor memori.
const MAX_CACHE_KEYS = 500;
const MAX_RATE_KEYS = 5_000;

/** Buang entri kedaluwarsa; dipanggil sebelum operasi tulis. */
function sweep<T extends { expiresAt: number }>(store: Map<string, T>, now: number): void {
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}

/** Bila masih kepenuhan setelah sweep, buang key tertua (Map menjaga urutan insert). */
function enforceLimit(store: Map<string, unknown>, max: number): void {
  while (store.size > max) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function setCachedData(
  key: string,
  data: unknown,
  ttlSeconds = 3600
): Promise<void> {
  const now = Date.now();
  sweep(cacheStore, now);
  cacheStore.set(key, { data, expiresAt: now + ttlSeconds * 1000 });
  enforceLimit(cacheStore, MAX_CACHE_KEYS);
}

/** Pola glob sederhana, mis. `public:centers*`. */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Escape metakarakter regex, lalu `*` diterjemahkan jadi `.*`.
  // Versi lama hanya mengganti `*` tanpa escape, sehingga pola yang memuat
  // titik atau tanda kurung ikut ditafsirkan sebagai regex.
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
  const regex = new RegExp(`^${escaped}$`);

  for (const key of cacheStore.keys()) {
    if (regex.test(key)) cacheStore.delete(key);
  }
}

/**
 * Rate limiter sliding-window sederhana.
 * Mengembalikan `allowed: false` begitu percobaan melewati `maxAttempts`
 * dalam rentang `windowSeconds`.
 */
export async function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowSeconds = 900
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const record = rateStore.get(key);

  if (!record || now > record.expiresAt) {
    sweep(rateStore, now);
    rateStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    enforceLimit(rateStore, MAX_RATE_KEYS);
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  record.count += 1;
  return {
    allowed: record.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - record.count),
  };
}
