# Design tokens

## Dashboard ground and surfaces

Document surfaces render on white; app surfaces whose content is white cards render on the `#faf8f3` ground so the cards lift. The per-page `<main>` panel is applied deliberately, not by default.

## Card shell (`.pack` on pricing, buy packs, develop seats)

- Padding: `32px 28px`
- Background: `var(--sc-panel)` / `var(--panel)` white
- Shadow: `var(--sc-shadow)` — no border
- Radius: `4px`
- Featured / START HERE: `border-top: 3px solid` accent-soft + `var(--sc-shadow-lift)`
- Grid gap: `20px`
- Feature list: `flex-grow: 1` so equal-height cards fill

## Pack price lockup (pricing + buy)

- Price: serif `30px` / `600`, letter-spacing `-0.02em`
- Per-credit line: sans `13px`, `var(--sc-ink-soft)`, italic
