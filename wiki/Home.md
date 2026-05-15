# Greenlight

Greenlight is a Next.js film-deck generator that turns structured screenplay JSON into a dark, editorial vision deck for early film development. It is built for the moment after a script exists but before a producer, DP, designer, or collaborator has a shared visual language for the film.

## Quick Links

- [Explained Simply](ELI5.md) - a plain-English tour of the product
- [Architecture](Architecture.md) - how the app, APIs, fixtures, and demos fit together
- [Getting Started](Getting-Started.md) - install, run, and generate locally
- [Project Structure](Project-Structure.md) - what each folder is for
- [Core Concepts](Core-Concepts.md) - the product vocabulary and data model
- [Data Flow](Data-Flow.md) - live generation, demo generation, and share flows
- [Design Decisions](Design-Decisions.md) - why the current architecture works this way

## Current Product State

Greenlight is currently a six-demo portfolio product plus a live generator. The major recent shift is a genre-aware report pipeline: demo text no longer comes from one reusable production vocabulary. The local fixture builder now reads genre, tone, period, themes, locations, and props before choosing a writing lane.

## Demo Routes

| Demo | Route | Fixture |
|---|---|---|
| Night of the Living Dead | `/demo` | `lib/demo-project.ts` |
| Get Out | `/demo/get-out` | `lib/demos/get-out.ts` |
| Dune: Part One | `/demo/dune-part-one` | `lib/demos/dune-part-one.ts` |
| The Favourite | `/demo/the-favourite` | `lib/demos/the-favourite.ts` |
| Past Lives | `/demo/past-lives` | `lib/demos/past-lives.ts` |
| The Red Balloon | `/demo/red-balloon` | `lib/demos/red-balloon.ts` |

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web app | Next.js 16 App Router, React 19 | Main product, demo routes, API handlers |
| Styling | Tailwind CSS 4, shadcn-style primitives | Dark editorial report UI |
| Text generation | Claude, OpenAI-compatible, DeepSeek, Gemini | Report sections and regeneration |
| Image generation | fal.ai FLUX LoRA using Gesture Draw | Storyboards, portraits, props, posters |
| Film references | TMDB API | Poster thumbnails for mood references |
| Local persistence | Browser `localStorage` | One active project, keys, prompt overrides |
| Demo persistence | TypeScript fixture modules and committed images | Public demo routes and share routes |
| Evaluation | `prompt-tests/` scripts | Prompt comparisons, fixture builds, visual QA |

## Status

Active portfolio/demo project. The hosted deployment is intentionally not advertised in the public README because fresh generation may depend on user-supplied provider keys or san's private setup.

## Last Generated

2026-05-15

