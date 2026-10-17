#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTokens } from '../../exporters/src/tokens.js';
import { toCss, toTailwind, toDtcg, toSwift, toAndroid } from '../../exporters/src/index.js';
import { runChecks } from '../src/check.js';
import { reportHtml } from '../src/report.js';
import { fixTokens } from '../src/fix.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const [cmd = 'help', ...args] = process.argv.slice(2);
const tokens = () => loadTokens(resolve(root, 'tokens/tokens.json'));
const out = (p, s) => { const f = resolve(root, 'dist', p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); console.log('wrote dist/' + p); };

const TARGETS = {
  css: (t) => out('tokens.css', toCss(t)),
  tailwind: (t) => out('tailwind.preset.js', toTailwind(t)),
  dtcg: (t) => out('tokens.dtcg.json', toDtcg(t)),
  ios: (t) => out('ios/LegibleTokens.swift', toSwift(t)),
  android: (t) => out('android/legible_tokens.xml', toAndroid(t)),
};

function check(t) {
  const rows = runChecks(t);
  const fails = rows.filter((r) => !r.pass);
  out('report.html', reportHtml(t, rows));
  for (const f of fails) console.log(`FAIL ${f.theme.padEnd(9)} ${f.text} on ${f.ground}: ${f.ratio.toFixed(2)}:1, Lc ${f.lc.toFixed(1)} (needs ${f.level})`);
  console.log(`${rows.length - fails.length}/${rows.length} pairs pass${fails.length ? `, ${fails.length} fail` : ''}`);
  return fails.length;
}

switch (cmd) {
  case 'build': { const t = tokens(); Object.values(TARGETS).forEach((f) => f(t)); process.exit(check(t) ? 1 : 0); break; }
  case 'check': process.exit(check(tokens()) ? 1 : 0); break;
  case 'fix': { const ch = fixTokens(resolve(root, 'tokens/tokens.json')); ch.forEach((c) => console.log(c)); console.log(`${ch.length} token values adjusted`); break; }
  case 'export': {
    const i = args.indexOf('--target'); const name = i > -1 ? args[i + 1] : null;
    if (!TARGETS[name]) { console.error('Usage: legible export --target <' + Object.keys(TARGETS).join('|') + '>'); process.exit(2); }
    TARGETS[name](tokens()); break;
  }
  default:
    console.log('legible <build|check|fix|export --target css|tailwind|dtcg|ios|android>');
}
