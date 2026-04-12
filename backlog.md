# Backlog

Items to explore or implement later. Organized by topic.

Framing: Greenlight is a **0→1 tool for indie filmmakers and freelancers**. It is not a production management tool. It is not for studios. It is not for festivals. Everything in this backlog should serve the "turn a script into something tangible, fast" mission. See `README.md` for the full positioning.

---

## Tab Restructure (the big move)

Full rethink of the tab architecture to match the indie-filmmaker framing. Current tabs are production-company-flavored; new structure is job-to-be-done-flavored.

**Kill:**
- Marketing Brief (as currently structured) — festival strategy, distribution, pitch deck, social hooks, casting wishlist are all out of scope. The useful bits (logline, synopsis, comparables, taglines) move to Overview.
- Production Matrices (crew breakdowns, department lists) — that's a real production team's output, wrong phase.

**New / renamed tabs:**

1. **Overview** *(new — this is the biggest gap today)*
   - Logline, synopsis, genre, format, themes
   - Comparable films ("it's X meets Y")
   - Scope-at-a-glance: X scenes, X unique locations, X characters, complexity read
   - First thing anyone opens — the elevator pitch
   - Absorbs: Film Identity + Logline + Synopsis + Taglines + Comparables (currently inside Marketing Brief)

2. **Mood & Tone** *(new — Greenlight's biggest differentiator)*
   - Text-driven, built from the mood of the film. Nailing the "comparable films" step upstream powers this tab.
   - Style narrative (1–2 paragraphs of prose describing the look and feel)
   - Color palette — **shuffleable** until you land on the right one (generate variants, re-roll, pick)
   - Music direction (keeps from current marketing brief)
   - Reference adjectives / descriptors — terms and labels rather than scraped screenshots (scraping flim.ai is not worth it)
   - Tone imagery — 4–6 FLUX-generated mood frames, same consistent style as posters
   - Open question: how much of the palette should come from the tone images vs. generated independently?
   - Potential data source: cinemateca project has `scripts/checkpoints/similar-films-checkpoint.json` (keyed by TMDB ID, with title/year/reason per comparable). Not a direct matcher for an arbitrary script, but could be mined as grounding data for comparable-film logic later. Worth exploring once the basic tab works.

3. **Scenes** *(renamed from Scene Breakdown)*
   - Per-scene table, simplified
   - Framed as "the map of your film," not as a production spreadsheet
   - Less corporate, more legible

4. **Locations** *(new — pulled out of scenes)*
   - Unique locations grouped
   - Per location: scenes shot there, int/ext, time of day, key visual moments
   - Answers "how complicated is this really?" for the production team

5. **Cast & Crew** *(new — replaces Characters)*
   - **Cast** = characters in the film (not actors). Character list with AI-generated portraits, brief bios/arcs, which scenes they appear in.
   - **Crew** = *roles* the film will require, scoped to the film's ambition. Not about assigning real people — about getting a sense of which departments and roles you'll need to fill.
     - Roles are addable/removable so the user can tune the scope
     - E.g., small short = director, DP, sound, 1 PA. Feature = full department heads.
     - Claude should suggest a starting set based on scene complexity, VFX presence, cast size, locations, etc.

6. **Visuals** *(merges Storyboard + Posters)*
   - Sub-sections: Storyboards / Poster Concepts
   - Framed as discussion starters for the art team, not final deliverables
   - Existing generation logic survives unchanged, just rehoused

**Open questions for later:**
- Should Cast & Crew be one tab with two sub-sections, or two separate tabs?
- Should Mood imagery live in Mood & Tone or Visuals? (Leaning Mood & Tone — different purpose from storyboards)
- Cache invalidation: renaming slugs breaks the `.cache/` keys. Either rename slugs carefully with a migration, or accept that Jaws/Ex Machina need to be regenerated post-restructure (they're being replaced anyway — see Sample Data below).

---

## Sample Data

See `presentation.md` for full context. The demo narrative is: *"I can show you how it works with a script I already converted into JSON. It's Night of the Living Dead. ...btw, we could try it with an A24 script if you want."*

**Kill Jaws and Ex Machina from the public sample picker.** Replace with:

### Primary sample (baked into the public UI)
- **Night of the Living Dead** (1968, George A. Romero) — public domain
  - The hero sample, shown first in every demo
  - Pre-cached output so the demo is instant
  - Philosophically aligned: the original indie horror, zero-budget feature, the spiritual ancestor of what A24 does today
  - Strong visual identity (black & white, claustrophobic, rural horror) → Mood & Tone tab will look great

### Optional variety samples (only if time allows)
- 1 CC-licensed short (Sintel or Tears of Steel) — shows tool handles short-form work, community-legitimate
- 1 synthetic commercial / ad spec — shows format flexibility, zero IP risk

Sample data lives in `lib/sample-data.ts` as exported const strings. A24 scripts should NOT live in this file (risk of accidental commit / deploy) — they should live in a gitignored directory loaded at runtime only when explicitly triggered.

---

## Theming

- **Dark / light mode switcher** — app is dark-only right now, needs toggle (required, not optional)

---

## Deployment & Sharing

- **Deploy to Vercel (public)** — let others try the tool
  - Hardcode `FAL_KEY` (image gen is cheap ~$0.003/image, acceptable to absorb)
  - Require users to bring their own `ANTHROPIC_API_KEY` (doc gen is the costly part)
  - Revisit the Vercel-removal decision — file-based cache is the blocker; options: move cache to Vercel Blob, or lose server-side caching and rely on browser localStorage
- **Share button** — generate read-only URL of a completed bible to send to collaborators
  - Read-only viewer shouldn't require an API key
  - Store shared bibles in Vercel Blob (matches existing pattern from other projects)
- **Routed demo instances** — pairs with single-project architecture below:
  - `site.com/<slug>` → premade bible as permanent showcase (e.g., the public-domain feature sample)
  - `site.com/demo` → JSON pre-loaded in code but not yet processed, for try-it-out
  - `site.com/new` → blank slate for actual use

---

## Architecture Simplification

- **Drop multi-project sidebar** — focus on one project at a time
  - Removes state complexity, makes Vercel deploy cleaner
  - Pairs naturally with routed demo instances above
  - Trade-off: lose ability to hop between multiple bibles in one session — worth it if multi-project is painful to maintain post-Vercel-deploy

---

## Export

- **PDF export** — current MD export handles text fine but loses generated images (mood frames, storyboards, posters, portraits). PDF would bundle everything into one shareable file.
  - Existing per-document MD export stays as-is for text-only workflows
  - **Partially shipped:** `/share` route is a full-bible print-friendly page — Cmd+P → Save as PDF works. Not yet wired into a single "Export PDF" button with programmatic generation.

- **Export / Import project as .greenlight.zip** — save full project state to a file, drop it back in later to restore.
  - **Export** creates a `.zip` with:
    - `greenlight-project.json` — the full `SavedProject` (screenplay JSON + all generated markdown + image URL references + prompt overrides + disabled items + title font selection)
    - `screenplay.json` — standalone copy of the raw Stage-0 extraction for human readability
    - `overview.md`, `mood-and-tone.md`, `scene-breakdown.md`, `storyboard-prompts.md`, `poster-concepts.md` — individual markdown files, extracted for people browsing the zip in Finder
    - `README.txt` — short note explaining what the file is and how to re-import
  - **Import** reads the zip, parses `greenlight-project.json`, overwrites `localStorage[greenlight-project]`, reloads the app
  - **File format v1 — Option A (URL-only):** image URLs point at `/api/serve-image/...` as-is. Works on the same machine because `.cache/images/` is untouched. Cross-machine images 404 (regenerate via "Generate all images"). Ship this first — 80% of the value, minimal effort.
  - **File format v2 — Option C2 (images in zip + dev-only import API):** zip includes images; import API writes them to `.cache/images/`. Lets you move a project between machines via USB / Dropbox. Dev-only because Vercel filesystem is read-only at runtime.
  - **File format v3 — Option C1 (images in zip + IndexedDB):** images unpacked into browser IndexedDB, viewers resolve IDs to blob URLs. Works cross-machine *and* in production. Biggest refactor — every `<img>` tag needs to route through a resolver.
  - **PDF in the export:** skip it. No client-side API generates a PDF of the print dialog's output. If needed, user runs `/share` → Print → Save as PDF as a separate step.
  - **Dependency:** `jszip` (~90KB gzipped) for both export and import.
  - **Priority:** zero demo value (nobody clicks this in a 5-minute walkthrough) but real indie-filmmaker value. Backlogged until after the interview.

---

## Smaller enhancements (still in scope)

### Scenes (formerly Scene Breakdown)
- Drag-to-reorder scenes
- Insert scene between existing scenes (not just append)

### Visuals
- Batch download all storyboard images as ZIP
- Batch download all poster sketches as ZIP

### General / UX
- Keyboard shortcuts for navigation between tabs
- Undo/redo for edits

---

## Added 2026-04-12

### Upload Script tab (end-to-end script→bible)
- [ ] Add "Upload script" tab alongside "Paste JSON" in step-json-input — user drops a PDF, Claude Sonnet extracts the JSON, pipes into existing generation pipeline
- [ ] Design thinking completed (session 4): PDF-only v1, Claude Sonnet 4.6 via document content block (no pdf-parse needed), ~$0.45/extraction, 60-90s latency, additive tab (remove if quality isn't there)
- [ ] Full design notes in plan.md session 3 / conversation history

### Image generation
- [ ] Expose model/LoRA picker in Settings (let users choose cost/quality tradeoff — schnell for cheap, dev+LoRA for quality)
- [ ] Per-kind model override (e.g., ultra for posters only, dev+LoRA for storyboards)
