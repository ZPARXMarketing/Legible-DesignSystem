import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTokens } from '../src/generate.js';
import { runChecks } from '../../cli/src/check.js';

// Awkward brand colors on purpose: a pale yellow, pure black, a mid-gray, a saturated red, near-white.
for (const hex of ['#0b57d0', '#ffd60a', '#000000', '#808080', '#e11d48', '#f5f5f4', '#2e7d32']) {
  test(`brand ${hex}: every pair in every theme passes after generation`, () => {
    const { tokens } = generateTokens({ name: 'Test', brand: [hex] });
    const fails = runChecks(tokens).filter((r) => !r.pass);
    assert.deepEqual(fails.map((f) => `${f.theme} ${f.text}/${f.ground}`), []);
  });
}
test('three brand colors add accent-2 and accent-3, all passing', () => {
  const { tokens } = generateTokens({ name: 'Trio', brand: ['#0b57d0', '#e69f00', '#009e73'] });
  assert.ok(tokens.colors.light['accent-2'] && tokens.colors.light['accent-3']);
  assert.equal(runChecks(tokens).filter((r) => !r.pass).length, 0);
});
test('hue is preserved when the engine lightens a brand color for dark themes', async () => {
  const { hexToOklch } = await import('../../core/src/index.js');
  const { tokens } = generateTokens({ name: 'Hue', brand: ['#0b57d0'] });
  const dh = hexToOklch(tokens.colors.dark.accent).h, bh = hexToOklch('#0b57d0').h;
  assert.ok(Math.abs(dh - bh) < 12, `${dh} vs ${bh}`);
});
test('product type changes the base size', () => {
  const body = (type) => generateTokens({ name: 'P', brand: ['#0b57d0'], productType: type }).raw.type.groups[0].styles.find((s) => s.name === 'body').fontSize;
  assert.equal(body('reading'), '18px'); assert.equal(body('app'), '16px'); assert.equal(body('dashboard'), '15px');
});
test('rejects bad input', () => {
  assert.throws(() => generateTokens({ name: '', brand: ['#000'] }));
  assert.throws(() => generateTokens({ name: 'X', brand: [] }));
  assert.throws(() => generateTokens({ name: 'X', brand: ['#0b57d0'], productType: 'nope' }));
  assert.throws(() => generateTokens({ name: 'X', brand: ['not-a-color'] }));
  assert.throws(() => generateTokens({ name: 'X', brand: ['#0b57d0'], fonts: { sans: 'a; b' } }));
});
test('output is valid tokens: unique names, every color has all six themes', () => {
  const { raw } = generateTokens({ name: 'Valid', brand: ['#e11d48'] });
  const names = raw.color.tokens.map((t) => t.name);
  assert.equal(new Set(names).size, names.length);
  for (const t of raw.color.tokens) assert.equal(Object.keys(t.value).length, 6);
});
