/**
 * sanitizeText
 *
 * A PURE function. No side effects. No locale awareness.
 * No imports. No JSX. No rendering logic.
 *
 * Removes encoding garbage and invisible characters that corrupt
 * rendered PDF text (both English and Arabic).
 *
 * SAFE on:
 *   - URLs (http://, https://)
 *   - JWT tokens (base64url: a-z A-Z 0-9 - _ . =)
 *   - SHA / HMAC hex hashes
 *   - TLS cipher suite identifiers (e.g. TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256)
 *   - HTTP header names (X-Content-Type-Options, etc.)
 *   - Code snippets (add_header ..., server_tokens off, etc.)
 *
 * Removes only KNOWN-BAD characters:
 *   - Unicode replacement char (U+FFFD)
 *   - Soft hyphen (U+00AD)  → fixes "sig\u00adnals" rendered as "sig￾nals"
 *   - Zero-width space (U+200B) and BOM (U+FEFF)
 *   - Stray bidi formatting marks (U+202A–U+202E, U+2066–U+2069)
 *   - Orphan LRM/RLM (U+200E / U+200F)
 *   - Mojibake remnants (Ø Ù × Æ Þ þ Œ œ) when adjacent to Arabic
 *     or whitespace — NOT when surrounded by Latin letters
 *
 * Preserves:
 *   - U+200C (ZWNJ) — needed for Arabic ligatures
 *   - U+200D (ZWJ)  — needed for Arabic ligatures
 *   - All ASCII printable characters
 *   - All Arabic letters (U+0600–U+06FF, U+0750–U+077F, U+FB50–U+FDFF, U+FE70–U+FEFF)
 *   - Diacritics, tatweel, and standard punctuation
 *
 * @param input  any string (may be undefined or null in practice)
 * @returns      cleaned string, never null/undefined
 */
export function sanitizeText(input: string | null | undefined): string {
  if (input == null) return '';
  if (typeof input !== 'string') return '';
  if (input.length === 0) return '';

  let s: string = input;

  // 1) Unicode NFC normalization (composes accents, fixes split forms)
  s = s.normalize('NFC');

  // 2) Remove the Unicode replacement character (U+FFFD)
  s = s.replace(/\ufffd/g, '');

  // 3) Remove soft hyphen (U+00AD)
  //    Source of "sig￾nals", "brows￾er-side" artifacts.
  s = s.replace(/\u00ad/g, '');

  // 4) Remove zero-width space (U+200B) and byte-order mark (U+FEFF)
  //    DO NOT remove U+200C (ZWNJ) or U+200D (ZWJ) — used by Arabic.
  s = s.replace(/[\u200b\ufeff]/g, '');

  // 5) Remove stray bidi formatting marks (RLO, LRO, PDF, isolates)
  s = s.replace(/[\u202a-\u202e\u2066-\u2069]/g, '');

  // 6) Remove orphan LRM/RLM (U+200E / U+200F)
  //    These appear scattered in corrupted exports and break flow.
  s = s.replace(/[\u200e\u200f]/g, '');

  // 7) Remove mojibake remnants — high Latin-1 letters that appear
  //    isolated when adjacent to Arabic letters or whitespace.
  //    These are corruption artifacts (single-byte remains of multi-byte
  //    UTF-8 sequences), NOT legitimate Latin text.
  //
  //    We only strip them at Arabic/whitespace boundaries — never inside
  //    legitimate Latin words like "Ångström" or "Œuvre".
  const MOJIBAKE_CHARS = /[ØÙ×ÆÞþŒœ̧]/g;
  const ARABIC_OR_SPACE = /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff\s]/;

  s = s.replace(MOJIBAKE_CHARS, (match, offset, full) => {
    const prev = offset > 0 ? full[offset - 1] : '';
    const next = offset + match.length < full.length ? full[offset + match.length] : '';
    const adjacentToArabic =
      ARABIC_OR_SPACE.test(prev) || ARABIC_OR_SPACE.test(next);
    return adjacentToArabic ? '' : match;
  });

  // 8) Collapse multiple horizontal whitespace into one space.
  //    Preserve newlines (\n, \r).
  s = s.replace(/[^\S\r\n]+/g, ' ');

  // 9) Trim leading/trailing whitespace.
  s = s.trim();

  return s;
}
