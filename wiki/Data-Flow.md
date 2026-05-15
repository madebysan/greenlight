# Data Flow

Greenlight has four important flows: live report generation, image generation, committed demo rendering, and local fixture regeneration.

## Live Text Generation

```mermaid
sequenceDiagram
  actor User
  participant Wizard as WizardShell
  participant Keys as ApiKeysProvider
  participant Route as app/api/generate/[section]
  participant Trim as json-trimmer
  participant Provider as selected text provider
  participant Cache as response-cache

  User->>Wizard: paste JSON
  Wizard->>Keys: ensure selected provider key
  Wizard->>Route: POST jsonData, apiProvider, apiKey
  Route->>Cache: check provider + input hash
  Route->>Trim: keep only fields needed by the section
  Route->>Provider: generate markdown
  Provider-->>Route: markdown document
  Route->>Cache: save markdown in memory
  Route-->>Wizard: return content
```

Five text documents are generated: Overview, Mood & Tone, Scene Breakdown, Storyboard Prompts, and Poster Concepts. `StepResults` turns those five documents plus raw JSON into eight visible tabs.

## Live Image Generation

```mermaid
sequenceDiagram
  participant Wizard as WizardShell
  participant Queue as Image queue
  participant Api as image route
  participant Fal as fal.ai
  participant Project as SavedProject

  Wizard->>Queue: enqueue portraits and props from JSON
  Wizard->>Queue: enqueue storyboards when storyboard document lands
  Wizard->>Queue: enqueue posters when poster document lands
  Queue->>Api: POST prompt, stylePrefix, fal key
  Api->>Fal: run FLUX LoRA with Gesture Draw
  Fal-->>Api: image URL
  Api-->>Queue: URL
  Queue->>Project: merge image map and save
```

The queue starts tasks with a 500ms stagger but does not wait for each task to finish before starting the next one. Results are merged through refs to avoid clobbering concurrent completions.

## Demo Rendering

```mermaid
sequenceDiagram
  actor Visitor
  participant Route as app/demo route
  participant Fixture as SavedProject fixture
  participant Demo as DemoContent
  participant Results as StepResults

  Visitor->>Route: open demo URL
  Route->>Fixture: import committed project
  Route->>Demo: pass fixture and shareSlug
  Demo->>Results: render read-only report state
  Results-->>Visitor: show the same eight-tab deck UI
```

Demo routes do not call text providers or fal.ai. They import a `SavedProject` object and reference committed images under `public/demo-images`.

## Text-Only Fixture Regeneration

```mermaid
flowchart TD
  A["raw screenplay JSON<br/>prompt-tests/inputs"] --> B["build-demo-fixture.mjs"]
  B --> C{"generation mode"}
  C -->|"GREENLIGHT_TEXT_PROVIDER=local"| D["local genre-aware writer"]
  C -->|"API mode"| E["Next API routes"]
  D --> F["SavedProject module"]
  E --> F
  F --> G{"image option"}
  G -->|"--preserve-images-from"| H["keep old image maps"]
  G -->|"--reuse-images"| I["generate missing images only"]
  G -->|"--force-images"| J["overwrite image folder"]
```

This is the workflow behind the latest demo report refresh. It lets the text improve without paying for images or accidentally overwriting existing image sets.

## Share Flow

```mermaid
sequenceDiagram
  actor User
  participant Share as /share
  participant Source as query source
  participant Fixture as demo fixtures
  participant Storage as localStorage
  participant Print as ShareableView

  User->>Share: open /share or /share?source=past-lives
  Share->>Source: read source param
  alt demo source exists
    Share->>Fixture: load matching SavedProject
  else no demo source
    Share->>Storage: load active project
  end
  Share->>Print: render full report
  Print-->>User: print-friendly film bible
```

