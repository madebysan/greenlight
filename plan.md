# Greenlight

AI-powered pre-production bible generator. Takes structured JSON from a screenplay and generates 5 production documents with AI image generation.

---

## Done this session (2026-04-10)

Full app built and working locally. Renamed from "Script to Production" to "Greenlight". All 5 document tabs functional with editing, image generation, and persistence. Dark mode with Runway-inspired design. Settings and About dialogs added.

## Current state
- Build status: passing
- Dev server: port 3001
- Directory: ~/Projects/greenlight/
- Cached Jaws + Ex Machina results in .cache/
- All images saved to .cache/images/ and persist with projects

## Next steps
- [ ] Further design polish (spacing, animations, micro-interactions)
- [ ] Scene Breakdown: consider drag-to-reorder scenes
- [ ] Production tab: consider scheduling/budget estimate sub-tabs
- [ ] Export: PDF export option for production documents
- [ ] Key Art Direction section for Marketing Brief (teaser imagery, trailer beat sheet)

## Decisions & context
- Local-only app (removed Vercel deployment — file-based cache doesn't work on serverless)
- API keys entered via Settings dialog (stored in localStorage, fallback to .env.local)
- FLUX Schnell for all image gen (~$0.003/image) — consistent B&W marker style across storyboards, posters, portraits
- Claude Haiku 4.5 for document generation, 16384 max tokens
- Space Grotesk + Space Mono fonts
- Reports stored in localStorage keyed as "stp-reports" (legacy key name)

## Dependencies added
- `@fal-ai/client` — fal.ai SDK for FLUX Schnell image generation
- Space Grotesk + Space Mono (Google Fonts via next/font)
