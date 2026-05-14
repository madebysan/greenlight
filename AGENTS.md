# Greenlight Codex Guide

This file is the Codex entry point for Greenlight. It preserves the project rules from `CLAUDE.md` without assuming Claude-specific tooling.

## Read First

- Read `presentation.md` before doing any project work.
- Use `README.md` for the public product framing.
- Use `backlog.md` for planned work and `plan.md` for current handoff details.
- When these disagree, `presentation.md` wins.

## Project Intent

Greenlight is a portfolio/demo project built to impress A24's creative team in a job interview. Judge decisions by whether they make that audience lean forward in a short demo.

## Working Rules

- Prioritize taste, polish, and design sensibility over feature completeness, edge cases, scalability, or exhaustive tests.
- Keep A24 films as the primary sample data.
- Protect the Mood & Tone tab; it is the most important tab for the intended audience.
- Stay happy-path unless an edge case would visibly affect a 5-minute demo.
- Do not add auth, accounts, payments, or analytics.
- Dark mode is the default.

## Stack

- Next.js 16, React 19, Tailwind CSS 4, shadcn/ui.
- Dev server uses port `3001`.
- User-provided API keys are the release architecture. Check `lib/api-keys-context.tsx` and `components/wizard/api-keys-dialog.tsx` before changing key handling.
- PDF extraction route exists but upload UI is intentionally disabled. Do not remove the route or `UploadMode`.

## Verification

- Prefer visual/browser verification for UI changes.
- Use focused tests/builds appropriate to the change, but do not overbuild infrastructure for this demo.
