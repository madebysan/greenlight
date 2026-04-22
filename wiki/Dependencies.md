# Dependencies

## Runtime

| Package | Version | Purpose | Why this one |
|---------|---------|---------|-------------|
| `next` | 16.1.6 | Framework | App Router, API routes, SSR. Latest version for React 19 support. |
| `react` / `react-dom` | 19.2.3 | UI library | Latest React with concurrent features. |
| `@anthropic-ai/sdk` | 0.78.0 | Claude API | Official SDK with retry/streaming support. |
| `@fal-ai/client` | 1.9.5 | FLUX image gen | Official fal.ai SDK. Supports LoRA, negative prompts. |
| `react-markdown` | 10.1.0 | Markdown rendering | Used in `document-viewer.tsx`. Handles GFM tables, lists, headings. |
| `remark-gfm` | 4.0.1 | GitHub-flavored markdown | Tables and strikethrough in `react-markdown`. |
| `@radix-ui/react-dialog` | 1.4.3 | Modal primitives | Accessible dialog for Settings, About. Via shadcn. |
| `@radix-ui/react-alert-dialog` | 1.4.3 | Confirm dialog | Accessible confirm for destructive actions. Via shadcn. |
| `lucide-react` | 0.575.0 | Icons | Consistent icon set. ~150 icons used across viewers. |
| `clsx` | 2.1.1 | Class merging | Conditional classnames. |
| `class-variance-authority` | 0.7.1 | Variant system | Button variants in shadcn components. |
| `tailwind-merge` | 3.5.0 | Tailwind dedup | Prevents conflicting Tailwind classes in `cn()`. |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4 | CSS framework |
| `@tailwindcss/postcss` | 4 | PostCSS integration |
| `typescript` | 5.9.3 | Type checking |
| `eslint` | 9 | Linting |
| `vitest` | 4.0.18 | Unit testing |
| `@testing-library/react` | 16.3.2 | Component testing |
| `playwright` | 1.58.2 | Visual QA screenshots |

## External Services (not npm packages)

| Service | Usage | Cost |
|---------|-------|------|
| Claude Haiku 4.5 (Anthropic) | Document generation | ~$0.005/document |
| FLUX dev + Gesture Draw LoRA (fal.ai) | Image generation | $0.035/image |
| TMDB REST API | Film poster lookups | Free (API key required) |
| Google Fonts CDN | Title treatment font loading | Free |
| HuggingFace | LoRA weight hosting | Free (direct download URL) |
