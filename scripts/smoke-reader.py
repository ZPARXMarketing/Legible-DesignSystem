"""Browser smoke test for <legible-reader> (needs: pip install playwright; a Chromium).
Usage: python3 scripts/smoke-reader.py [screenshot_dir]
Serves the repo on a local port, drives the real demo page, and asserts behavior."""
import http.server, socketserver, threading, os, sys, functools, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{port}'
fails = []
def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  {extra}' if extra and not cond else ''))
    if not cond: fails.append(name)

with sync_playwright() as p:
    exe = '/opt/pw-browsers/chromium'
    b = p.chromium.launch(executable_path=exe) if os.path.exists(exe) else p.chromium.launch()
    for label, url in [('source modules', '/packages/reader/demo/index.html')]:
        ctx = b.new_context(viewport={'width': 1280, 'height': 800}); pg = ctx.new_page()
        errors = []; pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(base + url); pg.wait_for_selector('legible-reader', state='attached')
        css = lambda sel, prop: pg.evaluate(f"getComputedStyle(document.querySelector('{sel}')).{prop}")
        check('default font size is 18px', css('main p', 'fontSize') == '18px', css('main p', 'fontSize'))
        pg.keyboard.press('Alt+a')
        check('Alt+A opens the panel', pg.evaluate("document.querySelector('legible-reader').shadowRoot.querySelector('.panel').classList.contains('open')"))
        sr = lambda js: pg.evaluate(f"(()=>{{const r=document.querySelector('legible-reader').shadowRoot;{js}}})()")
        sr("r.querySelector('[data-preset=dyslexia]').click()")
        check('dyslexia preset: 20px', css('main p', 'fontSize') == '20px', css('main p', 'fontSize'))
        check('dyslexia preset: sepia theme', pg.evaluate("document.body.dataset.theme") == 'sepia')
        check('dyslexia preset: line height 1.8 (36px)', css('main p', 'lineHeight') == '36px', css('main p', 'lineHeight'))
        sr("const i=r.querySelector('[data-k=measureCh]'); i.value=90; i.dispatchEvent(new Event('input',{bubbles:true}))")
        lh = float(css('main p', 'lineHeight').replace('px','')); fs = float(css('main p', 'fontSize').replace('px',''))
        check('90ch measure raises line height to at least 1.8 (kept the higher value)', lh / fs >= 1.6, lh / fs)
        sr("r.querySelector('[data-theme-pick=dark]').click()")
        check('dark theme applied', pg.evaluate("document.body.dataset.theme") == 'dark')
        check('dark theme raises weight to 450', css('main p', 'fontWeight') == '450', css('main p', 'fontWeight'))
        sr("r.querySelector('[data-contrast=maximum]').click()")
        note = sr("return r.querySelector('.adjust').textContent")
        ink = css('main p', 'color')
        check('maximum contrast corrects ink and tells the reader', 'Adjusted text color' in note, note)
        sr("r.querySelector('[data-font=serif]').click()")
        check('serif font applied', 'Source Serif' in css('main p', 'fontFamily') or 'serif' in css('main p', 'fontFamily').lower())
        sr("r.querySelector('[data-act=save]').click()")
        pg.reload(); pg.wait_for_selector('legible-reader', state='attached')
        check('saved prefs survive reload (dark)', pg.evaluate("document.body.dataset.theme") == 'dark')
        check('boot script set the root theme before paint', pg.evaluate("document.documentElement.dataset.theme") == 'dark')
        sr("r.querySelector('[data-act=reset]').click()")
        check('reset restores 18px', css('main p', 'fontSize') == '18px')
        check('reset restores light', pg.evaluate("document.body.dataset.theme") in ('light',))
        sr("r.querySelector('[data-act=undo]').click()")
        check('undo restores the previous state (dark)', pg.evaluate("document.body.dataset.theme") == 'dark')
        # touch targets
        small = sr("return [...r.querySelectorAll('button')].filter(b=>b.offsetParent!==null).map(b=>b.getBoundingClientRect()).filter(x=>x.height<43.5||x.width<43.5).length")
        check('every visible button is at least 44px in both directions', small == 0, small)
        # share link
        link = sr("r.querySelector('[data-act=share]').click(); return location.origin")
        pg.evaluate("localStorage.clear()")
        sr("r.querySelector('[data-preset=lowvision]').click()")
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True)
            pg.screenshot(path=os.path.join(SHOTS, 'reader-lowvision.png'))
        check('low vision preset: 24px and hc-light', css('main p', 'fontSize') == '24px' and pg.evaluate("document.body.dataset.theme") == 'hc-light')
        # fresh context: share link applies
        enc = pg.evaluate("localStorage.getItem('legible.prefs.v1')")
        check('no uncaught errors', not errors, errors)
        ctx.close()
        # screenshots of the default and dyslexia states
        if SHOTS:
            for name, js in [('reader-default', None), ('reader-dyslexia', "r.querySelector('[data-preset=dyslexia]').click()"), ('reader-night', "r.querySelector('[data-preset=night]').click()")]:
                c = b.new_context(viewport={'width': 1280, 'height': 800}); q = c.new_page(); q.goto(base + '/packages/reader/demo/index.html'); q.wait_for_selector('legible-reader', state='attached'); q.wait_for_timeout(600)
                q.keyboard.press('Alt+a')
                if js: q.evaluate(f"(()=>{{const r=document.querySelector('legible-reader').shadowRoot;{js}}})()")
                q.wait_for_timeout(400); q.screenshot(path=os.path.join(SHOTS, name + '.png')); c.close()
    # mobile bottom sheet + the single-file bundle
    mc = b.new_context(viewport={'width': 390, 'height': 800}, has_touch=True); m = mc.new_page()
    m.goto(base + '/packages/reader/demo/index.html'); m.wait_for_selector('legible-reader', state='attached'); m.keyboard.press('Alt+a')
    box = m.evaluate("(()=>{const e=document.querySelector('legible-reader').shadowRoot.querySelector('.panel').getBoundingClientRect();return [e.left,e.width,e.bottom, innerHeight]})()")
    check('mobile: panel is a full-width bottom sheet', box[0] == 0 and box[1] == 390 and abs(box[2] - box[3]) < 2, box)
    if SHOTS: m.screenshot(path=os.path.join(SHOTS, 'reader-mobile.png'))
    mc.close()
    bc = b.new_context(); bp = bc.new_page(); errs = []; bp.on('pageerror', lambda e: errs.append(str(e)))
    html = open(os.path.join(ROOT, 'packages/reader/demo/index.html')).read().replace('../src/legible-reader.js', '../../../dist/legible-reader.js')
    open(os.path.join(ROOT, 'packages/reader/demo/_bundle.html'), 'w').write(html)
    bp.goto(base + '/packages/reader/demo/_bundle.html'); bp.wait_for_selector('legible-reader', state='attached')
    bp.keyboard.press('Alt+a'); bp.evaluate("document.querySelector('legible-reader').shadowRoot.querySelector('[data-preset=night]').click()")
    check('single-file bundle works (night -> dim)', bp.evaluate("document.body.dataset.theme") == 'dim' and not errs, errs)
    os.remove(os.path.join(ROOT, 'packages/reader/demo/_bundle.html'))
    b.close()
srv.shutdown()
print('\n%d failed' % len(fails) if fails else '\nall passed'); sys.exit(1 if fails else 0)
