import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = new URL('../bin/legible.js', import.meta.url).pathname;

test('init writes tokens, config and every export, and all pairs pass', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'legible-')), 'acme');
  const stdout = execFileSync('node', [bin, 'init', '--name', 'Acme', '--brand', '#0B57D0,#E69F00', '--type', 'app', '--out', out]).toString();
  assert.match(stdout, /pairs pass/);
  for (const f of ['tokens/tokens.json', 'legible.config.json', 'dist/tokens.css', 'dist/tailwind.preset.js', 'dist/tokens.dtcg.json', 'dist/ios/LegibleTokens.swift', 'dist/android/legible_tokens.xml', 'dist/report.html']) assert.ok(existsSync(join(out, f)), f);
  assert.equal(JSON.parse(readFileSync(join(out, 'legible.config.json'), 'utf8')).name, 'Acme');
});
test('init refuses an invalid color with exit code 2', () => {
  const r = spawnSync('node', [bin, 'init', '--name', 'X', '--brand', 'nope', '--out', join(tmpdir(), 'legible-bad')]);
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /Invalid hex/);
});
test('check on the repo tokens exits 0', () => {
  const out = mkdtempSync(join(tmpdir(), 'legible-'));
  const r = spawnSync('node', [bin, 'check', '--out', out]);
  assert.equal(r.status, 0);
});
