#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { loadTokens } from '../../exporters/src/tokens.js';
import { buildAll, writeOut, TARGETS } from '../src/build.js';
import { fixTokens } from '../src/fix.js';
import { generateTokens } from '../../studio/src/generate.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const [cmd = 'help', ...argv] = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i > -1 ? argv[i + 1] : d; };
const tokenPath = resolve(flag('tokens', resolve(root, 'tokens/tokens.json')));
const distDir = resolve(flag('out', resolve(root, 'dist')));

function summarize(fails, total) {
  for (const f of fails) console.log(`FAIL ${f.theme.padEnd(9)} ${f.text} on ${f.ground}: ${f.ratio.toFixed(2)}:1, Lc ${f.lc.toFixed(1)} (needs ${f.level})`);
  console.log(`${total - fails.length}/${total} pairs pass${fails.length ? `, ${fails.length} fail` : ''}`);
}

async function init() {
  let name = flag('name'), brand = flag('brand'), type = flag('type');
  if (!name || !brand) {
    if (!process.stdin.isTTY) { console.error('Usage: legible init --name <Name> --brand <#hex[,#hex[,#hex]]> [--type reading|app|dashboard|marketing] [--out dir] [--radius 8] [--spacing 4] [--sans "<stack>"] [--serif "<stack>"]'); process.exit(2); }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    name ??= (await rl.question('Brand name: ')).trim();
    brand ??= (await rl.question('Brand colors (1 to 3 hex values, comma separated): ')).trim();
    type ??= (await rl.question('Product type [reading|app|dashboard|marketing] (reading): ')).trim() || 'reading';
    rl.close();
  }
  const fonts = {}; if (flag('sans')) fonts.sans = flag('sans'); if (flag('serif')) fonts.serif = flag('serif');
  const out = resolve(flag('out', './' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-')));
  let sys;
  try {
    sys = generateTokens({ name, brand: brand.split(',').map((s) => s.trim()), productType: type ?? 'reading', radiusBase: Number(flag('radius', 8)), spacingBase: Number(flag('spacing', 4)), fonts });
  } catch (e) { console.error('Cannot build this system: ' + e.message); process.exit(2); }
  writeOut(out, 'tokens/tokens.json', JSON.stringify(sys.raw, null, 1) + '\n');
  writeOut(out, 'legible.config.json', JSON.stringify({ name, productType: type ?? 'reading', brand: brand.split(',').map((s) => s.trim()), themes: sys.tokens.themes, defaults: { theme: 'system', contrast: 'standard' } }, null, 2) + '\n');
  const { rows, fails } = buildAll(sys.tokens, resolve(out, 'dist'));
  console.log(`${sys.changes.length} color values adjusted by the contrast engine`);
  summarize(fails, rows.length);
  console.log(`\nDone: ${out}`);
  process.exit(fails.length ? 1 : 0);
}

switch (cmd) {
  case 'init': await init(); break;
  case 'build': { const { rows, fails } = buildAll(loadTokens(tokenPath), distDir); summarize(fails, rows.length); process.exit(fails.length ? 1 : 0); break; }
  case 'check': { const { rows, fails } = buildAll(loadTokens(tokenPath), distDir, false); summarize(fails, rows.length); console.log('report: ' + resolve(distDir, 'report.html')); process.exit(fails.length ? 1 : 0); break; }
  case 'fix': { const ch = fixTokens(tokenPath); ch.forEach((c) => console.log(c)); console.log(`${ch.length} token values adjusted`); break; }
  case 'export': {
    const name = flag('target');
    if (!TARGETS[name]) { console.error('Usage: legible export --target <' + Object.keys(TARGETS).join('|') + '>'); process.exit(2); }
    const [file, fn] = TARGETS[name]; writeOut(distDir, file, fn(loadTokens(tokenPath))); break;
  }
  default:
    console.log('legible <init|build|check|fix|export --target css|tailwind|dtcg|ios|android> [--tokens file] [--out dir]');
}
