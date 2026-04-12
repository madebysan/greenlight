<h1 align="center">Greenlight</h1>
<p align="center">Script to vision deck in minutes.<br>
A conversation starter for filmmakers, not a production tool.</p>
<p align="center"><code>Next.js</code> <code>React 19</code> <code>Tailwind CSS 4</code> <code>Claude API</code> <code>FLUX + Gesture Draw LoRA</code></p>

![Greenlight demo — Night of the Living Dead](public/screenshot.png)

---

## What This Is

You have a script. Now what?

Greenlight helps you answer that question. You paste structured screenplay data and within minutes you have a vision deck — mood, visual references, storyboard sketches, poster concepts, and a sense of scope. Something tangible to put in front of collaborators before you have a crew, a schedule, or a budget.

It's not a production management tool. It's the thing that helps you figure out what the film *is* before you figure out how to make it.

## Who It's For

- **Directors** trying to articulate a visual language to their DP or production designer
- **Producers** assembling a pitch package or sizzle deck for a project
- **Small teams** who want a starting point for creative conversations

It sits upstream of StudioBinder, Movie Magic, and real pre-production workflows. Greenlight is for day one — before any of those tools are relevant.

## What You Get

| Tab | What It Does |
|---|---|
| **Overview** | Logline, taglines, synopsis, film identity, themes, scope at a glance |
| **Mood & Tone** | Atmosphere, tonal descriptors, color palette, music & sound direction, soundtrack references (TMDB posters), similar moods |
| **Scenes** | Scene-by-scene map with inline storyboard frames. Sequence or location grouping. |
| **Locations** | Unique locations grouped with scenes, time variations, and set requirements |
| **Cast & Crew** | Characters with AI portraits + production insights based on script complexity |
| **Production Design** | Cross-referenced props and wardrobe with reference sketches |
| **Title & Palette** | Color palette and title treatment with the full Google Fonts catalog |
| **Poster Concepts** | Visual directions across categories — conversation starters, not final art |

## What It Is Not

- **Not a production management tool.** No call sheets, no DOODs, no budgets, no scheduling.
- **Not a screenplay parser.** You bring structured data — the app generates the vision deck from it.
- **Not a replacement for StudioBinder or Movie Magic.** Those are for prep and production. This is for the phase before that.

## How It Works

1. **Upload + prompt** — Open [Gemini](https://gemini.google.com/app) (Pro model), upload your screenplay, and paste the built-in extraction prompt. Get structured JSON back.
2. **Paste** — Paste the JSON into Greenlight.
3. **Review** — Your vision deck generates automatically. Edit, regenerate images, and iterate.

## Image Generation

Storyboard frames, poster concepts, character portraits, and prop references are generated using FLUX dev + the [Gesture Draw LoRA](https://huggingface.co/glif/Gesture-Draw) (fal.ai) in a consistent black-ink-on-white-paper sketch style — every asset looks like it came from the same storyboard artist's hand. Use **Generate all images** in the More menu to batch-generate everything in one click.

## Setup

```bash
cd greenlight
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### API Keys

Set in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
TMDB_API_KEY=...
```

| Key | Purpose | Get one at |
|-----|---------|-----------|
| `ANTHROPIC_API_KEY` | Document generation | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `FAL_KEY` | Image generation | [fal.ai/dashboard](https://fal.ai/dashboard/keys) |
| `TMDB_API_KEY` | Film poster lookups | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

## Tech Stack

- **Framework:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **AI:** Claude Haiku 4.5 (Anthropic), FLUX dev + Gesture Draw LoRA (fal.ai)
- **Data:** TMDB REST API for film reference lookups
- **Fonts:** Space Grotesk + Space Mono (UI), full Google Fonts catalog for title treatment
- **Theme:** Dark default with light mode toggle

## License

[All rights reserved](LICENSE)

---

Made by [santiagoalonso.com](https://santiagoalonso.com)
