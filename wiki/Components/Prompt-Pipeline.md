# Prompt Pipeline

## Purpose

The prompt pipeline turns screenplay JSON into report markdown. The live app uses provider prompts, while local demo regeneration can use a genre-aware fixture writer.

## Location

- `lib/prompts/*`
- `lib/json-trimmer.ts`
- `lib/text-generation.ts`
- `app/api/generate/*/route.ts`
- `app/api/regenerate-section/route.ts`
- `prompt-tests/scripts/build-demo-fixture.mjs`
- `prompt-tests/scripts/compare-role-passes.mjs`

## Live Generation Flow

```mermaid
flowchart TD
  Json["full screenplay JSON"] --> Trim["section-specific trim"]
  Trim --> Prompt["section prompt"]
  Prompt --> Provider["selected text provider"]
  Provider --> Markdown["markdown document"]
  Markdown --> Parser["viewer parser"]
  Parser --> Tab["report tab"]
```

## Local Demo Genre Lanes

```mermaid
graph TD
  Profile["genre, tone, period"] --> Romance["intimate romance"]
  Profile --> Court["period court"]
  Profile --> Horror["horror/thriller"]
  Profile --> SciFi["sci-fi/action"]
  Profile --> Fable["fable"]
  Profile --> Drama["general drama"]
  Romance --> Fixture["demo fixture text"]
  Court --> Fixture
  Horror --> Fixture
  SciFi --> Fixture
  Fable --> Fixture
  Drama --> Fixture
```

## Why This Matters

The latest pipeline change fixed a product-level problem: unrelated demos were reading like they came from the same generic template. The local fixture writer now adapts language, references, palettes, taglines, and poster concepts by film lane.

## Constraints

- The local fixture writer is not the same thing as the live provider prompts.
- It is now important enough that prompt/report changes need text audits.
- The current horror lane still needs a split between siege/survival horror and social/psychological horror.

