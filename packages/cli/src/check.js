import { wcagRatio, apcaLc, passes } from '../../core/src/index.js';

const HC = (th) => th.startsWith('hc-');
const TEXT = {
  ink: (th) => (HC(th) ? 'maximum' : th === 'dim' ? 'comfortable' : 'standard'), // Dim is the Night preset: Comfortable
  'ink-2': (th) => (HC(th) ? 'standard' : 'comfortable'),
};
const COMFY = ['accent', 'success', 'warning', 'danger', 'success-cvd', 'warning-cvd', 'danger-cvd'];
const GROUNDS = ['bg', 'surface'];

/** The contrast matrix: every text/ground pair in every theme, against WCAG 2.2 and APCA. */
export const levelFor = (name, th) => (TEXT[name] ? TEXT[name](th) : HC(th) ? 'standard' : 'comfortable');

export function runChecks(t) {
  const rows = [];
  for (const th of t.themes) {
    const c = t.colors[th];
    for (const g of GROUNDS) {
      for (const name of Object.keys(TEXT)) rows.push(row(th, name, g, c, TEXT[name](th)));
      for (const name of COMFY) rows.push(row(th, name, g, c, HC(th) ? 'standard' : 'comfortable'));
      for (const name of ['line', 'focus']) {
        const ratio = wcagRatio(c[name], c[g]);
        rows.push({ theme: th, text: name, ground: g, kind: 'non-text', level: '3:1', ratio, lc: apcaLc(c[name], c[g]), pass: ratio >= 3 });
      }
    }
    rows.push(row(th, 'on-accent', 'accent', c, HC(th) ? 'standard' : 'comfortable'));
  }
  return rows;
}
function row(theme, text, ground, c, level) {
  return { theme, text, ground, kind: 'text', level, ratio: wcagRatio(c[text], c[ground]), lc: apcaLc(c[text], c[ground]), pass: passes(c[text], c[ground], level) };
}
