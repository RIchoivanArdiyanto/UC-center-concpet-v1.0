// ============================================================================
//  Pembuatan slug URL.
//
//  Logika ini sebelumnya disalin apa adanya di empat route (centers, articles,
//  portfolio, expertise) dan selalu menempelkan `-<4 digit timestamp>` ke setiap
//  slug — hasilnya URL jelek ("judul-artikel-8417") walau tidak ada bentrokan,
//  dan tetap bisa bentrok karena 4 digit terakhir milidetik mudah berulang.
//  Di sini slug dibuat bersih dulu; akhiran angka hanya ditambahkan kalau slug
//  tersebut memang sudah dipakai.
// ============================================================================

// Ditulis lewat konstruktor RegExp (bukan literal) supaya source file tetap
// ASCII murni dan tidak rusak saat berpindah editor/encoding.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** "Judul Ártikel Saya!" -> "judul-artikel-saya" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD") // pisahkan huruf dari tanda diakritiknya
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Bikin slug yang dijamin belum dipakai.
 *
 * @param base      teks sumber (judul/nama)
 * @param isTaken   callback pengecek ke database
 * @param fallback  dipakai kalau `base` tidak menyisakan karakter apa pun
 *                  (mis. judul yang seluruhnya aksara non-latin)
 */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallback = "item"
): Promise<string> {
  const root = slugify(base) || fallback;

  if (!(await isTaken(root))) return root;

  for (let suffix = 2; suffix < 1000; suffix++) {
    const candidate = `${root}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // Praktis tidak akan tercapai; jaring pengaman supaya tidak melempar error.
  return `${root}-${Date.now()}`;
}
