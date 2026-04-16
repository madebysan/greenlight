# Greenlight — Deep Refactor Report

**Generated:** 2026-04-15
**Method:** 5-phase audit with 5 parallel expert agents (Architect, Optimizer, Pragmatist, Domain Expert, Outsider)
**Overall health:** 11/20 (Weak band — significant issues, incremental improvement viable)
**Verdict:** Refactor incrementally in two waves — pre-interview UX fixes, post-interview structural refactor

---

## Executive Summary

Greenlight is a well-executed portfolio piece with strong domain taste (Mood & Tone, Cast & Crew insights, Gesture Draw LoRA consistency) but three structural debts are now limiting it:

1. **Markdown-as-data** — 9 regex parsers reverse-engineer Claude's markdown into typed objects. 3 of 5 agents independently named fixing this as the single highest-leverage change.
2. **1001-line god component** — `wizard-shell.tsx` owns all state. 52 git edits. Every feature funnels through it.
3. **230KB of demo data inlined as TypeScript** — `cached-projects.ts` (150KB) + `demo-project.ts` (82KB) ship in the client bundle.

The A24 Labs interview (April 17) makes a fork-and-rebuild untenable regardless of technical merit. This report proposes a **two-wave refactor**: ship-day UX fixes first (safe, ~3 hours), structural refactor after the interview.

---

# Phase 1: Archaeology

## 1.1 Identity

- **What it is:** Web-based vision deck generator. Screenplays (PDF/JSON) → 5 AI documents (Overview, Mood & Tone, Scene Breakdown, Storyboard Prompts, Poster Concepts) + ~67 AI sketch images.
- **Who it's for:** Directors, producers, small film teams — but the actual primary audience is A24 Labs (portfolio interview April 17, 2026).
- **State:** Active, functional, deployed to Vercel with password gate. 181 commits over ~3 months by Santiago Alonso (solo).

## 1.2 Architecture Map

### Pipeline

```
Stage 0 (Input)              Stage 1 (Processing)           Stage 2 (Output)
PDF/JSON Screenplay   ──>    5 Written Documents    ──>    ~67 AI Images
(Claude Sonnet 4.6)          (Claude Haiku 4.5 × 5)        (FLUX + LoRA via fal.ai)
~60-180s                     ~20-30s total                  ~60s parallel
```

### Core Modules

| Module | Purpose | Lines | Complexity | Hot? |
|--------|---------|-------|------------|------|
| `wizard-shell.tsx` | Master state container | 1001 | HIGH | 52 edits |
| `scene-breakdown-viewer.tsx` | Scene cards + storyboard placeholders | 1008 | HIGH | 21 edits |
| `shareable-view.tsx` | Print-friendly layout (duplicate rendering tree) | 1060 | HIGH | — |
| `storyboard-viewer.tsx` | Scene-by-scene prompts + image gen | 596 | HIGH | — |
| `poster-concepts-viewer.tsx` | 15 poster directions | 569 | HIGH | 15 edits |
| `cast-and-crew-viewer.tsx` | Character cards + portrait gen | 591 | HIGH | — |
| `production-viewer.tsx` | Props & wardrobe + sketch gen | 457 | HIGH | — |
| `mood-and-tone-viewer.tsx` | Atmosphere, palette, music refs, TMDB | 468 | HIGH | — |
| `cached-projects.ts` | Hardcoded NotLD + EEAAO demo data | 44K+ | LOW (data) | — |

### Entry points

- `/` → WizardShell (main flow)
- `/demo` → Pre-loaded with Night of the Living Dead
- `/share` → Read-only printable view

## 1.3 Dependency Audit

12 production deps — lean. Notable observations:
- `lucide-react` (~400KB) used for only ~30-40 icons, not tree-shakeable
- `react-markdown + remark-gfm` (~200KB) used alongside custom regex parsers (duplication)
- Test infrastructure installed but dormant. No CI.
- Custom code vs. library glue ratio: ~85% custom

## 1.4 Data Flow

```
User uploads PDF ─or─ pastes JSON
        │
        ▼
  /api/extract-screenplay (Claude Sonnet 4.6, PDF only)
        │
        ▼
  JSON validated against schema.ts
        │
        ├──> trimForOverview()      ──> /api/generate/overview
        ├──> trimForMoodAndTone()   ──> /api/generate/mood-and-tone
        ├──> trimForScenes()        ──> /api/generate/scene-breakdown
        ├──> trimForStoryboard()    ──> /api/generate/storyboard-prompts
        └──> trimForPosters()       ──> /api/generate/poster-concepts
                                            │
                                            ▼
                                    5 markdown docs parsed by
                                    9 custom regex parsers in viewers
                                            │
                                            ▼
                                    User clicks "Generate Images"
                                            │
                                    ┌───────┼───────┬──────────┐
                                    ▼       ▼       ▼          ▼
                                Storyboards Portraits Props  Posters
                                (FLUX+LoRA via fal.ai, 500ms stagger)
                                            │
                                            ▼
                                    localStorage (single project)
```

## 1.5 Assumptions & Constraints

- Single user, single project at a time
- Vercel deployment (read-only filesystem — `.cache/` silently no-op in prod)
- Solo dev, portfolio piece (not SaaS)
- Markdown is the data format (Claude outputs it → viewers regex-parse)
- fal.ai CDN URLs are temporary (no local backup)

## 1.6 Git Archaeology

- 181 commits, 1 contributor (bus factor: 1)
- Hottest: wizard-shell.tsx (52), step-results.tsx (29), step-instructions.tsx (26)
- 6 sessions documented in CHANGELOG
- Docs present: CLAUDE.md, DESIGN.md, CHANGELOG.md, plan.md, backlog.md, how-it-works.md, presentation.md

---

# Phase 2: Multi-Agent Audit

Five agents ran in parallel with full Phase 1 context but independent perspectives. Full individual reports summarized below; see Phase 3 for consensus synthesis.

## Agent 1 — The Architect
**Verdict:** Refactor incrementally. **One Big Idea:** Create `lib/documents/` as single owner of each document's entire lifecycle (prompt + schema + parse + toMarkdown).

Top findings:
- P0: Markdown-as-IPC is a leaky contract with no owner (parsers in viewers, prompts in `lib/prompts/`, nothing connects them)
- P0: `wizard-shell.tsx` is a god component (1001 lines, 14 useState, image orchestration inline)
- P1: `shareable-view.tsx` is evidence of a missing abstraction (1060 lines of duplicate rendering)
- P1: `cached-projects.ts` is 44K lines of data masquerading as a module
- P1: Type duplication + 18-prop drilling in `StepResults`

## Agent 2 — The Optimizer
**Verdict:** Refactor incrementally. **One Big Idea:** Move `cached-projects.ts` + `demo-project.ts` out of TS modules and into `public/*.json`, lazy-load.

Top findings:
- P0: 250KB of static demo data ships in client JS bundle
- P1: Anthropic SDK called without prompt caching (5× re-tokenization per run, ~40-50% cost reduction available)
- P1: Redundant TMDB fetches from 3 components (SimilarMoods + Soundtracks + Shareable each fire independently)
- P2: `lucide-react` + `react-markdown + remark-gfm` bundle weight
- P2: Shell re-renders entire wizard on every state change (~67 renders during image gen)

## Agent 3 — The Pragmatist
**Verdict:** Refactor incrementally during demo-adjacent work. **One Big Idea:** Kill markdown-as-data. Have Claude return JSON.

Top findings:
- P1: `wizard-shell.tsx` is a 1001-line state god
- P1: `cached-projects.ts` and `demo-project.ts` are 230KB of escaped JSON in git
- P1: Markdown-as-data forces 5 bespoke regex parsers that re-parse on every render
- P2: `shareable-view.tsx` duplicates every viewer to produce a print layout
- P2: Abstraction sprawl for 5 nearly-identical endpoints

## Agent 4 — The Domain Expert
**Verdict:** Refactor incrementally. **One Big Idea:** Reshape the demo experience so A24 sees the output before they see the tool.

Top findings:
- P0: Landing page undermines the demo before it begins (tool-chooser where a showcase should be)
- P1: Wardrobe matcher breaks on real screenplays (substring token collision `JOE`/`DEE`)
- P1: Storyboard prompt + poster palette contradiction (palette shown in UI but LoRA forces B&W)
- P1: Regenerate/Shuffle buttons lack optimistic feedback (5-second dead zone)
- P2: "Generate all images" has no partial-failure recovery

**What's working:** Mood & Tone prompt is best-written in codebase. `computeInsights` in Cast & Crew is domain-specific mastery. Gesture Draw LoRA consistency is the right design-system call.

## Agent 5 — The Outsider
**Verdict:** Fork and restructure (time-gated — "do not fork now; ship what you have"). **One Big Idea:** Make Claude return JSON, not markdown.

Top findings:
- P0: Markdown is the wrong data format. JSON is.
- P1: `shareable-view.tsx` is a second app pretending to be a print view
- P1: `wizard-shell.tsx` is a god component, not a shell
- P2: 14 API routes are 14 copies of the same 4 lines
- P2: Next.js is the wrong weight class (Vite SPA + 1 edge function would be half the size)

---

# Phase 3: Consensus Synthesis

## 3.1 Consensus Matrix

| # | Finding | Architect | Optimizer | Pragmatist | Domain | Outsider | Consensus |
|---|---------|-----------|-----------|------------|--------|----------|-----------|
| A | Markdown-as-data → 9 regex parsers | P0 | — | P1 | — | P0 | **3/5 HIGH** |
| B | wizard-shell.tsx god component | P0 | P2 | P1 | — | P1 | **4/5 HIGH** |
| C | shareable-view.tsx duplicate rendering | P1 | — | P2 | — | P1 | **3/5 HIGH** |
| D | 230KB demo data inlined as TS | P1 | P0 | P1 | — | — | **3/5 HIGH** |
| E | 14 near-identical API routes | P1 | — | P2 | — | P2 | **3/5 HIGH** |
| F | Type duplication + 18-prop drilling | P1 | P2 | — | — | — | 2/5 MEDIUM |
| G | No Claude prompt caching | — | P1 | — | — | — | 1/5 PERSPECTIVE |
| H | Landing hierarchy buries demo | — | — | — | P0 | — | 1/5 PERSPECTIVE |
| I | Wardrobe matcher substring bug | — | — | — | P1 | — | 1/5 PERSPECTIVE |
| J | Poster palette theater | — | — | — | P1 | — | 1/5 PERSPECTIVE |
| K | Regenerate/Shuffle lacks feedback | — | — | — | P1 | — | 1/5 PERSPECTIVE |
| L | "Generate all images" no retry | — | — | — | P2 | — | 1/5 PERSPECTIVE |
| M | Redundant TMDB fetches | — | P1 | — | — | — | 1/5 PERSPECTIVE |
| N | Bundle weight (lucide + markdown) | — | P2 | — | — | — | 1/5 PERSPECTIVE |
| O | Next.js wrong weight class | — | — | — | — | P2 | 1/5 PERSPECTIVE |

## 3.2 Disagreement Analysis

**Fork vs. refactor:** 4/5 vote refactor incrementally. Outsider votes fork-and-restructure on technical merit but caveats "do not fork now — ship what you have." Treating caveat as alignment: **5/5 say don't fork before April 17.**

**God component severity:** Architect P0, Optimizer P2, Pragmatist P1, Outsider P1. Optimizer rates narrowly (render cost only). Median: P1.

**The Big Idea convergence:** Architect, Pragmatist, and Outsider independently named the same "One Big Idea" — **Claude returns JSON, not markdown**. 3/5 independent agents converged without seeing each other's reports. Strongest single consensus signal in the audit.

**Engineers vs. Domain Expert:** 4 engineering agents converge on structural issues. Domain Expert flags 5 user-facing issues (H–L) that no engineer noticed. These are orthogonal, not conflicting — both sets valid.

## 3.3 Health Scorecard

| Dimension | Score | Key Finding |
|-----------|-------|-------------|
| Architecture | 2/4 | Markdown-as-data + god component + parallel rendering tree |
| Performance | 2/4 | 230KB demo data in bundle + no prompt caching + redundant TMDB fetches |
| Simplicity | 2/4 | 9 parsers, 14 duplicated routes, 1001-line shell, 230KB inline data |
| Goal Alignment | 3/4 | Strong domain taste but landing hierarchy + wardrobe bug + palette theater undermine |
| Modernity | 2/4 | React 19 + Next 16 modern, but patterns pre-2020 |
| **Overall** | **11/20** | **WEAK — significant issues, incremental improvement viable** |

## 3.4 Verdict

**Refactor incrementally.** Two distinct tracks:

1. **Pre-interview (ship-day UX only)** — fix what A24 will see. Landing hierarchy, wardrobe matcher, shuffle feedback. ~3 hours.
2. **Post-interview (structural)** — Markdown→JSON migration, god-component split, shareable-view unification, cached-projects extraction. Multi-session.

---

# Phase 4: Reimagine

## 4.1 Design Principles

Derived from findings, not generic best practices:

1. **Typed data end-to-end.** Claude returns structured JSON validated by Zod. Viewers consume types, not parsed markdown. Markdown becomes a *serializer* for export, not the source of truth.
2. **One owner per document lifecycle.** Each document type (overview, mood, scenes, storyboards, posters) has a single module owning its prompt + schema + type + default view.
3. **Project state lives in a store, not a component.** Wizard shell becomes a ~150-line router. All state (documents, images, overrides, theme, API keys) in a Zustand store or `useReducer` context.
4. **One presentation tree, two variants.** Viewers accept `variant: "interactive" | "print"`. Shareable view becomes a route that mounts the same viewers with `variant="print"`.
5. **Demo data is data.** `cached-projects.ts` and `demo-project.ts` are JSON files in `public/`, fetched lazily by matching titles.

## 4.2 Proposed Architecture

```
greenlight/
  app/
    page.tsx                     # Demo-first landing (was wizard)
    build/page.tsx               # Wizard (renamed from /)
    share/page.tsx               # Mounts viewers with variant="print"
    api/
      generate/[slug]/route.ts   # One dynamic route (was 5)
      images/[kind]/route.ts     # One dynamic route (was 4)
      regenerate-section/...     # Kept, but simpler (JSON patches)
      tmdb-search/route.ts       # Kept, in-memory cache added
      extract-screenplay/...     # Kept

  lib/
    documents/                   # NEW: single owner per document type
      overview.ts                # { prompt, schema, trim, type }
      mood-and-tone.ts
      scene-breakdown.ts
      storyboard-prompts.ts
      poster-concepts.ts
      index.ts                   # DOCUMENT_TYPES registry

    stores/
      project-store.ts           # NEW: Zustand. All project state.

    workflows/
      generate-all-images.ts     # NEW: Pure orchestration, not React

    hooks/
      useBatchGeneration.ts      # NEW: Absorbs cancel/progress/retry pattern
      useTmdbPosters.ts          # NEW: Deduped TMDB lookups

    claude.ts                    # Kept — add prompt caching
    utils.ts                     # Kept
    image-prompts.ts             # Kept
    title-fonts.ts               # Kept

  components/
    wizard/
      wizard-shell.tsx           # Shrinks to ~150 lines (router only)
      header.tsx                 # NEW: extracted
      settings-dialog.tsx        # NEW: extracted
      step-instructions.tsx
      step-json-input.tsx
      step-generating.tsx
      step-results.tsx           # Takes project from store, no prop drilling

    viewers/
      overview-viewer.tsx        # Consumes typed data, no regex
      mood-and-tone-viewer.tsx   # accepts variant prop
      scene-breakdown-viewer.tsx # accepts variant prop
      storyboard-viewer.tsx
      poster-concepts-viewer.tsx
      cast-and-crew-viewer.tsx
      production-viewer.tsx
      locations-viewer.tsx
      identity-viewer.tsx
      # DELETE shareable-view.tsx (replaced by variant="print")

    ui/                          # Kept — shadcn

  public/
    demo-data/
      night-of-the-living-dead.json   # NEW: extracted from cached-projects.ts
      everything-everywhere.json      # NEW: extracted from cached-projects.ts
      demo-project.json               # NEW: extracted from demo-project.ts
    demo-images/                       # Kept
```

## 4.3 What Gets Eliminated

- 5 parser functions (~400 lines regex): `parseOverview`, `parseMoodAndTone`, `parseSceneBreakdown`, `parseStoryboardPrompts`, `parsePosterConcepts`
- `scenesToMarkdown()` + inverse serializers
- `lib/markdown-utils.ts` (section-replacement regex)
- `components/share/shareable-view.tsx` (1060 lines)
- 4 duplicated API routes (collapsed to 1 dynamic `[slug]` route)
- 3 duplicated image API routes (collapsed to 1 dynamic `[kind]` route)
- ~230KB of TypeScript-wrapped JSON (moved to `public/*.json`)
- Type re-definitions (`SavedImage` × 3, `ImageState` × 2)
- 18-prop drilling into `StepResults` (replaced by store selector)

**Estimated LOC delta: ~12,500 → ~8,500 (32% reduction)**

## 4.4 What Gets Rewritten

| Component | Current | Proposed | Risk |
|-----------|---------|----------|------|
| `wizard-shell.tsx` | 1001-line god component | ~150-line router, state in Zustand | Medium — need to verify localStorage compatibility |
| All 5 `/api/generate/*/route.ts` | Copy-paste clones | 1 dynamic route reading from DOCUMENT_TYPES registry | Low |
| All 9 viewers | Regex-parse markdown → render | Consume typed data → render | High — biggest change, needs testing |
| `shareable-view.tsx` | 1060 lines of duplicate rendering | Deleted; `/share` mounts viewers with `variant="print"` | Medium — print CSS needs validation |
| `findCachedProject` | Module-scope import of 150KB | Async fetch of `public/demo-data/*.json` on title match | Low |

## 4.5 What Stays

Preserve what works:

- `lib/json-trimmer.ts` — the one place in the codebase with exemplary single-responsibility design
- `lib/claude.ts` — 55 lines, correct retry + auth handling (add prompt caching)
- `lib/reports.ts` — minimal, clean persistence layer
- All prompts in `lib/prompts/*.ts` content (move into `lib/documents/*.ts` but keep the wording)
- Gesture Draw LoRA consistency pattern (`lib/image-prompts.ts`)
- `computeInsights` in Cast & Crew viewer (Domain Expert's favorite — it's the strongest A24 artifact)
- Mood & Tone prompt wording ("Write like a thoughtful cinephile, not a marketer")
- 500ms-stagger parallel image generation pattern
- Password gate, theme toggle, all existing microcopy
- DESIGN.md visual language

## 4.6 Technology Changes

**No stack changes recommended pre-interview.** The Outsider's Vite recommendation (Finding O) is P2 and explicitly gated to "after the interview." Post-interview, the stack is not the bottleneck — the patterns are. Fix patterns first.

**Anthropic SDK usage change:** Add prompt caching via `cache_control: { type: "ephemeral" }` breakpoints. Structured output via tool-use replaces markdown response parsing. Both changes are SDK-level, not stack-level.

---

# Phase 5: Blueprint

## 5.1 Migration Strategy

**Strangler Fig** — both waves. New code coexists with old until migration completes. Old code stays working throughout.

- **Wave 1 (pre-interview):** Surgical UX fixes. Scope is intentionally tiny. No structural changes.
- **Wave 2 (post-interview):** Strangler-fig the data layer. Markdown parsers stay until JSON structured output is proven on one document, then migrate one document at a time.

## 5.2 Phase Plan

### Wave 1 — Pre-Interview UX (Ship Day Safety, ~3 hours)

**Goal:** Fix P0/P1 findings A24 would see in a live demo. No structural refactor. Safe to bail at any point.

#### Phase 1.1 — Landing Hierarchy Fix (Domain Finding H)
- [ ] In `components/wizard/step-instructions.tsx:31-100`, invert the hierarchy: demo card becomes hero (large poster thumbnail from NotLD + Identity font treatment), upload/paste collapses to secondary affordance
- [ ] Add second demo card ("or try *Everything Everywhere All At Once* →") that loads the EEAAO cached project
- [ ] Verification: visit `/`, confirm first paint shows 1-2 demo cards prominently before any upload UI
- [ ] Estimated scope: 1 file, ~60 lines changed

#### Phase 1.2 — Wardrobe Matcher Bug (Domain Finding I)
- [ ] In `components/viewers/production-viewer.tsx:137-180`, replace substring token matching with scene-co-presence matching: use `scene.characters_present` + `scene.wardrobe_notes` instead of `upper.includes(token)`
- [ ] Fallback to text match only as tiebreaker
- [ ] Lowercase map keys consistently (fix `matched.name` vs `matched.name.toUpperCase()` drift)
- [ ] Verification: run with EEAAO (has Joy/Joyce/Jobu — token collision risk) and NotLD; confirm no misattributed wardrobe
- [ ] Estimated scope: 1 file, ~40 lines

#### Phase 1.3 — Shuffle/Regenerate Feedback (Domain Finding K)
- [ ] In `mood-and-tone-viewer.tsx:183-201`, `overview-viewer.tsx:114-132`, `identity-viewer.tsx:61-79`: add optimistic skeleton state — fade old content to 40% opacity + shimmer during regen
- [ ] Add checkmark flash or toast on completion
- [ ] For Identity→Mood&Tone cross-tab palette regen (`identity-viewer.tsx`): add inline "palette updated in Mood & Tone" badge or toast
- [ ] Verification: click each regenerate/shuffle button on `/demo`; confirm visible feedback throughout 3-8s latency
- [ ] Estimated scope: 3 files, ~30 lines each
- [ ] **Irreversible flag:** No — pure addition, easy to revert

**Wave 1 Verification Gate:** Full demo run-through. `/` loads fast with demo cards. Open NotLD demo. Click each Shuffle/Regenerate button. Switch to Mood & Tone after palette reshuffle. Open `/demo` EEAAO, verify no wardrobe misattribution. If any issue, revert and ship as-is.

---

### Wave 2 — Post-Interview Structural (After April 17)

**Goal:** Fix HIGH consensus findings A–E. Biggest architectural changes first (where the leverage is).

#### Phase 2.1 — Extract Demo Data (Finding D, safest first)
- [ ] Move contents of `lib/cached-projects.ts` to `public/demo-data/night-of-the-living-dead.json` and `public/demo-data/everything-everywhere.json`
- [ ] Move contents of `lib/demo-project.ts` to `public/demo-data/demo-project.json`
- [ ] Rewrite `lib/cached-projects.ts` as a ~30-line async loader: `findCachedProject(title: string): Promise<SavedProject | null>`
- [ ] Update `wizard-shell.tsx:9` import + await the result
- [ ] Update `/demo/page.tsx` and `/share/page.tsx` to fetch-on-mount
- [ ] Verification: `npm run build` — check `.next/analyze` or route bundle output confirms 230KB drop. Test NotLD + EEAAO demo paths still work.
- [ ] Estimated scope: 3 files deleted/shrunk, 4 files updated, 3 JSON files created

#### Phase 2.2 — Collapse Duplicated API Routes (Finding E)
- [ ] Create `lib/documents/index.ts` registry: `{ [slug]: { prompt, trim } }` for 5 document types
- [ ] Replace `app/api/generate/{overview,mood-and-tone,scene-breakdown,storyboard-prompts,poster-concepts}/route.ts` with single `app/api/generate/[slug]/route.ts` reading from registry
- [ ] Similarly: `app/api/generate-{image,portrait,prop,poster-image}/route.ts` → `app/api/images/[kind]/route.ts` driven by config map
- [ ] Update all client call sites to use new route paths
- [ ] Verification: smoke test all 5 document gen + all 4 image gen paths. Tsc + build clean.
- [ ] Estimated scope: 9 routes deleted, 2 routes created, ~15 call sites updated

#### Phase 2.3 — Extract Project Store (Finding B, foundation for 2.4)
- [ ] Install Zustand (~2KB)
- [ ] Create `lib/stores/project-store.ts` — migrate 16 `useState` from `wizard-shell.tsx:74-97` into typed store
- [ ] Migrate `updateProject`/`saveProject`/`loadProject` from `reports.ts` into store actions
- [ ] Add debounced localStorage persistence (500ms trailing — Optimizer Finding)
- [ ] `wizard-shell.tsx` uses `useProjectStore()` selectors instead of prop drilling
- [ ] Extract `SettingsDialog` component (`wizard-shell.tsx:888-995`)
- [ ] Extract `useImageGeneration` hook (`wizard-shell.tsx:276-544` — both fake + real paths)
- [ ] Target: `wizard-shell.tsx` ≤ 250 lines
- [ ] Verification: full demo + real upload flow. All localStorage reads/writes preserved. No lost state across step transitions.
- [ ] Estimated scope: 1 new store file, 3 new hook/component files, `wizard-shell.tsx` shrinks ~70%
- [ ] **Irreversible flag:** High — touching all state. Commit before starting, test after each extract.

#### Phase 2.4 — Markdown → JSON Migration (Finding A, the Big Idea)
Apply strangler-fig: migrate one document at a time. Start with smallest (Overview).

- [ ] Define Zod schema for `Overview` type in `lib/documents/overview.ts`
- [ ] Update `lib/claude.ts` `generateDocument` to accept optional `schema` param; when present, use tool-use structured output
- [ ] Migrate `overview` document: prompt requests JSON via tool use; route returns typed object; viewer consumes typed data (delete `parseOverview`)
- [ ] Verify Overview tab works identically
- [ ] Repeat for: `storyboard-prompts` → `poster-concepts` → `mood-and-tone` → `scene-breakdown` (smallest to largest)
- [ ] For inline editing: replace `replaceMarkdownSection` + re-parse cycle with direct `setState({...doc, field: newValue})`
- [ ] Update `/api/regenerate-section` to patch JSON fields, not markdown sections
- [ ] Delete `lib/markdown-utils.ts`
- [ ] Verification: after each document migration, full smoke test of that viewer + inline editing + cross-viewer refs (e.g. palette regen from Identity→Mood)
- [ ] Estimated scope: 5 viewers updated, 5 parsers deleted, 1 library file deleted, 1 route updated, 1 module added (claude.ts)
- [ ] **Irreversible flag:** High per-document. Keep old parser as fallback until new path is proven on that document.

#### Phase 2.5 — Unify Shareable View (Finding C)
- [ ] Add `variant: "interactive" | "print"` prop to each viewer (9 files)
- [ ] When `variant === "print"`: hide interactive chrome (buttons, edit icons), expand all collapsibles, apply print-specific Tailwind
- [ ] Extract `<PrintStyles />` from `shareable-view.tsx:1035-1060` to `app/share/page.tsx`
- [ ] Rewrite `app/share/page.tsx` (~50 lines) to mount viewers with `variant="print"` from project store
- [ ] Delete `components/share/shareable-view.tsx` (1060 lines)
- [ ] Verification: `/share` loads identically. `Cmd+P` print output matches current. Dark mode works. TMDB posters render.
- [ ] Estimated scope: 9 files updated with prop, 1 page rewritten, 1 file deleted

**Wave 2 Verification Gate:** Type check passes. Build succeeds. Bundle size drops ≥200KB. All 5 document tabs render. All 4 image types generate. `/share` prints correctly. `/demo` loads cached project. Real PDF upload flow works end-to-end.

---

### Wave 3 — Optional Perspective Items (if time permits, any order)

These were flagged by one agent each. None are blockers.

- **Optimizer G — Add Claude prompt caching:** `cache_control` breakpoints on system prompt + screenplay body. ~40-50% input cost reduction. 1 file (`lib/claude.ts`), ~10 lines.
- **Optimizer M — Dedupe TMDB fetches:** Create `useTmdbPosters()` hook with module-level `Map` cache. ~2 files.
- **Optimizer N — Bundle optimization:** Deep-import lucide icons; dynamic-import `DocumentViewer` (lazy-loads react-markdown).
- **Domain J — Poster palette honesty:** Either drop palette from sketch card OR skip Gesture Draw LoRA for posters + use palette in FLUX prompt for risograph-style output. Product decision required.
- **Domain L — "Retry failed images":** Track failures during batch gen; show "3 failed — retry?" post-run action. ~30 lines in `useImageGeneration`.

## 5.3 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Wave 1 landing hierarchy breaks existing demo path | Low | High (ship day) | Test `/` + `/demo` + `/share` after each change. Revert if ambiguous. |
| Wave 1 wardrobe matcher regresses on NotLD (all-caps names that work today) | Medium | Medium | Preserve all-caps path as fallback. Test both cached projects before commit. |
| Wave 2.1 localStorage reads break when demo data becomes async | Medium | High | Handle `null` during fetch; show skeleton state. Verify hydration flow. |
| Wave 2.3 Zustand migration loses state across step transitions | Medium | High | Preserve localStorage schema exactly. Test each step transition after migration. |
| Wave 2.4 JSON structured output fails on edge-case screenplays | High | Medium | Keep markdown parsers as dead code for one session. Compare JSON vs. markdown outputs on 3 screenplays before deleting parsers. |
| Wave 2.5 print CSS breaks with new variant prop | Low | Medium | Print tests on NotLD + EEAAO + a real upload. Compare current `/share` PDF to new `/share` PDF side-by-side. |

## 5.4 What This Doesn't Cover

**Intentionally deferred:**
- Multi-project support (backlog item; not needed for portfolio)
- Image persistence / backup when fal.ai CDN URLs expire
- Testing infrastructure revival + CI pipeline
- Accessibility audit (`/a11y-audit`)
- Stack migration to Vite (Outsider's post-interview suggestion)

**Needs more investigation:**
- Whether Claude tool-use JSON structured output maintains the prose quality of the current markdown outputs (especially for Mood & Tone "cinephile voice"). Spike required before committing to Phase 2.4.
- Whether the poster palette is salvageable as a driver for FLUX prompts or should be cut entirely (Domain Finding J).

**Depends on external factors:**
- A24 interview outcome — if the conversation goes a direction that suggests different priorities, re-prioritize Wave 2.
- How much post-interview energy is available — Wave 2 is multi-session; prioritize 2.1 + 2.2 (highest leverage, lowest risk) if time is scarce.

## 5.5 Next Steps

1. **Review the blueprint** — mark any phases to skip or reorder. Wave 1 is designed to be independently valuable; stopping after Phase 1.1 still leaves the project better than today.
2. **Run `/executing-plans`** on Wave 1 to start ship-day fixes step-by-step. Budget: ~3 hours total, one sitting.
3. **After April 17:** decide on Wave 2 scope based on interview outcome. Phase 2.1 (extract demo data) is the safest, highest-leverage first structural move — recommended regardless of direction.

---

## Appendix: Key Files Referenced

- `components/wizard/wizard-shell.tsx` (1001 lines — god component)
- `components/share/shareable-view.tsx` (1060 lines — duplicate rendering tree)
- `components/viewers/scene-breakdown-viewer.tsx` (1008 lines)
- `components/viewers/mood-and-tone-viewer.tsx`, `poster-concepts-viewer.tsx`, `cast-and-crew-viewer.tsx`, `production-viewer.tsx`
- `components/wizard/step-instructions.tsx`, `step-results.tsx`
- `lib/cached-projects.ts` (150KB inline JSON), `lib/demo-project.ts` (82KB)
- `lib/prompts/*.ts` (6 files), `lib/json-trimmer.ts` (exemplary pattern)
- `lib/claude.ts`, `lib/reports.ts`, `lib/markdown-utils.ts`, `lib/image-prompts.ts`, `lib/schema.ts`
- `app/api/generate/*/route.ts` (5 near-identical), `app/api/generate-{image,portrait,prop,poster-image}/route.ts` (4 near-identical)
- `app/api/regenerate-section/route.ts`, `app/api/tmdb-search/route.ts`
- `app/page.tsx`, `app/demo/page.tsx`, `app/share/page.tsx`, `app/layout.tsx`
