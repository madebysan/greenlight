<h1 align="center">Greenlight</h1>
<p align="center">Script to vision deck in about ten minutes.<br>
For the space between finishing a script and figuring out what the film actually looks like.</p>
<p align="center"><code>Next.js</code> <code>React 19</code> <code>Tailwind CSS 4</code> <code>Claude API</code> <code>FLUX + Gesture Draw LoRA</code></p>
<p align="center"><a href="https://greenlight.santiagoalonso.com"><strong>Try it live →</strong></a></p>

https://github.com/user-attachments/assets/e5fbef69-2bd7-43b3-858a-e4ef32b0c419

---

I have friends in the film industry who spend days, sometimes weeks, on the same manual work: turning a script into a deck they can show investors, pitch to potential collaborators, or use to make the film feel real before there's a crew. As a designer, I've designed a lot of decks for documentary films, so I have a feel for what the output usually looks like. Greenlight is me trying to reverse-engineer that output from a single source, a movie script.

You share your script and you get a vision deck with a lot of ideas and assumptions based on the script for you to use as a starting point. Things like logline, tone, scene map, characters, and poster concepts. Something to show a your team, a producer, or a friend whose opinion matters.

It's best for students, first-time filmmakers, or anyone who struggles with moving from scripts into decks. It's not the right tool for teams already committed to production with a crew and a schedule.

## What's in a generated deck

| Tab | What's in it |
|---|---|
| **Overview** | Logline, taglines, synopsis, film identity, themes, scope at a glance |
| **Mood & Tone** | Atmosphere, tonal descriptors, color palette, music and sound direction, soundtrack references (with TMDB posters), similar moods |
| **Scenes** | Scene-by-scene map with inline storyboard frames. Sequence or location grouping. |
| **Locations** | Unique locations grouped with scenes, time variations, and set requirements |
| **Cast & Crew** | Characters with AI portraits plus production insights based on script complexity |
| **Production Design** | Cross-referenced props and wardrobe with reference sketches |
| **Title & Palette** | Color palette and title treatment with the full Google Fonts catalog |
| **Poster Concepts** | Visual directions across categories. Conversation starters, not final art. |

## How to use it

You'll need structured screenplay JSON to start. I use [Gemini Pro](https://gemini.google.com/app) for this: upload your script, paste the extraction prompt that Greenlight provides, Gemini hands back JSON that matches Greenlight's schema.

Paste that JSON into Greenlight. On first use the app asks for your Claude API key and (optionally) your fal.ai and TMDB keys. They're stored in your browser's `localStorage`. No keys touch a Greenlight server, and the script JSON you paste stays in your browser. Generated text and images come back through your own API keys, so token costs are yours and the output is yours.

The deck generates automatically. Claude does the writing, fal.ai generates the images. Both run in parallel, so most of a deck is ready in a couple minutes. You can edit, regenerate, or swap out sections as you go.

PDF upload is wired in the backend but disabled in the UI. Serverless function timeouts made it unreliable for feature-length scripts, so paste-JSON is the working path today.

## Images

All images (storyboards, character portraits, props, posters) run through FLUX dev plus the [Gesture Draw LoRA](https://huggingface.co/glif/Gesture-Draw) on fal.ai. The LoRA gives everything a consistent black-ink-on-white-paper sketch style, so every asset looks like it came from the same storyboard artist's hand. Use **Generate all images** in the More menu to batch everything in one click.

Cost is roughly $0.035 per image on fal.ai (April 2026).

## Running locally

```bash
git clone https://github.com/madebysan/greenlight.git
cd greenlight
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The app is a standalone Next.js project, no separate backend required. Serverless functions live in `app/api/` as Next.js route handlers.

### Dependencies

All listed in `package.json`. The important ones:

- `next@16`, `react@19`, `tailwindcss@4` (Next.js App Router stack)
- `@anthropic-ai/sdk` (Claude client)
- `@fal-ai/client` (fal.ai client for image generation)
- `radix-ui`, `lucide-react`, `class-variance-authority` (shadcn/ui foundations)
- `react-markdown` plus `remark-gfm` (rendering generated doc content)

Node 20+ recommended.

### API keys

Every API call is keyed by the end user. On first use the app pops a modal that stores your keys in `localStorage`. Nothing touches a Greenlight server.

| Key | Purpose | Required? | Get one at |
|-----|---------|-----------|-----------|
| Claude API key | Document generation (Overview, Mood & Tone, Scenes, Storyboards, Poster Concepts) | **Required** | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| fal.ai API key | Image generation (storyboards, portraits, props, posters) | Optional (text-only deck without it) | [fal.ai/dashboard](https://fal.ai/dashboard/keys) |
| TMDB API key | Poster thumbnails on Mood & Tone (Similar Moods, Soundtrack References) | Optional (tab works without it, just without poster thumbs) | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

For local development you can skip the in-app modal by adding the same variables to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
TMDB_API_KEY=...
```

These server-side env vars are used as a fallback when a user hasn't entered a key in the modal. On the public deployment no server-side keys are set, so every visitor brings their own.

## Tech stack

- **Framework:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **AI:** Claude Haiku 4.5 (Anthropic), FLUX dev plus Gesture Draw LoRA (fal.ai)
- **Data:** TMDB REST API for film reference lookups
- **Fonts:** Space Grotesk and Space Mono (UI), full Google Fonts catalog for title treatment
- **Theme:** Dark default with light mode toggle

## License

[All rights reserved](LICENSE)

---

Made by [santiagoalonso.com](https://santiagoalonso.com)
