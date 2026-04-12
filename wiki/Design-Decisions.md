# Design Decisions

## DD-001: Single-Project Architecture

**Context:** Multi-project support adds sidebar navigation, project switching, and state management complexity.
**Decision:** One active project at a time, stored in a single localStorage key.
**Rationale:** This is a portfolio demo for A24, not a production tool. Nobody opens two screenplays side-by-side in a 5-minute walkthrough. Simplicity > features.
**Consequences:** Users lose their project if they start a new one. The `/demo` route uses a separate committed snapshot to avoid this in demos.
**Evidence:** `lib/reports.ts` — single `greenlight-project` key.

## DD-002: localStorage Over Database

**Context:** The app needs persistence across page reloads but not across devices or users.
**Decision:** All state in localStorage. No database, no auth, no accounts.
**Rationale:** Eliminates deployment complexity entirely. A Vercel deploy with just env vars works. Matches the portfolio demo framing — this isn't a SaaS product.
**Consequences:** Data lost on browser clear. Can't share projects between devices (export feature is backlogged).
**Evidence:** `lib/reports.ts` — `loadProject()`, `saveProject()`.

## DD-003: Markdown as Intermediate Format

**Context:** Claude generates text documents. The UI needs to display them as structured cards, not raw text.
**Decision:** Claude outputs structured markdown (specific heading levels, bullet formats). Viewers parse it with regex.
**Rationale:** Markdown is human-readable, debuggable, and copyable. JSON output from Claude would be fragile (invalid JSON breaks everything). Markdown degrades gracefully — worst case, user sees raw text.
**Consequences:** Prompts and parsers are coupled. If Claude changes its heading format, the parser breaks. This is acceptable because the prompts are stable.
**Evidence:** `components/viewers/overview-viewer.tsx` — `parseOverview()` function.

## DD-004: Token Trimming Per Document

**Context:** A feature screenplay JSON can exceed 30k tokens. Claude Haiku 4.5 has a 16384 max output limit, and input should stay under ~50k for quality.
**Decision:** Each of the 5 documents gets a differently-trimmed version of the JSON. Overview drops full scene details; Scene Breakdown keeps them but drops props_master.
**Rationale:** Each document only needs specific fields. Sending the full JSON wastes tokens and degrades output quality.
**Consequences:** 5 trim functions to maintain. Adding a new document type requires a new trimmer.
**Evidence:** `lib/json-trimmer.ts` — `trimForOverview()`, `trimForMoodAndTone()`, etc.

## DD-005: Gesture Draw LoRA for All Images

**Context:** FLUX Schnell produced polished illustrations that didn't match the "quick production sketch" aesthetic. Prompt engineering alone couldn't overcome the model's training bias toward polish.
**Decision:** Switch to FLUX dev + Gesture Draw LoRA via `fal-ai/flux-lora` at scale 1.0, 28 steps.
**Rationale:** Extensive A/B testing across 4 FLUX tiers showed that LoRAs override style bias more reliably than any prompt. Dev + LoRA produces better sketches than Pro Ultra without LoRA, at lower cost.
**Alternatives Considered:** FLUX Pro Ultra ($0.06, better artist-name recognition but no LoRA support), prompt sandwiching (partially works but fragile), low inference steps (too undercooked).
**Consequences:** $0.035/image instead of $0.003. ~12x cost increase, but still under $2 per full bible. LoRA needs ~10-15s to load on first call per session.
**Evidence:** `lib/image-prompts.ts` — `GESTURE_DRAW_LORA_URL`, `GESTURE_DRAW_LORA_SCALE`.

## DD-006: Props Use a Different Style Prefix

**Context:** The Gesture Draw LoRA renders isolated objects extremely sparsely — a rifle becomes a few wisps of line, a jack-handle becomes a dot.
**Decision:** Props use "bold linework, close-up view filling the frame" instead of "rough lines, minimal background."
**Rationale:** The LoRA was trained on figure drawing (people in motion), not product photography. Single objects need explicit instructions to fill the frame.
**Consequences:** Props look slightly bolder than storyboards/portraits/posters. This is acceptable — they're still in the same B&W sketch family.
**Evidence:** `lib/image-prompts.ts` — `DEFAULT_IMAGE_PROMPTS.prop`.

## DD-007: Dark Mode Default

**Context:** The app serves both light and dark mode via a theme toggle.
**Decision:** Dark mode is the default. An inline `<script>` in `layout.tsx` applies the `.dark` class before React hydrates to prevent FOUC.
**Rationale:** Dark matches A24's aesthetic instinct. The portfolio audience will see dark mode first.
**Evidence:** `app/layout.tsx` — inline theme init script.

## DD-008: Peec.ai-Inspired Visual System

**Context:** The UI needed a design refresh that felt editorial and cinematic, not SaaS-generic.
**Decision:** Port peec.ai's visual language into dark mode: warm canvas tokens, `shadow-paper` layered elevation, `font-light` display weights, section label pills, flat underline tabs.
**Rationale:** peec.ai's design system communicates "taste" — which is exactly what A24's creative team would notice.
**Consequences:** The design reference doc (`DESIGN-PEEC.md`) captures the full analysis. Custom CSS utilities in `globals.css`.
**Evidence:** `app/globals.css` — `shadow-paper`, `shadow-pill` utilities. `components/ui/inline-chip.tsx` — `SectionLabelPill`.

## DD-009: Crew Replaced with Insights

**Context:** The Crew tab listed generic roles (Director, Producer, DP) that every film needs. Not useful information.
**Decision:** Replace with situational Insights — specialty hires the script implies (stunts, VFX, weapons, intimacy, minors, etc.).
**Rationale:** Generic roles are assumed. The value is in surfacing non-obvious needs a line producer would flag. 15 situational heuristics scan the screenplay JSON.
**Consequences:** If a screenplay has no specialty situations, the Insights tab shows a clean empty state instead of a generic crew list.
**Evidence:** `components/viewers/cast-and-crew-viewer.tsx` — `computeInsights()`.

## DD-010: File-Based Response Caching

**Context:** Claude API calls cost money and take 15-30s each. Regenerating the same screenplay wastes both.
**Decision:** SHA256 hash of the input JSON → file-based cache in `.cache/`. Same screenplay = instant results.
**Rationale:** Simple, no Redis/Memcached dependency. Works for single-user dev. Cache invalidates naturally when the user changes their screenplay.
**Consequences:** Cache lives on disk, not portable. Deleting `.cache/` forces regeneration.
**Evidence:** `lib/response-cache.ts` — `getCached()`, `setCache()`.
