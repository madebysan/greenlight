# Changelog

All notable shipped features and changes, organized by date.
Updated every session via `/save-session`.

---

## 2026-04-11 (session 2)

Massive iteration session. Full tab restructure, new routes, visual content generation, layout exploration. Net result: the app became a real portfolio piece instead of a wizard demo.

### Features

#### New tabs and major restructures
- **Key Art** replaces Visuals — sub-tabs: Identity (color palette + title treatment) and Posters
- **Production Design** replaces Production — props + wardrobe only, VFX/stunts moved into scene cards + Crew heuristic
- **Storyboards merged into Scenes** — inline in each expanded scene card with image + metadata + actions
- **6 tabs total:** Overview / Mood & Tone / Scenes / Locations / Cast & Crew / Production Design / Key Art

#### Overview
- **Hero restructure** — title + logline + taglines + Film Identity (left column, max 60ch) + PosterCarousel (right column, cycles through generated posters)
- **Taglines** card with Shuffle button (regenerates 3 new via `/api/regenerate-section`)
- **Writer credit** rendered in Film Identity, pulled from new JSON field

#### Mood & Tone
- **Similar Moods** — 4 TMDB posters with descriptions (replaces text-only Comparable Films)
- **Soundtrack References** — 4 film scores with TMDB posters + composer credits, horizontal 2-col grid
- **Color palette** compact 2-col with Reshuffle button (moved to Key Art)
- **Section reorder:** Atmosphere → Tonal Descriptors → Reference Points → Music & Sound → Similar Moods
- **Music shuffle button** regenerates prose + soundtracks via `/api/regenerate-section`

#### Key Art
- **Title Treatment** with full 1929-font Google Fonts catalog (category-filtered), per-slot shuffle + shuffle-both
- Selected font pair persists to localStorage across sessions
- **Color Palette** rendered as Identity sub-tab's first section
- **Poster Concepts** as second sub-tab with expand/collapse all

#### Scenes
- **Storyboard frames inline** — full-width in each expanded scene card, with camera/lighting/mood metadata and 4 action buttons (Regenerate / Rewrite prompt / Edit prompt / Copy)
- **Sequence/Location toggle** — Location mode groups scenes by location ordered by first appearance
- **Generate all frames** header button

#### Locations
- Expand/collapse all header controls
- First location expanded by default

#### Cast & Crew
- **Disable toggle** on every card (hover-reveals eye icon, 40% opacity when disabled, persists to SavedProject)
- **Writer** surfaced as a crew role from JSON field
- **Stunt Coordinator** added to crew heuristic when script has combat/stunt beats

#### Production Design
- **Prop reference image generation** — `/api/generate-prop` (sketch-style, matching portrait aesthetic), per-prop + bulk generate, `propImages` on SavedProject
- **Removed VFX sub-tab** — props + wardrobe only

#### Header and navigation
- **Consolidated to Start Over + 3-dot More menu** (all other actions live in the menu)
- **Generate all images** in More menu — parses current project for missing images across portraits/props/storyboards/posters, runs them sequentially with live progress pill next to Start Over (click to cancel)
- **Header progress pill** shows done/total while generate-all is running
- **Theme toggle** (dark/light) in More menu, persists via localStorage with inline init script
- **Custom logo** — pinwheel SVG/PNG replacing the document icon, also favicon via `app/icon.png`
- **Tagline** updated to "A 1st AD's first pass." across header/About/metadata
- **About dialog** extracted to shared component, content updated to current tabs

#### /share route
- **Full-bible print-friendly page** — rewritten from one-pager. Every tab's content rendered flat: Taglines, Synopsis, Film Identity, Themes, Scope, Atmosphere, Tonal Descriptors, Reference Points, Music & Sound + Soundtracks, Color Palette, Similar Moods, Scenes (with inline storyboards), Locations, Cast, Production Design · Props, Poster Concepts
- **Table of contents** after hero, dynamic based on what's populated
- **Writer credit** under title
- `break-inside: avoid` on every card for clean PDF page breaks
- Parsers shared across viewers (no duplication)

#### /demo route
- **Committed snapshot** system — `lib/demo-project.ts` backed by `/api/save-demo` (dev-only)
- Full Greenlight header on the demo page (logo + title + tagline + Start Over + More menu with theme toggle + About)
- Image URLs rewritten to `/demo-images/` on save, committed to git

#### Fake-generation cache
- **`lib/cached-projects.ts`** — Record of pre-cached projects keyed by normalized title
- **`/api/save-cached`** — dev-only endpoint, upserts current project text-only (no images) into the cache file
- **Title-match on JSON submit** — `findCachedProject()` checks the title, returns cached documents if found
- **StepGenerating fake mode** — `prefilledDocs` prop triggers a 2.2s-per-step fake progression instead of real Claude calls (~11s total vs 3 min)
- **EEAAO cached** as the first entry via "Save to cache (dev)" menu item

### Data
- **1929 Google Fonts** added via static `lib/google-fonts-catalog.json` from the public fonts.google.com metadata endpoint
- **NotLD JSON sample** updated with `writer` and `based_on` fields

### Routes added
- `/api/generate-prop`
- `/api/regenerate-section`
- `/api/save-cached`
- `/api/save-demo`
- `/api/tmdb-search`
- `/demo`
- `/share`

### Fixes
- Prose width caps removed on Mood & Tone atmosphere/music, Overview synopsis/themes/complexity, Scenes expanded cards (was max-w-[68ch], now fills container to match section divider width)
- Z-index of header + More menu bumped above poster carousel (was getting occluded)
- Duplicate React key warning on descriptors fixed (use `${i}-${d}`)
- `trimForOverview` now includes `writer` and `based_on` fields (was silently stripping them before Claude saw them)
- Unused imports cleaned from shareable-view and wizard-shell
- Scene-breakdown viewer now supports location grouping without duplicating the per-scene render code (extracted to inline renderScene function)
- Storyboard prompt text now collapsed by default with expand toggle
- Title treatment secondary font bumped from 15px to 20px
- Header demoted from the main wizard to share across wizard-shell + /demo page (HeaderButton + MoreMenu + AboutDialog extracted)

### Layout exploration
- Ran `/explore` skill on Home / Extract Screenplay Data page with Shuffle Layout mode
- Generated 4 standalone HTML variants in `/tmp/explore-home/`: Asymmetric Editorial, Dense Grid, Single-Column Narrative, Sidebar Driven
- User hasn't picked a direction yet

### Status: mostly uncommitted (many auto-checkpoints captured tracked files; ~32 new files still untracked including all new viewers, routes, libs, docs)

---

## 2026-04-10 (session 1)

### Features
- **Greenlight** — full app built from scratch (renamed from "Script to Production")
- **5-document generation** — Scene Breakdown, Production, Marketing Brief, Storyboard, Posters from screenplay JSON
- **Storyboard image generation** — B&W felt-tip marker sketch style via FLUX Schnell (fal.ai), per-scene or batch
- **Poster concept sketches** — portrait aspect ratio poster sketches, per-concept or batch
- **Character portraits** — AI-generated B&W portraits replacing initials on character cards, batch generation
- **Inline editing** — edit scenes (add/remove/modify), marketing brief sections, storyboard prompts
- **Prompt rewriting** — AI rewrites storyboard prompts for alternative visual interpretations
- **On-demand marketing sections** — Festival Strategy, Distribution Positioning, Pitch Deck, Social Hooks, Casting Wishlist, Music Direction
- **Production department tabs** — Characters, Locations, Production Design, Technical (replaced single long scroll)
- **Project management** — sidebar with rename, duplicate, delete projects
- **Full state persistence** — all images, edits, prompt overrides saved to localStorage + disk
- **Sample data** — Jaws and Ex Machina pre-loaded as demo projects
- **Settings dialog** — Claude API key + fal.ai key management in browser
- **About dialog** — feature overview with colored icons, how-it-works steps, credits
- **Dark mode** — Runway-inspired aesthetic with violet accent, Space Grotesk + Space Mono fonts
- **Input hash caching** — API responses cached per-input so same screenplay data returns instant results

### Fixes
- Fixed cache keying (was slug-only, now slug + input hash — different screenplays get different results)
- Fixed document content persistence (edits to Marketing Brief and Scene Breakdown now survive reload)
- Fixed storyboard act parser (non-act headings like "Prompt Modifiers" no longer break scene grouping)
- Fixed scene number comparison in act grouping (now uses array indices, works with non-sequential numbering)
- Fixed duplicate React key warning for characters with same name
- Merged Primary/Secondary Audience into single Target Audience section
- Removed broken "Regenerate" button from color palette (was rewriting entire document)

### Status: committed
