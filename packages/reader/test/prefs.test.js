import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, encodeShare, decodeShare, computeVars, resolveTheme, applyPreset, DEFAULT_PREFS, PRESETS } from '../src/prefs.js';
import { passes } from '../../core/src/index.js';

test('sanitize clamps, whitelists and never throws on junk', () => {
  for (const junk of [null, undefined, 5, 'x', [], { sizePx: 'big', theme: 'neon', font: '<script>' }]) assert.doesNotThrow(() => sanitize(junk));
  const s = sanitize({ sizePx: 999, lineHeight: -4, theme: 'neon', font: '<script>', evil: 1 });
  assert.equal(s.sizePx, 32); assert.equal(s.lineHeight, 1.2); assert.equal(s.theme, 'system'); assert.equal(s.font, 'inter'); assert.equal('evil' in s, false);
});
test('sanitize rejects non-hex custom colors (no CSS injection)', () => {
  assert.equal(sanitize({ customColors: { bg: 'red;}body{display:none', text: '#000000' } }).customColors, null);
  assert.deepEqual(sanitize({ customColors: { bg: '#FFFFFF', text: '#000000' } }).customColors, { bg: '#ffffff', text: '#000000' });
});
test('share link round trips', () => {
  const p = sanitize({ font: 'serif', sizePx: 22, theme: 'sepia', hyphenate: true });
  assert.deepEqual(decodeShare(encodeShare(p)), p);
});
test('bad share link returns null', () => { assert.equal(decodeShare('%%%'), null); assert.deepEqual(decodeShare('e30'), sanitize({})); });
test('system theme follows the OS', () => {
  assert.equal(resolveTheme(DEFAULT_PREFS, {}), 'light'); assert.equal(resolveTheme(DEFAULT_PREFS, { dark: true }), 'dark');
  assert.equal(resolveTheme(DEFAULT_PREFS, { contrastMore: true }), 'hc-light'); assert.equal(resolveTheme({ ...DEFAULT_PREFS, theme: 'sepia' }, { dark: true }), 'sepia');
});
test('computeVars maps settings to CSS variables and runs guard', () => {
  const r = computeVars({ ...DEFAULT_PREFS, sizePx: 20, measureCh: 85, theme: 'dark' });
  assert.equal(r.vars['--lg-size'], '1.25rem'); assert.equal(r.vars['--lg-measure'], '85ch');
  assert.equal(r.vars['--lg-leading'], '1.6'); assert.equal(r.vars['--lg-weight'], '450');
  assert.equal(r.attrs['data-theme'], 'dark');
});
test('every preset sanitizes to itself and stays inside the limits', () => {
  for (const id of Object.keys(PRESETS)) { const p = applyPreset(DEFAULT_PREFS, id); assert.deepEqual(sanitize(p), p); }
});
test('maximum contrast corrects ink against a weak palette and reports it', () => {
  const r = computeVars({ ...DEFAULT_PREFS, contrast: 'maximum' }, {}, { ink: '#777777', ink2: '#999999', bg: '#ffffff' });
  assert.ok(passes(r.vars['--ink'], '#ffffff', 'maximum')); assert.ok(r.notes.includes('Adjusted text color for readability.'));
});
test('custom colors are corrected to a passing pair', () => {
  const r = computeVars({ ...DEFAULT_PREFS, customColors: { bg: '#ffff00', text: '#ffee00' } });
  assert.ok(passes(r.vars['--ink'], r.vars['--bg'], 'standard'));
});
test('no contrast change when the palette already passes', () => {
  const r = computeVars({ ...DEFAULT_PREFS, contrast: 'standard' }, {}, { ink: '#000000', ink2: '#262626', bg: '#ffffff' });
  assert.equal('--ink' in r.vars, false);
});
test('color vision mode sets data-cvd', () => assert.equal(computeVars({ ...DEFAULT_PREFS, cvdMode: 'on' }).attrs['data-cvd'], ''));
