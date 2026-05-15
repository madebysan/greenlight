# Dependencies

## Runtime Dependencies

| Dependency | Role |
|---|---|
| `next` | App Router, server route handlers, metadata, build |
| `react`, `react-dom` | Client UI |
| `@anthropic-ai/sdk` | Claude text generation |
| `@fal-ai/client` | fal.ai image generation |
| `lucide-react` | Icons for report navigation and controls |
| `radix-ui` | Dialog primitives |
| `class-variance-authority`, `clsx`, `tailwind-merge` | shadcn-style component variants |

## Dev Dependencies

| Dependency | Role |
|---|---|
| `typescript` | Type checking |
| `eslint`, `eslint-config-next` | Linting |
| `vitest`, `jsdom`, `@testing-library/jest-dom` | Unit tests |
| `playwright`, `@playwright/test` | Browser and visual QA scripts |
| `tailwindcss`, `@tailwindcss/postcss` | Styling |
| `shadcn` | Component scaffolding support |

## External Services

| Service | Used for |
|---|---|
| Anthropic Claude | Default text provider |
| OpenAI-compatible API | Alternate text provider |
| DeepSeek | Lower-cost text provider |
| Gemini | Long-context text provider |
| fal.ai | FLUX LoRA image generation |
| Hugging Face | Gesture Draw LoRA file |
| TMDB | Film poster reference lookup |

