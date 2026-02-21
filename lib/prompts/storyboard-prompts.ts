export const STORYBOARD_PROMPTS_PROMPT = `Generate Storyboard Prompts from this screenplay data. Each prompt is designed to be used with an AI image generator (like FLUX, Midjourney, or DALL-E) to create storyboard frames.

Format your output as clean markdown:

# Storyboard Prompts: [Title]

## How to Use These Prompts
Each prompt below describes a key visual moment from the screenplay. Copy any prompt into an image generator to create a storyboard frame. Edit the prompts to adjust camera angles, lighting, or composition.

---

For EVERY scene that has a key_visual_moment, generate a prompt block:

### Scene [number]: [slug line]

**Prompt:**
[Write a detailed image generation prompt that describes:
- The physical setting and environment
- Characters present and their positions/actions
- Camera angle (wide shot, close-up, over-the-shoulder, bird's eye, etc.)
- Lighting (natural, harsh, soft, neon, candlelit, etc.)
- Mood and atmosphere
- Color palette for this specific moment
- Any important props or wardrobe details visible

Write it as a single flowing paragraph optimized for image generation. Be specific about composition.]

**Camera:** [suggested camera angle/movement]
**Lighting:** [key lighting description]
**Mood:** [1-3 words]

---

After all prompts, add:

## Prompt Modifiers
Suggest 5 style modifiers the user can append to any prompt:
1. **Cinematic:** [modifier text]
2. **Noir:** [modifier text]
3. **Documentary:** [modifier text]
4. **Indie:** [modifier text]
5. **Stylized:** [modifier text]

Output ONLY the markdown document. No commentary outside the document.`;
