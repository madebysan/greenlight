# Greenlight

A pre-production bible generator for filmmakers. Upload structured screenplay JSON, and Greenlight produces five department-ready documents plus AI-generated storyboards, character portraits, prop references, and poster concepts — all from a single input file.

Built as a portfolio piece targeting A24's creative team. See [presentation.md](../presentation.md) for the full framing.

## Quick Links

- [Architecture](Architecture.md) — how the system is designed
- [Getting Started](Getting-Started.md) — set up and run the project
- [Project Structure](Project-Structure.md) — what's in each folder
- [Core Concepts](Core-Concepts.md) — key abstractions and terminology
- [Data Flow](Data-Flow.md) — how screenplay JSON becomes a bible
- [Design Decisions](Design-Decisions.md) — why things work this way

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 + React 19 | App router, API routes, SSR |
| Styling | Tailwind CSS 4 + shadcn/ui | Design system, component primitives |
| Document Gen | Claude Haiku 4.5 (Anthropic) | Generates 5 markdown documents from screenplay JSON |
| Image Gen | FLUX dev + Gesture Draw LoRA (fal.ai) | B&W gesture sketches for storyboards, portraits, props, posters |
| Film Data | TMDB REST API | Poster lookups for Similar Moods + Soundtrack References |
| Fonts | Google Fonts catalog (1929 families) | Title treatment feature |
| Persistence | localStorage + file-based cache | Single-project, no backend |

## Status

Active development. Portfolio demo at `/demo` with Night of the Living Dead as the sample screenplay.

---

*Last generated: 2026-04-12*
