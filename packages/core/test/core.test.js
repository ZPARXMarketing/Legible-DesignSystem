import test from 'node:test';
import assert from 'node:assert/strict';
import { wcagRatio, apcaLc, hexToOklch, oklchToHex, passes, fixContrast, guard, resolve } from '../src/index.js';

test('WCAG ratio: black on white is 21:1', () => assert.ok(Math.abs(wcagRatio('#000', '#fff') - 21) < 1e-9));
test('APCA: black on white is about Lc 106', () => assert.ok(Math.abs(apcaLc('#000', '#fff') - 106.04) < 0.1));
test('APCA: white on black is negative', () => assert.ok(apcaLc('#fff', '#000') < -100));
test('APCA: equal colors are 0', () => assert.equal(apcaLc('#777', '#777'), 0));
test('OKLCH round trip', () => {
  for (const hex of ['#0b57d0', '#fafaf9', '#8ab4f8', '#3b2f20']) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});
test('passes needs both WCAG and APCA', () => {
  assert.ok(passes('#1a1a1a', '#fafaf9', 'standard'));
  assert.ok(!passes('#999999', '#ffffff', 'comfortable'));
});
test('fixContrast darkens text on a light ground and keeps hue', () => {
  const { text: fixed } = fixContrast('#8ab4f8', '#ffffff', 'standard');
  assert.ok(passes(fixed, '#ffffff', 'standard'));
  assert.ok(Math.abs(hexToOklch(fixed).h - hexToOklch('#8ab4f8').h) < 8);
});
test('fixContrast lightens text on a dark ground', () => {
  const { text: fixed } = fixContrast('#444444', '#121212', 'standard');
  assert.ok(passes(fixed, '#121212', 'standard'));
  assert.ok(hexToOklch(fixed).l > hexToOklch('#444444').l);
});
test('fixContrast handles a mid-gray ground by moving the ground and reporting it', () => {
  const out = fixContrast('#808080', '#808080', 'maximum');
  assert.ok(out.bgMoved && passes(out.text, out.bg, 'maximum'));
});
test('guard clamps every range', () => {
  const g = guard({ sizePx: 99, lineHeight: 0.5, letterSpacingEm: 1, measureCh: 10 });
  assert.equal(g.sizePx, 32); assert.equal(g.lineHeight, 1.2); assert.equal(g.letterSpacingEm, 0.16); assert.equal(g.measureCh, 45);
});
test('guard: small text keeps weight at 400 or more', () => assert.equal(guard({ sizePx: 14, weight: 300 }).weight, 400));
test('guard: dark themes raise weight to 450', () => assert.equal(guard({ theme: 'dark', weight: 400 }).weight, 450));
test('guard: long measure raises line height to 1.6', () => assert.equal(guard({ measureCh: 85, lineHeight: 1.4 }).lineHeight, 1.6));
test('guard: justified without hyphenation falls back to left', () => assert.equal(guard({ align: 'justify' }).align, 'left'));
test('guard: justified with hyphenation is kept', () => assert.equal(guard({ align: 'justify', hyphenate: true }).align, 'justify'));
test('guard reports notes', () => assert.ok(guard({ sizePx: 99 }).notes.length === 1));
test('resolve: reader beats OS beats brand', () => {
  const r = resolve({ brand: { sizePx: 17 }, os: { sizePx: 18 }, user: { sizePx: 22 } });
  assert.equal(r.sizePx, 22);
});
test('resolve: reader cannot leave the limits', () => assert.equal(resolve({ user: { sizePx: 80 } }).sizePx, 32));
