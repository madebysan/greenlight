# Greenlight Component Inventory

Generated: 2026-05-14

Scope: Phase 1 component audit only. This inventory documents the current reusable UI surface and the main drift points. No broad migration was made as part of the audit; the only UI implementation in this pass is the new adjacent-section report CTA.

## Project Surface

- Stack: Next.js 16, React 19, Tailwind 4.
- App structure: `app/` routes, `components/wizard/` app shell, `components/viewers/` report tab bodies, `components/ui/` primitives.
- Styling direction: Cinemateca sister product from `DESIGN.md`: dark-only, true-black canvas, hairline borders, DM Sans body, Instrument Serif report titles, Space Mono metadata.
- Existing dirty state: repo had many existing modified files before this audit. This inventory only evaluates current component consistency and does not revert unrelated work.

## Shared Components

| Component | Path | Current role | Status |
| --- | --- | --- | --- |
| `Button` | `components/ui/button.tsx` | shadcn button primitive | Underused outside simple shell states |
| `Dialog` / `AlertDialog` | `components/ui/dialog.tsx`, `components/ui/alert-dialog.tsx` | modal primitives | Good for destructive/start-over and modal flows |
| `InlineChip`, `SectionLabelPill` | `components/ui/inline-chip.tsx` | inline evidence and section labels | Good current pattern |
| `SectionHead` | `components/ui/section-head.tsx` | report section header with index/label/meta | Good current pattern |
| `DepartmentLens`, `ReportPanel`, `ReportCallout`, `EvidencePill` | `components/ui/department-lens.tsx` | role-based report headers and dense report panels | Good current pattern for Locations, Cast, Production |
| `ShuffleButton`, `useShuffleState` | `components/ui/shuffle-button.tsx` | section-level regeneration control | Good current pattern |
| `EditableText` | `components/ui/editable-text.tsx` | hover/click inline editing | Good interaction pattern, but it owns native input/textarea styling |
| `HeaderButton`, `MoreMenu` | `components/wizard/header-menu.tsx` | header actions and overflow menu | Good app-shell pattern |
| `ReportSectionNav` | `components/ui/report-section-nav.tsx` | end-of-page before/after report CTAs | New shared pattern |

## Usage Snapshot

- Raw native buttons: 82 `<button>` occurrences across app/components. Many are legitimate low-level interactions, but repeated classes appear in report cards, tab controls, image generation states, and header actions.
- Native form fields: 20 `<input>` / `<textarea>` occurrences. There is no shared `Input` primitive or report edit-field primitive.
- Shared report primitives: 118 references across `SectionHead`, `SectionLabelPill`, `DepartmentLens`, `ReportPanel`, `EvidencePill`, `ShuffleButton`, and `ReportSectionNav`.

## Consistency Findings

### 1. Report Header System Is Converging

The newer tabs use a clear shared report language:

- `DepartmentLens` for role-based headers in Locations, Cast & Crew, and Production Design.
- `SectionHead` and `SectionLabelPill` for Overview, Mood & Tone, Scenes, Identity, and Posters.
- `ReportPanel` and `EvidencePill` for dense script evidence.

Drift score: 2/5. The main mismatch is that not every viewer has been moved to `DepartmentLens`. That is acceptable for now because some tabs are editorial docs rather than role-lens data views.

Recommendation: keep both header modes, but define the rule clearly: role-heavy tabs use `DepartmentLens`; prose-heavy tabs use `SectionLabelPill` + serif H1 + `SectionHead`.

### 2. Panels Are Mostly Consistent, But Repeated Card Classes Are Spreading

The report now consistently favors `rounded-[12px] border border-border bg-card/35` with restrained hover states. The same class cluster appears repeatedly in Mood, Scenes, Identity, Production, Cast, and Locations.

Drift score: 3/5. Visual consistency is good, but implementation consistency is medium because repeated panel classes are manually copied.

Recommendation: add one generic `ReportCard` or extend `ReportPanel` for repeated row cards before the next broad UI pass. Do not force shadcn `Card` into the report; it does not match the current Cinemateca language as well as the report primitives.

### 3. Sub-Tabs Are Duplicated

Production Design has a local `SubTabButton`. Cast & Crew repeats the same underline-tab logic inline.

Drift score: 4/5. Same component idea, two implementations.

Recommendation: extract a small `ReportSubTabs` / `ReportSubTabButton` primitive and migrate Production + Cast first. This is the cleanest low-risk consolidation.

### 4. Action Buttons Need Tiering

There are several button types:

- app-shell header buttons via `HeaderButton`
- section regenerate controls via `ShuffleButton`
- shadcn `Button`
- custom icon/action buttons inside report cards
- image-generation buttons inside Cast, Scenes, Production, Posters

Drift score: 4/5. The visual language is mostly close, but implementation is scattered and touch/focus states vary.

Recommendation: introduce report-specific action primitives rather than migrating everything to shadcn `Button`:

- `ReportActionButton` for small bordered text+icon actions
- `ReportIconButton` for card-level icon-only controls
- keep `ShuffleButton` specialized

### 5. Form Fields Are Not Centralized

Editing surfaces use native `input` and `textarea` with repeated Tailwind classes in Scene editing, API keys, password gate, prompt editing, and wizard settings. `EditableText` handles inline edits well but does not cover every form case.

Drift score: 4/5. This is the biggest consistency gap after buttons.

Recommendation: add a shared `Input` primitive and a report-specific `ReportField` wrapper with label + field styling. Migrate Scene edit form and API key dialog first because they repeat the most visible form chrome.

### 6. Evidence Chips Are Mostly Unified

`EvidencePill` is now used in role-based report tabs, but some scene/time chips still inline the same class cluster.

Drift score: 2/5. The duplication is small and the visual output is consistent.

Recommendation: opportunistically replace inline scene/time chips with `EvidencePill` when editing those files for other reasons.

## Recommended Migration Order

1. Extract `ReportSubTabs` and use it in Cast & Crew plus Production Design.
2. Add `ReportActionButton` and replace duplicated small bordered action buttons in Cast, Production, Scenes, and Locations.
3. Add `ReportCard` only if we continue adding new repeated report rows.
4. Add `Input` / `ReportField` and migrate Scene edit form, API key dialog, and password gate.
5. Replace remaining inline evidence chips opportunistically.

## Current Verdict

The report experience is now visually consistent enough to keep building. The highest-value consistency work is not another visual redesign; it is extracting the repeated small-control layer so the report does not accumulate more one-off buttons, tabs, and edit fields as new film-role tabs are added.
