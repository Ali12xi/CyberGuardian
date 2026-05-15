/**
 * RTL layout strategy (CyberGurdian AI)
 *
 * 1. Prefer logical CSS / Tailwind: `ms-`, `me-`, `ps-`, `pe-`, `start-*`, `end-*`,
 *    `text-start`, `text-end`, `border-s-*`, `rounded-s-*`, etc.
 * 2. Use the `rtl:` variant only when mirroring an exception (e.g. gradients).
 * 3. Keep URLs, headers, severity tokens, and numeric displays in `dir="ltr"` where needed.
 * 4. Do not reverse source arrays for visual order — use flex/grid direction + document `dir`,
 *    or isolate a row with `dir="ltr"` when the physical control order must match LTR (URL bar).
 * 5. Prefer `text-start` / `text-end` over hard-coded left/right alignment classes.
 */

import type { Language } from "@/lib/i18n";

export function isRtl(language: Language): boolean {
  return language === "ar";
}
