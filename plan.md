# Plan: Script-to-Production Pipeline

A stateless web tool that takes structured JSON (extracted from a screenplay via a subscription LLM) and generates five pre-production documents: scene breakdown, production matrices, marketing brief, storyboard prompts, and poster concepts.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes + SSR rendering in one project |
| LLM | Claude API (Sonnet) via `@anthropic-ai/sdk` | Cheap, fast, good at structured formatting |
| UI | Tailwind CSS + shadcn/ui | Consistent, fast to build, light mode |
| Markdown | `react-markdown` + `remark-gfm` | Render tables, headings, lists in-app |
| State | React useState + useReducer | Stateless v0, no persistence |
| Hosting | Vercel | Zero-config Next.js deployment |

### Cost Per Script Run

- Stage 0: $0 (subscription LLM)
- Docs 1-5 (5 API calls, Sonnet): ~$0.05-0.10 total
- Total: ~$0.05-0.10 per script

---

## Features

### Feature 1: Wizard Shell & Navigation
- 4-step wizard: Instructions → Paste JSON → Generating → Results
- Step indicator bar showing current position
- Back/forward navigation between steps
- Single-page app — no routing, steps managed via state
- Light mode only

### Feature 2: Step 1 — Instructions Screen
- Clear explanation of the current manual workflow
- Display the Stage 0 prompt (full text, in a code/copy block)
- "Copy Prompt" button
- Instructions: "Take your screenplay PDF to Claude.ai or ChatGPT, paste this prompt along with the PDF, copy the JSON response, and proceed to Step 2"
- "I have my JSON — Next" button to proceed

### Feature 3: Stage 0 Extraction Prompt
- A carefully engineered prompt that takes a full screenplay and outputs the structured JSON schema
- Stored as a constant in the codebase (displayed in Step 1)
- Must produce valid JSON matching the defined schema
- Covers: scenes, characters, locations, props, wardrobe, VFX/stunts, themes, tone
- Version-controlled so it can be iterated on

### Feature 4: Step 2 — JSON Input
- Large textarea for pasting JSON
- JSON validation on submit (parse check + basic schema validation)
- Clear error messages if JSON is malformed or missing required fields
- "Generate Documents" button
- Optional: example JSON snippet toggle for reference

### Feature 5: Step 3 — Generation (Loading State)
- Fires all 5 document generation API calls in parallel
- Per-document progress indicator (pending / generating / done / error)
- Show document names with status icons
- Auto-advance to Step 4 when all complete
- If any doc fails, show error inline but still show completed docs

### Feature 6: API Route — Doc 1: Scene Breakdown
- Endpoint: `POST /api/generate/scene-breakdown`
- Input: Stage 0 JSON
- Prompt engineering: JSON → structured markdown with scene-by-scene table
- Output fields per scene: number, slug line, page range, characters, location, time of day, key visual moment, props, wardrobe notes, VFX/stunts
- Returns markdown string

### Feature 7: API Route — Doc 2: Production Matrices
- Endpoint: `POST /api/generate/production-matrices`
- Input: Stage 0 JSON
- Prompt engineering: JSON → 5 cross-referenced markdown tables
- Tables: Character Matrix, Location Matrix, Props Catalog, Wardrobe Catalog, VFX/Stunts Register
- Each table cross-references scene numbers for scheduling
- Returns markdown string

### Feature 8: API Route — Doc 3: Marketing Brief
- Endpoint: `POST /api/generate/marketing-brief`
- Input: Stage 0 JSON
- Prompt engineering: JSON → narrative marketing document
- Sections: title, genre, logline, synopsis (spoiler-free), full plot summary, 5 tagline options, 3-5 comparable films with reasoning, visual direction (color palette with hex codes, mood, typography suggestions), target audience
- Returns markdown string

### Feature 9: API Route — Doc 4: Storyboard Prompts
- Endpoint: `POST /api/generate/storyboard-prompts`
- Input: Stage 0 JSON
- Prompt engineering: JSON → per-scene image generation prompts
- Each prompt includes: scene number, visual description, camera angle, mood/lighting, characters in frame
- Designed as editable text fields in the UI for Phase 2 generate buttons
- Returns markdown string (each prompt as its own block)

### Feature 10: API Route — Doc 5: Poster Concepts
- Endpoint: `POST /api/generate/poster-concepts`
- Input: Stage 0 JSON
- Prompt engineering: JSON → many diverse poster ideas
- Each concept includes: composition description, focal point, typography direction, color palette, mood/tone, tagline suggestion, target audience angle
- Goal: generate 10-15 distinct concepts across different styles (minimalist, character-driven, symbolic, scene-based, typographic, etc.)
- This is an iterative discovery doc — quantity and variety over perfection
- Returns markdown string

### Feature 11: Step 4 — Results Viewer
- Tabbed interface (shadcn Tabs) — one tab per document
- Markdown rendered with react-markdown + remark-gfm
- Per-doc "Download as .md" button
- "Download All" button (zip or individual downloads)
- "Start Over" button to return to Step 1
- Doc 4 (Storyboard Prompts): render each prompt in an editable textarea (prep for Phase 2 image gen)
- Doc 5 (Poster Concepts): render each concept as a card-like block for easy scanning

### Feature 12: Error Handling
- JSON validation errors in Step 2 with specific messages
- API route errors caught and displayed per-document in Step 3
- Rate limiting awareness (Claude API)
- Graceful degradation: if 1 doc fails, the other 4 still display

---

## File Structure

```
script-to-production/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Main page — wizard container
│   ├── api/
│   │   └── generate/
│   │       ├── scene-breakdown/route.ts
│   │       ├── production-matrices/route.ts
│   │       ├── marketing-brief/route.ts
│   │       ├── storyboard-prompts/route.ts
│   │       └── poster-concepts/route.ts
│   └── globals.css
├── components/
│   ├── wizard/
│   │   ├── wizard-shell.tsx     # Step indicator + navigation
│   │   ├── step-instructions.tsx # Step 1
│   │   ├── step-json-input.tsx  # Step 2
│   │   ├── step-generating.tsx  # Step 3
│   │   └── step-results.tsx     # Step 4
│   ├── document-viewer.tsx      # Markdown renderer + download
│   └── ui/                      # shadcn components
├── lib/
│   ├── prompts/
│   │   ├── stage-0.ts           # The extraction prompt
│   │   ├── scene-breakdown.ts
│   │   ├── production-matrices.ts
│   │   ├── marketing-brief.ts
│   │   ├── storyboard-prompts.ts
│   │   └── poster-concepts.ts
│   ├── schema.ts                # JSON schema + validation
│   └── claude.ts                # Claude API client wrapper
├── plan.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local                   # ANTHROPIC_API_KEY
```

---

## Competitive Context

Key competitors in AI pre-production tools:

- **Filmustage** — Full AI pre-production suite (breakdown, scheduling, budgeting). $50-200/mo. Our differentiator: free/cheap, focused on document generation, LLM-powered creative output (marketing brief, poster concepts) that Filmustage doesn't do.
- **StudioBinder** — Collaborative production management. Heavy, team-oriented. We're a lightweight single-user tool.
- **RivetAI** — Enterprise-focused, budgeting/scheduling. Expensive, closed. We're open and cheap.
- **Studiovity** — Storyboarding + writing. Overlaps on storyboard prompts but doesn't generate marketing material.

**Gap we exploit:** None of these tools generate marketing/creative pre-production documents (poster concepts, marketing briefs, taglines, visual direction). They focus on operational pre-production (schedules, budgets, breakdowns). We do both.

---

## Implementation Order

Dependencies flow top-down:

1. **Feature 1: Wizard Shell** — the container everything lives in
2. **Feature 3: Stage 0 Prompt** — needed for Step 1 content
3. **Feature 2: Step 1 Instructions** — displays the prompt
4. **Feature 4: Step 2 JSON Input** — textarea + validation
5. **Features 6-10: API Routes** (can be built in parallel) — the 5 generation endpoints
6. **Feature 5: Step 3 Generation** — calls the API routes, shows progress
7. **Feature 11: Step 4 Results** — tabbed viewer + downloads
8. **Feature 12: Error Handling** — wired through all steps

---

## Stage 0 JSON Schema

The extraction prompt must produce this exact structure:

```json
{
  "title": "string",
  "genre": ["string"],
  "setting_period": "string",
  "total_pages": "number",
  "scenes": [{
    "scene_number": 1,
    "slug_line": "INT. APARTMENT - NIGHT",
    "location": "apartment",
    "int_ext": "INT",
    "time_of_day": "NIGHT",
    "page_start": 1,
    "page_end": 3,
    "characters_present": ["JOHN", "SARAH"],
    "key_visual_moment": "description",
    "emotional_beat": "revelation / betrayal",
    "props": ["wedding ring", "packed suitcase"],
    "wardrobe_notes": ["John in rumpled work suit"],
    "vfx_stunts": [],
    "music_cue": "score shifts to minor key",
    "notes": "callback to scene 3"
  }],
  "characters": [{
    "name": "JOHN",
    "description": "Mid-30s, tired eyes",
    "arc_summary": "From denial to acceptance",
    "scenes_present": [1, 3, 5],
    "special_requirements": ["crying on cue"],
    "wardrobe_changes": 4
  }],
  "locations": [{
    "name": "apartment",
    "description": "Small NYC apartment",
    "scenes": [1, 5, 12],
    "int_ext": "INT",
    "time_variations": ["NIGHT", "MORNING"],
    "set_requirements": ["practical window"]
  }],
  "props_master": [{
    "item": "wedding ring",
    "scenes": [1, 7, 15],
    "hero_prop": true,
    "notes": "needs close-up in scene 15"
  }],
  "themes": ["string"],
  "tone": "string"
}
```

---

## Out of Scope (v0)

- Image generation (Phase 2)
- PDF upload / automated extraction
- User accounts / auth
- Data persistence / database
- Dark mode
- Fountain format support
- Real-time collaboration
- Export to PDF/DOCX (markdown download only)

---
run_contract:
  max_iterations: 30
  completion_promise: "V0_COMPLETE"
  on_stuck: defer_and_continue
  on_ambiguity: choose_simpler_option
  on_regression: revert_to_last_clean_commit
  human_intervention: never
  phase_skip:
    qa_console: false
    visual_qa: false
    security: false
  complexity_overrides:
    wizard_navigation: "useState with step number, no router"
    instructions_screen: "static content with copy-to-clipboard"
    stage_0_prompt: "hardcoded constant in lib/prompts/stage-0.ts"
    json_input: "textarea with JSON.parse validation + schema check"
    generation: "Promise.allSettled for 5 parallel API calls"
    scene_breakdown: "Claude API, single prompt, markdown output"
    production_matrices: "Claude API, single prompt, 5 tables in one response"
    marketing_brief: "Claude API, single prompt, narrative markdown"
    storyboard_prompts: "Claude API, single prompt, per-scene prompt blocks"
    poster_concepts: "Claude API, single prompt, 10-15 diverse concepts"
    results_viewer: "shadcn Tabs, react-markdown, blob download"
    error_handling: "try/catch per API route, graceful degradation"
