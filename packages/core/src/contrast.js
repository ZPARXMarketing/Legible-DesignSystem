import limits from '../limits.json' with { type: 'json' };
import { wcagRatio, apcaLc, hexToOklch, oklchToHex } from './color.js';

export const LEVELS = limits.contrast;

/** A pair passes only if it meets BOTH the WCAG 2 ratio and the APCA |Lc| for the level. */
export function passes(text, bg, level = 'standard') {
  const t = typeof level === 'string' ? LEVELS[level] : level;
  return wcagRatio(text, bg) >= t.wcag && Math.abs(apcaLc(text, bg)) >= t.apca;
}

/**
 * Shift text lightness (OKLCH L only, hue and chroma kept) until the pair passes.
 * If text reaches black or white and still fails, nudge the ground the other way and retry.
 * Returns BOTH colors, because the ground may have moved: { text, bg, bgMoved }.
 */
export function fixContrast(text, bg, level = 'standard') {
  let t = text, b = bg;
  for (let round = 0; round < 25; round++) {
    if (passes(t, b, level)) return { text: t, bg: b, bgMoved: b !== bg };
    const dir = hexToOklch(b).l > 0.5 ? -1 : 1; // darker text on a light ground, lighter on a dark one
    const o = hexToOklch(t);
    for (let i = 0; i < 100; i++) {
      o.l = Math.min(1, Math.max(0, o.l + dir * 0.01));
      const candidate = oklchToHex(o);
      if (passes(candidate, b, level)) return { text: candidate, bg: b, bgMoved: b !== bg };
    }
    t = oklchToHex(o);
    const bo = hexToOklch(b);
    bo.l = Math.min(1, Math.max(0, bo.l - dir * 0.02));
    b = oklchToHex(bo);
  }
  return { text: t, bg: b, bgMoved: b !== bg };
}
