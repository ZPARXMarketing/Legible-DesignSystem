const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const pascal = (s) => camel(s).replace(/^./, (c) => c.toUpperCase());

export function toCss(t) {
  const { raw, themes, colors } = t;
  const first = themes[0];
  const block = (th) => Object.entries(colors[th]).map(([n, v]) => `  --${n}: ${v};`).join('\n');
  const other = (fam) => (raw[fam]?.tokens ?? []).map((x) => `  --${x.name}: ${x.value};`).join('\n');
  const fonts = Object.entries(raw.type.families).map(([k, v]) => `  --font-${k}: ${v};`).join('\n');
  let css = `/* ${raw.name} — generated from tokens.json */\n:root, [data-theme="${first}"] {\n${block(first)}\n}\n`;
  for (const th of themes.slice(1)) css += `[data-theme="${th}"] {\n${block(th)}\n}\n`;
  css += `:root {\n${[other('spacing'), other('radius'), other('measure'), fonts].filter(Boolean).join('\n')}\n}\n`;
  for (const g of raw.type.groups) for (const s of g.styles) {
    const fam = s.family ?? g.family;
    css += `.${s.name} { font-family: var(--font-${fam}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ''} }\n`;
  }
  // OS integration (SKILL: prefers-color-scheme / contrast / reduced motion / forced colors)
  css += `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n`;
  css += `@media (forced-colors: active) { :root { --bg: Canvas; --ink: CanvasText; --accent: LinkText; } }\n`;
  return css;
}

export function toTailwind(t) {
  const colors = Object.fromEntries(t.colorTokens.map((c) => [c.name, `var(--${c.name})`]));
  const scale = (fam) => Object.fromEntries((t.raw[fam]?.tokens ?? []).map((x) => [x.name.replace(/^(space|radius)-/, ''), x.value]));
  const fonts = Object.fromEntries(Object.entries(t.raw.type.families).map(([k, v]) => [k, [v]]));
  return `// ${t.raw.name} — generated Tailwind preset. Load dist/tokens.css and set data-theme on <html>.\nexport default ${JSON.stringify({ theme: { extend: { colors, spacing: scale('spacing'), borderRadius: scale('radius'), fontFamily: fonts } } }, null, 2)};\n`;
}

export function toDtcg(t) {
  const out = {};
  for (const th of t.themes) {
    out[th] = { color: Object.fromEntries(Object.entries(t.colors[th]).map(([n, v]) => [n, { $type: 'color', $value: v, $description: t.colorTokens.find((c) => c.name === n)?.usage }])) };
  }
  const dim = (fam) => Object.fromEntries((t.raw[fam]?.tokens ?? []).map((x) => [x.name, { $type: 'dimension', $value: x.value, $description: x.usage }]));
  out.$shared = { spacing: dim('spacing'), radius: dim('radius'), measure: dim('measure') };
  return JSON.stringify(out, null, 2) + '\n';
}

export function toSwift(t) {
  let s = `// ${t.raw.name} — generated. Do not edit.\nimport UIKit\n\nextension UIColor {\n    convenience init(legibleHex hex: UInt32) {\n        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)\n    }\n}\n\nenum LegibleTheme {\n`;
  for (const th of t.themes) {
    s += `    enum ${pascal(th)} {\n`;
    for (const [n, v] of Object.entries(t.colors[th])) s += `        static let ${camel(n)} = UIColor(legibleHex: 0x${v.slice(1).toUpperCase()})\n`;
    s += `    }\n`;
  }
  s += `}\n\nenum LegibleSpacing {\n` + (t.raw.spacing.tokens).map((x) => `    static let ${camel(x.name)}: CGFloat = ${parseFloat(x.value)}`).join('\n') + `\n}\n`;
  return s;
}

export function toAndroid(t) {
  let s = `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${t.raw.name} — generated. Do not edit. -->\n<resources>\n`;
  for (const th of t.themes) {
    s += `    <!-- ${th} -->\n`;
    for (const [n, v] of Object.entries(t.colors[th])) s += `    <color name="legible_${th.replace(/-/g, '_')}_${n.replace(/-/g, '_')}">${v.toUpperCase()}</color>\n`;
  }
  for (const x of t.raw.spacing.tokens) s += `    <dimen name="legible_${x.name.replace(/-/g, '_')}">${parseFloat(x.value)}dp</dimen>\n`;
  return s + `</resources>\n`;
}
