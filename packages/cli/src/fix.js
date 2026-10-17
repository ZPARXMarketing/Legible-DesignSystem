import { readFileSync, writeFileSync } from 'node:fs';
import { fixContrast, passes, hexToOklch, oklchToHex } from '../../core/src/index.js';
import { fromRaw } from '../../exporters/src/tokens.js';
import { levelFor } from './check.js';

const TEXT_TOKENS = ['ink', 'ink-2', 'accent', 'accent-2', 'accent-3', 'success', 'warning', 'danger', 'success-cvd', 'warning-cvd', 'danger-cvd'];
const NON_TEXT = { wcag: 3, apca: 0 };

/** Auto-fix failing tokens with the core engine: text lightness only, grounds never move (except accent behind on-accent). */
export function fixTokens(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const changes = fixRaw(raw);
  writeFileSync(path, JSON.stringify(raw, null, 1) + '\n');
  return changes;
}

/** Same, on a tokens object in memory. Returns the list of changes. */
export function fixRaw(raw) {
  const t = fromRaw(raw);
  const byName = Object.fromEntries(raw.color.tokens.map((x) => [x.name, x]));
  const changes = [];
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const th of t.themes) {
      const c = t.colors[th];
      const set = (name, hex) => { if (c[name] !== hex) { changes.push(`${th} ${name}: ${c[name]} -> ${hex}`); c[name] = hex; byName[name].value[th] = hex; changed = true; } };
      for (const name of TEXT_TOKENS.filter((n) => c[n])) for (const g of ['bg', 'surface']) {
        const lvl = levelFor(name, th);
        if (!passes(c[name], c[g], lvl)) {
          const r = fixContrast(c[name], c[g], lvl);
          if (r.bgMoved) throw new Error(`${th} ${name} cannot reach ${lvl} on ${g} without moving the ground`);
          set(name, r.text);
        }
      }
      for (const name of ['line', 'focus']) for (const g of ['bg', 'surface']) {
        if (!passes(c[name], c[g], NON_TEXT)) {
          const r = fixContrast(c[name], c[g], NON_TEXT);
          if (r.bgMoved) throw new Error(`${th} ${name} cannot reach 3:1 on ${g} without moving the ground`);
          set(name, r.text);
        }
      }
      const lvl = levelFor('on-accent', th);
      if (!passes(c['on-accent'], c.accent, lvl)) {
        // Polarity follows the theme: dark text on a light accent in dark themes, light text on a dark accent otherwise.
        // Only the accent moves (away from the text), which also keeps it clear of the ground.
        const darkTheme = /dark|dim/.test(th);
        let text = c['on-accent'];
        const lt = hexToOklch(text).l;
        if (darkTheme ? lt > 0.5 : lt < 0.5) text = darkTheme ? '#0b0b0b' : '#ffffff';
        const o = hexToOklch(c.accent);
        for (let i = 0; i < 100 && !passes(text, oklchToHex(o), lvl); i++) o.l = Math.min(1, Math.max(0, o.l + (darkTheme ? 0.01 : -0.01)));
        set('on-accent', text); set('accent', oklchToHex(o));
      }
    }
    if (!changed) break;
  }
  return changes;
}
