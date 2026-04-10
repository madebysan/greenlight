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
| **Overview** | You, investors, collaborators you're recruiting | Logline, synopsis, genre, themes, comparables, scope-at-a-glance |
| **Mood & Tone** | DP, production designer, composer | Style narrative, color palette, music direction, reference adjectives, tone imagery |
| **Scenes** | You, 1st AD | Per-scene map of the film — what happens and where |
| **Locations** | Location scout, production team | Unique locations grouped, with scenes-per-location and key visual moments |
| **Cast & Crew** | Casting, producers | Characters (with AI portraits) + scope-based crew roles the film will require |
| **Visuals** | Art department | Poster concepts and storyboard frames as discussion starters |

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

Mood imagery, storyboard frames, poster concepts, and character portraits are generated using FLUX Schnell (fal.ai) in a consistent black-and-white felt-tip marker production art style. All images are saved locally to `.cache/images/` and persist with your project.

## Setup

```bash
cd greenlight
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### API Keys

Configure via **Settings** in the sidebar:

| Key | Purpose | Get one at |
|-----|---------|-----------|
| Claude API Key | Document generation, prompt rewriting | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| fal.ai API Key | Image generation (mood, storyboards, posters, portraits) | [fal.ai/dashboard](https://fal.ai/dashboard/keys) |

Or set them in `.env.local` for local development:

```
ANTHROPIC_API_KEY=sk-ant-...
FAL_KEY=...
```

## Tech Stack

- **Framework:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- **AI:** Claude Haiku 4.5 (Anthropic), FLUX Schnell (fal.ai)
- **Fonts:** Space Grotesk + Space Mono
- **Theme:** Dark mode, Runway-inspired aesthetic

---

Made by [santiagoalonso.com](https://santiagoalonso.com)
