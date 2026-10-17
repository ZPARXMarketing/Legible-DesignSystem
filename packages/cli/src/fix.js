import { readFileSync, writeFileSync } from 'node:fs';
import { fixContrast, passes } from '../../core/src/index.js';
import { loadTokens } from '../../exporters/src/tokens.js';
import { levelFor } from './check.js';

const TEXT_TOKENS = ['ink', 'ink-2', 'accent', 'success', 'warning', 'danger', 'success-cvd', 'warning-cvd', 'danger-cvd'];

/** Auto-fix failing tokens with the core engine: text lightness only, grounds never move (except accent behind on-accent). */
export function fixTokens(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const t = loadTokens(path);
  const byName = Object.fromEntries(raw.color.tokens.map((x) => [x.name, x]));
  const changes = [];
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const th of t.themes) {
      const c = t.colors[th];
      const set = (name, hex) => { if (c[name] !== hex) { changes.push(`${th} ${name}: ${c[name]} -> ${hex}`); c[name] = hex; byName[name].value[th] = hex; changed = true; } };
      for (const name of TEXT_TOKENS) for (const g of ['bg', 'surface']) {
        const lvl = levelFor(name, th);
        if (!passes(c[name], c[g], lvl)) {
          const r = fixContrast(c[name], c[g], lvl);
          if (r.bgMoved) throw new Error(`${th} ${name} cannot reach ${lvl} on ${g} without moving the ground`);
          set(name, r.text);
        }
      }
      const lvl = levelFor('on-accent', th);
      if (!passes(c['on-accent'], c.accent, lvl)) {
        const r = fixContrast(c['on-accent'], c.accent, lvl);
        set('on-accent', r.text); if (r.bgMoved) set('accent', r.bg);
      }
    }
    if (!changed) break;
  }
  writeFileSync(path, JSON.stringify(raw, null, 1) + '\n');
  return changes;
}
