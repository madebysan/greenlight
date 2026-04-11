<h1 align="center">Greenlight</h1>
<p align="center">Turn a script into something tangible, fast.<br>
A 0→1 tool for indie filmmakers and freelancers.</p>
<p align="center"><code>Next.js</code> <code>React 19</code> <code>Tailwind CSS 4</code> <code>Claude API</code> <code>FLUX Schnell</code></p>

---

## What This Is

You have a script. Now what?

Greenlight is the tool you open on day one, before you have a crew, before you have a schedule, before you have anything except an idea and some pages. You paste a structured version of your script and within minutes you have something tangible to put in front of your collaborators — a mood, a look, some visual concepts, a sense of scope.

It's not an end-to-end production platform. It's the thing that helps you get *started*.

## Who It's For

- **Indie filmmakers** juggling multiple scripts, trying to figure out which one to push forward
- **Freelance directors and producers** who need to turn a script into a pitch artifact overnight
- **Small teams** who want a starting point to hand to their art department, production designer, or location scout

It is explicitly **not** built for large production companies, studios, or festival-stage projects. Those teams already have StudioBinder, Movie Magic, and real pre-production workflows. Greenlight sits upstream of all of that.

## What It Solves

Five concrete problems an indie filmmaker hits the moment they commit to a script:

1. **"What *is* this film?"** → A clean synopsis, logline, genre, tone, and comparable films
2. **"What does it look and feel like?"** → Mood, style, color palette, music direction, visual references
3. **"How do I talk to my art team about visuals?"** → Poster concepts and storyboard frames as conversation starters
4. **"How do I talk to my production team about scope?"** → Location breakdown, scene complexity, what you're actually signing up for
5. **"How big is this, really?"** → An honest read on the work ahead — cast size, location count, rough complexity

## What's In The Bible

| Tab | Who It's For | What It Does |
|---|---|---|
| **Overview** | You, investors, collaborators you're recruiting | Logline, taglines, synopsis, film identity, themes, scope-at-a-glance, poster carousel |
| **Mood & Tone** | DP, production designer, composer | Atmosphere prose, tonal descriptors, reference points, music & sound direction with real soundtrack references (TMDB posters), and Similar Moods film grid |
| **Scenes** | You, 1st AD | Per-scene map with inline storyboard frames. Sequence or Location grouping. Every scene gets a generated key-visual frame. |
| **Locations** | Location scout, production team | Unique locations grouped, with scenes-per-location, time variations, set requirements, and key visual moments |
| **Cast & Crew** | Casting, producers | Characters (with AI portraits) + scope-based crew roles. Each card can be disabled if you don't need that role. |
| **Production Design** | Art department | Cross-referenced props and wardrobe pulled from every scene. Each prop gets a reference sketch. |
| **Key Art** | Marketing, pitch meetings | Color palette (reshuffleable), title treatment with full Google Fonts catalog, and 15 poster concepts across 5 categories |

## What It Is Not

- **Not a production management tool.** No call sheets, no DOODs, no crew scheduling, no SMS.
- **Not a festival or distribution planner.** That's a different problem for a different phase.
- **Not a screenplay editor.** Bring a finished script.
- **Not a replacement for StudioBinder.** It delivers ~50% of what a pro tool does at ~2% of the effort — deliberately — by focusing on the "get something tangible" phase.

## How It Works

1. **Extract** — Upload your screenplay PDF to Claude or ChatGPT with the built-in extraction prompt. Get structured JSON back.
2. **Paste** — Paste the JSON into the app (or use one of the open-source sample scripts).
3. **Generate** — Claude creates the full bible automatically.
4. **Refine** — Edit inline, generate mood imagery, poster concepts, and character portraits.

## Image Generation

Storyboard frames, poster concepts, character portraits, and prop references are generated using FLUX Schnell (fal.ai) in a consistent black-and-white felt-tip marker production art style so every asset in the bible looks like it came from the same hand. Images are saved locally to `.cache/images/` and persist with your project. Use **Generate all images** in the More menu to batch-generate everything missing across every tab in one click.

## Setup

```bash
cd greenlight
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### API Keys

Configure via **Settings** in the More menu (3-dot button in the header):

| Key | Purpose | Get one at |
|-----|---------|-----------|
| Claude API Key | Document generation, prompt rewriting | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| fal.ai API Key | Image generation (mood, storyboards, posters, portraits, props) | [fal.ai/dashboard](https://fal.ai/dashboard/keys) |
| TMDB API Key | Real poster lookups on Similar Moods and Soundtrack References | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |

Or set them in `.env.local` for local development:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
TMDB_API_KEY=...
```

## Tech Stack

- **Framework:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **AI:** Claude Haiku 4.5 (Anthropic), FLUX Schnell (fal.ai)
- **Data:** TMDB REST API for film reference lookups
- **Fonts:** Space Grotesk + Space Mono (UI), full Google Fonts catalog for title treatment
- **Theme:** Dark default with light mode toggle

---

Made by [santiagoalonso.com](https://santiagoalonso.com)
