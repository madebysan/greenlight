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

### Bonus-round samples (pre-cached but NOT shown in the public picker)

**⚠️ This is the LAST step.** Do not start this until the full app is working end-to-end with Night of the Living Dead at the quality bar we want. The A24 validation pipeline depends on knowing what "good output" looks like, which we can only define after NotLD is locked in.

**The task: test 6 A24 scripts through the full Gemini → JSON → Greenlight pipeline.**

Process for each script:
1. Source the PDF
2. Upload to Gemini (or Claude) with the extraction prompt → get JSON
3. Time how long extraction takes
4. Paste JSON into Greenlight → generate full bible
5. Time how long the full generation takes (document gen + image gen)
6. **Review every tab manually.** Does the output make sense? Is the Mood & Tone tab actually good? Do the characters, locations, and scene breakdowns feel right? Are the generated images usable?
7. Mark the script as PASS (ready to use as a bonus sample) or FAIL (don't use — output was weak, Gemini crashed, or something looked off)

**Acceptance criteria:**
- End-to-end processing time ≤ 2 minutes is totally fine
- Output quality must match the Night of the Living Dead bar — nothing embarrassing, nothing generic, no obvious hallucinations
- Gemini must not crash or refuse the script
- The goal is to have **2–3 confirmed-good A24 options** to offer live in the interview, selected from the 6 tested

Candidates to test (all 6):
- Ex Machina (2014) — already tested informally, cerebral sci-fi
- The Witch (2015) — period horror, Mood & Tone showcase
- Hereditary (2018) — family drama/horror
- Midsommar (2019) — bright horror, incredible mood potential
- Moonlight (2016) — intimate character drama
- The Lighthouse (2019) — B&W, two-hander, contained
- (Swap in Aftersun or another A24 film if any of the above are hard to source or fail validation)

**Storage & safety:**
- Pre-cached A24 output goes in `.cache/` keyed by slug, same as NotLD
- The A24 JSONs themselves must NOT live in `lib/sample-data.ts` or anywhere that could get committed/deployed — store in a gitignored directory (e.g., `.a24-scripts/`) loaded only when explicitly triggered
- Add `.a24-scripts/` to `.gitignore` before any A24 script touches the filesystem

**Open question:** how are these surfaced in the UI during the demo? Hidden keyboard shortcut? URL flag (`?bonus=1`)? Dev-only menu only visible on localhost? Or just JSON files on disk san pastes manually into the upload flow? Decide during the plan step.

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
