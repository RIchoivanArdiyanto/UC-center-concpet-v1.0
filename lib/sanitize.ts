import sanitizeHtml from "sanitize-html";

/**
 * Pembersih HTML untuk konten yang ditulis lewat editor Tiptap.
 *
 * Konten ini sebelumnya diteruskan apa adanya ke `dangerouslySetInnerHTML`.
 * Penulisnya memang admin, tetapi itu tidak membuatnya aman: admin ber-role
 * terbatas (mis. "Editor Konten" yang hanya boleh menulis artikel) bisa
 * menyisipkan <script> yang kemudian berjalan di browser SETIAP pengunjung dan
 * di browser Super Admin — cukup untuk mencuri cookie sesi dan mengambil alih
 * panel. Karena itu HTML dibersihkan di server sebelum dirender.
 *
 * Daftar tag/atribut di bawah sengaja dibatasi pada yang benar-benar bisa
 * dihasilkan Tiptap (StarterKit + Link + Image).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike", "code", "pre", "blockquote",
    "ul", "ol", "li",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class"],
  },
  // Skema berbahaya seperti javascript: dan data:text/html ditolak dengan
  // hanya mengizinkan skema di bawah ini.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Cegah URL relatif protokol ("//evil.com") lolos sebagai tautan.
  allowProtocolRelative: false,
  transformTags: {
    // Setiap tautan keluar dipaksa aman: tanpa noopener, halaman tujuan bisa
    // mengendalikan tab asal lewat window.opener.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === "_blank"
          ? { rel: "noopener noreferrer nofollow" }
          : {}),
      },
    }),
  },
};

/** Bersihkan HTML dari editor; string kosong/null aman dikirim. */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}

/**
 * Ubah HTML jadi teks biasa — dipakai untuk ringkasan/preview dan meta
 * description, di mana tag apa pun hanya jadi sampah.
 */
export function htmlToPlainText(html: string | null | undefined, maxLength = 200): string {
  if (!html) return "";
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
