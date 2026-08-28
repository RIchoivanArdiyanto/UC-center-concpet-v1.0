// In-Memory Rate Limiting & Cache Fallback (Zero Redis Dependency Mode)

const inMemoryCache = new Map<string, { data: any; expiry: number }>();
const inMemoryRateLimit = new Map<string, { count: number; expiry: number }>();

// Cache Helper
export async function getCachedData<T>(key: string): Promise<T | null> {
  const item = inMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    inMemoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
  inMemoryCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  for (const key of inMemoryCache.keys()) {
    if (regexPattern.test(key)) {
      inMemoryCache.delete(key);
    }
  }
}

// In-Memory Rate Limiter for Admin Login
export async function checkRateLimit(
  ipOrEmail: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const key = `ratelimit:${ipOrEmail}`;
  const record = inMemoryRateLimit.get(key);

  if (!record || now > record.expiry) {
    inMemoryRateLimit.set(key, { count: 1, expiry: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  record.count += 1;
  const allowed = record.count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - record.count);

  return { allowed, remaining };
}
