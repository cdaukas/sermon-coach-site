# Design tokens — from `public/pricing.html`

Source of truth when the app and marketing pages disagree. Extracted verbatim from the `<style>` block in `public/pricing.html`. Do not override from mockups.

Resolved custom properties used below (from `:root`):

```css
:root {
  --bg: #faf8f3;
  --ink: #1a2332;
  --ink-soft: #4a5568;
  --ink-mid: #2a3447;
  --rule: #d4cfc1;
  --panel: #ffffff;
  --accent: #a67c2e;
  --accent-soft: #c9a55c;
  --accent-pale: #faf6ed;
  --shadow: 0 1px 3px rgba(26,35,50,.06), 0 1px 2px rgba(26,35,50,.04);
  --shadow-lift: 0 12px 32px rgba(26,35,50,.10), 0 4px 12px rgba(26,35,50,.06);
}
```

Body type stack (inherited by serif elements that do not set `font-family`):

```css
body {
  font-family: 'Iowan Old Style', 'Charter', Georgia, 'Times New Roman', serif;
}
```

---

## 1. "Best pack value" ribbon

### Selector: `.pack-best-value`

```css
.pack-best-value {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-soft);
  color: var(--ink);
  padding: 4px 12px;
  border-radius: 3px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}
```

### Card border coordination — selector: `.pack.featured`

The ribbon sits on the featured pack. The card’s top edge is a 3px soft-gold bar that matches the ribbon fill (`var(--accent-soft)`). The ribbon overlaps that bar via `top: -11px`. Featured also lifts the shadow.

```css
.pack.featured {
  box-shadow: var(--shadow-lift);
  border-top: 3px solid var(--accent-soft);
}
```

Base pack positioning context (required for absolute ribbon):

```css
.pack {
  position: relative;
}
```

Responsive note (featured pack only at narrow width):

```css
@media (max-width: 880px) {
  .tier.featured, .pack.featured { margin-top: 16px; }
}
```

---

## 2. Monthly / annual toggle

### Container — selector: `.billing-toggle`

```css
.billing-toggle {
  max-width: 900px;
  margin: 0 auto 32px;
  padding: 0 24px;
  display: flex;
  justify-content: center;
}
```

### Track — selector: `.toggle-inner`

```css
.toggle-inner {
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 4px;
  display: inline-flex;
  box-shadow: var(--shadow);
}
```

### Inactive label / button base — selector: `.toggle-btn`

```css
.toggle-btn {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 10px 22px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

### Active pill — selector: `.toggle-btn.active`

```css
.toggle-btn.active {
  background: var(--ink);
  color: var(--bg);
}
```

### "2 months free" badge — selector: `.toggle-savings`

```css
.toggle-savings {
  font-size: 10px;
  background: var(--accent);
  color: #fff;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
```

### Badge when parent is active — selector: `.toggle-btn.active .toggle-savings`

```css
.toggle-btn.active .toggle-savings { background: var(--accent-soft); color: #1a2332; }
```

---

## 3. Pack card

### Selector: `.pack`

```css
.pack {
  background: var(--panel);
  box-shadow: var(--shadow);
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  text-align: center;
  transition: all 0.18s ease;
  position: relative;
}
```

No explicit `border` on the base pack (only the featured top bar above). No explicit `min-height` / `height` on `.pack`.

### Grid that holds the three — selector: `.packs`

```css
.packs {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

### Height equalization

There is no fixed equal-height declaration. Equal height comes from CSS Grid’s default stretch (`align-items: stretch` implied) on the three columns in one row, plus the column flex layout and a growing feature list:

```css
.pack {
  display: flex;
  flex-direction: column;
}
.pack-features {
  list-style: none;
  margin-bottom: 24px;
  flex-grow: 1;
  text-align: left;
}
```

At `max-width: 880px`, packs collapse to one column (`grid-template-columns: 1fr`), so row-stretch equalization no longer applies across the three.

---

## 4. Check-mark feature list (hairline dividers)

The list with hairline dividers between items is the subscription tier list (`.tier-features`). Pack lists (`.pack-features`) use the same check mark but do **not** draw hairlines.

### List container — selector: `.tier-features`

```css
.tier-features {
  list-style: none;
  margin-bottom: 32px;
  flex-grow: 1;
}
```

No `gap` property. Vertical rhythm is from per-item padding.

### Per item — selector: `.tier-features li`

```css
.tier-features li {
  padding: 10px 0;
  padding-left: 24px;
  position: relative;
  font-size: 14.5px;
  line-height: 1.5;
  border-bottom: 1px solid var(--rule);
  color: var(--ink-mid);
}
```

### Last item (drop hairline) — selector: `.tier-features li:last-child`

```css
.tier-features li:last-child { border-bottom: none; }
```

### Check mark — selector: `.tier-features li::before`

```css
.tier-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent);
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### Pack list check mark (no hairline) — for comparison

```css
.pack-features li {
  padding: 8px 0;
  padding-left: 22px;
  position: relative;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-mid);
}
.pack-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent);
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 5. Italic sub-line under each card heading

### Pack cards — selector: `.pack-tagline`

```css
.pack-tagline {
  font-size: 14px;
  font-style: italic;
  color: var(--ink-soft);
  margin-bottom: 16px;
}
```

`font-family` is not set; inherits body serif: `'Iowan Old Style', 'Charter', Georgia, 'Times New Roman', serif`.

### Subscription tier cards — selector: `.tier-tagline`

```css
.tier-tagline {
  font-size: 14.5px;
  color: var(--ink-soft);
  font-style: italic;
  margin-bottom: 26px;
  line-height: 1.5;
  min-height: 44px;
}
```

Same inherited serif family.

---

## 6. Section heading lockup

### Wrapper — selector: `.section-header`

```css
.section-header {
  max-width: 1100px;
  margin: 0 auto 28px;
  padding: 0 24px;
  text-align: center;
}
```

### Display heading — selector: `.section-header h2`

```css
.section-header h2 {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin-bottom: 10px;
}
```

`font-family` is not set; inherits body serif.

### Italic lede — selector: `.section-header p`

```css
.section-header p {
  font-size: 16px;
  color: var(--ink-soft);
  font-style: italic;
  max-width: 560px;
  margin: 0 auto;
}
```

### Responsive override — display size only

```css
@media (max-width: 720px) {
  .section-header h2 { font-size: 24px; }
}
```
