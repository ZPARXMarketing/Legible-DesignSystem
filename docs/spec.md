# Legible — a research-backed, reader-adjustable design system

> Working name. Legible is two things built on one core:
> 1. **Legible Studio**: a program that *creates design systems* (tokens, themes, components) that obey readability research.
> 2. **Legible Reader**: a *single reading app* (or embeddable widget) that lets each reader change font, size, spacing, and colors, within safe limits.
>
> Research basis: [`/research/readability-research.md`](../research/readability-research.md)

---

## Table of contents
1. [Core idea](#1-core-idea)
2. [Architecture (the 5 token layers)](#2-architecture-the-5-token-layers)
3. [What readers can change (full settings list)](#3-what-readers-can-change-full-settings-list)
4. [Guardrails (how we stop bad combinations)](#4-guardrails-how-we-stop-bad-combinations)
5. [Color & contrast engine](#5-color--contrast-engine)
6. [Font system](#6-font-system)
7. ["Find my best font" calibration](#7-find-my-best-font-calibration)
8. [Presets](#8-presets)
9. [Legible Reader: UI spec](#9-legible-reader-ui-spec)
10. [Legible Studio: generator program spec](#10-legible-studio-generator-program-spec)
11. [Data model (config + preferences schema)](#11-data-model-config--preferences-schema)
12. [Implementation (CSS + JS)](#12-implementation-css--js)
13. [Testing & compliance](#13-testing--compliance)
14. [Project structure](#14-project-structure)
15. [Build plan (numbered steps)](#15-build-plan-numbered-steps)

---

## 1. Core idea

Research says **no single font or setting is best for everyone** (Wallace et al., 2022: readers were ~35% faster in their personal best font). So instead of picking one "perfect" style, Legible:

1. Ships **research-backed defaults** that work well for most people.
2. Lets each reader **adjust everything** that research shows matters.
3. **Clamps every setting to a safe range** and **auto-fixes contrast**, so no combination becomes unreadable.

Same engine powers both products: Studio uses it to *author* systems; Reader uses it to *render* text per reader.

---

## 2. Architecture (the 5 token layers)

Each layer can only override the one below it. Guardrails apply at the end, every time.

```
┌──────────────────────────────────────────────┐
│ 5. Reader overrides    (user's own choices)  │  ← Reader settings panel
├──────────────────────────────────────────────┤
│ 4. OS / browser prefs  (dark mode, contrast, │  ← prefers-color-scheme, prefers-contrast,
│                         reduced motion)      │     prefers-reduced-motion, forced-colors
├──────────────────────────────────────────────┤
│ 3. Brand theme         (a generated system)  │  ← made in Legible Studio
├──────────────────────────────────────────────┤
│ 2. Semantic tokens     (text, bg, accent…)   │
├──────────────────────────────────────────────┤
│ 1. Research baseline   (defaults + limits)   │  ← never editable by brands or readers
└──────────────────────────────────────────────┘
          ↓ resolve()  →  guardrails()  →  CSS variables
```

- **Layer 1 (baseline)** holds the safe ranges. Brands cannot widen them.
- **Layer 3 (brand)** can choose *defaults* inside the ranges, not new ranges.
- **Layer 5 (reader)** always wins, as long as it stays inside the ranges.

Token format: **W3C Design Tokens (DTCG) JSON**, so output works with Figma (Tokens Studio), Style Dictionary, Tailwind, iOS, and Android.

---

## 3. What readers can change (full settings list)

| # | Setting | Options / range | Default | Research reason |
|---|---|---|---|---|
| 1 | **Font family** | Curated list (see §6) + "system font" + "Dyslexia-friendly" | Inter | Individual best font = up to 35% faster (Wallace 2022) |
| 2 | **Text size** | 14–32px, steps of 1px (or slider 87%–200%) | 18px reading / 16px UI | Below critical print size, speed collapses (Legge & Bigelow 2011); WCAG 1.4.4 needs 200% |
| 3 | **Font weight** | 300–700 (variable fonts) | 400 (light) / 450 (dark) | Thin weights lose legibility; dark mode benefits from slightly heavier text |
| 4 | **Line height** | 1.2–2.2 | 1.5 | WCAG 1.4.8 / 1.4.12 |
| 5 | **Letter spacing** | −0.02em to +0.16em | 0 | Extra spacing helps dyslexic readers (Zorzi 2012); WCAG 1.4.12 needs up to 0.12em |
| 6 | **Word spacing** | 0 to +0.32em | 0 | WCAG 1.4.12 needs up to 0.16em |
| 7 | **Line length (measure)** | 45–90 characters | 65ch | Dyson & Haselgrove 2001; WCAG 1.4.8 ≤80 |
| 8 | **Paragraph spacing** | 0.5–2.5em | 1.5em | WCAG 1.4.12 needs 2× font size support |
| 9 | **Text alignment** | Left / Justified (warns) | Left | WCAG 1.4.8: avoid justified |
| 10 | **Theme** | Light · Dark · Sepia · Dim · High contrast (light) · High contrast (dark) · Custom | Follows OS | Light = better accuracy (Piepenbrock 2013); dark for low light |
| 11 | **Contrast level** | Comfortable (APCA Lc 75) · Standard (Lc 90 / 7:1) · Maximum (Lc 105+) | Standard | WCAG 2 + APCA |
| 12 | **Custom colors** | Background + text pickers (auto-corrected, see §5) | — | Some readers (e.g., Irlen/visual stress) prefer tinted backgrounds |
| 13 | **Color vision mode** | Off · Protan · Deutan · Tritan · Monochrome | Off | ~8% of men have CVD (Birch 2012) |
| 14 | **Link style** | Underline always · Underline on hover (not recommended) | Always | WCAG 1.4.1 (don't rely on color alone) |
| 15 | **Reduced motion** | On / Off | Follows OS | `prefers-reduced-motion` |
| 16 | **Focus / reading ruler** | Off · Line highlight · Dim other paragraphs | Off | Helps tracking on long lines |
| 17 | **Hyphenation** | On / Off | Off | Helps narrow columns; can hurt some readers |
| 18 | **Number style** | Proportional / Tabular | Tabular in tables | Faster scanning of figures |

Every setting has a **"Reset to recommended"** button, and the panel shows a **live preview** paragraph.

---

## 4. Guardrails (how we stop bad combinations)

Readers get freedom, but the engine checks every combination in order.

1. **Clamp:** each value is held inside its range in §3.
2. **Contrast fix:** if text/background fall below the chosen contrast level, the engine shifts the text lightness (OKLCH) until it passes (§5). Readers see a small note: *"Adjusted text color for readability."*
3. **Size ↔ weight:** below 16px, weight minimum becomes 400; in dark mode, minimum becomes 400 at all sizes.
4. **Size ↔ contrast:** smaller text needs more contrast (APCA font lookup table). 14px text requires Lc 90+.
5. **Measure ↔ line height:** when measure > 75ch, line height minimum becomes 1.6 (longer lines need more spacing to find the next line).
6. **Justified text:** allowed only with hyphenation on; shows a warning.
7. **Layout never breaks:** components must survive WCAG 1.4.12 spacing and 200% zoom (tested in CI, §13).
8. **Brand can't break it:** Studio refuses to build a theme that fails any of the above.

---

## 5. Color & contrast engine

### 5.1 Color space
All colors are stored and adjusted in **OKLCH** (perceptually uniform). Changing lightness doesn't shift the perceived hue, so auto-fixes still look "on brand."

### 5.2 Contrast checks (both run)
- **WCAG 2.2 ratio**: legal compliance (4.5:1 AA, 7:1 AAA).
- **APCA Lc**: perceptual accuracy, especially for dark mode.

A color pair passes only if it meets **both** targets for the chosen contrast level.

| Contrast level | WCAG 2 body | APCA body | Use for |
|---|---|---|---|
| Comfortable | ≥ 4.5:1 | ≥ Lc 75 | Readers who find high contrast glaring |
| Standard (default) | ≥ 7:1 | ≥ Lc 90 | Most reading |
| Maximum | ≥ 12:1 | ≥ Lc 105 | Low vision |

### 5.3 Auto-fix algorithm
```
function fixContrast(text, bg, target):
    if passes(text, bg, target): return text
    direction = bg is light ? darker : lighter
    repeat (max 50 steps):
        text.L += direction * 0.01        # adjust OKLCH lightness only
        if passes(text, bg, target): return text
    # still failing (e.g., mid-gray background): move bg away too
    return fixContrast(text, nudge(bg, -direction), target)
```

### 5.4 Built-in themes
| Theme | Background | Text | Notes |
|---|---|---|---|
| Light | #FAFAF9 | #1A1A1A | 16.7:1 |
| Sepia | #F4ECD8 | #3B2F20 | Warm, popular for long reading |
| Dark | #121212 | #E6E6E6 | 15.0:1, no pure black/white (halation) |
| Dim | #1F2328 | #D1D5DB | Softer dark for evenings |
| High contrast light | #FFFFFF | #000000 | 21:1 |
| High contrast dark | #000000 | #FFFFFF | 21:1, weight +50 to reduce bleed |

Semantic colors (accent, success, warning, danger) are generated per theme from the brand hue and auto-fixed to ≥ 4.5:1. Full starter values: see research file.

### 5.5 Color vision modes
- Swap status colors to the **Okabe–Ito** palette.
- Always show **icon + text** with status color (never color alone).
- Charts switch to **viridis / cividis** for continuous data.
- "Monochrome" mode removes hue entirely and relies on shape/labels (a stress test, useful for designers too).

### 5.6 OS integration
| OS/browser signal | Behavior |
|---|---|
| `prefers-color-scheme: dark` | Start in Dark |
| `prefers-contrast: more` | Start at Maximum contrast |
| `prefers-contrast: less` | Start at Comfortable |
| `forced-colors: active` (Windows High Contrast) | Hand control to the OS colors; keep only layout tokens |
| `prefers-reduced-motion` | Turn off animations |

---

## 6. Font system

### 6.1 Curated font list
Chosen from the Wallace 2022 study plus fonts built for legibility. All are free/open license (OFL) except where noted.

| Group | Fonts | Why included |
|---|---|---|
| **Recommended sans** | Inter, Noto Sans, Montserrat, Atkinson Hyperlegible, Lato, Roboto | Noto most preferred; Montserrat fast for 35+; Atkinson built for low vision |
| **Recommended serif** | EB Garamond, Source Serif 4, Literata, Merriweather | EB Garamond fastest average in Wallace 2022 |
| **Glance / UI** | Inter, Atkinson Hyperlegible, Source Sans 3 (humanist) | Humanist sans best for glance reading (Reimer 2014, Dobres 2016) |
| **Dyslexia-friendly** | Atkinson Hyperlegible, Lexend, Verdana-style (system) | Rello 2013: sans + roman best. *OpenDyslexic offered only by request; no proven benefit* |
| **Monospace** | JetBrains Mono, IBM Plex Mono | Clear 0/O, 1/l/I |
| **System** | `system-ui` stack | Zero download, familiar |

Each font in the list stores metadata the engine uses:
```json
{
  "id": "eb-garamond",
  "family": "EB Garamond",
  "category": "serif",
  "variable": true,
  "weights": [400, 800],
  "xHeight": 0.40,
  "sizeAdjust": 1.12,
  "minSizePx": 16,
  "license": "OFL"
}
```

### 6.2 Size normalization
Fonts with small x-heights (e.g., Garamond) look smaller at the same px. The engine uses **`font-size-adjust`** (or a stored `sizeAdjust` multiplier) so **"18px" looks the same size in every font**. Switching fonts never makes text suddenly tiny.

### 6.3 Loading
1. Self-host as **WOFF2 variable fonts** (one file per family).
2. Load only the reader's chosen font, plus the default.
3. `font-display: swap` with a metric-matched fallback (`size-adjust`, `ascent-override`) to avoid layout jump.
4. Preview cards in the font picker use a small subset file (just the preview text) so the picker opens fast.

---

## 7. "Find my best font" calibration

Optional 2-minute test, modeled on the Wallace 2022 method. Measured speed beats gut feel: preferred font matched fastest font only 20% of the time.

1. Reader picks **"Find my best font."**
2. App shows **6 short passages** (~150 words each), each in a different font from the curated list, at the reader's current size. Order is randomized.
3. Each passage ends with **1 simple comprehension question** (so people read, not skim).
4. App records **words per minute** for passages answered correctly.
5. Result screen: *"You read fastest in Montserrat (+18% vs. your slowest)."* Options: **Use this font** · **Keep my current font** · **Run again**.
6. Results are stored locally; never shared without consent.

Optional extension: same test for **size** (3 sizes) and **theme** (light vs dark).

---

## 8. Presets

One-tap starting points. Each just fills in §3 settings; readers can tweak further.

| Preset | Font | Size | Line height | Letter sp. | Theme | Contrast |
|---|---|---|---|---|---|---|
| **Recommended** | Inter | 18 | 1.5 | 0 | OS | Standard |
| **Long reading** | EB Garamond / Literata | 19 | 1.6 | 0 | Light or Sepia | Standard |
| **Low vision** | Atkinson Hyperlegible | 24 | 1.6 | +0.02em | High contrast | Maximum |
| **Dyslexia-friendly** | Atkinson Hyperlegible / Lexend | 20 | 1.8 | +0.08em | Sepia | Standard |
| **Night** | Inter (wt 450) | 18 | 1.6 | +0.01em | Dim | Comfortable |
| **Older readers (35+)** | Montserrat / EB Garamond | 20 | 1.6 | 0 | Light | Standard |
| **Compact (dashboards)** | Inter | 14–16 | 1.35 | 0 | OS | Standard |

---

## 9. Legible Reader: UI spec

### 9.1 Entry point
- A single **"Aa"** button, always visible (top-right of reading view). Keyboard: `Alt + A`.
- Opens a **side panel** (desktop) or **bottom sheet** (mobile). Content reflows live behind it.

### 9.2 Panel layout (top → bottom, most-used first)
1. **Presets row** (chips): Recommended · Long reading · Low vision · Dyslexia · Night · More…
2. **Text size**: big `A−` / `A+` buttons + slider.
3. **Theme**: 6 color swatches + "Custom."
4. **Font**: list of cards, each rendered in its own font; "Find my best font" link.
5. **Spacing** (collapsed group): line height, letter, word, paragraph, line length.
6. **Contrast**: 3-way toggle (Comfortable / Standard / Maximum).
7. **Advanced** (collapsed): weight, alignment, hyphenation, color vision mode, reading ruler, reduced motion, custom colors.
8. **Footer**: Reset to recommended · Save as my default · Share settings (link/code).

### 9.3 Rules for the panel itself
- Panel always uses **Recommended** styling (so it's usable even if the reader picks extreme settings).
- Every control has a text label (no icon-only controls).
- Targets ≥ 44×44px.
- All changes are instant and undoable (`Ctrl/Cmd + Z` inside panel).

### 9.4 Persistence
| Where | What |
|---|---|
| Local (default) | `localStorage` key `legible.prefs.v1` |
| Account (optional) | Synced to user profile, applies across devices |
| URL | `?legible=<base64 settings>` for sharing a setup |
| Export | Download/import `.legible.json` |

Settings apply **before first paint** (inline script in `<head>`) so the page never flashes the wrong theme.

### 9.5 Embeddable mode
Reader also ships as a web component so any site can add it:
```html
<script type="module" src="legible-reader.js"></script>
<legible-reader target="article" presets="all"></legible-reader>
```

---

## 10. Legible Studio: generator program spec

Studio makes **new design systems** that inherit the research baseline. Use it as a **CLI** and a **web app** (same engine).

### 10.1 Inputs (what a designer gives it)
1. Brand name.
2. 1–3 brand colors (any format).
3. Product type: `reading` · `app/UI` · `dashboard` · `marketing`.
4. Optional: preferred fonts (validated against legibility checks), type scale ratio, corner radius, spacing base.

### 10.2 What it does (pipeline)
1. **Validate inputs**: rejects fonts below legibility thresholds (e.g., tiny x-height, confusable I/l/1); warns on brand colors that can't reach contrast.
2. **Generate color ramps**: 12 steps per hue in OKLCH, for light and dark.
3. **Map semantic tokens**: text, bg, surface, border, accent, success, warning, danger, focus. Auto-fixed to targets.
4. **Generate type scale**: base 16/18px, ratio 1.2–1.25 (by product type), with line heights per step.
5. **Generate spacing, radius, elevation, motion** tokens.
6. **Build all 6 themes** (§5.4) for the brand.
7. **Run checks** (§13) and produce a **report card**.
8. **Export** to every target.

### 10.3 Outputs
| Target | File |
|---|---|
| DTCG tokens | `tokens/*.json` |
| CSS variables | `dist/legible.css` |
| Tailwind preset | `dist/tailwind.preset.js` |
| Figma | `dist/figma-tokens.json` (Tokens Studio) |
| iOS | `dist/ios/LegibleTokens.swift` |
| Android | `dist/android/legible_tokens.xml` |
| React components | `@brand/ui` package (Button, Text, Heading, Link, Input, Card, Alert, Table, ReaderPanel) |
| Docs site | Auto-generated, with live Reader panel |
| Report card | `report.html` (contrast table, CVD previews, pass/fail) |

### 10.4 CLI
```bash
npx legible init                 # interactive: brand name, colors, product type
npx legible build                # generate tokens + all outputs
npx legible check                # run WCAG 2.2 + APCA + CVD + spacing tests
npx legible preview              # local docs site with Reader panel
npx legible export --target ios  # single target
```

### 10.5 Studio web app screens
1. **Start**: pick "New system" or "Import tokens."
2. **Brand**: color pickers with live contrast badges.
3. **Type**: font choice (curated list first), scale preview at every size.
4. **Themes**: all 6 themes side by side, with CVD simulation toggles.
5. **Components**: live preview of every component in every theme.
6. **Report card**: pass/fail list; "Fix all" button applies auto-fixes.
7. **Export**: download zip or publish package.

---

## 11. Data model (config + preferences schema)

### 11.1 Studio config — `legible.config.json`
```json
{
  "$schema": "https://legible.dev/schema/config.v1.json",
  "name": "Acme",
  "productType": "reading",
  "brand": { "primary": "#0B57D0", "secondary": "#E69F00" },
  "fonts": {
    "sans": "inter",
    "serif": "eb-garamond",
    "mono": "jetbrains-mono",
    "readerChoices": "curated"
  },
  "type": { "base": 18, "ratio": 1.25 },
  "spacing": { "base": 4 },
  "radius": { "base": 8 },
  "themes": ["light", "sepia", "dark", "dim", "hc-light", "hc-dark"],
  "defaults": { "theme": "system", "contrast": "standard" },
  "reader": { "enabled": true, "presets": "all", "calibration": true }
}
```

### 11.2 Reader preferences — `legible.prefs.v1`
```json
{
  "version": 1,
  "preset": "custom",
  "font": "montserrat",
  "sizePx": 20,
  "weight": 400,
  "lineHeight": 1.6,
  "letterSpacingEm": 0.0,
  "wordSpacingEm": 0.0,
  "measureCh": 65,
  "paragraphSpacingEm": 1.5,
  "align": "left",
  "hyphenate": false,
  "theme": "sepia",
  "contrast": "standard",
  "customColors": null,
  "cvdMode": "off",
  "linkUnderline": "always",
  "reducedMotion": "system",
  "readingRuler": "off",
  "numbers": "auto",
  "calibration": { "fastestFont": "montserrat", "wpm": 284, "date": "2026-10-17" }
}
```

### 11.3 Guardrail table — `baseline/limits.json` (Layer 1, read-only)
```json
{
  "sizePx":           { "min": 14,    "max": 32,   "default": 18 },
  "weight":           { "min": 300,   "max": 700,  "default": 400 },
  "lineHeight":       { "min": 1.2,   "max": 2.2,  "default": 1.5 },
  "letterSpacingEm":  { "min": -0.02, "max": 0.16, "default": 0 },
  "wordSpacingEm":    { "min": 0,     "max": 0.32, "default": 0 },
  "measureCh":        { "min": 45,    "max": 90,   "default": 65 },
  "paragraphSpacingEm": { "min": 0.5, "max": 2.5,  "default": 1.5 },
  "contrast": {
    "comfortable": { "wcag": 4.5, "apca": 75 },
    "standard":    { "wcag": 7.0, "apca": 90 },
    "maximum":     { "wcag": 12,  "apca": 105 }
  },
  "nonTextContrast": 3.0,
  "minTargetPx": 44
}
```

---

## 12. Implementation (CSS + JS)

### 12.1 CSS: everything is a variable
```css
:root {
  --lg-font: "Inter", system-ui, sans-serif;
  --lg-size: 1.125rem;
  --lg-weight: 400;
  --lg-leading: 1.5;
  --lg-tracking: 0em;
  --lg-word: 0em;
  --lg-measure: 65ch;
  --lg-para: 1.5em;
  --lg-align: left;

  --lg-bg: #FAFAF9;
  --lg-surface: #FFFFFF;
  --lg-text: #1A1A1A;
  --lg-text-2: #4A4A4A;
  --lg-accent: #0B57D0;
  --lg-focus: #0B57D0;
}

[data-lg-theme="dark"]  { --lg-bg:#121212; --lg-surface:#1E1E1E; --lg-text:#E6E6E6; --lg-text-2:#A8A8A8; --lg-accent:#8AB4F8; --lg-weight:450; }
[data-lg-theme="sepia"] { --lg-bg:#F4ECD8; --lg-surface:#FBF5E6; --lg-text:#3B2F20; --lg-text-2:#5C4A35; }
/* …dim, hc-light, hc-dark generated by Studio */

.lg-prose {
  font-family: var(--lg-font);
  font-size: var(--lg-size);
  font-weight: var(--lg-weight);
  line-height: var(--lg-leading);
  letter-spacing: var(--lg-tracking);
  word-spacing: var(--lg-word);
  max-width: var(--lg-measure);
  text-align: var(--lg-align);
  color: var(--lg-text);
  background: var(--lg-bg);
  font-size-adjust: from-font;      /* normalize x-height across fonts */
}
.lg-prose p + p { margin-top: var(--lg-para); }
.lg-prose a { color: var(--lg-accent); text-decoration: underline; text-underline-offset: 0.15em; }

@media (forced-colors: active) { :root { --lg-bg: Canvas; --lg-text: CanvasText; --lg-accent: LinkText; } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

### 12.2 JS: resolve → guard → apply
```js
import limits from "./baseline/limits.json";
import { fixContrast } from "./contrast.js";

export function applyPrefs(brand, os, user) {
  const p = { ...limits.defaults, ...brand.defaults, ...os, ...user }; // layers 1→5
  const g = guard(p);                                                 // §4 rules
  const root = document.documentElement;
  root.dataset.lgTheme = g.theme;
  root.style.setProperty("--lg-font", fontStack(g.font));
  root.style.setProperty("--lg-size", `${g.sizePx / 16}rem`);
  root.style.setProperty("--lg-weight", g.weight);
  root.style.setProperty("--lg-leading", g.lineHeight);
  root.style.setProperty("--lg-tracking", `${g.letterSpacingEm}em`);
  root.style.setProperty("--lg-word", `${g.wordSpacingEm}em`);
  root.style.setProperty("--lg-measure", `${g.measureCh}ch`);
  root.style.setProperty("--lg-para", `${g.paragraphSpacingEm}em`);
  if (g.customColors) {
    const text = fixContrast(g.customColors.text, g.customColors.bg, limits.contrast[g.contrast]);
    root.style.setProperty("--lg-bg", g.customColors.bg);
    root.style.setProperty("--lg-text", text);
  }
  return g; // so the UI can show "adjusted for readability" notes
}

function guard(p) {
  const c = (k) => Math.min(limits[k].max, Math.max(limits[k].min, p[k]));
  const g = { ...p };
  for (const k of ["sizePx","weight","lineHeight","letterSpacingEm","wordSpacingEm","measureCh","paragraphSpacingEm"]) g[k] = c(k);
  if (g.sizePx < 16 || g.theme.includes("dark")) g.weight = Math.max(g.weight, 400);
  if (g.measureCh > 75) g.lineHeight = Math.max(g.lineHeight, 1.6);
  if (g.align === "justify" && !g.hyphenate) g.align = "left";
  return g;
}
```

### 12.3 No-flash boot (inline in `<head>`)
```html
<script>
  try {
    const p = JSON.parse(localStorage.getItem("legible.prefs.v1") || "{}");
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.lgTheme = p.theme && p.theme !== "system" ? p.theme : (dark ? "dark" : "light");
  } catch (e) {}
</script>
```

---

## 13. Testing & compliance

`legible check` (and CI) runs:

1. **Contrast matrix**: every text/background token pair in every theme × every contrast level, against WCAG 2.2 and APCA.
2. **Non-text contrast**: borders, icons, focus rings ≥ 3:1.
3. **CVD simulation**: renders status colors under protan/deutan/tritan; fails if any two become indistinguishable (ΔE OK < 10).
4. **Spacing stress test** (WCAG 1.4.12): applies line height 1.5, paragraph 2×, letter 0.12em, word 0.16em; screenshots check for clipped or overlapping text.
5. **Zoom test**: 200% and 400% (reflow, WCAG 1.4.10) with no horizontal scroll.
6. **Extreme-combo test**: every preset × every font × min/max size; checks nothing breaks.
7. **Axe-core** automated accessibility scan on docs site and components.
8. **Keyboard test**: Reader panel fully usable by keyboard and screen reader (labels, roles, focus order).

Output: `report.html` with a pass/fail table. Build fails on any failure.

Recommended manual checks before launch:
- Test with real users with low vision, dyslexia, and CVD.
- Test on OLED phone outdoors and in a dark room.

---

## 14. Project structure

```
legible/
├── packages/
│   ├── core/              # resolve(), guard(), contrast engine (OKLCH, WCAG, APCA)
│   │   ├── baseline/limits.json
│   │   ├── fonts/catalog.json
│   │   └── src/
│   ├── studio-cli/        # `npx legible …`
│   ├── studio-web/        # Studio web app
│   ├── reader/            # Reader panel (web component + React wrapper)
│   ├── components/        # Text, Heading, Button, Link, Input, Card, Alert, Table
│   └── exporters/         # css, tailwind, figma, ios, android
├── fonts/                 # self-hosted WOFF2 variable fonts (OFL)
├── apps/
│   ├── docs/              # generated docs + live demo
│   └── reading-app/       # standalone Legible Reader app
├── tests/                 # contrast matrix, CVD, spacing, zoom, e2e
└── research/              # links to readability-research.md
```

Suggested stack: TypeScript, Vite, Lit (web components) + React wrappers, `culori` (OKLCH), `apca-w3` (APCA), Style Dictionary (exports), Playwright + axe-core (tests).

---

## 15. Build plan (numbered steps)

**Phase 1: Core engine**
1. Write `limits.json` and `fonts/catalog.json` from the research file.
2. Build the contrast engine: OKLCH conversion, WCAG ratio, APCA Lc, `fixContrast()`.
3. Build `resolve()` (5 layers) and `guard()` (§4 rules).
4. Write unit tests for every guardrail.

**Phase 2: Reader (single reading app)**
5. CSS variable layer + 6 themes.
6. Reader panel UI (§9) with presets, live preview, persistence, no-flash boot.
7. Self-host curated fonts with size normalization.
8. "Find my best font" calibration (§7).
9. Accessibility pass: keyboard, screen reader, 200% zoom, spacing stress test.
10. Ship standalone reading app + `<legible-reader>` embed.

**Phase 3: Studio (design system generator)**
11. Config schema + `legible init`.
12. Color ramp + semantic token generation for all themes.
13. Type scale, spacing, radius, motion generation.
14. Exporters: CSS, Tailwind, Figma, iOS, Android.
15. `legible check` + HTML report card.
16. Component library consuming tokens.
17. Studio web app (§10.5).

**Phase 4: Validate**
18. User testing with diverse readers (age 35+, low vision, dyslexia, CVD).
19. Compare reading speed: defaults vs. reader-chosen settings (repeat the Wallace method).
20. Tune defaults and presets from results.
