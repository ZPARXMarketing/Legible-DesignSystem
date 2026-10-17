// Pure preference logic for Legible Reader: no DOM, fully unit-tested.
import { guard, DEFAULTS, fixContrast, parseHex, limits } from '../../core/src/index.js';

export const STORAGE_KEY = 'legible.prefs.v1';
export const THEMES = ['light', 'sepia', 'dark', 'dim', 'hc-light', 'hc-dark'];
export const FONTS = {
  inter: { name: 'Inter', stack: 'var(--font-sans, "Inter", system-ui, sans-serif)', google: 'Inter:wght@300..700' },
  atkinson: { name: 'Atkinson Hyperlegible', stack: 'var(--font-hyper, "Atkinson Hyperlegible", system-ui, sans-serif)', google: 'Atkinson+Hyperlegible:wght@400;700' },
  serif: { name: 'Source Serif 4', stack: 'var(--font-serif, "Source Serif 4", Georgia, serif)', google: 'Source+Serif+4:wght@300..700' },
  mono: { name: 'JetBrains Mono', stack: 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)', google: 'JetBrains+Mono:wght@300..700' },
  system: { name: 'System font', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
};
export const DEFAULT_PREFS = {
  version: 1, preset: 'recommended', font: 'inter', sizePx: DEFAULTS.sizePx, weight: 400, lineHeight: 1.5, letterSpacingEm: 0, wordSpacingEm: 0,
  measureCh: 65, paragraphSpacingEm: 1.5, align: 'left', hyphenate: false, theme: 'system', contrast: 'auto', customColors: null, cvdMode: 'off', readingRuler: 'off',
};
export const PRESETS = {
  recommended: { label: 'Recommended', set: { ...DEFAULT_PREFS, preset: 'recommended' } },
  long: { label: 'Long reading', set: { font: 'serif', sizePx: 19, lineHeight: 1.6, letterSpacingEm: 0, theme: 'sepia', contrast: 'standard' } },
  lowvision: { label: 'Low vision', set: { font: 'atkinson', sizePx: 24, lineHeight: 1.6, letterSpacingEm: 0.02, theme: 'hc-light', contrast: 'maximum' } },
  dyslexia: { label: 'Dyslexia-friendly', set: { font: 'atkinson', sizePx: 20, lineHeight: 1.8, letterSpacingEm: 0.08, theme: 'sepia', contrast: 'standard' } },
  night: { label: 'Night', set: { font: 'inter', sizePx: 18, weight: 450, lineHeight: 1.6, letterSpacingEm: 0.01, theme: 'dim', contrast: 'comfortable' } },
  compact: { label: 'Compact', set: { font: 'inter', sizePx: 15, lineHeight: 1.35, letterSpacingEm: 0, contrast: 'standard' } },
};
export function applyPreset(prefs, id) {
  const p = PRESETS[id];
  return p ? sanitize({ ...DEFAULT_PREFS, ...p.set, cvdMode: prefs.cvdMode, readingRuler: prefs.readingRuler, preset: id }) : prefs;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const pick = (v, list, d) => (list.includes(v) ? v : d);
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Whitelist and type-check untrusted input (storage, share links, imported files). Never throws. */
export function sanitize(input) {
  const i = input && typeof input === 'object' ? input : {};
  const d = DEFAULT_PREFS;
  const out = {
    version: 1, preset: typeof i.preset === 'string' && (PRESETS[i.preset] || i.preset === 'custom') ? i.preset : 'custom',
    font: pick(i.font, Object.keys(FONTS), d.font),
    sizePx: num(i.sizePx, d.sizePx), weight: num(i.weight, d.weight), lineHeight: num(i.lineHeight, d.lineHeight),
    letterSpacingEm: num(i.letterSpacingEm, d.letterSpacingEm), wordSpacingEm: num(i.wordSpacingEm, d.wordSpacingEm),
    measureCh: num(i.measureCh, d.measureCh), paragraphSpacingEm: num(i.paragraphSpacingEm, d.paragraphSpacingEm),
    align: pick(i.align, ['left', 'justify'], 'left'), hyphenate: i.hyphenate === true,
    theme: pick(i.theme, ['system', ...THEMES], 'system'), contrast: pick(i.contrast, ['auto', 'comfortable', 'standard', 'maximum'], 'auto'),
    customColors: i.customColors && HEX.test(i.customColors.bg) && HEX.test(i.customColors.text) ? { bg: i.customColors.bg.toLowerCase(), text: i.customColors.text.toLowerCase() } : null,
    cvdMode: pick(i.cvdMode, ['off', 'on'], 'off'), readingRuler: pick(i.readingRuler, ['off', 'line', 'dim'], 'off'),
  };
  const g = guard(out);
  for (const k of ['sizePx', 'weight', 'lineHeight', 'letterSpacingEm', 'wordSpacingEm', 'measureCh', 'paragraphSpacingEm', 'align']) out[k] = g[k];
  return out;
}

export const encodeShare = (prefs) => btoa(JSON.stringify(prefs)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function decodeShare(s) {
  try { return sanitize(JSON.parse(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')))); } catch { return null; }
}

/** OS signals decide what "system" means. */
export function resolveTheme(prefs, os = {}) {
  if (prefs.theme !== 'system') return prefs.theme;
  if (os.contrastMore) return os.dark ? 'hc-dark' : 'hc-light';
  return os.dark ? 'dark' : 'light';
}

/**
 * Everything the page needs: CSS variables, attributes and human-readable notes.
 * `palette` ({ink, ink2, bg}) is read from the live theme so contrast can be corrected.
 */
export function computeVars(prefs, os = {}, palette = null) {
  const p = sanitize(prefs);
  const theme = resolveTheme(p, os);
  const g = guard({ ...p, theme });
  const notes = [...g.notes];
  const vars = {
    '--lg-font': FONTS[p.font].stack, '--lg-size': `${g.sizePx / 16}rem`, '--lg-weight': String(g.weight), '--lg-leading': String(g.lineHeight),
    '--lg-tracking': `${g.letterSpacingEm}em`, '--lg-word': `${g.wordSpacingEm}em`, '--lg-measure': `${g.measureCh}ch`, '--lg-para': `${g.paragraphSpacingEm}em`,
    '--lg-align': g.align, '--lg-hyphens': p.hyphenate ? 'auto' : 'manual',
  };
  const level = p.contrast === 'auto' ? (os.contrastMore ? 'maximum' : null) : p.contrast;
  const usable = (h) => typeof h === 'string' && HEX.test(h.trim());
  if (p.customColors) {
    const base = limits.contrast[level ?? 'standard'];
    const fixed = fixContrast(p.customColors.text, p.customColors.bg, base);
    vars['--bg'] = fixed.bg; vars['--surface'] = fixed.bg; vars['--ink'] = fixed.text; vars['--ink-2'] = fixed.text;
    if (fixed.text !== p.customColors.text || fixed.bg !== p.customColors.bg) notes.push('Adjusted text color for readability.');
  } else if (level && palette && usable(palette.ink) && usable(palette.bg)) {
    const second = { maximum: 'standard', standard: 'comfortable', comfortable: 'comfortable' }[level];
    const a = fixContrast(palette.ink.trim(), palette.bg.trim(), level);
    if (!a.bgMoved && a.text !== palette.ink.trim().toLowerCase()) { vars['--ink'] = a.text; notes.push('Adjusted text color for readability.'); }
    if (usable(palette.ink2)) {
      const b = fixContrast(palette.ink2.trim(), palette.bg.trim(), second);
      if (!b.bgMoved && b.text !== palette.ink2.trim().toLowerCase()) vars['--ink-2'] = b.text;
    }
  }
  return { vars, attrs: { 'data-theme': theme, 'data-cvd': p.cvdMode === 'on' ? '' : null }, notes, theme, safe: g };
}
