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

**Kill Jaws and Ex Machina.** Don't want to signal "I'm uploading studio scripts into an LLM" to anyone from A24 or Universal seeing this tool. Replace with scripts that are legally safe to showcase — public domain, Creative Commons, or synthetic/original.

Target mix to showcase range:
- 1 open-source / CC-licensed short film
- 1 public-domain feature (classic, recognizable, clearly out of copyright)
- 1 synthetic commercial / ad spec (original, nothing to infringe)
- Stretch: 1 music video spec, 1 doc short

Sample data lives in `lib/sample-data.ts` as exported const strings.

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
