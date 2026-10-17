import limits from '../limits.json' with { type: 'json' };

export const BOUNDS = ['sizePx', 'weight', 'lineHeight', 'letterSpacingEm', 'wordSpacingEm', 'measureCh', 'paragraphSpacingEm'];
export const DEFAULTS = Object.fromEntries(BOUNDS.map((k) => [k, limits[k].default]));
const clamp = (v, k) => Math.min(limits[k].max, Math.max(limits[k].min, v));
const isDark = (theme = '') => /dark|dim/.test(theme);

/**
 * Apply the guardrails in order. Returns the safe settings plus `notes`
 * describing every adjustment, so a UI can say "Adjusted for readability."
 */
export function guard(input) {
  const g = { ...DEFAULTS, ...input };
  const notes = [];
  for (const k of BOUNDS) {
    const v = clamp(g[k], k);
    if (v !== g[k]) notes.push(`${k} limited to ${v}`);
    g[k] = v;
  }
  const minWeight = isDark(g.theme) ? 450 : 400;
  if ((g.sizePx < 16 || isDark(g.theme)) && g.weight < minWeight) {
    g.weight = minWeight;
    notes.push(`weight raised to ${minWeight}`);
  }
  if (g.measureCh > 75 && g.lineHeight < 1.6) {
    g.lineHeight = 1.6;
    notes.push('line height raised to 1.6 for a long line');
  }
  if (g.align === 'justify' && !g.hyphenate) {
    g.align = 'left';
    notes.push('justified text needs hyphenation; using left');
  }
  g.notes = notes;
  return g;
}

/** Layers 1 to 5: baseline < brand < OS < reader. Guardrails run last. */
export function resolve({ brand = {}, os = {}, user = {} } = {}) {
  return guard({ ...DEFAULTS, ...brand, ...os, ...user });
}
