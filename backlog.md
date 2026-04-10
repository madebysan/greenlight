# Backlog

Items to explore or implement later. Organized by topic.

## Theming
- **Dark / light mode switcher** — app is dark-only right now, needs toggle (required, not optional)

## Sample Data
- More pre-imported example JSONs covering different formats — keep upload flow as-is (avoids wasted API spend), but showcase the tool's range:
  - 1 short film
  - 1 commercial / ad
  - possibly: music video, doc short, TV pilot cold open
  - Current samples live in `lib/sample-data.ts` as exported consts

## Deployment & Sharing
- **Deploy to Vercel (public)** — let others try the tool
  - Hardcode FAL_KEY (image gen is cheap ~$0.003/image)
  - Require users to bring their own ANTHROPIC_API_KEY (doc gen is the costly part)
  - Revisit the Vercel-removal decision — the cache is the blocker; could move to Vercel Blob or just lose server-side caching and rely on browser
- **Share button** — generate read-only URL of a completed bible to send to collaborators
  - Read-only viewer shouldn't require an API key
  - Store shared bibles in Vercel Blob (matches existing pattern from other projects)
- **Routed demo instances** — if we simplify to single-project mode (see below):
  - `site.com/diehard` (or similar) → premade bible as permanent showcase
  - `site.com/demo` → JSON pre-loaded in code but not yet processed, for try-it-out
  - `site.com/new` → blank slate for actual use

## Architecture Simplification
- **Drop multi-project sidebar** — focus on one project at a time
  - Removes state complexity, makes Vercel deploy cleaner
  - Pairs naturally with routed demo instances above
  - Trade-off: lose ability to hop between multiple bibles in one session — worth it if multi-project is painful to maintain

## Export
- **PDF export** — current MD export handles text fine but loses generated images (storyboards, posters, portraits). PDF would bundle everything into one shareable file.
  - (Existing MD export stays as-is for text-only workflows)

## Scene Breakdown
- Drag-to-reorder scenes
- Insert scene between existing scenes (not just append)

## Production
- Scheduling sub-tab (shooting schedule estimates)
- Budget estimate sub-tab
- Permits tracking

## Marketing Brief
- Key Art Direction — teaser imagery, social assets, trailer beat sheet, title treatment style

## Storyboard
- Batch download all generated storyboard images as ZIP

## Posters
- Batch download all poster sketches as ZIP

## General / UX
- Keyboard shortcuts for navigation between tabs
- Undo/redo for edits
