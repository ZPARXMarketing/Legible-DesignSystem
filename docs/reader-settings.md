# Reader settings

Eighteen settings, each clamped. "Reset to recommended" restores every default.

| Setting | Range | Default | Why |
| --- | --- | --- | --- |
| Font family | curated list, system, dyslexia-friendly | Inter | Personal best font reads up to 35% faster (Wallace 2022) |
| Text size | 14–32 px | 18 px reading, 16 px UI | Below critical print size speed collapses; WCAG 1.4.4 needs 200% |
| Font weight | 300–700 | 400 (450 dark) | Thin weights lose legibility |
| Line height | 1.2–2.2 | 1.5 | WCAG 1.4.8, 1.4.12 |
| Letter spacing | −0.02 to +0.16 em | 0 | Helps dyslexic readers |
| Word spacing | 0 to +0.32 em | 0 | WCAG 1.4.12 |
| Line length | 45–90 ch | 65 ch | Dyson and Haselgrove 2001 |
| Paragraph spacing | 0.5–2.5 em | 1.5 em | WCAG 1.4.12 |
| Alignment | left, justified | left | Justified needs hyphenation |
| Theme | six themes plus custom | follows OS | Light for accuracy, dark for low light |
| Contrast level | Comfortable, Standard, Maximum | Standard | WCAG 2 and APCA |
| Custom colors | background and text | none | Auto-corrected |
| Color vision mode | off, protan, deutan, tritan, mono | off | Status colors swap to Okabe–Ito |
| Link style | underline always | always | WCAG 1.4.1 |
| Reduced motion | on, off | follows OS | `prefers-reduced-motion` |
| Reading ruler | off, line, dim others | off | Helps tracking |
| Hyphenation | on, off | off | Helps narrow columns |
| Numbers | proportional, tabular | tabular in tables | Faster scanning |

## Guardrails, in order

1. Clamp each value to its range.
2. Fix contrast: shift text lightness in OKLCH until it passes the chosen level; tell the reader "Adjusted text color for readability."
3. Below 16 px, weight is at least 400; in dark themes, at least 450 in the Reader.
4. Smaller text needs more contrast: 14 px text requires Lc 90 or more.
5. Measure above 75 ch raises line height to at least 1.6.
6. Justified text is allowed only with hyphenation on, with a warning.
7. Layouts must survive WCAG 1.4.12 spacing and 200% zoom.
8. A brand theme that fails any rule is refused.

## Presets

| Preset | Font | Size | Line height | Letter spacing | Theme | Contrast |
| --- | --- | --- | --- | --- | --- | --- |
| Recommended | Inter | 18 | 1.5 | 0 | OS | Standard |
| Long reading | Source Serif 4 | 19 | 1.6 | 0 | Light or Sepia | Standard |
| Low vision | Atkinson Hyperlegible | 24 | 1.6 | +0.02 em | hc-light | Maximum |
| Dyslexia-friendly | Atkinson Hyperlegible | 20 | 1.8 | +0.08 em | Sepia | Standard |
| Night | Inter, weight 450 | 18 | 1.6 | +0.01 em | Dim | Comfortable |
| Older readers | Montserrat or EB Garamond | 20 | 1.6 | 0 | Light | Standard |
| Compact | Inter | 14–16 | 1.35 | 0 | OS | Standard |

## Find my best font

An optional two-minute test: six passages of about 150 words, one font each in random order, each ending in one comprehension question. Record words per minute on correct answers and offer the fastest font. Results stay on the device. Measured speed beats gut feel; the preferred font was also the fastest only 20% of the time.

## Persistence

`localStorage` key `legible.prefs.v1`; optional account sync; `?legible=<base64>` to share; export `.legible.json`. Apply preferences in an inline `<head>` script so the page never flashes the wrong theme.
