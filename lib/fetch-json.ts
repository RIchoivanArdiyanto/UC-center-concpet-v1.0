/**
 * Pembungkus fetch untuk panel admin.
 *
 * Halaman admin sebelumnya memakai pola `if (res.ok) { refresh() }` tanpa cabang
 * else, jadi request yang gagal (403, 409, 500) berakhir senyap: tombol diklik,
 * tidak terjadi apa-apa, dan pengguna tidak tahu kenapa. Helper ini selalu
 * melempar Error berisi pesan dari server supaya pemanggilnya bisa
 * menampilkannya lewat toast.
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json", ...init?.headers }
        : init?.headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String(data.error)) ||
      `Permintaan gagal (HTTP ${res.status}).`;
    throw new Error(message);
  }

  return data as T;
}

/** Ambil pesan error yang aman ditampilkan ke pengguna. */
export function errorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
