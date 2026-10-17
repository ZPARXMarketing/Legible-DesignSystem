import { readFileSync } from 'node:fs';

/** Load tokens.json (the Design System artifact format) and resolve per-theme color values, including {alias} references. */
export function loadTokens(path) {
  return fromRaw(JSON.parse(readFileSync(path, 'utf8')));
}

export function fromRaw(raw) {
  const themes = raw.color.themes.map((t) => t.id);
  const first = themes[0];
  const names = new Set(raw.color.tokens.map((t) => t.name));
  const lookup = (tok, theme) => (typeof tok.value === 'string' ? tok.value : tok.value[theme] ?? tok.value[first]);
  const byName = Object.fromEntries(raw.color.tokens.map((t) => [t.name, t]));
  const resolve = (name, theme, depth = 0) => {
    if (depth > 16) throw new Error(`alias chain too deep at ${name}`);
    const v = lookup(byName[name], theme);
    const m = /^\{(.+)\}$/.exec(v);
    if (!m) return v;
    if (!names.has(m[1])) throw new Error(`${name} aliases missing token ${m[1]}`);
    return resolve(m[1], theme, depth + 1);
  };
  const colors = {};
  for (const th of themes) colors[th] = Object.fromEntries(raw.color.tokens.map((t) => [t.name, resolve(t.name, th)]));
  return { raw, themes, themeMeta: raw.color.themes, colors, colorTokens: raw.color.tokens };
}
