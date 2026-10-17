Button is the one control for actions, in three variants.

Provide a text label as `children`; icon-only buttons are not allowed. Use `primary` once per view for the main action, `secondary` for the rest, and `quiet` for low-emphasis actions that still read as underlined text.

- Every button is at least `target-min` (44px) in both directions.
- Borders use `line`, so the shape is visible without color; the focus ring is `focus`, 2px solid with a 2px offset.
- Disabled buttons use `ink-2` text with a dashed border, never lowered opacity.
- Do not use `accent` fills for destructive actions; use a `secondary` button and a `danger` Alert for the result.
