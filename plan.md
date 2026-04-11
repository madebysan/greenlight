# Greenlight — Current Plan

Greenlight is a portfolio project built to impress A24's creative team in a job interview. See `presentation.md` for full context and `backlog.md` for deferred work.

---

## Done this session (2026-04-11)

A very large iteration session. Summary by area:

### Tabs & information architecture
- **Storyboards merged into Scenes tab** — fully inline in each expanded scene card (image + metadata + action buttons, prompt collapsed by default)
- **Production tab renamed to Production Design** — VFX/stunts sub-tab removed, Stunt Coordinator added to crew scope heuristic
- **Visuals tab renamed to Key Art** with Identity (palette + title treatment) and Posters sub-tabs
- **Color Palette moved** from Mood & Tone → Key Art → Identity
- **Comparable Films moved** from Overview → Mood & Tone → renamed **Similar Moods**
- **Reference Points reordered** to sit directly below Tonal Descriptors in Mood & Tone
- **Scenes header** got a Sequence/Location toggle that groups scenes by location when active
- **Locations and Posters tabs** got Expand all / Collapse all controls

### Overview
- **Film Identity moved into the hero** below logline/taglines (left column, next to poster carousel)
- **PosterCarousel** added to the hero right column — prev/next through generated posters with counter
- **Taglines** card in hero with Shuffle button (generates 3 new via `/api/regenerate-section`)
- **Writer** field added to stage-0 prompt + `trimForOverview` + rendered in Film Identity and Crew list
- Character Presence / Story Shape chart added then deliberately removed (not actionable)

### Mood & Tone
- **Soundtrack References** — 4 film scores looked up via TMDB, horizontal 2-col card grid with 14×21 posters
- **Similar Moods** — 4 mood-aligned films via TMDB, same horizontal 2-col design as Soundtracks
- **Color palette** compact 2-col layout, with Reshuffle button
- **Music & Sound** Shuffle button regenerates prose + soundtracks
- **Section order:** Atmosphere → Tonal Descriptors → Reference Points → Music & Sound (+ Soundtracks) → Similar Moods (palette now lives in Key Art)

### Key Art (new tab, replaces Visuals)
- **Title Treatment** feature — full Google Fonts catalog (1929 families, filtered by category) with per-slot shuffle + shuffle-both. Selected pair persists to localStorage.
- **Color Palette** rendered here
- **Poster Concepts** as second sub-tab

### Production Design
- **Prop reference image generation** — `/api/generate-prop` with sketch style matching portraits. Per-prop + bulk generate. Persisted as `propImages` on SavedProject.

### Cast & Crew
- **Disable toggle** on each cast/crew card (hover-reveals eye icon → 40% opacity, persists)
- **Writer** surfaced as a crew role when present in JSON

### Scenes
- Sequence/Location toggle
- Storyboard image generation fully inline
- "Generate all frames" header button
- Stats row (13 scenes / 86 pages / 5 unique locations)

### Header & navigation
- **Consolidated header** — Start Over + 3-dot More menu (all other actions live in the menu)
- **More menu** contains: Generate all images · Share · Download all · Download JSON · Theme toggle · Settings · About · Save as demo (dev) · Save to cache (dev)
- **Header progress pill** appears while Generate all images is running (with cancel)
- **Logo** swapped to custom pinwheel mark (public/logo.png + app/icon.png as favicon)
- **Tagline** set to "A 1st AD's first pass." everywhere
- **Dark/light theme toggle** with inline init script to prevent FOUC

### /share route
- **Full bible** rewritten from a one-pager to a complete print-friendly page
- **Table of contents** after the hero, dynamic based on which sections have content
- **Writer credit** beneath the title, hero poster removed
- Renders every tab's content flat (no collapsibles, no sub-tabs): Taglines, Synopsis, Film Identity, Themes, Scope, Atmosphere, Tonal Descriptors, Reference Points, Music & Sound + Soundtracks, Color Palette, Similar Moods, Scenes (with storyboards), Locations, Cast, Production Design · Props, Poster Concepts
- Reuses parsers from all the viewers (no duplicated parsing logic)
- Print stylesheet with `break-inside: avoid` on every card

### /demo route
- Standalone page backed by `lib/demo-project.ts` (committed snapshot)
- **Save as demo (dev)** menu item writes to the file + copies images to `public/demo-images/`
- Full Greenlight header (logo + title + tagline + Start Over + More menu with theme toggle + About)

### Fake-generation cache
- **`lib/cached-projects.ts`** — Record of pre-cached projects keyed by normalized title
- **`/api/save-cached`** — dev-only endpoint, upserts the current project (strips images) into cached-projects.ts
- **Title-match lookup** on JSON submit → if found, StepGenerating fake-progresses through 5 steps (~11s total) instead of real API calls (~3 min)
- EEAAO cached this session as the first entry

### Text / prose polish
- **Prose width caps removed** from Mood & Tone atmosphere/music, Overview synopsis/themes/complexity, and Scenes expanded cards (was max-w-[68ch], now fills container)
- **Title treatment secondary font** bumped to 20px

### New API routes
- `/api/generate-prop`
- `/api/regenerate-section` (taglines, color-palette, music)
- `/api/save-cached`
- `/api/save-demo`
- `/api/tmdb-search`

### New components
- `components/viewers/cast-and-crew-viewer.tsx`
- `components/viewers/key-art-viewer.tsx`
- `components/viewers/locations-viewer.tsx`
- `components/viewers/mood-and-tone-viewer.tsx`
- `components/viewers/overview-viewer.tsx`
- `components/viewers/poster-carousel.tsx`
- `components/viewers/production-viewer.tsx`
- `components/viewers/title-treatment.tsx`
- `components/wizard/about-dialog.tsx`
- `components/wizard/header-menu.tsx`
- `components/share/shareable-view.tsx`
- `app/share/page.tsx`
- `app/demo/page.tsx`

### New libs
- `lib/cached-projects.ts`
- `lib/demo-project.ts`
- `lib/google-fonts-catalog.json` (1929 families from `fonts.google.com/metadata/fonts`)
- `lib/markdown-utils.ts`
- `lib/prompts/mood-and-tone.ts`
- `lib/prompts/overview.ts`
- `lib/title-fonts.ts`

### Layout exploration (unshipped, session-end)
- Ran the `/explore` skill on the Home / Extract Screenplay Data page with Shuffle Layout mode
- Produced 4 standalone HTML variants in `/tmp/explore-home/`:
  1. Asymmetric Editorial — 7/5 magazine spread with prompt as a brutalist hero card
  2. Dense Grid — 12-col everything-above-the-fold with inline header stepper
  3. Single-Column Narrative — centered 680px reading column with huge italic display hero
  4. Sidebar Driven — dark 280px left rail with persistent stepper, main pane is a "working surface" with line numbers
- User hasn't picked a direction yet — that's the next thing

---

## Current state

- **Build status:** passing (tsc --noEmit clean)
- **Type checks:** clean
- **All 6 tabs functional:** Overview, Mood & Tone, Scenes, Locations, Cast & Crew, Production Design, Key Art
- **/demo works:** renders the committed snapshot with full header
- **/share works:** full-bible print-friendly view
- **Fake-gen cache:** EEAAO cached, title-match fake progression working end-to-end
- **Git state:** ~32 untracked files + `CLAUDE.md`, `presentation.md`, `public/logo.png`, `public/demo-images/`, `app/icon.png` all pending commit. Many auto-checkpoints have captured the two tracked files (`wizard-shell.tsx` and `step-instructions.tsx`).

---

## Next steps

- [ ] **User picks a home-page layout direction** from the 4 `/tmp/explore-home/*.html` variants (or combines elements across them)
- [ ] **Apply the chosen layout** to the React project (`components/wizard/step-instructions.tsx`)
- [ ] **Run `/explore` on other pages** — Overview, Mood & Tone, Scenes (user said "lets start with the home")
- [ ] **Visual style pass** after layouts are settled — typography, color, spacing, micro-interactions. Deliberately held off until after layout decisions.
- [ ] **A24 bonus-round validation** — pre-cache 2-3 A24 films beyond EEAAO (The Witch, Hereditary, The Lighthouse candidates). See `backlog.md` → Sample Data → Bonus-round samples.
- [ ] **Commit the untracked files** — big single commit or grouped by area. User hasn't been asked yet.

---

## Decisions & context

- **Deliberately skipped image caching in save-cached** — the fake-gen path shows only documents, then the user walks through image generation live so the demo stays honest about the pipeline
- **Writer field flows through** the trimmer → Claude prompt → Film Identity → Crew list → /share hero
- **Title treatment persists to localStorage** (not SavedProject) — survives tab switches but lives in browser state
- **Storyboards did NOT get merged into Scenes at first** — the first attempt used a sub-tab. The second attempt (accepted) moved them fully inline into expanded scene cards.
- **Prop images use sketch style** matching character portraits (matched after a "looks too photographic" note mid-session)
- **Export/import project feature is backlogged** — URL-only (Option A), .greenlight.zip format planned, deferred until post-interview. See `backlog.md` → Export.
- **No PDF export button** — `/share` + browser Print is the PDF path. The one-pager export was rejected in favor of the full bible at `/share`.

---

## Dependencies added

- `TMDB_API_KEY` env var in `.env.local` (for /api/tmdb-search)
- `lib/google-fonts-catalog.json` — 1929 families static data from Google Fonts public metadata endpoint
