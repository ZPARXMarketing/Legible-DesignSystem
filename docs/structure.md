# Structure layer

Readability (the rest of Legible) makes the text easy to read. Structure makes the information easy to find and take in. Five rules, strongest evidence first, each backed by a token, a check or a component.

| Rule | Why | In Legible |
| --- | --- | --- |
| 1. Answer first, then cut | Most readers scan; in Morkes & Nielsen (1997) concise, scannable, neutral text together scored 124% more usable than a promotional version (one site, small sample) | `Summary`: one bottom line, then points, then the one action |
| 2. Groups of about four | Working memory holds three to five chunks (Cowan, 2001), not seven | `Group` and `Summary` docs; keep a group to about four items |
| 3. Spacing shows the grouping | Proximity is the strongest grouping cue (Gestalt), stronger than boxes or rules | `gap-item` < `gap-group` < `gap-section`; the build fails unless each is a clear step up |
| 4. Format fits the task | Tables for looking up values, charts for trends (Vessey, cognitive fit, 1991); side by side for choosing | `Compare` for choices, `Table` for look-ups |
| 5. Overview first, details on demand | Shneiderman's mantra; Mayer's segmenting principle | `Summary` on top, details below or one tap away |

## Tokens

| Token | Default | Use |
| --- | --- | --- |
| `gap-item` | 8px (2 x spacing base) | Between items inside one group |
| `gap-group` | 24px (6 x base) | Between groups |
| `gap-section` | 48px (12 x base) | Between sections |

`legible check` and `legible build` fail unless `gap-group` is at least 2 x `gap-item` and `gap-section` at least 1.5 x `gap-group`. `legible init` scales all three from `--spacing`. Utility classes: `.lg-items`, `.lg-groups`, `.lg-sections`.

## Components

- **Group**: optional label, items `gap-item` apart. No border; the space does the work.
- **Summary**: `answer`, up to about four `points`, one `action`.
- **Compare**: options as columns, criteria as row headers, a marked `pick` (check and word, not color alone), "—" for anything missing, criteria column fixed while options scroll on a phone.
