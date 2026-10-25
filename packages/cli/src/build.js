import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { toCss, toTailwind, toDtcg, toSwift, toAndroid } from '../../exporters/src/index.js';
import { runChecks, checkStructure } from './check.js';
import { reportHtml } from './report.js';

export const TARGETS = {
  css: ['tokens.css', toCss],
  tailwind: ['tailwind.preset.js', toTailwind],
  dtcg: ['tokens.dtcg.json', toDtcg],
  ios: ['ios/LegibleTokens.swift', toSwift],
  android: ['android/legible_tokens.xml', toAndroid],
};

export function writeOut(dist, rel, content, log = true) {
  const f = resolve(dist, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
  if (log) console.log('wrote ' + rel);
}

/** Write every export and the report card into `dist`. Returns the contrast rows, their failures and the structure rules. */
export function buildAll(t, dist, log = true) {
  for (const [file, fn] of Object.values(TARGETS)) writeOut(dist, file, fn(t), log);
  const rows = runChecks(t), structure = checkStructure(t.raw);
  writeOut(dist, 'report.html', reportHtml(t, rows, structure), log);
  return { rows, fails: rows.filter((r) => !r.pass), structure };
}
