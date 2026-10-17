// Generates every image in docs/img from the real tokens and the real contrast results,
// so the README can never drift from the system.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens } from '../packages/exporters/src/tokens.js';
import { runChecks } from '../packages/cli/src/check.js';
import { limits, guard } from '../packages/core/src/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const t = loadTokens(resolve(root, 'tokens/tokens.json'));
const rows = runChecks(t);
const L = t.colors.light, D = t.colors.dark;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" font-family="${FONT}"><title>${esc(title)}</title>${body}</svg>\n`;
const save = (name, s) => { mkdirSync(resolve(root, 'docs/img'), { recursive: true }); writeFileSync(resolve(root, 'docs/img', name), s); console.log('docs/img/' + name); };
const text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size ?? 14}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? L.ink}" text-anchor="${o.anchor ?? 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
const rect = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 0}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 2}"` : ''}/>`;

// 1. Banner ---------------------------------------------------------------
{
  const W = 1280, H = 380;
  let b = rect(0, 0, W, H, L.bg);
  b += `<clipPath id="a"><rect x="660" y="0" width="300" height="230" rx="10"/></clipPath>`;
  b += rect(660, 0, 300, 230, L.accent, { rx: 10 }) + `<text x="684" y="292" font-size="340" font-weight="700" fill="${L['on-accent']}" clip-path="url(#a)">A</text>`;
  b += rect(972, 0, 308, 140, L.ink, { rx: 10 }) + rect(972, 152, 150, 228, L.warning, { rx: 10 }) + rect(1134, 152, 146, 120, L['ink-2'], { rx: 10 }) + rect(660, 242, 300, 138, L.success, { rx: 10 });
  b += text(64, 236, 'Legible', { size: 128, weight: 700, ls: '-3' });
  b += text(68, 282, 'Type that adjusts to the reader,', { size: 22, fill: L['ink-2'] });
  b += text(68, 310, 'inside limits that keep it readable.', { size: 22, fill: L['ink-2'] });
  b += text(68, 352, 'Research-backed defaults · 18 settings · WCAG 2.2 + APCA', { size: 15, fill: L['ink-2'] });
  save('banner.svg', svg(W, H, b, 'Legible: type that adjusts to the reader'));
}

// 2. Six themes -----------------------------------------------------------
{
  const names = Object.fromEntries(t.themeMeta.map((x) => [x.id, x.name]));
  const cw = 380, ch = 250, gap = 20, W = cw * 3 + gap * 4, H = ch * 2 + gap * 3;
  let b = rect(0, 0, W, H, '#ffffff');
  t.themes.forEach((th, i) => {
    const c = t.colors[th], x = gap + (i % 3) * (cw + gap), y = gap + Math.floor(i / 3) * (ch + gap);
    b += rect(x, y, cw, ch, c.bg, { rx: 14, stroke: c.line });
    b += rect(x + 20, y + 20, cw - 40, 118, c.surface, { rx: 10, stroke: c.line });
    b += text(x + 36, y + 52, names[th], { size: 19, weight: 700, fill: c.ink });
    b += text(x + 36, y + 80, 'Reading is a skill we build once', { size: 15, fill: c.ink });
    b += text(x + 36, y + 102, 'and use all day. Secondary caption.', { size: 13, fill: c['ink-2'] });
    b += text(x + 36, y + 126, 'Underlined link', { size: 14, fill: c.accent }) + `<line x1="${x + 36}" y1="${y + 130}" x2="${x + 130}" y2="${y + 130}" stroke="${c.accent}" stroke-width="1.5"/>`;
    b += rect(x + 20, y + 154, 112, 44, c.accent, { rx: 8 }) + text(x + 76, y + 182, 'Primary', { size: 15, weight: 600, fill: c['on-accent'], anchor: 'middle' });
    b += rect(x + 142, y + 154, 112, 44, c.surface, { rx: 8, stroke: c.line }) + text(x + 198, y + 182, 'Secondary', { size: 15, fill: c.ink, anchor: 'middle' });
    [['✓', 'success'], ['⚠', 'warning'], ['✕', 'danger']].forEach(([g, n], j) => { b += text(x + 24 + j * 82, y + 232, g, { size: 17, weight: 700, fill: c[n] }) + text(x + 44 + j * 82, y + 232, n, { size: 12, fill: c.ink }); });
    b += rect(x + 282, y + 216, 28, 22, c.focus, { rx: 4 }) + text(x + 316, y + 232, 'focus', { size: 12, fill: c.ink });
  });
  save('themes.svg', svg(W, H, b, 'The six Legible themes'));
}

// 3. Contrast matrix ------------------------------------------------------
{
  const toks = ['ink', 'ink-2', 'accent', 'success', 'warning', 'danger', 'success-cvd', 'warning-cvd', 'danger-cvd'];
  const cols = t.themes.flatMap((th) => ['bg', 'surface'].map((g) => ({ th, g })));
  const x0 = 130, cw = 84, rh = 44, top = 78, W = x0 + cols.length * cw + 20, H = top + (toks.length + 2) * rh + 60;
  let b = rect(0, 0, W, H, '#ffffff');
  b += text(20, 34, 'Contrast matrix: every text color on both grounds, in every theme', { size: 18, weight: 700, fill: '#1a1a1a' });
  b += text(20, 56, 'Each cell shows the WCAG 2 ratio and APCA Lc. Every cell passes both for its level.', { size: 13, fill: '#4a4a4a' });
  t.themes.forEach((th, i) => { b += text(x0 + i * 2 * cw + cw, top - 8, th, { size: 13, weight: 700, fill: '#1a1a1a', anchor: 'middle' }); });
  const rowsAll = [...toks, 'line', 'focus'];
  rowsAll.forEach((n, r) => {
    const y = top + r * rh;
    b += text(20, y + 27, n, { size: 13, fill: '#1a1a1a' });
    cols.forEach((cl, i) => {
      const c = t.colors[cl.th], x = x0 + i * cw;
      const hit = rows.find((q) => q.theme === cl.th && q.text === n && q.ground === cl.g);
      b += rect(x + 2, y + 2, cw - 4, rh - 4, c[cl.g], { rx: 6, stroke: hit?.pass ? 'none' : '#c00' });
      b += text(x + cw / 2, y + 20, hit.kind === 'text' ? 'Aa' : '■', { size: 16, weight: 700, fill: c[n], anchor: 'middle' });
      b += text(x + cw / 2, y + 35, `${hit.ratio.toFixed(1)}${hit.kind === 'text' ? ' · ' + Math.abs(hit.lc).toFixed(0) : ''}`, { size: 10, fill: c[n], anchor: 'middle' });
    });
  });
  b += text(20, H - 22, `${rows.filter((q) => q.pass).length} of ${rows.length} checked pairs pass (includes on-accent on accent). Source: npm run check`, { size: 12, fill: '#4a4a4a' });
  save('contrast-matrix.svg', svg(W, H, b, 'Contrast matrix across six themes'));
}

// 4. WCAG vs APCA scatter ---------------------------------------------------
{
  const W = 760, H = 460, m = { l: 70, r: 30, t: 70, b: 70 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
  const xmax = 21, ymax = 110;
  const X = (v) => m.l + (Math.log(v) - Math.log(3)) / (Math.log(xmax) - Math.log(3)) * pw;
  const Y = (v) => m.t + ph - (v / ymax) * ph;
  let b = rect(0, 0, W, H, '#ffffff');
  b += text(m.l, 28, 'WCAG 2 and APCA measure differently, so Legible checks both', { size: 18, weight: 700, fill: '#1a1a1a' });
  b += text(m.l, 48, 'Each dot is one text/ground pair. At the same ratio, light text on dark scores a lower Lc than dark on light.', { size: 13, fill: '#4a4a4a' });
  [3, 4.5, 7, 12, 21].forEach((v) => { b += `<line x1="${X(v)}" y1="${m.t}" x2="${X(v)}" y2="${m.t + ph}" stroke="#dcdcdc"/>` + text(X(v), m.t + ph + 20, v + ':1', { size: 12, anchor: 'middle', fill: '#4a4a4a' }); });
  [0, 25, 50, 75, 90, 105].forEach((v) => { b += `<line x1="${m.l}" y1="${Y(v)}" x2="${m.l + pw}" y2="${Y(v)}" stroke="${v === 75 || v === 90 || v === 105 ? '#767676' : '#dcdcdc'}" ${v === 75 || v === 90 || v === 105 ? 'stroke-dasharray="4 4"' : ''}/>` + text(m.l - 10, Y(v) + 4, 'Lc ' + v, { size: 12, anchor: 'end', fill: '#4a4a4a' }); });
  b += text(m.l + pw / 2, H - 20, 'WCAG 2 contrast ratio (log scale)', { size: 13, anchor: 'middle', fill: '#1a1a1a' });
  b += `<text transform="translate(18 ${m.t + ph / 2}) rotate(-90)" font-size="13" fill="#1a1a1a" text-anchor="middle">APCA |Lc|</text>`;
  for (const q of rows.filter((r) => r.kind === 'text')) {
    const dark = q.lc < 0;
    b += dark ? `<circle cx="${X(Math.min(q.ratio, xmax))}" cy="${Y(Math.abs(q.lc))}" r="5" fill="#1a1a1a" stroke="#fff"/>` : `<circle cx="${X(Math.min(q.ratio, xmax))}" cy="${Y(Math.abs(q.lc))}" r="5" fill="#ffffff" stroke="#0b57d0" stroke-width="2"/>`;
  }
  b += `<circle cx="${m.l + 24}" cy="${m.t + ph - 54}" r="5" fill="#1a1a1a"/>` + text(m.l + 36, m.t + ph - 50, 'light text on dark ground', { size: 12, fill: '#1a1a1a' }) + `<circle cx="${m.l + 24}" cy="${m.t + ph - 32}" r="5" fill="#fff" stroke="#0b57d0" stroke-width="2"/>` + text(m.l + 36, m.t + ph - 28, 'dark text on light ground', { size: 12, fill: '#1a1a1a' });
  save('wcag-vs-apca.svg', svg(W, H, b, 'WCAG ratio versus APCA Lc for every checked pair'));
}

// 5. Architecture: five layers ------------------------------------------------
{
  const W = 900, H = 420, layers = [
    ['5', 'Reader overrides', 'the reader’s own choices · Aa panel', L.accent, L['on-accent']],
    ['4', 'OS and browser preferences', 'color scheme · contrast · reduced motion · forced colors', L.surface, L.ink],
    ['3', 'Brand theme', 'a generated system, defaults inside the ranges', L.surface, L.ink],
    ['2', 'Semantic tokens', 'bg · surface · ink · accent · status', L.surface, L.ink],
    ['1', 'Research baseline', 'safe ranges, never editable by brands or readers', L.ink, L.bg],
  ];
  let b = rect(0, 0, W, H, '#ffffff') + text(30, 34, 'Five token layers: each can only override the one below', { size: 18, weight: 700, fill: '#1a1a1a' });
  layers.forEach(([n, name, sub, fill, ink], i) => {
    const y = 56 + i * 64;
    b += rect(30, y, 560, 54, fill, { rx: 8, stroke: L.line }) + text(52, y + 24, `${n}  ${name}`, { size: 16, weight: 700, fill: ink }) + text(52, y + 44, sub, { size: 12.5, fill: ink });
  });
  const steps = [['resolve()', 'merge layers 1 to 5'], ['guard()', 'clamp · weight · measure · justify'], ['fixContrast()', 'OKLCH lightness only'], ['CSS variables', 'applied before first paint']];
  steps.forEach(([a, s], i) => {
    const y = 56 + i * 78;
    b += rect(640, y, 230, 58, '#ffffff', { rx: 8, stroke: '#1a1a1a' }) + text(755, y + 25, a, { size: 15, weight: 700, fill: '#1a1a1a', anchor: 'middle' }) + text(755, y + 45, s, { size: 11.5, fill: '#4a4a4a', anchor: 'middle' });
    if (i < 3) b += `<path d="M755 ${y + 60} v14" stroke="#1a1a1a" stroke-width="2"/><path d="M749 ${y + 70} l6 6 l6 -6" fill="none" stroke="#1a1a1a" stroke-width="2"/>`;
  });
  b += `<path d="M594 190 H636" stroke="#1a1a1a" stroke-width="2"/><path d="M630 184 l6 6 l-6 6" fill="none" stroke="#1a1a1a" stroke-width="2"/>`;
  save('architecture.svg', svg(W, H, b, 'Five token layers feeding resolve, guard and fixContrast'));
}

// 6. Reader setting ranges ------------------------------------------------------
{
  const items = [['Text size', 'sizePx', 'px'], ['Font weight', 'weight', ''], ['Line height', 'lineHeight', ''], ['Letter spacing', 'letterSpacingEm', 'em'], ['Word spacing', 'wordSpacingEm', 'em'], ['Line length', 'measureCh', 'ch'], ['Paragraph spacing', 'paragraphSpacingEm', 'em']];
  const W = 820, rh = 54, H = 100 + items.length * rh, x0 = 210, tw = 440;
  let b = rect(0, 0, W, H, '#ffffff') + text(30, 34, 'What a reader can change, and the limits that always apply', { size: 18, weight: 700, fill: '#1a1a1a' }) + text(30, 56, 'The dot marks the research default. The reader can move anywhere on the bar, never off it.', { size: 13, fill: '#4a4a4a' });
  items.forEach(([name, k, u], i) => {
    const { min, max, default: d } = limits[k], y = 96 + i * rh, px = (v) => x0 + ((v - min) / (max - min)) * tw;
    b += text(30, y + 22, name, { size: 14, fill: '#1a1a1a' }) + rect(x0, y + 12, tw, 10, '#dcdcdc', { rx: 5 }) + rect(x0, y + 12, tw, 10, L.accent, { rx: 5 }) + `<circle cx="${px(d)}" cy="${y + 17}" r="9" fill="#ffffff" stroke="#1a1a1a" stroke-width="3"/>`;
    b += text(x0, y + 42, `${min}${u}`, { size: 12, fill: '#4a4a4a' }) + text(px(d), y + 6, `default ${d}${u}`, { size: 12, weight: 700, fill: '#1a1a1a', anchor: 'middle' }) + text(x0 + tw, y + 42, `${max}${u}`, { size: 12, fill: '#4a4a4a', anchor: 'end' });
  });
  save('settings-ranges.svg', svg(W, H, b, 'Reader setting ranges and defaults'));
}

// 7. Type scale + guardrails in action ---------------------------------------------
{
  const styles = t.raw.type.groups.flatMap((g) => g.styles).filter((s) => ['display', 'h2', 'h3', 'h4', 'body', 'ui', 'caption'].includes(s.name));
  const W = 820, H = 120 + styles.reduce((a, s) => a + parseFloat(s.lineHeight) + 18, 0);
  let b = rect(0, 0, W, H, '#ffffff') + text(30, 34, 'Type scale: base 18px, ratio 1.25', { size: 18, weight: 700, fill: '#1a1a1a' }) + text(30, 56, 'Sans is Inter. Serif (Source Serif 4) and Atkinson Hyperlegible are one tap away in the Reader.', { size: 13, fill: '#4a4a4a' });
  let y = 84;
  for (const s of styles) { const fs = parseFloat(s.fontSize), lh = parseFloat(s.lineHeight); b += text(30, y + fs, 'Legible reading', { size: fs, weight: s.fontWeight, fill: '#1a1a1a' }) + text(W - 30, y + fs, `${s.name} · ${s.fontSize}/${s.lineHeight}`, { size: 12, fill: '#4a4a4a', anchor: 'end' }); y += lh + 18; }
  save('type-scale.svg', svg(W, y + 20, b, 'The Legible type scale'));
}

// 8. Guardrails in action ----------------------------------------------------------
{
  const cases = [
    ['Reader sets text to 99px', { sizePx: 99 }], ['Reader picks 300 weight at 14px', { sizePx: 14, weight: 300 }],
    ['Dark theme, weight 400', { theme: 'dark', weight: 400 }], ['85ch line with 1.4 leading', { measureCh: 85, lineHeight: 1.4 }],
    ['Justified text, hyphenation off', { align: 'justify' }], ['Letter spacing 0.5em', { letterSpacingEm: 0.5 }],
  ];
  const W = 820, rh = 52, H = 90 + cases.length * rh;
  let b = rect(0, 0, W, H, '#ffffff') + text(30, 34, 'Guardrails in action: guard() output', { size: 18, weight: 700, fill: '#1a1a1a' }) + text(30, 56, 'Generated by calling the real function. Every adjustment is reported to the reader.', { size: 13, fill: '#4a4a4a' });
  cases.forEach(([label, input], i) => {
    const y = 76 + i * rh, g = guard(input);
    b += rect(30, y, W - 60, rh - 8, '#f4f4f4', { rx: 8 }) + text(46, y + 29, label, { size: 14, fill: '#1a1a1a' }) + text(W - 46, y + 29, '→ ' + (g.notes.join('; ') || 'no change'), { size: 13, weight: 600, fill: '#0b57d0', anchor: 'end' });
  });
  save('guardrails.svg', svg(W, H, b, 'Guardrails turning unsafe input into safe settings'));
}
