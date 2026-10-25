import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Load the browser bundle against a tiny React stand-in that returns a plain element tree.
const el = (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter((c) => c != null && c !== false) });
const window = { React: { createElement: el, useState: (v) => [v, () => {}] } };
vm.runInNewContext(readFileSync(new URL('../bundle.js', import.meta.url), 'utf8'), { window });
const L = window.Legible;
const text = (n) => (typeof n === 'object' ? n.children.map(text).join('') : String(n));
const find = (n, pred, out = []) => { if (typeof n === 'object') { if (pred(n)) out.push(n); n.children.forEach((c) => find(c, pred, out)); } return out; };

test('Compare shows a dash for missing values, never a blank or a guess', () => {
  const t = L.Compare({ options: ['A', 'B'], criteria: ['Price', 'Speed'], values: [[10, null], ['', 'Fast']] });
  const cells = find(t, (n) => n.type === 'td').filter((n) => n.children.length); // skip the empty corner cell
  assert.deepEqual(cells.map(text), ['10', '—', '—', 'Fast']);
});
test('Compare marks the pick with a check and a word, not color alone', () => {
  const t = L.Compare({ options: ['A', 'B'], criteria: ['Price'], values: [[1, 2]], pick: 1 });
  const head = find(t, (n) => n.type === 'th' && n.props.scope === 'col');
  assert.equal(text(head[1]), 'B✓ Pick');
  assert.match(head[1].props.className, /is-pick/);
  assert.equal(head[0].props.className, undefined);
});
test('Compare uses row headers for criteria', () => {
  const t = L.Compare({ options: ['A'], criteria: ['Price', 'Speed'], values: [[1], [2]] });
  assert.deepEqual(find(t, (n) => n.type === 'th' && n.props.scope === 'row').map(text), ['Price', 'Speed']);
});
test('Summary renders the answer first, then points, then the action', () => {
  const s = L.Summary({ answer: 'Yes', points: ['one', 'two'], action: 'Go' });
  assert.deepEqual(s.children.map((c) => c.props.className), ['lg-summary__answer', 'lg-summary__points', 'lg-summary__action']);
  assert.equal(find(s, (n) => n.type === 'li').length, 2);
});
test('Group labels its items and spaces them with gap-item', () => {
  const g = L.Group({ label: 'Today', children: ['a', 'b'] });
  assert.equal(g.props.className, 'lg-group');
  assert.equal(text(g.children[0]), 'Today');
  assert.match(readFileSync(new URL('../bundle.css', import.meta.url), 'utf8'), /\.lg-group\{[^}]*gap:var\(--gap-item\)/);
});
