# Testing

## Automated Checks

| Command | What it checks |
|---|---|
| `npm run lint` | ESLint and Next lint rules |
| `npm run build` | Production Next build |
| `npx vitest run` | Unit tests for schema and prompt constants |
| `npm run prompt:compare` | Prompt comparison workflow |

## Current Test Files

| File | Coverage |
|---|---|
| `__tests__/schema.test.ts` | Accepts valid screenplay JSON and rejects malformed or incomplete input |
| `__tests__/prompts.test.ts` | Ensures prompt files contain required section markers |

## Product-Specific QA

The important recent QA path is not just "does it build." For report-pipeline work, the project rules require a text audit for:

- cross-demo title leakage
- meta/tutorial residue
- old generic pipeline phrases
- film-specific language in the generated reports

Browser QA has also been used for all six demo routes and share routes, checking:

- HTTP 200 route responses
- no console errors
- no broken images
- no horizontal overflow

## Known Lint Warnings

The latest saved session notes mention two existing `@next/next/no-img-element` warnings in poster/storyboard viewer code. They are known warnings, not new wiki-generation changes.

