# Changelog

All notable shipped features and changes, organized by date.
Updated every session via `/save-session`.

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
