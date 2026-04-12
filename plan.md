# Greenlight — Current Plan

Greenlight is a portfolio project built to impress A24's creative team in a job interview. See `presentation.md` for full context and `backlog.md` for deferred work.

---

## Done this session (2026-04-12, session 4 — image generation overhaul)

### Gesture Draw LoRA integration
Replaced FLUX Schnell ($0.003/image, polished output) with **FLUX dev + Gesture Draw LoRA** ($0.035/image, B&W gesture sketch). Extensive A/B testing across 4 FLUX model tiers (schnell, dev, pro v1.1, pro v1.1 ultra) and multiple prompt strategies led to this config:

- **Model:** `fal-ai/flux-lora` with [glif/Gesture-Draw](https://huggingface.co/glif/Gesture-Draw) LoRA at scale 1.0
- **Steps:** 28, guidance 3.5
- **Negative prompt:** blocks color, photorealism, sepia, warm tint, rendering
- **Prompt structure:** `gstdrw style` trigger + per-kind style prefix + subject. No sandwich/reinforcement needed — the LoRA handles style enforcement.

### Files changed
- **`lib/image-prompts.ts`** — complete rewrite. New exports: `IMAGE_NEGATIVE_PROMPT`, `GESTURE_DRAW_LORA_URL`, `GESTURE_DRAW_LORA_SCALE`. Style prefixes rewritten for LoRA trigger. Removed `STYLE_OVERRIDE_PREFIX` and `STYLE_REINFORCEMENT` (no longer needed).
- **`app/api/generate-image/route.ts`** — switched to `fal-ai/flux-lora` with LoRA config, negative prompt, 28 steps
- **`app/api/generate-portrait/route.ts`** — same
- **`app/api/generate-prop/route.ts`** — same
- **`app/api/generate-poster-image/route.ts`** — same
- **42 demo images regenerated** in `public/demo-images/` — all storyboards, portraits, props, and posters now in Gesture Draw B&W style

### Prop visibility fix
Props were nearly invisible (sparse lines, tiny objects in large canvas) because the Gesture Draw LoRA is trained on figure drawing, not isolated objects. Fixed by changing the prop style prefix only: "bold linework, close-up filling the frame" instead of "rough lines, minimal background". Props regenerated separately — storyboards/portraits/posters untouched.

### Crew → Insights (from session start)
Replaced the generic Crew tab with situational production Insights. See session 3 notes for details.

### Research conducted (not shipped as features)
- Tested FLUX schnell, dev, pro v1.1, pro v1.1 ultra across 4 artist-style prompts (Moebius, Despretz, Huebner, Toth)
- Tested prompt sandwich strategies (style-only, sandwich, heavy sandwich, sandwich+raw) to fight color leakage from AI-generated subject prose
- Tested Gesture Draw LoRA at scales 1.0–1.8 and steps 8–28 to find the roughness sweet spot
- Tested HuggingFace storyboard scene LoRA (too polished/anime, rejected)

### Backlog update
- Removed A24 bonus-round samples section (already completed)

---

## Current state

- **Build status:** passing (`tsc --noEmit` clean)
- **Dev server:** running on :3001
- **Demo:** all 42 images regenerated with Gesture Draw LoRA, consistent B&W sketch style
- **Git state:** clean (auto-commit hook captured all changes)
- **Image gen cost:** $0.035/image (~$1.47 per full bible of 42 images)

---

## Next steps

- [ ] **Font audit execution** — 72 `font-semibold`/`font-bold` stragglers across 17 files. Waiting on user scope preference from session 3.
- [ ] **"Upload script" tab** — end-to-end script→bible flow via Claude Sonnet PDF extraction. Design thinking completed in session 3, not yet implemented. PDF-only v1, additive tab alongside existing Paste JSON.
- [ ] **Low-risk backlog items** — keyboard shortcuts, batch download ZIPs, PDF export button wiring

---

## Decisions & context

- **Gesture Draw LoRA at scale 1.0 / 28 steps is the sweet spot.** Higher scale (1.3+) produced artifacts and 3D glass-orb effects. Fewer steps (<12) made output unreadable. The user preferred the clean-but-sketchy output of 1.0/28 over rougher variants.
- **No prompt sandwich needed with the LoRA.** The `gstdrw style` trigger + negative prompt is sufficient to override color/lighting words in AI-generated subject prose. The heavy-sandwich approach was tested and worked, but the LoRA makes it unnecessary.
- **Props need a different style prefix.** The Gesture Draw LoRA renders isolated objects too sparsely (trained on figure drawing). Props use "bold linework, close-up filling the frame" while all other types use "rough lines, minimal background."
- **FLUX dev with LoRA ($0.035) beats FLUX Pro Ultra ($0.06).** Ultra was better at style adherence without a LoRA, but with the Gesture Draw LoRA, dev produces equivalent results at 58% of the cost and faster latency.
- **Civitai CDN blocks fal.ai downloads.** Use HuggingFace URLs for LoRA weights (`huggingface.co/.../resolve/main/file.safetensors`). Civitai API download format (`civitai.com/api/download/models/{id}`) also works as a fallback.
- **fal.ai SDK types lag behind the API.** `negative_prompt` and `loras` are accepted by the API but not in the TypeScript types. Workaround: `as never` type assertion on the input object.
