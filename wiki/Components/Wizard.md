# Wizard

## Purpose

The wizard is the live generation surface. It accepts screenplay JSON, checks keys, runs text generation, schedules image generation, and saves one active project to browser storage.

## Location

- `components/wizard/wizard-shell.tsx`
- `components/wizard/step-instructions.tsx`
- `components/wizard/step-generating.tsx`
- `components/wizard/step-results.tsx`
- `components/wizard/api-keys-dialog.tsx`
- `lib/api-keys-context.tsx`

## Internal Flow

```mermaid
flowchart TD
  Start["Step 1<br/>paste JSON"] --> Keys{"cached demo title?"}
  Keys -->|yes| Fake["fake progression with cached docs"]
  Keys -->|no| Modal["ensure text provider key"]
  Modal --> Generate["Step 2<br/>parallel document generation"]
  Fake --> Review["Step 3<br/>review report"]
  Generate --> Images["background image queue"]
  Generate --> Review
  Images --> Review
  Review --> Storage[("localStorage<br/>SavedProject")]
```

## Interface

`WizardShell` owns project-level state and passes data into `StepGenerating` and `StepResults`. `ApiKeysProvider` wraps the app in `app/layout.tsx` and exposes `ensureKeys`.

## Constraints

- Only one active project is stored.
- Key handling is browser-local.
- Image generation is opportunistic. Text generation can complete without images.

