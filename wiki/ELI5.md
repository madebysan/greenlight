# Greenlight, Explained Simply

**If you take one thing from this page: Greenlight is a small film-studio workbench that turns one organized script file into a first visual pitch deck.** Imagine a workbench in a film office. You put a labeled script box on the bench. The bench asks a writing assistant to draft the deck, asks a sketch artist to draw visual references, then lays everything out as a readable film dossier.

## The Big Picture

You start with a script that has already been turned into structured JSON. That file lists scenes, characters, locations, props, themes, tone, and page counts. Greenlight turns that one file into eight deck sections: overview, mood, scenes, locations, cast, production design, title/palette, and poster concepts. Some sections are written by a text provider. Some are derived directly from the JSON. Images come from the sketch artist service when a fal.ai key is available.

```mermaid
graph TD
  Writer["you<br/>the filmmaker"] -->|puts script facts into| Box["the script box<br/>structured JSON"]
  Box -->|feeds| Bench["the workbench<br/>Greenlight"]
  Bench -->|asks for words| WriterBot["the writing assistant<br/>selected text provider"]
  Bench -->|asks for sketches| SketchBot["the sketch artist<br/>fal.ai"]
  Bench -->|checks film posters| FilmShelf["the film shelf<br/>TMDB"]
  Bench -->|lays out| Deck["the deck<br/>film dossier"]
```

## Where The Material Comes From

| What you see | Where it comes from | Notes |
|---|---|---|
| Logline, synopsis, themes | Text provider using trimmed screenplay JSON | Live app calls `/api/generate/overview` |
| Mood, references, soundtrack ideas | Text provider using genre, tone, scene emotion, music cues | Most important tab for the demo audience |
| Scene cards | Text provider plus original scene JSON | Storyboards sit inside this tab |
| Locations | Original JSON | No text provider needed for the main location list |
| Cast cards | Original JSON plus generated portraits | Performance and requirements come from JSON |
| Props and wardrobe | Original JSON plus generated prop sketches | VFX and stunt implications appear in insights |
| Title and palette | Mood document plus title-font logic | Uses curated Google Fonts list |
| Posters | Text provider plus generated poster sketches | Poster concepts are campaign prompts, not final art |
| Share page | Current project or demo fixture | Printed as one long light-mode bible |

## How The Data Is Shaped

At the center is one movie. Everything else hangs off that movie.

```mermaid
graph LR
  Film((movie<br/>the script box<br/>from uploaded JSON))
  Film --- Scenes["scenes<br/>beats and pages<br/>from Gemini-style JSON"]
  Film --- Characters["characters<br/>arcs and needs<br/>from Gemini-style JSON"]
  Film --- Locations["locations<br/>sets and time changes<br/>from Gemini-style JSON"]
  Film --- Props["props<br/>hero objects and continuity<br/>from Gemini-style JSON"]
  Film --- Reports["report sections<br/>deck prose<br/>from text provider"]
  Film --- Images["sketch images<br/>visual references<br/>from fal.ai"]
  Film --- Posters["film poster thumbnails<br/>mood references<br/>from TMDB"]
```

## What Happens When You Use It

```mermaid
sequenceDiagram
  actor You
  participant Bench as Greenlight
  participant File as Script JSON
  participant Writer as Text provider
  participant Sketch as fal.ai
  participant Store as Browser storage

  You->>Bench: paste structured screenplay JSON
  Bench->>File: read title, scenes, characters, props
  Bench->>Writer: request five report documents
  Bench->>Sketch: queue portraits and prop sketches if key exists
  Writer-->>Bench: return markdown sections
  Bench->>Sketch: queue storyboard and poster images as prompts land
  Bench->>Store: save the active project
  Bench-->>You: show the film deck
```

## How A Deck Page Is Built

The visible report has eight tabs, but the writing engine only creates five markdown documents. Greenlight splits and combines those documents with original JSON.

```mermaid
graph TD
  Root["one script box"] --> Docs["five written documents"]
  Root --> Raw["raw script facts"]
  Docs --> Overview["Overview tab"]
  Docs --> Mood["Mood & Tone tab"]
  Docs --> Scenes["Scenes tab"]
  Raw --> Locations["Locations tab"]
  Raw --> Cast["Cast & Crew tab"]
  Raw --> Production["Production Design tab"]
  Docs --> Identity["Title & Palette tab"]
  Docs --> Posters["Poster Concepts tab"]
```

## A Real Example

For `Past Lives`, the JSON says the film is a melancholic romantic drama about timing, immigration, language, and chosen lives. The new local demo pipeline recognizes that as the `intimate-romance` lane. That changes the language of the generated fixture: it talks about silence, screens, cities, distance, and memory instead of using the same hard-production phrases that were showing up across unrelated demos.

```mermaid
flowchart TD
  A["Past Lives JSON<br/>genre: Drama, Romance"] --> B{"Which writing lane?"}
  B -->|"romance, melancholic, identity"| C["intimate romance lane"]
  C --> D["quiet references<br/>In the Mood for Love, Before Sunset"]
  C --> E["palette from bar booths, laptops, dawn, passports"]
  C --> F["poster language about timing and distance"]
  D --> G["Past Lives demo report"]
  E --> G
  F --> G
```

## How Demo Pages Work

Live generation is not required for the six public demos. Those pages read committed fixture files and image paths.

```mermaid
sequenceDiagram
  actor Visitor
  participant Demo as Demo route
  participant Fixture as SavedProject fixture
  participant Images as Committed images
  participant Viewer as Report viewer

  Visitor->>Demo: open /demo/past-lives
  Demo->>Fixture: import Past Lives project
  Demo->>Images: reference local image URLs
  Demo->>Viewer: render the same report UI
  Viewer-->>Visitor: show a full deck without API keys
```

## What Can Break

| Failure | What the user sees |
|---|---|
| Bad JSON | The app cannot generate a deck because required fields are missing |
| Missing text provider key | The API-key modal opens and generation does not start |
| Text provider fails | That document is marked as failed while other documents may still finish |
| Missing fal.ai key | Text deck still works, but fresh images do not generate |
| fal.ai credits fail | Image queue stops or reports failed image jobs |
| TMDB key missing or lookup fails | Mood references still render, but poster thumbnails may be absent |
| Mobile viewport | A desktop-only gate appears because the report UI is not designed for phones |
| Fixture image path missing | A demo image area can appear broken until the committed file exists |

## Glossary

| Term | Plain-English meaning |
|---|---|
| Structured JSON | The script turned into labeled fields like scenes, characters, props, and themes |
| Vision deck | A first creative deck that helps people feel what the film could be |
| Fixture | A saved demo project stored in code so it can render without live generation |
| Text provider | The writing assistant chosen by the user, such as Claude, OpenAI, DeepSeek, or Gemini |
| fal.ai | The image service used to generate the sketch-style visuals |
| TMDB | The movie database used for reference poster thumbnails |
| Share page | A one-page printable version of the whole deck |
| Genre lane | A writing profile that keeps reports specific to the film's tone and genre |

## Where To Go Next

- [Architecture](Architecture.md) - go here if you want the technical map.
- [Data Flow](Data-Flow.md) - go here if you want to follow generation step by step.
- [Core Concepts](Core-Concepts.md) - go here if the product terms are still fuzzy.
- [Prompt Pipeline](Components/Prompt-Pipeline.md) - go here for the genre-aware report workflow.
- [Demo System](Components/Demo-System.md) - go here for the six committed demos.

