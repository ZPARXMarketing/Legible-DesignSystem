const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function reportHtml(t, rows) {
  const fails = rows.filter((r) => !r.pass).length;
  const body = t.themes.map((th) => {
    const rs = rows.filter((r) => r.theme === th);
    return `<h2>${esc(th)}</h2><table><thead><tr><th>Pair</th><th>Ground</th><th>Sample</th><th>WCAG</th><th>APCA Lc</th><th>Target</th><th>Result</th></tr></thead><tbody>` +
      rs.map((r) => {
        const fg = t.colors[th][r.text], bg = t.colors[th][r.ground];
        return `<tr><td>${esc(r.text)}</td><td>${esc(r.ground)}</td><td style="background:${bg};color:${fg};padding:4px 12px">Aa Legible</td><td>${r.ratio.toFixed(2)}:1</td><td>${r.kind === 'text' ? r.lc.toFixed(1) : '–'}</td><td>${esc(r.level)}</td><td>${r.pass ? '✓ pass' : '✕ FAIL'}</td></tr>`;
      }).join('') + '</tbody></table>';
  }).join('');
  return `<!doctype html><meta charset="utf-8"><title>Legible report card</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#1a1a1a}table{border-collapse:collapse;width:100%;margin-bottom:2rem}td,th{border-bottom:1px solid #767676;padding:6px 8px;text-align:left}</style><h1>Legible report card</h1><p>${rows.length - fails}/${rows.length} pairs pass${fails ? `; ${fails} fail` : ''}.</p>${body}`;
}
