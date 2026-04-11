# DESIGN-PEEC.md

> Deep design analysis of **peec.ai** — captured as reference for a Greenlight redesign.
> This is **not** a spec for Greenlight. It is the raw language of peec.ai, plus a translation layer that maps each pattern into Greenlight's dark cinematic register so we can redesign without touching functionality.
>
> Source material: `/tmp/peec-analysis/` (full-page + hero + 5 section screenshots, mobile, tokens.json, colors.json, fonts.json, radii.json, html-sample.html). Captured 2026-04-11.

---

## 0. TL;DR — What peec.ai Actually Is

A **Framer-built marketing site** for a B2B analytics SaaS. On the surface it reads "clean SaaS landing page," but the details are more interesting than that:

- **Warm off-white canvas** (`#F7F7F7`) — not pure white. Feels like paper, not screen.
- **Near-black foreground** (`#171717`) — not pure black. Softer contrast.
- **Geist Variable for display** at surprisingly **light weight (400)** and **tight tracking (-0.02em)** — the opposite of the usual SaaS "heavy-bold-hero." It reads like a Swiss editorial cover.
- **Inter for body** at 14px with `-0.2px` letter spacing and 80% opacity foreground — subtle, but intentional. Prose whispers.
- **Pills everywhere.** Section labels, meta chips, inline prose nouns, CTAs, badges. Pills are the atomic unit.
- **Layered, paper-soft shadows** — not a single `0 4px 12px` but 3–5 stacked tiny-radius shadows to fake paper sitting on paper. One cascade shadow for the hero mockup that falls 300px+.
- **Product mockups float up from the bottom**, fade into a grid background, never fully terminate.
- **Dark floating callouts** (pure black pills with white text) act as "active state highlights" scattered through screenshots.
- **Tilted, stacked card compositions** — suggested-prompt cards rotate and overlap instead of sitting in a neat grid.
- **Grayscale logo walls** with **section-label pills** above each row ("Brands" / "Agencies") instead of a single "Trusted by" header.

What it communicates: *"We're a serious analytics product, but a thoughtful designer touched every pixel."* That's exactly the tone Greenlight's A24-facing portfolio version should hit.

---

## 1. Canvas & Material

### Background
```
bodyBackground: rgb(247, 247, 247)  /* #F7F7F7 — warm neutral-50 */
```

This is the **single most defining choice**. It is not white. It is a soft dove gray that reads as "paper" under cinema lighting. Every card, chip, and floating element sits on this canvas and reads slightly raised.

### Surface hierarchy (inferred from screenshots + color extraction)

| Token         | Hex (approx) | Role                                                                    |
|---------------|--------------|-------------------------------------------------------------------------|
| canvas        | `#F7F7F7`    | Body background. Everything sits on this.                               |
| surface       | `#FFFFFF`    | Cards, pills, input chrome. Pure white for lift.                        |
| surface-warm  | `#E8E4E2`    | Cream tinted cards (used for highlighted / brand-accent cards).         |
| surface-muted | `#F5F5F5`    | Subtle alternate bands and table rows.                                  |
| overlay       | `rgba(0,0,0,0.05)` | Hairline separators, borders, dotted grids.                       |
| ink           | `#171717`    | Primary foreground. NEVER `#000`.                                        |
| ink-80        | `rgba(23,23,23,0.8)` | Body copy — peec literally uses 80% opacity of ink for body text. |
| ink-50        | `rgba(23,23,23,0.5)` | Secondary text, icon fills, meta labels.                          |
| dark-card     | `#1D1E20`    | Inverted dark cards (floating tooltips, "Join r/CRM" callouts).         |
| dark-card-dp  | `#0C0A09`    | Deepest black card (stone-950 warm).                                     |

### Accent signals (extracted from colors.json)

| Token          | Hex        | Role                                             |
|----------------|------------|--------------------------------------------------|
| accent-red     | `#DA314A`  | "We are hiring" dot. Brand warning signal.       |
| accent-crimson | `#D80027`  | Down-arrow deltas in tables (`↘ 0.2`).            |
| signal-green   | `#22C55E`  | Up-arrow deltas (`↗ 0.3`). Emerald 500.           |
| signal-blue    | `#479FDB`  | Chart line, Salesforce brand accent.              |
| signal-orange  | `#FF7A59`  | HubSpot brand accent in competitor tables.        |
| signal-yellow  | `#F8D749`  | Pipedrive brand accent.                           |
| signal-royal   | `#266DF0`  | Deep royal blue for secondary signals.            |

**Rule:** these are **sparingly used**. Peec is ≥95% neutral. Color appears only in data cells, brand logos, and deltas. Never on prose. Never on buttons (except the black primary CTA).

---

## 2. Typography

### The unexpected choices

```
H1: Geist Variable, 64px / 64px line-height, weight 400, letter-spacing -1.28px
H2: Geist,         40px / 42px, weight 500, letter-spacing -0.8px
H3: Geist,         18px / 21.6px, weight 600
Body (p): Inter,   14px / 16.8px, weight 400, letter-spacing -0.2px, color rgba(23,23,23,0.8)
Button: Geist,     16px / 16px, weight 500
```

### What's notable

1. **H1 is weight 400 (regular).** This is the editorial move. Most SaaS uses 600–800 for display; peec chooses the same weight as body. It feels confident instead of shouty.
2. **H1 line-height = font-size (64px/64px).** No extra breathing room. Headlines are tight, stacked blocks.
3. **Tight negative tracking (-1.28px at 64px = -0.02em).** Pulls letterforms together into compressed headlines.
4. **Body is 14px.** Small. The whole site is tighter than average SaaS. It signals "dense / serious."
5. **80% opacity body color**, not a separate gray token. Gives body copy a subtle fog that reads well on warm canvas.
6. **Letter-spacing on body copy (-0.2px).** Every size is tightened, even body. Uniform typographic personality.
7. **H2 weight 500 (medium) not 600+.** Same move as H1 — editorial restraint.

### Typographic system, abstracted

| Role             | Size | Line-height | Weight | Tracking  | Family           |
|------------------|------|-------------|--------|-----------|------------------|
| Display          | 64px | 1.00        | 400    | -0.02em   | Geist Variable   |
| Section title    | 40px | 1.05        | 500    | -0.02em   | Geist            |
| Card title       | 18px | 1.20        | 600    | 0         | Geist            |
| Eyebrow / meta   | 12px | 1.20        | 500    | 0         | Geist/Inter      |
| Body             | 14px | 1.20        | 400    | -0.2px    | Inter            |
| Button           | 16px | 1.00        | 500    | 0         | Geist            |
| Mono (tabular)   | 12px | 1.00        | 500    | 0         | (none — peec uses Geist tabular-nums, not a mono font) |

### Translation to Greenlight

Greenlight uses **Space Grotesk + Space Mono**. Both already have the correct personality (Swiss-editorial, mechanical precision). The **insight to port is not the font — it's the weight and tracking discipline**:

- Pull hero/display weights **down**, not up. Replace any `font-bold` at 32px+ with `font-light` or `font-normal`.
- Tighten letter-spacing by ~0.02em at every size above 16px.
- Set body text to ~80% opacity on the foreground color (not a separate muted token) so there's a single ink hue fading into the canvas.
- Lock line-heights close to 1:1 on display headings.

---

## 3. Spatial Rhythm

Observed from screenshots (approximated from pixel counts):

| Gap role                         | Value       |
|----------------------------------|-------------|
| Inline chip padding              | 6px 10px    |
| Button padding (primary small)   | 10px 16px   |
| Button padding (primary large)   | 14px 22px   |
| Card padding                     | 24px 32px   |
| Section vertical gap (marketing) | 96px–128px  |
| Between sibling cards in grid    | 24px        |
| Between hero subtitle and CTA    | 48px        |
| Between section label pill and h2| 16px        |
| Hairline divider vertical gap    | 32px        |

The whole site feels like it's laid out on a **24px / 48px / 96px cadence**, with card interiors on an **8px sub-grid**. Greenlight already uses similar spacing via Tailwind's `space-y-{3,6,12}` — this just reaffirms it.

---

## 4. Shape Language — Radii

Extracted from `radii.json`: **33 unique border-radius values** on the page. That's a lot, but they cluster into a clear system:

| Bucket   | Values                     | Used for                                    |
|----------|----------------------------|---------------------------------------------|
| Hairline | 1.5px, 1.67px, 2px, 3px    | Inner strokes, decorative micro-details     |
| Button   | 6px, 7px, 8px              | CTAs, input chrome, small pills             |
| Card     | 10px, 11px, 12px, 14px     | Cards, feature tiles, table containers     |
| Feature  | 15px, 16px                 | Hero mockups, big illustrations             |
| Deep     | 22px, 23px, 24px, 30px     | Very large surfaces (rare)                  |
| Full pill | 100px, 125px, 1000px, 100% | "We are hiring" chips, avatar circles, all pill buttons |

### The rule
- **Buttons / small pills → 6–7px.** Slightly rounded, never pill.
- **Cards → 10–14px.** A consistent "paper card" radius.
- **Meta pills / section labels → full pill.**
- **Avatars + status dots → 100%.**

### Translation to Greenlight
Greenlight already uses `rounded-[10px]` on cards (good — matches peec). Tighten buttons to `rounded-[6px]` instead of the default `rounded-md`. Keep meta chips and section labels as `rounded-full`. Do not mix `rounded-xl` / `rounded-2xl` in the same context.

---

## 5. Shadow System — This Is the Craft

Peec's shadow language is **unusually careful**. From `colors.json` shadows:

### The "paper card" shadow (cards, tooltips)
```css
box-shadow:
  rgba(0, 0, 0, 0.05) 0px 0px 3.33px 0px,
  rgba(0, 0, 0, 0.05) 0px 0px 1.67px 0px,
  rgba(0, 0, 0, 0.05) 0px 0px 1.67px 0px,
  rgba(0, 0, 0, 0.2)  0px 0px 0.42px 0px;
```
**Three soft outer glows at tiny radii + one sharp 0.4px hairline.** This is what makes peec's cards look like they're sitting *on* paper instead of floating *above* a screen. Each shadow is almost invisible alone — stacked, they read as a material edge.

### The "hairline pill" shadow (small chips)
```css
box-shadow:
  rgba(12, 10, 9, 0.08) 0px 2px 6px 0px,
  rgba(23, 23, 23, 0.08) 0px 0px 0px 1px;
```
**A 1px inset ring + a tiny 6px drop.** The ring is what gives pills their crisp edge on the warm canvas without an explicit `border`.

### The "product screenshot cascade" (hero mockup)
```css
box-shadow:
  rgba(0, 0, 0, 0.10) 0px  12.65px  28.75px,
  rgba(0, 0, 0, 0.09) 0px  51.76px  51.76px,
  rgba(0, 0, 0, 0.05) 0px 116.16px  70.16px,
  rgba(0, 0, 0, 0.01) 0px 207.02px  82.81px,
  rgba(0, 0, 0, 0.00) 0px 323.18px  90.86px;
```
**Five shadows at increasing distances, ending in `opacity: 0` at 323px.** This creates a physical sense that the product screenshot is "falling into the page," not floating. The final shadow exists only to *smooth the gradient* of the drop — it contributes nothing visible, only softness.

### The card-inset ring
```css
box-shadow:
  rgba(23, 23, 23, 0.04) 0px 4px 4px 0px,
  rgba(0,  0,  0,  0.05) 0px 0px 0px 1px inset;
```
Used on feature cards. An inset ring simulates a border without adding one — preserves inner padding math.

### Translation to Greenlight (dark mode)

Shadows don't translate cleanly from light mode to dark mode — in dark mode the effect of "lift" is usually **lighter rim light** (a subtle outline glow), not a drop shadow. The *principle* to port is:

1. **Never a single shadow.** Always stack 2–4.
2. **Use inset rings instead of borders** where possible, so you can hover-brighten the ring without reflowing padding.
3. **Cascade the hero mockup.** If Greenlight has a hero screenplay/storyboard preview, give it a long, falling shadow instead of a tight one.

Example dark-mode port of the paper-card shadow:
```css
box-shadow:
  inset 0 0 0 1px rgba(255, 255, 255, 0.06),
  0 1px 0 0 rgba(255, 255, 255, 0.02),
  0 8px 24px -8px rgba(0, 0, 0, 0.6);
```

---

## 6. Pattern Library — The Good Stuff

### Pattern 1: The section-label pill
Every major section is preceded by a small **floating pill** with an icon + short label, not a heading.

```
[🔑 Key features]
Turn AI search insights into
new customers with Peec AI
```

The pill sits directly above the h2, center-aligned, ~24px gap to the headline. It categorizes the section without stealing hierarchy from the real title.

**Greenlight port:** replace the current numbered `01/02/03` eyebrows (or combine them) with labeled pills like `[◉ Overview]`, `[◉ Scenes]`, `[◉ Mood]`. Keep them mono-styled for Greenlight's voice.

### Pattern 2: Inline prose chips
Feature nouns are **baked into the hero subtitle as inline pills**, not separated into a feature list below.

> Track, analyze, and improve brand performance on AI search platforms through key metrics like `[👁 Visibility]`, `[◇◇ Position]`, and `[◡ Sentiment]`.

Each pill has a tiny icon + label, sits on `rgba(255,255,255,1)` with the hairline-pill shadow, and inherits the prose line-height so it flows naturally.

**Greenlight port:** in overview page subtitles, promote the key nouns of the film into inline chips — e.g., "A 34-scene thriller set across `[🌃 12 locations]` over `[⏱ 82 pages]`." This reinforces "data behind prose" without adding a stat row.

### Pattern 3: Dark floating callouts
Pure-dark pills (`#1D1E20` or `#0C0A09`) with white text appear **inside product screenshots** as tooltip highlights:
- "April 2025" chart tooltip
- "Actively Tracking" status
- "You have 5 strategy recommendations"
- "Join r/CRM subreddit discussions"

They act like **highlighter annotations** — a designer's "look here" marker, not a UI element the user interacts with in the real product.

**Greenlight port:** in demo mode, use dark floating pills to annotate storyboard frames — "AI-generated" label, "Scene 14" tag, a mock "Generated in 2m 18s" callout on hover.

### Pattern 4: Tilted / stacked card compositions
The "Suggested Prompts" card in the hero is **rotated ~3° and stacked** with two more cards peeking out behind it. They're not a neat grid — they're a deck of cards mid-shuffle.

**Greenlight port:** storyboard frames in the hero preview should overlap with slight rotation (`rotate(-1.2deg)`, `rotate(2deg)`) instead of a grid. Same for mood-board reference images.

### Pattern 5: Grid-faded backgrounds
Behind the hero product mockup, there's a **subtle dotted grid** (`rgba(0,0,0,0.05)` dots, ~20px spacing) that fades out at the edges with a radial gradient mask.

**Greenlight port:** replace flat page backgrounds behind hero elements with a faint grid or **film perforation** pattern — sprocket-hole shapes repeating at the page edges, barely visible.

### Pattern 6: Top + bottom content fade on embedded mockups
Feature-card screenshots never show a full top or bottom edge. They fade into the card background with a CSS mask:
```css
mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
```
This creates the feeling that the screenshot is a **window into a larger product**, not a crop.

**Greenlight port:** every embedded preview (storyboard, script, mood board) uses a bottom-fade mask so it reads as a peek into the full document.

### Pattern 7: Section-label pills above logo rows
Instead of one "Trusted by 2000+ marketing teams" header, peec splits the logo wall in two columns:
```
       [Brands]                    [Agencies]
BREITLING  attio  SQUARESPACE     seer  previsible  PEAK ACE  Eskimoz
   n8n  ElevenLabs  Omio  TUI      KINESSO  We.Comm  MINDSHARE  firstpage
```
The two pills ("Brands", "Agencies") float above the columns as label affordances. Logos are **all grayscale**.

**Greenlight port:** if we ever add a "Trusted by" or "Tools we use" section, split it: `[Models]` / `[Fonts]` / `[Stacks]` with pill labels, grayscale rendering.

### Pattern 8: Hairline section dividers with no heading
Between content blocks, peec uses very long, very thin horizontal rules (`1px` `rgba(0,0,0,0.05)`) with no heading attached. They just **breathe**.

**Greenlight port:** on long viewers (Scene Breakdown, Production Design), insert hairline rules every 3–4 scene cards without any label. Pure rhythm.

### Pattern 9: Tabular numerals in data cells
Rankings, percentages, and deltas (`65%`, `62%`, `↗ 0.3`) use **tabular-nums** so columns align like a spreadsheet. Peec achieves this with Geist's `font-feature-settings: "tnum"`, not a separate mono font.

**Greenlight port:** `font-variant-numeric: tabular-nums` on every scene number, page count, runtime, and timecode. Greenlight already does this in some places — enforce everywhere.

### Pattern 10: Colored signal tags in tables
Source-type tags (`UGC` pink, `Reference` purple, `Competitor` pink, `You` green, `Editorial` neutral) are tiny, full-pill, color-tinted chips with 15% opacity backgrounds and saturated text. This is **exactly** the pattern Greenlight already uses for INT/EXT/time — validated.

**Greenlight port:** already in place. Extend it to new taxonomies (prop categories, character archetypes, mood descriptors).

---

## 7. Iconography

Peec uses **Lucide** (same library as Greenlight) at **14–16px with stroke-width 2**. Icons sit inside pills with **6px gap** to the label. Icon color always matches the text color of the pill it's in — no colored icons on neutral text.

There is one exception: the **status dot** in "We are hiring" is a filled red circle, not a stroked icon. That's the only color breaking the neutral pill.

**Greenlight port:** Already using Lucide. Rule to enforce: *icons always inherit text color; status dots are the only exception.*

---

## 8. Motion & Interaction (inferred from Framer structure)

Peec is a Framer site — motion is baked in but constrained. Observed/inferred behaviors:

1. **Fade-up entrance on scroll.** Sections animate `opacity 0 → 1` and `translateY(16px) → 0` as they enter the viewport. Duration ~500ms, easing `ease-out`.
2. **Hero mockup floats up from below.** Starts ~40px lower, settles on initial render. No loop — it's a one-shot reveal.
3. **Hover on cards lifts them slightly.** `translateY(-2px)` + shadow intensifies. Framer's "variants" driven.
4. **Dropdown nav caret rotates 180°** on expand (`transform: rotate(180deg)`, 200ms).
5. **Cookie banner slides in from bottom-right** with a bounce ease.
6. **Tilted stacked cards don't animate** in the still screenshots, but the Framer class hierarchy suggests a subtle rotate-on-hover (`rotate(-3deg) → rotate(0deg)` to "straighten" the card when hovered).

**Greenlight port (dark cinema register):**
- **Slower** than peec. 600–800ms fade-ups, not 500ms.
- **Never bounce.** Always `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) or `(0.2, 0.8, 0.2, 1)` (slight overshoot is ok, bounce never).
- **Hero storyboard** floats up like peec's mockup — but also has a **grain filter** that settles on reveal (grain intensity `0.3 → 0.15`).
- **Cards don't lift on hover.** Instead, the **border ring brightens** from `border-white/10` to `border-white/25`. Same information, less bounce.
- **Tilted storyboard stacks straighten on hover** (`rotate(-1.2deg) → rotate(0)`). This is the one place we borrow the animation directly.

---

## 9. Imagery & Mockups

Peec's mockups are **real product screenshots** composited at small scale with **readable but not pixel-perfect** copy. Techniques:

1. **Rendered in the site's canvas color.** The product chrome is also `#F7F7F7`, so it blends edge-to-edge with the page. No jarring "white rectangle on gray page" moment.
2. **Grid background behind the mockup.** The dotted pattern extends past the mockup edges, making it feel rooted in the page.
3. **Fade masks on all four edges** of feature-card screenshots.
4. **Drop shadows are omitted** on some mockups (the ones that sit in cards) because the card's own shadow is the lift cue.
5. **Content is realistic.** No lorem ipsum, no fake "Product Name" placeholders — always plausible copy ("Best AI native CRM 2025", "CRM software that provides advanced workflow automation").

**Greenlight port:**
- Storyboard previews already use **real pencil sketches** ("black marker on white paper"). Keep that.
- Make sure the demo page's hero storyboard carousel bleeds into the canvas color at its edges (mask-image gradient).
- Add a **film grain / perforation border** to hero mockup containers — makes it read as "film strip" instead of "web screenshot."

---

## 10. What Greenlight Should Keep vs. Change

### Keep (already aligned with peec's principles)

- Dark canvas with near-black (not pure black)
- Space Grotesk + Space Mono pairing
- `rounded-[10px]` card radius
- Theme-safe color-signal badges (INT/EXT/NIGHT/DAWN)
- Shared `SectionHead` component with numbered index
- `font-variant-numeric: tabular-nums` on scene/page numbers
- Lucide icons inheriting text color
- Warm dark cards over pure black background

### Change (to capture peec's craft)

1. **Display weights**: drop all `font-bold` / `font-semibold` on sizes ≥32px to `font-light` or `font-normal`. Tighten tracking by `-0.02em`.
2. **Body color**: replace explicit `text-muted-foreground` on body prose with `text-foreground/80`. Single ink hue fading into canvas.
3. **Section eyebrows**: add iconed section-label pills above the numbered index (`[◉ 01 Overview]` instead of `01 Overview`).
4. **Inline prose chips**: promote key nouns in subtitles (location count, page count, scene count) into inline pills.
5. **Shadows**: replace every single-shadow card with a 2–3 layer inset-ring + subtle drop combo.
6. **Hero storyboard**: give it peec's cascade shadow pattern + fade mask + grid background.
7. **Dark floating callouts**: add them as annotations on demo storyboard frames.
8. **Tilted stacks**: storyboard preview and mood board grids stack with subtle rotation, not a flat grid.
9. **Button radii**: tighten to `rounded-[6px]` from the current default `rounded-md`.
10. **Section dividers**: add hairline rules between groups of 3–4 scene cards for breathing room.

### Avoid (things peec *does* that don't translate)

- **Framer's bouncy entrances.** Greenlight is cinematic, not playful.
- **Pure white cards.** We're dark mode. White cards would be a jarring register break.
- **Icons from non-Lucide sets.** Peec mixes some custom SVG icons — we stay in Lucide for consistency.
- **Peec's warm cream card variant (`#E8E4E2`).** It's tied to light mode. In dark mode the equivalent is a **warm off-black** (`#14100F` or similar) for "highlighted" card states.

---

## 11. Component Recipes (code-ready, dark-mode)

### 11.1 Section-label pill
```tsx
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
  <Eye size={11} />
  Overview
</div>
```

### 11.2 Inline prose chip
```tsx
<span className="inline-flex items-center gap-1 px-2 py-[3px] mx-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[12px] font-mono tabular-nums text-foreground/90 align-baseline shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
  <MapPin size={11} />
  12 locations
</span>
```

### 11.3 Paper card with layered shadow
```tsx
<div className="relative rounded-[12px] bg-card/40 p-6
  shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),_0_1px_0_0_rgba(255,255,255,0.02),_0_8px_24px_-8px_rgba(0,0,0,0.6)]
  transition-shadow hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),_0_1px_0_0_rgba(255,255,255,0.04),_0_12px_32px_-8px_rgba(0,0,0,0.7)]">
  {/* content */}
</div>
```

### 11.4 Dark floating callout
```tsx
<div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#0C0A09] text-white text-[12px] font-medium shadow-[0_4px_12px_rgba(0,0,0,0.4),_0_0_0_1px_rgba(255,255,255,0.08)_inset]">
  <CheckCircle2 size={12} className="text-emerald-400" />
  Generated in 2m 18s
</div>
```

### 11.5 Hero mockup cascade shadow (dark-mode rim light port)
```tsx
<div className="relative rounded-[16px] overflow-hidden
  shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),_0_20px_40px_-12px_rgba(0,0,0,0.7),_0_60px_120px_-20px_rgba(0,0,0,0.5),_0_100px_200px_-40px_rgba(0,0,0,0.3)]
  before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.2)_100%)]
  [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]">
  <img src="/storyboard.png" alt="" />
</div>
```

### 11.6 Tilted card stack
```tsx
<div className="relative w-[320px] h-[220px]">
  <div className="absolute inset-0 rounded-[12px] bg-card/30 border border-white/5 rotate-[-2.5deg] translate-x-2 translate-y-2" />
  <div className="absolute inset-0 rounded-[12px] bg-card/40 border border-white/10 rotate-[1.5deg] translate-x-1 translate-y-1" />
  <div className="absolute inset-0 rounded-[12px] bg-card/60 border border-white/15 shadow-xl transition-transform hover:rotate-0">
    {/* content */}
  </div>
</div>
```

### 11.7 Grid pattern background
```tsx
<div className="relative before:absolute before:inset-0 before:pointer-events-none
  before:[background-image:radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)]
  before:[background-size:24px_24px]
  before:[mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]">
  {/* hero content */}
</div>
```

---

## 12. Phased Redesign Plan (no functionality changes)

### Phase 1 — Typography & color (1 session)
- Drop hero/display weights to `font-light`/`font-normal`, tighten tracking
- Replace body `text-muted-foreground` with `text-foreground/80`
- Audit every card for explicit borders; convert to inset-ring shadows
- **Zero functional changes.** Pure CSS class swaps.

### Phase 2 — Shadow & radii pass (1 session)
- Apply the "paper card" layered shadow recipe to every card in every viewer
- Tighten all button radii to 6px
- Add hairline rules between groups of 3–4 scene cards

### Phase 3 — Section-label pills (1 session)
- Extend `SectionHead` to optionally render a label pill above the numbered index
- Apply across all viewers

### Phase 4 — Inline prose chips (1 session)
- Promote key nouns in Overview subtitles and viewer descriptions into inline pills
- Build a shared `<InlineChip icon={...}>{...}</InlineChip>` helper

### Phase 5 — Hero storyboard craft (1 session)
- Add the cascade shadow + bottom fade mask to the hero storyboard carousel
- Add the grid pattern behind it
- Tilt-stack the next 2 frames behind the current one

### Phase 6 — Dark floating callouts on demo (1 session)
- Annotate the demo storyboard frames with "AI-generated," "Scene 14," generation-time pills
- Purely decorative — reinforces "look at the craft"

### Phase 7 — Motion pass (1 session)
- Add on-scroll fade-ups to section transitions
- Never bounce. 600–800ms ease-out.
- Straighten-on-hover for tilted card stacks

### What we do **not** touch
- `lib/*` business logic
- API routes
- State management in viewers
- The screenplay JSON parsing
- The Zustand stores
- Image generation endpoints

Every phase is pure presentation layer. Each phase can ship independently.

---

## 13. Quick Reference — The 10 Rules

If you strip peec.ai down to 10 commandments for Greenlight to follow:

1. **Canvas is warm, not pure.** Dark mode = `#0A0A0C`, never `#000`. Light mode = `#F7F7F7`, never `#FFF`.
2. **Ink is warm, not pure.** `#171717` / `#F2F0EE`, never `#000` / `#FFF`.
3. **Display headlines are light-weight.** Editorial over muscular.
4. **Track everything tighter than default.** `-0.02em` on display, `-0.01em` on body.
5. **Body copy is 80% opacity of ink.** One hue, not two.
6. **Cards have no borders. They have inset rings.**
7. **Shadows are always layered.** Never one shadow — always 2–4.
8. **Pills are the atomic unit.** Section labels, inline chips, status, meta — all pills.
9. **Rounded corners live in three buckets**: 6px (buttons), 10–14px (cards), full (pills).
10. **Tabular numerals on every number.** Non-negotiable.

---

*Source captures: `/tmp/peec-analysis/` — kept for reference. Regenerate with a fresh playwright pass if peec.ai ships a redesign.*
