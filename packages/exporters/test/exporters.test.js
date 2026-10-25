import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTokens } from '../src/tokens.js';
import { toCss, toTailwind, toDtcg, toSwift, toAndroid } from '../src/index.js';

const t = loadTokens(new URL('../../../tokens/tokens.json', import.meta.url).pathname);

test('six themes load, every color token has a value in each', () => {
  assert.equal(t.themes.length, 6);
  for (const th of t.themes) for (const c of t.colorTokens) assert.match(t.colors[th][c.name], /^#[0-9a-f]{6}$/);
});
test('css has a block per theme and the token vars', () => {
  const css = toCss(t);
  for (const th of t.themes.slice(1)) assert.ok(css.includes(`[data-theme="${th}"]`));
  assert.ok(css.includes('--target-min: 44px;') && css.includes('--font-sans:'));
});
test('tailwind preset maps colors to css variables', () => assert.ok(toTailwind(t).includes('"ink": "var(--ink)"')));
test('dtcg is valid JSON with $value and $type', () => {
  const d = JSON.parse(toDtcg(t));
  assert.equal(d.light.color.ink.$type, 'color');
  assert.equal(d.hcDark === undefined, true);
  assert.ok(d['hc-dark'].color.bg.$value === '#000000');
});
test('swift and android mention every theme', () => {
  const sw = toSwift(t), an = toAndroid(t);
  for (const th of t.themes) assert.ok(an.includes(`legible_${th.replace(/-/g, '_')}_ink`));
  assert.ok(sw.includes('enum HcDark') && sw.includes('static let onAccent'));
});
test('structure tokens reach every export', async () => {
  const { loadTokens } = await import('../src/tokens.js');
  const ex = await import('../src/index.js');
  const t = loadTokens(new URL('../../../tokens/tokens.json', import.meta.url).pathname);
  assert.match(ex.toCss(t), /--gap-item: 8px;[\s\S]*--gap-group: 24px;[\s\S]*--gap-section: 48px;/);
  assert.equal(JSON.parse(ex.toDtcg(t)).$shared.structure['gap-group'].$value, '24px');
  assert.match(ex.toTailwind(t), /"gap-group": "24px"/);
  assert.match(ex.toSwift(t), /static let gapGroup: CGFloat = 24/);
  assert.match(ex.toAndroid(t), /legible_gap_group">24dp/);
});
