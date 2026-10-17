/* @ds-bundle: {"format":4,"namespace":"Legible","components":[{"name":"Button"},{"name":"Link"},{"name":"Alert"},{"name":"Prose"},{"name":"Reader"},{"name":"Heading"},{"name":"Input"},{"name":"Card"},{"name":"Table"}]} */
(function () {
  var h = window.React.createElement, useState = window.React.useState;
  var LIMITS = {
    sizePx: [14, 32], weight: [300, 700], lineHeight: [1.2, 2.2], letterSpacingEm: [-0.02, 0.16],
    wordSpacingEm: [0, 0.32], measureCh: [45, 90], paragraphSpacingEm: [0.5, 2.5]
  };
  var FONTS = {
    inter: 'var(--font-sans)', serif: 'var(--font-serif)', atkinson: 'var(--font-hyper)', mono: 'var(--font-mono)'
  };
  function clamp(v, k) { return Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], v)); }
  function guard(p) {
    var g = Object.assign({}, p);
    Object.keys(LIMITS).forEach(function (k) { if (g[k] != null) g[k] = clamp(g[k], k); });
    var dark = /dark|dim/.test(g.theme || '');
    if (g.sizePx < 16 || dark) g.weight = Math.max(g.weight || 400, dark ? 450 : 400);
    if (g.measureCh > 75) g.lineHeight = Math.max(g.lineHeight, 1.6);
    return g;
  }
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }

  function Button(p) {
    var variant = p.variant || 'primary';
    var rest = Object.assign({}, p); delete rest.variant; delete rest.children; delete rest.className;
    return h('button', Object.assign({ type: 'button', className: cx('lg-btn', 'lg-btn--' + variant, p.className) }, rest), p.children);
  }
  function Link(p) {
    var rest = Object.assign({}, p); delete rest.children; delete rest.className;
    return h('a', Object.assign({ className: cx('lg-link', p.className) }, rest), p.children);
  }
  var ICON = { info: 'ℹ', success: '✓', warning: '⚠', danger: '✕' };
  var WORD = { info: 'Note', success: 'Success', warning: 'Warning', danger: 'Error' };
  function Alert(p) {
    var kind = p.kind || 'info';
    return h('div', { className: cx('lg-alert', 'lg-alert--' + kind, p.className), role: kind === 'danger' ? 'alert' : 'status' },
      h('span', { className: 'lg-alert__icon', 'aria-hidden': 'true' }, ICON[kind]),
      h('div', null,
        h('strong', { className: 'lg-alert__title' }, p.title || WORD[kind]),
        h('div', { className: 'lg-alert__body' }, p.children)));
  }
  function Prose(p) {
    var s = Object.assign({}, p.style);
    return h('div', { className: cx('lg-prose', p.serif && 'lg-prose--serif', p.className), style: s }, p.children);
  }

  var THEMES = [['light', 'Light'], ['sepia', 'Sepia'], ['dark', 'Dark'], ['dim', 'Dim'], ['hc-light', 'High contrast light'], ['hc-dark', 'High contrast dark']];
  var SAMPLE = [
    'Research says no single font or setting is best for everyone. Readers were about 35% faster in their own best font, so Legible ships safe defaults and lets each reader adjust the rest.',
    'Every change is held inside a safe range, and text color is corrected whenever contrast would fall too low.'
  ];
  function Reader(p) {
    var init = p.initial || {};
    var st = useState({ theme: init.theme || 'light', font: init.font || 'inter', sizePx: init.sizePx || 18, lineHeight: init.lineHeight || 1.5, letterSpacingEm: init.letterSpacingEm || 0 });
    var s = st[0], set = st[1];
    function up(k, v) { var n = Object.assign({}, s); n[k] = v; set(n); }
    var g = guard(Object.assign({ weight: 400, measureCh: 65 }, s));
    var note = g.lineHeight !== s.lineHeight || g.weight !== 400 ? 'Adjusted for readability.' : '';
    var prose = { fontFamily: FONTS[g.font], fontSize: g.sizePx + 'px', lineHeight: g.lineHeight, letterSpacing: g.letterSpacingEm + 'em', fontWeight: g.weight };
    return h('div', { className: 'lg-reader', 'data-theme': g.theme },
      h('section', { className: 'lg-reader__panel', 'aria-label': 'Reading settings' },
        h('h3', { className: 'lg-reader__h' }, 'Aa  Reading settings'),
        h('div', { className: 'lg-reader__row', role: 'group', 'aria-label': 'Theme' },
          THEMES.map(function (t) {
            return h('button', { key: t[0], type: 'button', 'data-theme': t[0], className: cx('lg-chip', g.theme === t[0] && 'is-on'), 'aria-pressed': g.theme === t[0], onClick: function () { up('theme', t[0]); } }, t[1]);
          })),
        h('div', { className: 'lg-reader__row', role: 'group', 'aria-label': 'Text size' },
          h('button', { type: 'button', className: 'lg-btn lg-btn--secondary', onClick: function () { up('sizePx', clamp(s.sizePx - 1, 'sizePx')); }, 'aria-label': 'Smaller text' }, 'A−'),
          h('output', { className: 'lg-reader__val' }, g.sizePx + ' px'),
          h('button', { type: 'button', className: 'lg-btn lg-btn--secondary', onClick: function () { up('sizePx', clamp(s.sizePx + 1, 'sizePx')); }, 'aria-label': 'Larger text' }, 'A+')),
        h('label', { className: 'lg-reader__row' }, h('span', null, 'Line height ' + g.lineHeight.toFixed(2)),
          h('input', { type: 'range', min: 1.2, max: 2.2, step: 0.05, value: s.lineHeight, onChange: function (e) { up('lineHeight', parseFloat(e.target.value)); } })),
        h('label', { className: 'lg-reader__row' }, h('span', null, 'Font'),
          h('select', { className: 'lg-select', value: s.font, onChange: function (e) { up('font', e.target.value); } },
            h('option', { value: 'inter' }, 'Inter'), h('option', { value: 'atkinson' }, 'Atkinson Hyperlegible'), h('option', { value: 'serif' }, 'Source Serif 4'), h('option', { value: 'mono' }, 'JetBrains Mono'))),
        note && h('p', { className: 'lg-reader__note' }, note)),
      h('article', { className: 'lg-reader__page', style: prose }, SAMPLE.map(function (t, i) { return h('p', { key: i }, t); })));
  }

  function Heading(p) {
    var lv = p.level || 2, style = { 2: 'h2', 3: 'h3', 4: 'h4', 1: 'display' }[lv];
    return h('h' + lv, { className: cx('lg-h', 'lg-h--' + style, p.className) }, p.children);
  }
  function Input(p) {
    var rest = Object.assign({}, p); ['label', 'hint', 'error', 'className'].forEach(function (k) { delete rest[k]; });
    var id = p.id || ('lg-' + String(p.label).replace(/\W+/g, '-').toLowerCase());
    var desc = p.error ? id + '-err' : (p.hint ? id + '-hint' : undefined);
    return h('div', { className: cx('lg-field', p.className) },
      h('label', { htmlFor: id, className: 'lg-field__label' }, p.label),
      h('input', Object.assign({ id: id, className: cx('lg-input', p.error && 'is-invalid'), 'aria-invalid': p.error ? 'true' : undefined, 'aria-describedby': desc }, rest)),
      p.hint && !p.error && h('span', { id: id + '-hint', className: 'lg-field__hint' }, p.hint),
      p.error && h('span', { id: id + '-err', className: 'lg-field__error' }, '\u2715 Error: ' + p.error));
  }
  function Card(p) {
    return h('section', { className: cx('lg-card', p.className) }, p.title && h('h3', { className: 'lg-card__title' }, p.title), p.children);
  }
  function Table(p) {
    return h('table', { className: cx('lg-table', p.className) },
      p.caption && h('caption', null, p.caption),
      h('thead', null, h('tr', null, p.columns.map(function (c, i) { return h('th', { key: i, scope: 'col', className: p.numeric && p.numeric.indexOf(i) > -1 ? 'is-num' : undefined }, c); }))),
      h('tbody', null, p.rows.map(function (r, i) { return h('tr', { key: i }, r.map(function (c, j) { return h('td', { key: j, className: p.numeric && p.numeric.indexOf(j) > -1 ? 'is-num' : undefined }, c); })); })));
  }
  window.Legible = { Heading: Heading, Input: Input, Card: Card, Table: Table, Button: Button, Link: Link, Alert: Alert, Prose: Prose, Reader: Reader, guard: guard, LIMITS: LIMITS };
})();
