# Greenlight — Current Plan

Greenlight is a portfolio project built to impress A24's creative team in a job interview. See `presentation.md` for full context and `backlog.md` for deferred work.

---

## Done this session (2026-04-11, session 3 — peec.ai redesign)

### The big pass: peec.ai aesthetic port
Rebuilt the visual system across every viewer using peec.ai as inspiration (research captured in `DESIGN-PEEC.md`). Dark-mode translation of: warm canvas (not pure black), inset-ring `shadow-paper` layered elevation instead of borders, 80% body copy opacity, `font-light` display weights with tight `-0.025em` tracking, section label pills with icons, flat underline tabs.

- **`app/globals.css`** — warm canvas/ink tokens (light + dark), `@layer utilities` for `shadow-paper`, `shadow-paper-hover`, `shadow-pill`, `shadow-cascade`, `bg-grid-pattern`. Typography tightening in `@layer base`.
- **`components/ui/section-head.tsx`** (new) — accepts optional `label` + `labelIcon` props, renders floating `SectionLabelPill` above the numbered section title.
- **`components/ui/inline-chip.tsx`** (new) — `InlineChip` for prose nouns, `SectionLabelPill` floating eyebrow tag. Dark + light tone variants.

### Every viewer rebuilt
- **Overview** — `[◉ Overview]` pill, 44px `font-light` title, section pills for Synopsis / Themes / Scope, stat grid cells shrunk to `inline-grid grid-cols-[repeat(6,120px)]` with leading-number parsing so "5 unique locations" displays cleanly.
- **Mood & Tone** — `[◉ Atmosphere]` pill, 44px title, 5 section pills, Similar Moods + Soundtrack cards on `shadow-paper`.
- **Scenes** — `[◉ Scene Breakdown]` pill, 32px title, section pills for Breakdown / Scenes, stat grid 140px cells, scene cards on `shadow-paper`.
- **Locations** — `[◉ Geography]` pill, location cards on `shadow-paper`, INT/EXT chips as pills.
- **Cast & Crew** — `[◉ People]` pill, character cards on `shadow-paper`, flattened tab underline.
- **Production Design** — `[◉ Art Department]` pill, stat grid 160px cells with `max-w-[11ch]` labels, prop/wardrobe cards on `shadow-paper`.
- **Key Art split into two tabs** — `Identity` (color palette + title treatment) and `Posters`. Deleted the old `key-art-viewer.tsx` host.

### Image prompt customization
Users can now tweak the hardcoded sketch-style image prompts in Settings.
- **`lib/image-prompts.ts`** (new) — `ImagePromptKind`, `DEFAULT_IMAGE_PROMPTS`, `loadImagePrompts()`, `saveImagePrompts()`, `getStylePrefix()`. Overrides persisted to localStorage.
- **Settings dialog** — 4 textareas (storyboard / portrait / prop / poster) with per-field Reset buttons.
- **All 4 image API routes** now accept `stylePrefix` in body and fall back to `DEFAULT_IMAGE_PROMPTS[kind]`.
- **Bulk generate loop** in `wizard-shell.tsx` passes `getStylePrefix(kind)` to every API call.

### Loading UI rewrite
`components/wizard/step-generating.tsx` fully rewritten. Call-sheet pattern with `[◉ PRE-PRODUCTION BIBLE]` label, film-strip segmented progress bar, per-document elapsed time tracking via `docTimesRef`, cinema vocabulary (Queued / Rolling / In the can / Failed), and shimmer sweep on the active row via inline `<style jsx>` animation.

### Logo + favicon
New logo: 4 black corner triangles forming a diamond negative space on a white tile.
- `public/logo.svg` — uses `fill="currentColor"` for theme adaptability
- `app/icon.svg` — favicon with baked-in white background (old `app/icon.png` deleted)
- Header / demo / about logo wrapped in white rounded tile so the mark stays visible in dark mode

### Font audit
Scanned all 17 viewer files for `font-semibold` / `font-bold` stragglers — found 72. Ladder proposed (28 legitimate uppercase meta labels kept, 44 stragglers to normalize) — **execution paused, waiting on user scope preference**.

### Crew → Insights (end of session)
The Crew section under Cast & Crew was replaced with situational production Insights.
- `suggestCrewRoles()` → `computeInsights()` in `components/viewers/cast-and-crew-viewer.tsx`
- Dropped the 8 generic baseline roles (writer, director, producer, DP, 1st AD, production designer, sound mixer, script supervisor)
- Added 15 situational heuristics that only fire when the script justifies them: stunts, VFX, practical makeup, weapons, pyro, water/weather, intimacy, animals, picture cars, night shoots, heavy exteriors, location density (6+), large ensemble (6+), minors on set, movement/music, period piece
- Each card has lightbulb icon + title + mono signal chip with real counts + recommendation in line-producer voice
- Empty state card for scripts with no specialty situations
- Demo screenplay fires 9 insights (stunt work × 17, practical makeup × 5, weapons × 13, pyro × 5, night × 10, exteriors × 6, large ensemble × 8, minors on set, movement/music)
- Disabled-items key prefix `crew:` → `insight:`

---

## Current state

- **Build status:** passing (`tsc --noEmit` clean)
- **Dev server:** running on :3001
- **All tabs functional:** Overview / Mood & Tone / Scenes / Locations / Cast & Crew / Production Design / Identity / Posters (7 top-level tabs)
- **Playwright QA:** verified Overview, Scenes, Production Design stat grids hug content correctly; verified Cast + Insights tabs render cleanly on the demo screenplay
- **Git state:** modifications are auto-committed by a hook, but new files remain untracked. Pending untracked files listed below.

---

## Next steps

- [ ] **Commit untracked files** as a single peec.ai pass checkpoint (DESIGN-PEEC.md, app/icon.svg, inline-chip.tsx, section-head.tsx, identity-viewer.tsx, posters-viewer.tsx, image-prompts.ts, public/logo.svg)
- [ ] **Font audit execution** — waiting on user scope preference. Options: (A) full normalization across all 17 files including shareable-view + document-viewer, or (B) scoped to in-app viewers only
- [ ] **A24 bonus-round validation** — pre-cache 2-3 more A24 films beyond EEAAO (The Witch, Hereditary, The Lighthouse). See `backlog.md` → Sample Data
- [ ] **Optional Insights bonuses** — could categorize (Safety / Specialty / Logistics) if the flat list feels long on a heavy script

---

## Decisions & context

- **Peec.ai is a light-mode reference, Greenlight is dark-first.** The translation required: warm dark canvas instead of pure black, inset-ring light shadows instead of drop shadows, 80% foreground opacity for body copy, flat underline tabs instead of pilled ones.
- **Stat grids use `inline-grid` with fixed pixel column widths** (`grid-cols-[repeat(N,Xpx)]`) so they hug content instead of stretching to container width.
- **Stat labels wrap to 2 lines uniformly** via `max-w-[11ch]` for consistent cell heights.
- **Insights tab is for specialty hires only** — baseline roles (director, DP, producer, production designer) are assumed. This is the non-obvious stuff a line producer would flag on a first read. Framed as observations, not a crew list.
- **Image prompts live in localStorage, not SavedProject** — they're a user preference, not part of the project data that gets shared via `/share`.
- **Logo uses `currentColor`** so it adapts to theme, but we wrap it in a white tile to keep the mark visible in dark mode without re-coloring.

---

## Dependencies added this session

- None. No new npm packages, env vars, or external services. Entirely internal refactor + new UI components.
