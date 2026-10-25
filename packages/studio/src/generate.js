import { hexToOklch, oklchToHex, parseHex } from '../../core/src/index.js';
import { fixRaw } from '../../cli/src/fix.js';
import { fromRaw } from '../../exporters/src/tokens.js';

const THEMES = [['light', 'Light'], ['sepia', 'Sepia'], ['dark', 'Dark'], ['dim', 'Dim'], ['hc-light', 'High contrast light'], ['hc-dark', 'High contrast dark']];
const IDS = THEMES.map((t) => t[0]);
const PRODUCT = {
  reading: { base: 18, ratio: 1.25, lh: 1.5 },
  app: { base: 16, ratio: 1.2, lh: 1.5 },
  dashboard: { base: 15, ratio: 1.2, lh: 1.4 },
  marketing: { base: 18, ratio: 1.25, lh: 1.5 },
};
const px = (n) => Math.round(n) + 'px';
const col = (l, c, h) => oklchToHex({ l, c, h });

/**
 * Brand colors in, complete token set out. Every color is built in OKLCH so lightness shifts keep the hue,
 * then the core contrast engine fixes anything that misses its level (see packages/cli/src/fix.js).
 */
export function generateTokens({ name, brand, productType = 'reading', radiusBase = 8, spacingBase = 4, fonts = {} }) {
  if (!name || typeof name !== 'string') throw new Error('A brand name is required.');
  if (!Array.isArray(brand) || brand.length < 1 || brand.length > 3) throw new Error('Give one to three brand colors.');
  brand.forEach(parseHex); // throws on invalid hex
  const prod = PRODUCT[productType];
  if (!prod) throw new Error(`Unknown product type "${productType}". Use: ${Object.keys(PRODUCT).join(', ')}.`);
  for (const [k, v] of Object.entries(fonts)) if (/[;{}<>\\()]/.test(v)) throw new Error(`Font stack for ${k} contains unsafe characters.`);

  const [b1, b2, b3] = brand.map(hexToOklch);
  // Hue for tinted neutrals: the primary's hue, unless it is nearly gray.
  const nh = b1.c > 0.02 ? b1.h : 250;
  const ink = (l, c = 0.01) => col(l, c, nh);
  const per = {
    light: { bg: col(0.985, 0.003, nh), surface: '#ffffff', ink: ink(0.22), 'ink-2': ink(0.42), line: ink(0.55) },
    sepia: { bg: col(0.94, 0.03, 85), surface: col(0.97, 0.025, 85), ink: col(0.27, 0.03, 70), 'ink-2': col(0.4, 0.03, 70), line: col(0.52, 0.03, 75) },
    dark: { bg: col(0.18, 0.004, nh), surface: col(0.22, 0.004, nh), ink: ink(0.93, 0.004), 'ink-2': ink(0.78, 0.006), line: ink(0.6, 0.006) },
    dim: { bg: col(0.25, 0.018, nh), surface: col(0.3, 0.018, nh), ink: ink(0.89, 0.01), 'ink-2': ink(0.76, 0.012), line: ink(0.6, 0.014) },
    'hc-light': { bg: '#ffffff', surface: '#ffffff', ink: '#000000', 'ink-2': '#262626', line: '#000000' },
    'hc-dark': { bg: '#000000', surface: '#0a0a0a', ink: '#ffffff', 'ink-2': '#e0e0e0', line: '#ffffff' },
  };
  const lightish = (o, th) => (/dark|dim/.test(th) ? { ...o, l: Math.max(o.l, 0.78) } : o);
  const accentFor = (o) => Object.fromEntries(IDS.map((th) => [th, oklchToHex(lightish(o, th))]));
  const status = (hue, lLight, lDark) => Object.fromEntries(IDS.map((th) => [th, col(/dark|dim/.test(th) ? lDark : lLight, 0.12, hue)]));
  const usage = {
    bg: 'Page ground. Text sits on it.', surface: 'Cards, panels and inputs raised above `bg`.', ink: 'Body and heading text on `bg` and `surface`.',
    'ink-2': 'Secondary text on `bg` and `surface`.', line: 'Borders of controls, inputs and cards; 3:1 or better on `bg` and `surface`.',
    accent: 'Links, primary buttons and selected states. Link text on `bg` and `surface`.', 'on-accent': 'Text on an `accent` fill.',
    focus: 'Focus ring, 2px solid with 2px offset; 3:1 on every ground.',
    success: 'Success text and icon on `bg` and `surface`; always with the word or a check mark.', warning: 'Warning text and icon on `bg` and `surface`; always with the word or a triangle.', danger: 'Error text and icon on `bg` and `surface`; always with the word or a cross.',
    'success-cvd': 'Success in color-vision mode (blue); with the word or a check mark.', 'warning-cvd': 'Warning in color-vision mode (orange); with the word or a triangle.', 'danger-cvd': 'Error in color-vision mode (vermillion); with the word or a cross.',
    'accent-2': 'Secondary brand color as text or icon on `bg` and `surface`.', 'accent-3': 'Tertiary brand color as text or icon on `bg` and `surface`.',
  };
  const values = {
    bg: Object.fromEntries(IDS.map((t) => [t, per[t].bg])), surface: Object.fromEntries(IDS.map((t) => [t, per[t].surface])),
    ink: Object.fromEntries(IDS.map((t) => [t, per[t].ink])), 'ink-2': Object.fromEntries(IDS.map((t) => [t, per[t]['ink-2']])),
    line: Object.fromEntries(IDS.map((t) => [t, per[t].line])), accent: accentFor(b1), 'on-accent': {}, focus: accentFor(b1),
    ...(b2 ? { 'accent-2': accentFor(b2) } : {}), ...(b3 ? { 'accent-3': accentFor(b3) } : {}),
    success: status(165, 0.45, 0.8), warning: status(70, 0.45, 0.82), danger: status(27, 0.45, 0.8),
    'success-cvd': status(250, 0.45, 0.8), 'warning-cvd': status(65, 0.45, 0.82), 'danger-cvd': status(38, 0.45, 0.8),
  };
  for (const th of IDS) {
    values['on-accent'][th] = /dark|dim/.test(th) ? '#0b0b0b' : '#ffffff'; // polarity follows the theme
  }
  const order = ['bg', 'surface', 'ink', 'ink-2', 'line', 'accent', 'on-accent', 'focus', 'accent-2', 'accent-3', 'success', 'warning', 'danger', 'success-cvd', 'warning-cvd', 'danger-cvd'];
  const sp = [1, 2, 3, 4, 6, 8, 12, 16].map((m, i) => ({ name: `space-${i + 1}`, value: `${m * spacingBase}px`, usage: ['Tight gaps', 'Inline gaps', 'Control padding', 'Card padding; minimum gutter', 'Between related groups', 'Section spacing', 'Large section spacing', 'Page-level spacing'][i] + '.' }));
  sp.push({ name: 'target-min', value: '44px', usage: 'Minimum size of every interactive target.' });
  // Structure: proximity carries the grouping, so each level is a clear step up from the one inside it.
  const structure = [['gap-item', 2, 'Between items inside one group: list rows, label to value.'], ['gap-group', 6, 'Between groups; at least 2x gap-item, so spacing alone shows what belongs together.'], ['gap-section', 12, 'Between sections; at least 1.5x gap-group.']].map(([n, m, u]) => ({ name: n, value: `${m * spacingBase}px`, usage: u }));
  const rb = radiusBase;
  const radius = [['radius-sm', Math.round(rb / 2), 'Chips, inputs.'], ['radius-md', rb, 'Buttons, alerts, cards.'], ['radius-lg', Math.round(rb * 1.5), 'Panels, large cards.']].map(([n, v, u]) => ({ name: n, value: v + 'px', usage: u }));
  radius.push({ name: 'radius-pill', value: '999px', usage: 'Chips and swatches.' });
  const { base, ratio, lh } = prod, step = (n) => Math.round(base * ratio ** n);
  const fam = { sans: fonts.sans ?? '"Inter", system-ui, sans-serif', serif: fonts.serif ?? '"Source Serif 4", Georgia, serif', mono: fonts.mono ?? '"JetBrains Mono", ui-monospace, monospace', hyper: '"Atkinson Hyperlegible", system-ui, sans-serif' };
  const style = (n, size, line, w, u, extra = {}) => ({ name: n, fontSize: px(size), lineHeight: px(line), fontWeight: w, usage: u, ...extra });
  const raw = {
    name, version: 1,
    color: { themes: THEMES.map(([id, nm]) => ({ id, name: nm })), tokens: order.filter((n) => values[n]).map((n) => ({ name: n, value: values[n], usage: usage[n] })) },
    type: { fonts: [], families: fam, groups: [
      { name: 'Reading', family: 'sans', styles: [
        style('display', step(4), step(4) * 1.15, 700, 'Page title.', { letterSpacing: '-0.01em' }), style('h2', step(3), step(3) * 1.2, 700, 'Section heading.'),
        style('h3', step(2), step(2) * 1.3, 650, 'Subsection heading.'), style('h4', step(1), step(1) * 1.35, 600, 'Minor heading.'),
        style('body', base, base * lh, 400, `Reading text: ${base}px at line height ${lh}.`), style('body-serif', base + 1, (base + 1) * 1.6, 400, 'Long-form reading in the serif family.', { family: 'serif' })] },
      { name: 'Interface', family: 'sans', styles: [
        style('ui', Math.max(16, base - 2), 24, 500, 'Buttons, labels, form fields.'), style('caption', Math.max(14, base - 4), 20, 400, 'Captions and helper text.', { letterSpacing: '0.01em' }), style('code', Math.max(14, base - 3), 24, 400, 'Inline and block code.', { family: 'mono' })] }] },
    spacing: { tokens: sp }, structure: { tokens: structure }, radius: { tokens: radius },
    measure: { tokens: [{ name: 'measure-min', value: '45ch', usage: 'Narrowest allowed line length.' }, { name: 'measure-default', value: '65ch', usage: 'Default reading column.' }, { name: 'measure-max', value: '90ch', usage: 'Widest allowed line length; above 75ch line height becomes at least 1.6.' }] },
  };
  const changes = fixRaw(raw);
  return { raw, tokens: fromRaw(raw), changes };
}
