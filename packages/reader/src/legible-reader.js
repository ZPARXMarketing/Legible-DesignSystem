// <legible-reader target="article" presets="all"></legible-reader>
// Needs dist/tokens.css (theme variables) on the page. Preferences apply to `target` before first paint
// if you also include packages/reader/boot.js inline in <head>.
import { STORAGE_KEY, THEMES, FONTS, PRESETS, DEFAULT_PREFS, sanitize, applyPreset, encodeShare, decodeShare, computeVars } from './prefs.js';
import { limits } from '../../core/src/index.js';

const THEME_NAMES = { light: 'Light', sepia: 'Sepia', dark: 'Dark', dim: 'Dim', 'hc-light': 'High contrast light', 'hc-dark': 'High contrast dark' };
const PAGE_CSS = `[data-lg-target]{font-family:var(--lg-font,inherit);font-size:var(--lg-size,1.125rem);font-weight:var(--lg-weight,400);line-height:var(--lg-leading,1.5);letter-spacing:var(--lg-tracking,0);word-spacing:var(--lg-word,0);text-align:var(--lg-align,left);hyphens:var(--lg-hyphens,manual);background:var(--bg);color:var(--ink)}
[data-lg-target] :is(p,li,blockquote,dd){max-width:var(--lg-measure,65ch)}[data-lg-target] p+p{margin-top:var(--lg-para,1.5em)}
[data-lg-target] a{color:var(--accent);text-decoration:underline;text-underline-offset:.15em}
.lg-ruler{position:fixed;left:0;right:0;height:2.2em;pointer-events:none;z-index:2147482000;display:none}
.lg-ruler[data-mode=line]{display:block;border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);background:rgba(127,127,127,.12)}
.lg-ruler[data-mode=dim]{display:block;box-shadow:0 0 0 100vmax rgba(0,0,0,.5)}`;
const PANEL_CSS = `:host{all:initial;font:400 16px/24px var(--font-sans,system-ui,-apple-system,"Segoe UI",sans-serif);color:var(--ink,#1a1a1a)}
*{box-sizing:border-box}
.aa{position:fixed;top:12px;right:12px;z-index:2147483000;min-width:44px;min-height:44px;padding:0 12px;border-radius:8px;border:2px solid var(--line,#6b6b6b);background:var(--surface,#fff);color:var(--ink,#1a1a1a);font:700 18px/1 var(--font-sans,system-ui,sans-serif);cursor:pointer}
.panel{position:fixed;top:0;right:0;bottom:0;width:min(380px,100vw);z-index:2147483001;overflow:auto;background:var(--surface,#fff);color:var(--ink,#1a1a1a);border-left:2px solid var(--line,#6b6b6b);padding:16px;display:none}
.panel.open{display:block}
@media (max-width:640px){.panel{top:auto;left:0;width:100%;max-height:80vh;border-left:0;border-top:2px solid var(--line,#6b6b6b);border-radius:12px 12px 0 0}}
h2{margin:0 0 12px;font:600 18px/24px inherit}
h3{margin:16px 0 8px;font:600 14px/20px inherit;letter-spacing:.02em}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
button,select,input,.chip{font:inherit;color:inherit}
button{min-height:44px;min-width:44px;padding:0 12px;border-radius:8px;border:2px solid var(--line,#6b6b6b);background:var(--surface,#fff);cursor:pointer}
button[aria-pressed=true]{background:var(--accent,#0b57d0);border-color:var(--accent,#0b57d0);color:var(--on-accent,#fff);font-weight:600}
button.pill{border-radius:999px;font-size:14px}
button.font{width:100%;text-align:left;justify-content:flex-start}
.theme{border-radius:999px;font-size:13px}
button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--focus,#0b57d0);outline-offset:2px}
label{display:flex;flex-direction:column;gap:2px;margin:6px 0;font-size:14px;width:100%}
input[type=range]{width:100%;min-height:44px;accent-color:var(--accent,#0b57d0)}
select{min-height:44px;border:2px solid var(--line,#6b6b6b);border-radius:8px;background:var(--surface,#fff);padding:0 8px}
.note{margin:8px 0 0;font-size:14px;line-height:20px;color:var(--ink-2,#4a4a4a)}
details{margin-top:12px}summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}
.foot{margin-top:16px;padding-top:12px;border-top:2px solid var(--line,#6b6b6b)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.hdr{display:flex;justify-content:space-between;align-items:center}`;

class LegibleReader extends HTMLElement {
  #prefs = sanitize(DEFAULT_PREFS); #history = []; #open = false; #notes = [];
  #os = () => ({ dark: matchMedia('(prefers-color-scheme: dark)').matches, contrastMore: matchMedia('(prefers-contrast: more)').matches });
  get #target() { return document.querySelector(this.getAttribute('target') || 'body') || document.body; }
  get #key() { return this.getAttribute('storage-key') || STORAGE_KEY; }

  connectedCallback() {
    if (!document.getElementById('legible-reader-style')) { const s = document.createElement('style'); s.id = 'legible-reader-style'; s.textContent = PAGE_CSS; document.head.append(s); }
    this.attachShadow({ mode: 'open' });
    this.ruler = Object.assign(document.createElement('div'), { className: 'lg-ruler' }); document.body.append(this.ruler);
    addEventListener('pointermove', (e) => { this.ruler.style.top = `${e.clientY - 12}px`; }, { passive: true });
    for (const q of ['(prefers-color-scheme: dark)', '(prefers-contrast: more)']) matchMedia(q).addEventListener('change', () => this.#apply());
    addEventListener('keydown', (e) => { if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); this.toggle(); } else if (e.key === 'Escape' && this.#open) this.toggle(false); });
    this.#prefs = this.#load();
    this.#render(); this.#apply();
  }

  #load() {
    const fromUrl = new URLSearchParams(location.search).get('legible');
    if (fromUrl) { const p = decodeShare(fromUrl); if (p) return p; }
    try { const raw = localStorage.getItem(this.#key); if (raw) return sanitize(JSON.parse(raw)); } catch { /* storage blocked: defaults */ }
    return sanitize(DEFAULT_PREFS);
  }
  #save() { try { localStorage.setItem(this.#key, JSON.stringify(this.#prefs)); return true; } catch { return false; } }

  #set(patch, { custom = true } = {}) {
    this.#history.push(this.#prefs);
    this.#prefs = sanitize({ ...this.#prefs, ...patch, preset: custom ? 'custom' : patch.preset });
    this.#apply(); this.#render();
  }

  #apply() {
    const t = this.#target, os = this.#os();
    // Reset any earlier contrast corrections so the palette is read clean.
    for (const k of ['--ink', '--ink-2', '--bg', '--surface']) t.style.removeProperty(k);
    const theme = computeVars(this.#prefs, os).attrs['data-theme'];
    t.setAttribute('data-theme', theme); t.setAttribute('data-lg-target', '');
    const cs = getComputedStyle(t), get = (n) => cs.getPropertyValue(n).trim();
    const r = computeVars(this.#prefs, os, { ink: get('--ink'), ink2: get('--ink-2'), bg: get('--bg') });
    for (const [k, v] of Object.entries(r.vars)) t.style.setProperty(k, v);
    r.attrs['data-cvd'] === null ? t.removeAttribute('data-cvd') : t.setAttribute('data-cvd', '');
    const font = FONTS[this.#prefs.font];
    if (font.google && !document.querySelector(`link[data-lg-font="${this.#prefs.font}"]`) && this.hasAttribute('load-fonts')) {
      document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${font.google}&display=swap` }));
      document.querySelector('link:last-of-type')?.setAttribute('data-lg-font', this.#prefs.font);
    }
    this.ruler.dataset.mode = this.#prefs.readingRuler;
    this.#notes = r.notes;
    const n = this.shadowRoot?.querySelector('.adjust'); if (n) n.textContent = [...new Set(r.notes)].join(' ');
    this.dispatchEvent(new CustomEvent('legible-change', { detail: { prefs: this.#prefs, theme, notes: r.notes }, bubbles: true }));
  }

  toggle(force) {
    this.#open = force ?? !this.#open;
    const p = this.shadowRoot.querySelector('.panel'); p.classList.toggle('open', this.#open);
    this.shadowRoot.querySelector('.aa').setAttribute('aria-expanded', String(this.#open));
    (this.#open ? p.querySelector('h2') : this.shadowRoot.querySelector('.aa')).focus();
  }

  #render() {
    const p = this.#prefs, L = limits, on = (c) => (c ? 'true' : 'false');
    const presetList = (this.getAttribute('presets') || 'all') === 'all' ? Object.keys(PRESETS) : this.getAttribute('presets').split(',').filter((i) => PRESETS[i]);
    const slider = (id, label, v, lim, step, unit = '') => `<label>${label}: <output>${v}${unit}</output><input type="range" data-k="${id}" min="${lim.min}" max="${lim.max}" step="${step}" value="${v}"></label>`;
    const html = `<style>${PANEL_CSS}</style>
<button class="aa" aria-label="Reading settings" aria-expanded="${this.#open}" aria-controls="panel" data-act="toggle">Aa</button>
<section class="panel ${this.#open ? 'open' : ''}" id="panel" role="dialog" aria-label="Reading settings">
<div class="hdr"><h2 tabindex="-1">Reading settings</h2><button data-act="close" aria-label="Close reading settings">Close</button></div>
<h3>Presets</h3><div class="row" role="group" aria-label="Presets">${presetList.map((id) => `<button class="pill" data-preset="${id}" aria-pressed="${on(p.preset === id)}">${PRESETS[id].label}</button>`).join('')}</div>
<h3>Text size</h3><div class="row"><button data-act="smaller" aria-label="Smaller text">A−</button><output>${p.sizePx} px</output><button data-act="larger" aria-label="Larger text">A+</button></div>
<h3>Theme</h3><div class="row" role="group" aria-label="Theme"><button class="theme" data-theme-pick="system" aria-pressed="${on(p.theme === 'system')}">Match system</button>${THEMES.map((t) => `<button class="theme" data-theme-pick="${t}" aria-pressed="${on(p.theme === t)}">${THEME_NAMES[t]}</button>`).join('')}</div>
<h3>Font</h3><div role="group" aria-label="Font">${Object.entries(FONTS).map(([id, f]) => `<button class="font" data-font="${id}" aria-pressed="${on(p.font === id)}" style="font-family:${f.stack}">${f.name}</button>`).join('')}</div>
<details><summary>Spacing</summary>${slider('lineHeight', 'Line height', p.lineHeight, L.lineHeight, 0.05)}${slider('letterSpacingEm', 'Letter spacing', p.letterSpacingEm, L.letterSpacingEm, 0.01, ' em')}${slider('wordSpacingEm', 'Word spacing', p.wordSpacingEm, L.wordSpacingEm, 0.02, ' em')}${slider('measureCh', 'Line length', p.measureCh, L.measureCh, 1, ' ch')}${slider('paragraphSpacingEm', 'Paragraph spacing', p.paragraphSpacingEm, L.paragraphSpacingEm, 0.1, ' em')}</details>
<h3>Contrast</h3><div class="row" role="group" aria-label="Contrast"><button class="pill" data-contrast="auto" aria-pressed="${on(p.contrast === 'auto')}">Theme default</button><button class="pill" data-contrast="comfortable" aria-pressed="${on(p.contrast === 'comfortable')}">Comfortable</button><button class="pill" data-contrast="standard" aria-pressed="${on(p.contrast === 'standard')}">Standard</button><button class="pill" data-contrast="maximum" aria-pressed="${on(p.contrast === 'maximum')}">Maximum</button></div>
<details><summary>Advanced</summary>${slider('weight', 'Font weight', p.weight, L.weight, 10)}
<label>Alignment<select data-k="align"><option value="left" ${p.align === 'left' ? 'selected' : ''}>Left</option><option value="justify" ${p.align === 'justify' ? 'selected' : ''}>Justified (needs hyphenation)</option></select></label>
<div class="row"><button data-toggle="hyphenate" aria-pressed="${on(p.hyphenate)}">Hyphenation</button><button data-toggle="cvd" aria-pressed="${on(p.cvdMode === 'on')}">Color-vision mode</button></div>
<label>Reading ruler<select data-k="readingRuler"><option value="off">Off</option><option value="line" ${p.readingRuler === 'line' ? 'selected' : ''}>Line highlight</option><option value="dim" ${p.readingRuler === 'dim' ? 'selected' : ''}>Dim other lines</option></select></label>
<div class="row"><label>Background<input type="color" data-color="bg" value="${p.customColors?.bg ?? '#ffffff'}"></label><label>Text<input type="color" data-color="text" value="${p.customColors?.text ?? '#1a1a1a'}"></label><button data-act="clear-colors">Clear custom colors</button></div></details>
<p class="note adjust" role="status" aria-live="polite">${[...new Set(this.#notes)].join(' ')}</p>
<div class="foot row"><button data-act="reset">Reset to recommended</button><button data-act="save">Save as my default</button><button data-act="share">Copy share link</button><button data-act="export">Export file</button><button data-act="undo">Undo</button></div>
<p class="note status" role="status" aria-live="polite"></p></section>`;
    this.shadowRoot.innerHTML = html;
    this.#wire();
  }

  #status(msg) { const s = this.shadowRoot.querySelector('.status'); if (s) s.textContent = msg; }

  #wire() {
    const r = this.shadowRoot, q = (s) => r.querySelectorAll(s);
    const click = (sel, fn) => q(sel).forEach((el) => el.addEventListener('click', () => fn(el)));
    click('[data-act=toggle]', () => this.toggle()); click('[data-act=close]', () => this.toggle(false));
    click('[data-preset]', (el) => { this.#history.push(this.#prefs); this.#prefs = applyPreset(this.#prefs, el.dataset.preset); this.#apply(); this.#render(); });
    click('[data-act=smaller]', () => this.#set({ sizePx: this.#prefs.sizePx - 1 })); click('[data-act=larger]', () => this.#set({ sizePx: this.#prefs.sizePx + 1 }));
    click('[data-theme-pick]', (el) => this.#set({ theme: el.dataset.themePick })); click('[data-font]', (el) => this.#set({ font: el.dataset.font }));
    click('[data-contrast]', (el) => this.#set({ contrast: el.dataset.contrast }));
    click('[data-toggle=hyphenate]', () => this.#set({ hyphenate: !this.#prefs.hyphenate })); click('[data-toggle=cvd]', () => this.#set({ cvdMode: this.#prefs.cvdMode === 'on' ? 'off' : 'on' }));
    click('[data-act=clear-colors]', () => this.#set({ customColors: null }));
    click('[data-act=reset]', () => { this.#history.push(this.#prefs); this.#prefs = sanitize(DEFAULT_PREFS); this.#apply(); this.#render(); this.#status('Reset to recommended.'); });
    click('[data-act=undo]', () => { const prev = this.#history.pop(); if (prev) { this.#prefs = prev; this.#apply(); this.#render(); } });
    click('[data-act=save]', () => this.#status(this.#save() ? 'Saved as your default on this device.' : 'Could not save: storage is blocked in this browser.'));
    click('[data-act=share]', async () => {
      const url = `${location.origin}${location.pathname}?legible=${encodeShare(this.#prefs)}`;
      try { await navigator.clipboard.writeText(url); this.#status('Share link copied.'); } catch { this.#status(url); }
    });
    click('[data-act=export]', () => {
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(this.#prefs, null, 2)], { type: 'application/json' })), download: 'settings.legible.json' });
      a.click(); URL.revokeObjectURL(a.href);
    });
    q('input[type=range][data-k],select[data-k]').forEach((el) => el.addEventListener('input', () => {
      const k = el.dataset.k; this.#set({ [k]: el.tagName === 'SELECT' ? el.value : parseFloat(el.value) });
      const again = this.shadowRoot.querySelector(`[data-k="${k}"]`); if (again) again.focus();
    }));
    q('input[type=color]').forEach((el) => el.addEventListener('change', () => {
      const c = { ...(this.#prefs.customColors ?? { bg: '#ffffff', text: '#1a1a1a' }), [el.dataset.color]: el.value };
      this.#set({ customColors: c });
    }));
    r.querySelector('.panel').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); r.querySelector('[data-act=undo]').click(); } });
  }
}
if (!customElements.get('legible-reader')) customElements.define('legible-reader', LegibleReader);
export { LegibleReader };
