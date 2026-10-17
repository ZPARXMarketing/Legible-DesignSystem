# Legible Studio

> Status: the CLI generator (`legible init`) is implemented in `packages/studio`; the web app and docs-site output are still planned.

Studio generates new design systems that inherit the research baseline. It is a CLI and a web app on one engine.

## Inputs

Brand name; one to three brand colors; product type (`reading`, `app/UI`, `dashboard`, `marketing`); optional fonts, type ratio, radius and spacing base. Reject fonts with tiny x-height or confusable I, l, 1; warn on brand colors that cannot reach contrast.

## Pipeline

1. Validate inputs.
2. Build 12-step color ramps in OKLCH for light and dark.
3. Map semantic tokens (`bg`, `surface`, `ink`, `ink-2`, `line`, `accent`, `on-accent`, `focus`, status) and auto-fix them to target.
4. Generate the type scale (base 16 or 18 px, ratio 1.2–1.25).
5. Generate spacing, radius, elevation and motion tokens.
6. Build all six themes.
7. Run checks and write a report card.
8. Export.

## Commands

```
npx legible init
npx legible build
npx legible check
npx legible preview
npx legible export --target ios
```

## Outputs

DTCG tokens, CSS variables, a Tailwind preset, Tokens Studio JSON, Swift and Android tokens, a React package (Button, Text, Heading, Link, Input, Card, Alert, Table, ReaderPanel), a docs site and `report.html`.

## Checks

Contrast matrix (WCAG 2.2 and APCA) for every pair, theme and level; 3:1 for non-text; color-vision simulation; WCAG 1.4.12 spacing stress; 200% and 400% zoom; every preset by every font at min and max size; axe-core; keyboard and screen reader on the Reader panel. The build fails on any failure.
