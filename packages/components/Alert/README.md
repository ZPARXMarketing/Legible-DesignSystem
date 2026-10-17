Alert shows a status message with a symbol and a word, never color alone.

Provide `kind` (`info`, `success`, `warning`, `danger`), an optional `title` (defaults to Note, Success, Warning or Error) and message text as `children`. The body stays in `ink`; only the symbol and title take the status color, and each status color holds 4.5:1 on `surface` in every theme. `danger` uses `role="alert"`; the others use `role="status"`.
