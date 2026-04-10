# Greenlight — Implementation Plan

## Overview

Greenlight is a **portfolio / demo project for an A24 creative team interview.** Every decision optimizes for "will this make A24 lean forward?" — not feature completeness, not test coverage, not production-grade anything. See `presentation.md` for the full context.

This plan takes the project from its current state (5 production-heavy tabs, multi-project sidebar, Jaws/Ex Machina samples) to the intended interview-ready state (6 indie-filmmaker-flavored tabs, single-project, Night of the Living Dead as primary sample, A24 scripts pre-cached in reserve).

## Chosen approach

Six sequential phases. Phases 1–4 must happen in order. Phases 5–7 can be shuffled or skipped based on time before the interview.

**Working in parallel:**
- san is processing the Night of the Living Dead screenplay through Gemini to produce the input JSON
- Claude is simplifying the app architecture and restructuring tabs using existing cached Jaws/Ex Machina data as scaffolding. Once NotLD JSON is ready, it slots in as the primary (and only) sample

**Not touching:** the extraction prompt at `lib/prompts/stage-0.ts`. It works. Don't risk it.

---

## Phase 1 — Rip out multi-project architecture

**Goal:** Single-project app. No sidebar. Clean state model.

**Why first:** Clears the decks. Every subsequent phase (tab restructure, sample replacement, polish) gets simpler once there's only ever one project in view. Hiding the sidebar would leave dead code rotting under the surface — full rip is cleaner for a codebase that's about to grow.

### Tasks

- [ ] Read current app structure: find sidebar component, project list, state management, localStorage keys (`stp-reports`)
- [ ] Map every call site that touches multi-project state (project switcher, "New Project" action, per-project routing)
- [ ] Design a minimal header to house the displaced sidebar items:
  - Greenlight logo / title (top-left)
  - Settings button (top-right)
  - About button (top-right)
  - Start Over button (resets state, returns to paste-JSON screen)
- [ ] Delete sidebar components and the project list UI
- [ ] Simplify state: one active project at a time, single localStorage slot
- [ ] Replace "New Project" flow with "Start Over" (wipes current state, returns to paste-JSON)
- [ ] Verify: fresh load, paste-JSON flow, generation, edit, reset — all work on a single project
- [ ] Verify: existing cached Jaws/Ex Machina data either loads or is gracefully discarded (doesn't need to be preserved — it's test data)

### Acceptance criteria

- No sidebar visible anywhere
- Settings, About, and Start Over are reachable from the header
- No references to "current project" vs "other projects" in the code
- App runs clean after a full localStorage wipe

---

## Phase 2 — Tab restructure

**Goal:** Replace the 5 production-heavy tabs with the 6 indie-filmmaker-flavored tabs. Shell only — content comes in Phase 3.

**Why second:** With the sidebar gone, the tab bar becomes the primary navigation. Getting the structure right before filling it means we don't rebuild viewers twice.

### New tabs (in walkthrough order)

1. **Overview** *(new)* — logline, synopsis, genre/format/themes, comparables, scope-at-a-glance
2. **Mood & Tone** *(new)* — style narrative, color palette (shuffleable), music direction, reference adjectives, tone imagery
3. **Scenes** *(renamed from Scene Breakdown)* — per-scene map, simplified
4. **Locations** *(new, pulled out of scenes)* — unique locations with scenes/int-ext/time-of-day/key visuals
5. **Cast & Crew** *(new)* — Cast = characters with AI portraits; Crew = scope-based role list (addable/removable)
6. **Visuals** *(merges Storyboard + Posters)* — sub-sections for Storyboards and Poster Concepts

### Tasks

- [ ] Create new viewer components for Overview, Mood & Tone, Locations, Cast & Crew
- [ ] Rename Scene Breakdown viewer → Scenes viewer (and simplify its presentation — less spreadsheet, more map)
- [ ] Merge Storyboard + Posters viewers into a single Visuals viewer with sub-tabs
- [ ] Update `TAB_LABELS` map in `components/wizard/step-results.tsx`
- [ ] Update the tab slug list everywhere it's referenced (generation pipeline, cache keys, downloads)
- [ ] Kill Marketing Brief viewer and Production Matrices viewer (useful content moves to Overview / Mood & Tone / Cast & Crew)
- [ ] Preserve the existing editing, regeneration, and image-generation plumbing — rehouse, don't rewrite

### Acceptance criteria

- 6 tabs visible, in the new order
- Each tab renders (even if with placeholder content)
- Old tabs are completely gone, not hidden
- Cache keys are updated so old cached output doesn't leak in

---

## Phase 3 — Tab content & generation prompts

**Goal:** Each tab produces real content from the input JSON. This is the bulk of the work.

Most generation happens server-side via Claude prompts at `lib/prompts/*.ts`. The existing scene-breakdown, marketing-brief, production-matrices, storyboard-prompts, and poster-concepts prompts get repurposed, retired, or merged.

### Per-tab breakdown

**Overview**
- [ ] Create `lib/prompts/overview.ts` — logline, synopsis, themes, comparables, scope stats, genre/format summary
- [ ] Absorbs the Film Identity / Logline / Synopsis / Taglines / Comparables sections from the old Marketing Brief prompt
- [ ] Viewer: clean hero layout with big logline, readable synopsis, themed scope stats cards
- [ ] Editable inline

**Mood & Tone** *(the differentiator tab — prioritize polish)*
- [ ] Create `lib/prompts/mood-and-tone.ts` — style narrative prose, color palette (5–6 colors with names), music direction, reference adjectives, tone descriptors
- [ ] Add "shuffle palette" action — re-roll the color palette until satisfying
- [ ] Generate 4–6 FLUX tone/mood images in the same B&W marker style as existing assets
- [ ] Viewer: prose at top, palette in the middle (clickable swatches), tone images grid, music direction and adjectives at the bottom
- [ ] Open question: should tone imagery use a different visual style than storyboards? Probably yes — needs to feel like reference, not storyboard. Decide during implementation.

**Scenes**
- [ ] Reuse existing scene-breakdown prompt and viewer; simplify visual presentation (less spreadsheet, more "map of the film")
- [ ] Keep add/edit/delete scene functionality

**Locations**
- [ ] Create `lib/prompts/locations.ts` OR derive client-side from the already-extracted `locations` array in the input JSON (no new generation needed — just grouping + a one-line Claude description per location for color)
- [ ] Viewer: location cards with scenes listed, int/ext/time-of-day tags, key visual moments extracted from associated scenes

**Cast & Crew**
- [ ] Split into two sub-sections: Cast (characters) and Crew (roles)
- [ ] Cast: reuses existing character data + AI portrait generation. Each character card has name, arc, scenes present, portrait, editable
- [ ] Crew: new — Claude suggests a starting role list based on scene count, VFX presence, cast size, location count, etc. User can add/remove roles. Create `lib/prompts/crew-scope.ts`
- [ ] Viewer: two-column or sub-tabbed layout

**Visuals**
- [ ] Merge existing storyboard-viewer and poster-concepts-viewer into one Visuals viewer with two sub-tabs
- [ ] Preserve all existing generation, editing, regeneration, and image persistence logic — do not rewrite the FLUX integration
- [ ] Keep the felt-tip marker style consistent across everything

### Acceptance criteria

- All 6 tabs produce real content when you load a project JSON (using Jaws/Ex Machina as scaffolding until NotLD JSON is ready)
- Editing, regeneration, and image generation all still work
- Nothing in the UI looks like a generic SaaS dashboard — Runway/Linear/Arc tier polish or better

---

## Phase 4 — Night of the Living Dead as the primary sample

**Goal:** NotLD is hardcoded as the only sample. Pre-cached output so the demo is instant.

**Depends on:** san delivering the NotLD JSON file.

### Tasks

- [ ] Replace `JAWS_JSON` and `EX_MACHINA_JSON` in `lib/sample-data.ts` with `NIGHT_OF_THE_LIVING_DEAD_JSON`
- [ ] Update the sample picker in the paste-JSON screen to show only NotLD (or remove the picker entirely and auto-load it as the default)
- [ ] Run full generation against the NotLD JSON (all 6 tabs)
- [ ] Pre-cache every tab's output in `.cache/` keyed by the NotLD slug
- [ ] Pre-generate all tone images, storyboards, posters, and character portraits
- [ ] Commit the cached output to disk (or at least have it sitting there locally — decide based on whether the Vercel deploy is happening)
- [ ] Iterate on the actual output until every tab is at the "A24 lean-forward" quality bar

### Acceptance criteria

- Loading NotLD is instant (cache hit every time)
- Every tab's output is reviewed and locked in
- No "regenerate me" is required to see the full demo

---

## Phase 5 — Polish pass

**Goal:** Make it feel like a crafted tool, not a prototype.

### Tasks

- [ ] Dark / light mode switcher (dark default, matches A24's aesthetic)
- [ ] Typography, spacing, motion pass — tab transitions, card hover states, micro-interactions
- [ ] Empty states, loading states, error states — make sure nothing ugly surfaces on the happy path
- [ ] Icon audit — consistent weight, size, color
- [ ] Keyboard shortcuts for tab navigation (low-priority but cheap to add)
- [ ] Review every screen against `presentation.md` non-negotiables

---

## Phase 6 — Deploy to Vercel *(optional)*

**Goal:** Shareable URL, public demo. Only if san wants a teaser link to send before the interview.

### Tasks

- [ ] Restore Vercel compatibility — the `.cache/` filesystem pattern doesn't work on serverless. Options:
  - Migrate cache to Vercel Blob
  - Drop server-side caching and rely on pre-baked JSON committed to the repo
- [ ] Hardcode `FAL_KEY` in environment variables (image gen is cheap, acceptable to absorb)
- [ ] Require users to bring their own `ANTHROPIC_API_KEY` via Settings dialog
- [ ] Test the full flow on the deployed URL before sending

### Acceptance criteria

- Public URL loads NotLD bible instantly without requiring the user to type any keys
- "Start Over" / "Paste new JSON" flow works if a user wants to try their own script

---

## Phase 7 — A24 bonus-round validation *(the last step)*

**Goal:** 2–3 A24 scripts pre-cached as the bonus round, held in reserve.

**Depends on:** Phases 1–5 complete. Cannot start until the app is fully working with NotLD at the quality bar we want.

See `backlog.md` → Sample Data → Bonus-round samples for the full validation checklist. Summary:

- [ ] Source PDFs for 6 A24 scripts (candidates: Ex Machina, The Witch, Hereditary, Midsommar, Moonlight, The Lighthouse)
- [ ] For each: extract via Gemini → time it → paste into Greenlight → generate → time it → review every tab manually → mark PASS/FAIL
- [ ] Pick the 2–3 best-performing scripts
- [ ] Pre-cache their output in `.cache/`
- [ ] Store the JSONs in a gitignored directory (e.g., `.a24-scripts/`) — NOT in `lib/sample-data.ts`, NOT committed to git, NOT shipped to Vercel
- [ ] Surface them in the UI via a hidden keyboard shortcut or URL flag (e.g., `?bonus=1` reveals a secondary menu). Decide the exact mechanism during implementation.

### Acceptance criteria

- 2–3 A24 scripts loadable instantly during the interview via a non-obvious trigger
- Output quality matches the NotLD bar
- Zero A24 IP is accessible via the public URL without the hidden trigger

---

## Next steps (immediate)

- [ ] **(Claude)** Start Phase 1 — audit the current sidebar + multi-project state, propose the header redesign, then execute the rip-out
- [ ] **(san)** Run the Night of the Living Dead screenplay through Gemini to produce the input JSON
- [ ] **(Claude)** Begin Phase 2 once Phase 1 is clean (tab shell restructure, using existing Jaws/Ex Machina as scaffolding)
- [ ] **(san + Claude)** Drop in NotLD JSON once ready; switch to it as the scaffolding sample

## Open questions

- **Interview lead time?** Sets the scope ceiling — if it's days not weeks, Phase 5 polish collapses into Phases 2–4 inline and Phases 6–7 get cut.
- **Specific role inside A24 creative team?** Sharpens which tabs to prioritize polish on.
- **Public Vercel URL before or after the interview?** Determines whether Phase 6 is in scope.
- **A24 bonus round UI trigger mechanism?** Keyboard shortcut? URL flag? Dev-only menu? Decide during Phase 7.
- **Mood & Tone imagery visual style** — same B&W marker style as storyboards, or something distinct that feels like "reference" instead of "production art"? Decide during Phase 3.
