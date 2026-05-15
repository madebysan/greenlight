# Design Decisions

## DD-001: Bring Your Own Keys

**Context:** The public app should not require Greenlight to store or pay for provider keys.

**Decision:** Store user-selected text, fal.ai, and TMDB keys in browser localStorage and pass them to route handlers only when needed.

**Rationale:** This keeps the app simple and avoids accounts, billing, and database infrastructure.

**Consequences:** The product is easier to run as a demo, but key storage is browser-local and should be explained clearly to users.

**Evidence:** `lib/api-keys-context.tsx`, `lib/reports.ts`, `lib/text-generation.ts`.

## DD-002: Five Documents, Eight Tabs

**Context:** The report needs to feel like a full production dossier, but not every tab needs a separate model call.

**Decision:** Generate five markdown documents and derive additional tabs from JSON and parsed markdown.

**Rationale:** This reduces cost and keeps factual sections grounded in the JSON.

**Consequences:** Viewers need careful parsing logic, and prompt changes must preserve expected section headings.

**Evidence:** `components/wizard/step-results.tsx`, `components/viewers/*`, `__tests__/prompts.test.ts`.

## DD-003: Demo Fixtures Instead Of A Demo Database

**Context:** Public demos should load instantly and not depend on provider keys.

**Decision:** Commit demo fixtures as TypeScript `SavedProject` modules and commit their image assets.

**Rationale:** Static fixtures are reliable, reviewable, and easy to route.

**Consequences:** Large generated image sets live in the repo, and fixture regeneration needs care to preserve image maps.

**Evidence:** `lib/demos/*`, `public/demo-images/*`, `components/demo/demo-content.tsx`.

## DD-004: Genre-Aware Local Demo Pipeline

**Context:** Earlier demo reports reused phrases and production vocabulary across unrelated films.

**Decision:** Add local text profiles in the fixture builder for romance, period court drama, horror/thriller, sci-fi/action, fable, and general drama.

**Rationale:** The demo needs to show that the workflow adapts to the script instead of stamping every movie with the same deck voice.

**Consequences:** The local fixture pipeline is now more product-critical and should be audited when prompts change.

**Evidence:** `prompt-tests/scripts/build-demo-fixture.mjs`, `plan.md`, `CHANGELOG.md`.

## DD-005: Desktop-Only Report Surface

**Context:** The report UI is dense, multi-column, and designed for a short A24-style desktop demo.

**Decision:** Use a mobile gate for viewports under 1024px.

**Rationale:** Collapsing the report to phones would compromise the intended presentation.

**Consequences:** Mobile users see a branded desktop-only screen instead of the full product.

**Evidence:** `components/mobile-gate.tsx`, `DESIGN.md`.

