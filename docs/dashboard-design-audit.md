# Authenticated conversion-path design audit

**Note:** The heat-map register hexes and score-bar colors on the evaluation report are intentional design, not token debt. They should not be mapped back to the brand palette in any future cleanup pass.

Read-only inventory of the seven free-evaluation conversion surfaces. No code was changed.

**Out of scope (noted, ignored):** account settings, admin routes, mentor surfaces (`/dashboard/mentoring`, invite/accept), Sketch surfaces (`/dashboard/sketch`, `SketchHistorySection` on dashboard home, public sketch), growth report (`/dashboard/growth`).

**Shared chrome on all `/dashboard/*` routes:** `src/app/dashboard/layout.tsx` → `LastActiveTracker` (no UI) → `DashboardShell` → `AppHeader` + page. Styles: `dashboard.css` (serif on `h1`/`h2`/`.sc-heading`).

**Canonical palette (brief):** `--bg #faf8f3`, `--ink #1a2332`, `--ink-soft #4a5568`, `--rule #d4cfc1`, `--panel #ffffff`, `--accent #a67c2e`, `--accent-soft #c9a55c`, `--accent-pale #faf6ed`.

**Canonical fonts (brief):** headings `'Iowan Old Style', 'Charter', Georgia, serif`; UI `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Repo implements these as `--font-serif` / `--font-ui` in `globals.css` (serif also falls back to `"Times New Roman"`).

---

## Summary — non-brand color usages per surface

Counts = hardcoded hex outside the canonical eight + applications of CSS variables that resolve to non-canonical hex (`--sc-ink-mid`, `--sc-error*`, `--sc-success*`, `--sc-green*`, `--sc-amber`, `--sc-red`, and related). Does **not** count intentional brand accents (ink/accent borders on CTAs) or Tailwind default palette classes (none found anywhere in scope).

| # | Surface | Non-brand color usages | Tailwind default palette | Hardcoded non-canonical hex |
|---|---------|------------------------|--------------------------|-----------------------------|
| 1 | `/start` signup + post-verify | **8** | 0 | 0 |
| 2 | Dashboard home (empty) | **0** | 0 | 0 |
| 3 | Sermon submission | **3** | 0 | 0 |
| 4 | Post-submit waiting / processing | **1** | 0 | 0 |
| 5 | Evaluation report | **~45** | 0 | **18** (15 beat register + 3× `#2a3548`) |
| 6 | Dashboard home (with sermons) | **0** | 0 | 0 |
| 7 | Credits / subscribe CTA slab | **2** | 0 | 0 |

Cross-cutting: **zero** `gray-*` / `slate-*` / `zinc-*` / `neutral-*` / `blue-*` / other default Tailwind color scales in scope. **Geist** is loaded in root layout and never applied. **Inter** is absent. **`SubscribeToEvaluate`** is dead code (defined, never imported). **`DashboardSubscribeCTA`** mounts only on `/dashboard/buy`.

---

## 1. `/start` — signup and post-verification confirmation

### Route and component map

| Item | Detail |
|------|--------|
| **Route** | `/start` |
| **Owner** | `src/app/start/page.tsx` |

**Branches:**

| Condition | Renders |
|-----------|---------|
| Unauthenticated | `StartLanding` |
| Authenticated + sketch claim ok (`?saved=1` + cookie) | `StartClaimed` (sketch path — adjacent, not free-eval default) |
| Authenticated + eligible for acquisition prompt | `StartRedirect` ← **post-verification confirmation for free-eval users** |
| Authenticated + already attributed / redirects | `redirect(...)` — no UI |

**`StartLanding` tree** (`src/components/start/StartLanding.tsx`):

```
div (page shell)
├── header → brand Link
└── main → panel
    ├── eyebrow / h1 / italic sub
    ├── value ul
    ├── AuthMessage? (error | success)
    ├── awaitingConfirmation?
    │   ├── help copy + AuthLink (mailto)
    │   └── AuthLink → login
    └── else AuthForm
        ├── AuthField ×3 (email, password, confirm)
        ├── newsletter checkbox
        └── AuthSubmit
    └── footer AuthLink → sign in (when form visible)
```

Shared: `AuthForm` / `AuthField` / `AuthSubmit` / `AuthLink` (`src/components/auth/AuthForm.tsx`), `AuthMessage` (`AuthMessage.tsx`). **`AuthShell` is not used on `/start`.**

**`StartRedirect` tree** (`StartRedirect.tsx`): brand header → panel → h1/sub → acquisition radio buttons → optional “other” input → CTA “Start my first evaluation”.

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Validation / signup error | Dedicated `AuthMessage` error |
| Awaiting email confirmation | Dedicated success banner + help copy; form hidden |
| Submit loading | Button label “Creating account…” |
| Session immediate signup | `router.push` — no confirmation UI |
| Acquisition write failure (`StartRedirect`) | **Bare fallthrough** — still navigates; no error UI |
| Sketch claim confirmation | Dedicated `StartClaimed` |

### Token audit

**Hardcoded non-canonical hex:** none.

**Non-canonical CSS vars used:**

| Var | Resolves to | Where |
|-----|-------------|-------|
| `--sc-ink-mid` | `#2a3447` | `StartLanding` value list, newsletter label; `AuthForm` `AuthLabel` |
| `--sc-error` / `--sc-error-bg` | `#9b2c2c` / `#fdf2f2` | `AuthMessage` error |
| `--sc-success` / `--sc-success-bg` | `#276749` / `#f0fff4` | `AuthMessage` success |

**Non-rule borders:**

- `AuthMessage`: `rgba(155,44,44,0.25)` / `rgba(39,103,73,0.25)`
- Selected acquisition radio: `var(--sc-accent)`
- Primary CTAs / `AuthSubmit`: `var(--sc-ink)`
- Focus rings: `focus:border-[var(--sc-accent)]`

**Tailwind default palette:** none.

### Type audit

All `fontFamily: var(--font-ui)` or `var(--font-serif)`. No Inter. No `font-sans` / `font-mono`.

### Shape audit

- Radius: only Tailwind `rounded` (= 4px) — matches marketing.
- Shadow: `var(--sc-shadow-lift)` on panels; selected radio also lift.

---

## 2. Dashboard home — zero sermons (empty state)

### Route and component map

| Item | Detail |
|------|--------|
| **Route** | `/dashboard` |
| **Owner** | `src/app/dashboard/page.tsx` |

```
main (panel)
├── status row (if subscriptionStatus || packCredits)
│   ├── SubscriptionStatusCard?
│   ├── PackCreditsCard?
│   └── Link → /dashboard/buy
│   OR plain “Subscribe or buy a pack →” link
├── SermonList
│   ├── header (eyebrow “Dashboard” + h1 “Your sermons”)
│   └── empty: italic copy + “Submit your first sermon” CTA
└── SketchHistorySection  ← out of scope
```

Components: `SermonList` (`SermonList.tsx`), `SubscriptionStatusCard`, `PackCreditsCard`, plus shell `DashboardShell` / `AppHeader`.

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Empty sermons | Dedicated empty state in `SermonList` |
| Loading | **None** — server component; no skeleton |
| Fetch / data error | **Bare fallthrough** — no dedicated error UI |

### Token audit

**Hardcoded non-canonical hex:** none.  
**Non-canonical CSS vars:** none on this path (status cards use canonical vars; PackCredits left accent is `--sc-accent`).  
**Non-rule borders:** growth-link hover `var(--sc-accent)` (not shown when empty + &lt;2 evals); AppHeader primary `var(--sc-ink)`; PackCreditsCard `borderLeft: 3px solid var(--sc-accent)`; empty CTA `var(--sc-ink)`.  
**Tailwind default palette:** none.

### Type audit

`var(--font-ui)` / `var(--font-serif)`. **`SubscriptionStatusCard` hardcodes the system UI stack inline** (same glyphs as `--font-ui`, bypasses the CSS variable). PackCredits count line inherits body serif (no explicit UI font on the number).

### Shape audit

- Radius: `rounded` (4px); `SubscriptionStatusCard` uses `borderRadius: "4px"` (equivalent).
- Shadow: main panel `var(--sc-shadow-lift)`.

---

## 3. Sermon submission screen

### Route and component map

| Item | Detail |
|------|--------|
| **Route** | `/dashboard/sermons/new` |
| **Owner** | `src/app/dashboard/sermons/new/page.tsx` |

```
main (panel)
├── back Link → /dashboard
└── NewSermonWorkspace
    ├── eyebrow / h1 / italic sub
    ├── EvaluationAccessGate? (null when canEvaluate)
    └── SermonForm? (hidden if blocked && !mentored mentee)
        ├── AuthMessage? (error)
        ├── input method tabs (paste | YouTube)
        ├── manuscript / YouTube fields
        ├── title, primary passage
        ├── optional context <details>
        ├── ModeSelector (diagnostic | debrief)
        ├── EvaluationPollingStatus? (during poll — see §4)
        ├── AuthSubmit + save-without-running
        └── EvaluationCreditLine?
```

Files: `NewSermonWorkspace.tsx`, `SermonForm.tsx`, `ModeSelector.tsx`, `EvaluationAccessGate.tsx`, `EvaluationCreditLine.tsx`, auth form pieces.

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Form validation / create error | `AuthMessage` error |
| Saving / YouTube fetch | Disabled controls + label changes |
| No credits (`EvaluationAccessGate`) | CapacityAlert + Buy link for known blocked reasons |
| Unknown `blockedReason` | **Bare fallthrough** — gate returns `null` |
| Mentored mentee without credits | Form still shown; gate suppressed |

### Token audit

**Hardcoded non-canonical hex:** none.  
**Non-canonical vars:** `--sc-ink-mid` via `AuthLabel`; `--sc-error*` via `AuthMessage` when errors show.  
**Non-rule borders:** selected tab/mode `var(--sc-accent)`; primary buttons `var(--sc-ink)`; focus `var(--sc-accent)`; context summary hover `var(--sc-ink)`.  
**Tailwind default palette:** none.

### Type audit

Only `--font-ui` / `--font-serif`.

### Shape audit

Only `rounded` (4px). Selected tabs/modes: `var(--sc-shadow-lift)`.

---

## 4. Post-submit waiting / processing state

### Route and component map

Two presentations on the conversion path:

**A. Inline on submission form** (primary UX after “Save and run evaluation”)

| Item | Detail |
|------|--------|
| **Mount** | `SermonForm` while `useEvaluationPolling` is active |
| **Component** | `EvaluationPollingStatus` (`EvaluationPollingStatus.tsx`) |

Shows “Evaluating your sermon…”, 2–4 minute guidance, elapsed timer. On complete, client navigates to the evaluation page.

**B. Evaluation page incomplete** (refresh / deep link while still running)

| Item | Detail |
|------|--------|
| **Route** | `/dashboard/sermons/[id]/evaluations/[evaluationId]` |
| **Owner** | `…/evaluations/[evaluationId]/page.tsx` (status ≠ complete branch) |

```
main
├── error_message? (failed + message present)
├── status paragraph (“Evaluation in progress…” or bare status string)
└── back Link
```

**Not on conversion path:** `EvaluateButton` + polling on sermon detail (`SermonDetailEvaluationActions`) — re-eval surface, ignored except to note it reuses `EvaluationPollingStatus`.

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Polling on form | Dedicated `EvaluationPollingStatus` |
| Incomplete page, running/pending | Static copy only — **no live poll / no elapsed timer** |
| Failed + `error_message` | Error text in `--sc-error` |
| Failed without message / other statuses | Generic “not ready yet (status: …)” — thin treatment |
| Eval missing | `notFound()` |

### Token audit

**Hardcoded non-canonical hex:** none.  
**Non-canonical vars:** `--sc-error` on failed incomplete page. Polling status uses `--sc-accent-pale` + `--sc-rule` (canonical).  
**Non-rule borders:** none on polling card (uses rule).  
**Tailwind default palette:** none.

### Type / shape

`--font-ui` only on polling status. Radius `rounded` (4px). No shadow on polling card.

---

## 5. Evaluation report view

### Route and component map

| Item | Detail |
|------|--------|
| **Route** | `/dashboard/sermons/[id]/evaluations/[evaluationId]` |
| **Owner** | `src/app/dashboard/sermons/[id]/evaluations/[evaluationId]/page.tsx` |
| **CSS** | `evaluation-print.css`, `evaluation-pdf-capture.css` |

**Complete — diagnostic (`report_mode` ≠ debrief):**

```
main.evaluation-page-main
├── EvaluationPdfCapture? (?pdf=1)
├── EvaluationPdfCover? (pdf + preparedFor)
├── back Link (screen)
├── EvaluationPrintHeader (print-only)
├── EvaluationDashboard
│   ├── title / scripture / meta
│   ├── EvaluationPrintButtons?
│   ├── HeadlineLockup
│   ├── CategoryCard × N (CriterionScoreBar)
│   ├── HeatMapSection?
│   ├── HowItPreachesSection?
│   ├── WorkingSection → SectionTitle + cards
│   ├── PrioritiesSection
│   ├── RewritesSection → SectionTitle
│   └── MethodologySection
└── print footer
```

**Complete — debrief:** same chrome → `CoachingReportView` (strengths / how to grow / what it looks like) + optional `EvaluationPrintButtons`. Missing narrative → thin “narrative not available” fallthrough.

Helpers: `shared.ts` (fonts, beat colors, score colors).

### Empty / loading / error

Covered in §4 for incomplete. Complete path assumes result/narrative present; otherwise debrief empty copy or `notFound()`.

### Token audit — hardcoded non-canonical hex

| File | Line(s) | Value |
|------|---------|-------|
| `HeadlineLockup.tsx` | 23 | `#2a3548` (gradient mid; ends also use canonical `#1a2332` / `#faf8f3`) |
| `CategoryCard.tsx` | 72 | `#2a3548` |
| `PrioritiesSection.tsx` | 13 | `#2a3548` |
| `shared.ts` | 6–19, 23 | Beat register palette: `#d4a857`, `#6b7a8f`, `#4a6584`, `#5a4a6b`, `#7a8f6b`, `#6b4a7a`, `#8aa37a`, `#a04848`, `#c9892e`, `#a8a59a`, `#4a7c59`, `#c98a4a`, `#6b4a4a`, `#8a8a82`, fallback `#6b7a8f` |

Canonical hex also appears as literals (`#faf8f3`, `#1a2332`, `#fff` in print CSS) — not counted as violations.

### Token audit — non-canonical CSS vars in report

| Var | Resolves | Used in |
|-----|----------|---------|
| `--sc-ink-mid` | `#2a3447` | `CategoryCard`, `MethodologySection` |
| `--sc-green` / `--sc-green-soft` | `#4a7c59` / `#7ba886` | Working, Rewrites, Coaching, HeatMap scores, print |
| `--sc-amber` | `#c9892e` | HowItPreaches, Rewrites, Coaching, HeatMap, `criterionScoreColor` |
| `--sc-red` | `#a04848` | Rewrites, Coaching, `criterionScoreColor` |
| `--sc-error` | `#9b2c2c` | Incomplete branch only |

### Borders other than `#d4cfc1` / `var(--sc-rule)`

Accent / ink / semantic colored borders are widespread (intentional section accents):

| Location | Color |
|----------|-------|
| `HeadlineLockup` verdict panel | `var(--sc-accent)` 3px left |
| `CategoryCard` score knob | green/amber/red; quote `accent` |
| `WorkingSection` | `--sc-green` top; `--sc-green-soft` left |
| `CoachingReportView` | accent / amber / red / green |
| `RewritesSection` | red / green left |
| `PrioritiesSection` | `rgba(250,248,243,0.15)` divide; `--sc-accent-soft` steps |
| `HowItPreachesSection` | accent top 3px |
| `MethodologySection` | ink top 3px; accent left callout |
| `EvaluationPrintButtons` | ink |
| print / pdf-capture CSS | accent / green / ink accents |

Many meta/table borders correctly use `var(--sc-rule)`.

**Tailwind default palette:** none.

### Type audit

Almost all via `shared.ts` → `--font-serif` / `--font-ui`.  
**Flag:** `MethodologySection.tsx` uses Tailwind `font-mono` — browser default monospace, **not** either canonical stack (and not Geist Mono).  
**Inter:** none. **Geist:** see cross-cutting below.

### Shape audit

| Radius | Where |
|--------|-------|
| `rounded` (4px) | Page main, methodology score box, heat-map bar container, print buttons, etc. |
| `rounded-full` | Score-bar knob (`CategoryCard`) — **divergence** |
| SVG `rx={5}` | Criterion score track pill (capsule) — **divergence** |

| Shadow | Where |
|--------|-------|
| `var(--sc-shadow)` | HeadlineLockup, CategoryCard, HeatMap, Working, Rewrites, Methodology, HowItPreaches, Coaching cards |
| `var(--sc-shadow-lift)` | Page main (non-PDF) |
| `box-shadow: none` | Print + PDF capture overrides |

Marketing reference is a single soft shadow; report surfaces use **both** soft and lift tokens heavily.

---

## 6. Dashboard home — one or more sermons

### Route and component map

Same route/owner as §2 (`/dashboard` → `page.tsx`). Difference is `SermonList` populated branch:

```
SermonList
├── header
├── DashboardToolbar (growth link? + search input)
└── month groups → SermonCard × N
    OR “No sermons match that search.”
```

`SermonCard`: title (serif) + “Saved {date}” → `/dashboard/sermons/{id}`.

### Empty / loading / error

| State | Treatment |
|-------|-----------|
| Search no matches | Dedicated soft message |
| Loading / error | Same gap as §2 — **no dedicated treatment** |

### Token / type / shape

Same as §2. Sermon cards: `borderColor: var(--sc-rule)`; `shadow-[var(--sc-shadow)]` with hover `var(--sc-shadow-lift)`. Search focus border accent. Non-brand color count remains **0**.

---

## 7. Credits / subscribe CTA slab

### Route and component map

| Item | Detail |
|------|--------|
| **Primary mount** | `/dashboard/buy` — `src/app/dashboard/buy/page.tsx` |
| **CTA component** | `DashboardSubscribeCTA` (`DashboardSubscribeCTA.tsx`) — **only mounts here** |
| **Adjacent** | `BuyPackCards` (pack grid on same page); `PackCreditsCard` / `SubscriptionStatusCard` (status row on buy + home) |

```
/dashboard/buy main
├── header (“Add credits”)
├── SubscriptionStatusCard? + PackCreditsCard?
├── DashboardSubscribeCTA? (only if !hasActiveSubscription)
├── depleted subscriber copy?
└── BuyPackCards (3 pack cards)
```

**`DashboardSubscribeCTA`:** “Coach” heading, $29/mo, feature list, Subscribe monthly/annually. With `surface="buy"`, pack sub-buttons are **hidden** (those only render when `surface="dashboard"`, which is never passed today).

**Dead:** `SubscribeToEvaluate` — accent-pale slab + “View pricing” → `/pricing.html`; never imported.

**Home does not render the CTA slab** — only text links to `/dashboard/buy`.

### Empty / loading / error

No loading UI. If subscribed, CTA omitted (packs remain). No error state.

### Token audit

**Hardcoded non-canonical hex:** none.  
**Non-canonical vars:** `--sc-ink-mid` on feature list items (`DashboardSubscribeCTA`, `BuyPackCards`).  
**Non-rule borders:** primary CTAs `var(--sc-ink)`; hover `var(--sc-ink)`; featured pack `borderTopColor: var(--sc-accent-soft)`; PackCredits left accent.  
**Tailwind default palette:** none.

### Type audit

`--font-ui` / `--font-serif` / `.sc-heading` → serif via `dashboard.css`.

### Shape audit

- Radius: only `rounded` (4px).
- **Shadow divergence — hardcoded duplicates of tokens instead of vars:**

| Location | Value | Matches token? |
|----------|-------|----------------|
| `DashboardSubscribeCTA` L66 | `0 1px 3px rgba(26,35,50,.06), 0 1px 2px rgba(26,35,50,.04)` | Yes → `--sc-shadow`, but **inline** |
| `BuyPackCards` featured | `0 12px 32px rgba(26,35,50,.10), 0 4px 12px rgba(26,35,50,.06)` | Yes → `--sc-shadow-lift`, but **inline** |
| `BuyPackCards` default | soft rgba (same as `--sc-shadow`) | Inline |

---

## Cross-cutting findings

### Tailwind default palette

**Zero** matches for `gray-*`, `slate-*`, `zinc-*`, `neutral-*`, `stone-*`, `blue-*`, `red-*`, `green-*`, `yellow-*`, `amber-*`, `orange-*`, `purple-*`, `indigo-*`, `pink-*`, `rose-*`, `teal-*`, `cyan-*`, `sky-*`, `violet-*`, `fuchsia-*`, `lime-*`, `emerald-*` anywhere under the conversion-path files.

### Fonts — Geist and Inter

| Check | Result |
|-------|--------|
| Inter | **Not referenced** anywhere in scope (or meaningfully in the app UI) |
| Geist | `src/app/layout.tsx` loads `Geist` / `Geist_Mono` and sets `--font-geist-sans` / `--font-geist-mono` on `<html>` |
| Geist applied? | **No** — zero `var(--font-geist-*)` or `font-geist` usages outside that declaration. UI uses `--font-ui` (system); body/display use `--font-serif` (Iowan stack) |
| Off-stack utility | `MethodologySection` `font-mono` (browser mono) |
| Off-var duplicate | `SubscriptionStatusCard` hardcodes system UI stack |

`--font-serif` in `globals.css` is `"Iowan Old Style", "Charter", Georgia, "Times New Roman", serif` — brief listed without Times; minor extra fallback only.

### Shape — distinct values in scope

**Border-radius**

| Value | Notes |
|-------|-------|
| `0.25rem` / `4px` (`rounded` or `borderRadius: "4px"`) | Dominant — aligned with marketing |
| `9999px` (`rounded-full`) | Score knob only |
| SVG capsule `rx={5}` | Score bar track |

No `rounded-sm` / `md` / `lg` / `xl` in scope.

**Box-shadow**

| Value | Notes |
|-------|-------|
| `var(--sc-shadow)` | Soft dual-layer — marketing soft token |
| `var(--sc-shadow-lift)` | Deeper lift — used on panels, hover cards |
| Inline rgba copies of both | Buy CTA / pack cards |
| `none` | Unselected controls; print/PDF |

Divergence from “single soft shadow”: lift token + inline duplicates + report cards on soft while page shells use lift.

### Extended palette in `globals.css` (context)

Beyond the brief’s eight, the design system also defines `--sc-ink-mid`, error/success pairs, green/amber/red score colors, gold/olive/rust, and cream-tint (= accent-pale). Conversion path leans on ink-mid + semantic score/error colors heavily on the report; start/auth use error/success; buy CTA uses ink-mid for body list text.

### Bare-state flags (quick list)

1. `StartRedirect` — acquisition RPC failure ignored  
2. Dashboard home — no loading/error UI  
3. `EvaluationAccessGate` — unknown `blockedReason` → null  
4. Incomplete evaluation page — no polling UI after refresh  
5. Debrief report — missing narrative → thin fallthrough copy  

---

## File index (in scope)

| Surface | Primary files |
|---------|---------------|
| 1 Start | `app/start/page.tsx`, `StartLanding.tsx`, `StartRedirect.tsx`, `StartClaimed.tsx`, `AuthForm.tsx`, `AuthMessage.tsx` |
| 2–3, 6 Dashboard / submit | `dashboard/page.tsx`, `layout.tsx`, `dashboard.css`, `DashboardShell.tsx`, `AppHeader.tsx`, `SermonList.tsx`, `SubscriptionStatusCard.tsx`, `PackCreditsCard.tsx`, `sermons/new/page.tsx`, `NewSermonWorkspace.tsx`, `SermonForm.tsx`, `ModeSelector.tsx`, `EvaluationAccessGate.tsx`, `EvaluationCreditLine.tsx` |
| 4 Waiting | `EvaluationPollingStatus.tsx`, incomplete branch of evaluation page |
| 5 Report | evaluation page + `EvaluationDashboard`, `CoachingReportView`, `HeadlineLockup`, `CategoryCard`, `HeatMapSection`, `HowItPreachesSection`, `WorkingSection`, `PrioritiesSection`, `RewritesSection`, `MethodologySection`, `SectionTitle`, `EvaluationPrintHeader`, `EvaluationPrintButtons`, `EvaluationPdfCover`, `EvaluationPdfCapture`, `shared.ts`, `evaluation-print.css`, `evaluation-pdf-capture.css` |
| 7 CTA | `DashboardSubscribeCTA.tsx`, `buy/page.tsx`, `BuyPackCards.tsx` (+ dead `SubscribeToEvaluate.tsx`) |
