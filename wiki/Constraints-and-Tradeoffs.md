# Constraints And Tradeoffs

## Known Constraints

| Constraint | Impact |
|---|---|
| No database | Simple deployment, but active projects are browser-local |
| localStorage key storage | Easy BYO-key flow, but not enterprise-grade secret storage |
| Desktop-only UI | Polished demo surface, but no mobile report experience |
| PDF upload disabled in UI | Paste-JSON is reliable, but script extraction remains a separate step |
| Image generation costs money | Text-only decks can work without fal.ai, but full visual decks need credits |
| Fixtures are code | Demos are stable, but fixture refreshes create large diffs |
| In-memory response cache | Helpful during a server process lifetime, not durable persistence |

## Current Product Risks

- Horror reports can still feel too similar between Night of the Living Dead and Get Out. The backlog calls for splitting the horror lane.
- Prompt changes can silently break parsers if section headings drift.
- Demo image maps must be preserved during text-only fixture reruns unless images are intentionally regenerated.
- `lib/cached-projects.ts` is large and contains a separate cached EEAAO path that should not be confused with the six visible demo routes.

## Intentional Tradeoffs

- Taste and polish are prioritized over exhaustive edge-case coverage.
- The app avoids auth, accounts, payments, analytics, and databases.
- Generated images are first-pass references, not final art.
- The share page is print-friendly and light-mode even though the app surface is dark-only.

