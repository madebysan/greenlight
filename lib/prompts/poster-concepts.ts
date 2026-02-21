export const POSTER_CONCEPTS_PROMPT = `Generate a Poster Concepts document from this screenplay data. This is a creative exploration document — generate MANY diverse ideas for movie poster designs. Quantity and variety matter more than perfection. The user will iterate on favorites.

Format your output as clean markdown:

# Poster Concepts: [Title]

## About This Document
These are concept directions for movie poster design. Each concept describes a visual approach, composition, and mood. Use these as briefs for a designer, or as prompts for AI image generation. Mix and match elements across concepts.

---

Generate 12-15 distinct poster concepts across these style categories:

### Category: Character-Driven (2-3 concepts)
Posters that center on a character's face, silhouette, or figure.

**Concept [N]: [Concept Name]**
- **Style:** [e.g., Close-up portrait, Full silhouette, Split face]
- **Composition:** [Detailed description of what the viewer sees — layout, focal point, negative space, background]
- **Color Palette:** [3-4 colors with hex codes and mood reasoning]
- **Typography:** [Where the title goes, what style, size relationship to image]
- **Tagline:** [Suggested tagline for this specific concept]
- **Mood:** [2-3 words]
- **Target Appeal:** [Who this poster speaks to most]
- **AI Prompt:** [A ready-to-use image generation prompt for this poster concept]

### Category: Symbolic/Metaphorical (2-3 concepts)
Posters built around a central symbol, object, or metaphor from the story.

### Category: Scene-Based (2-3 concepts)
Posters that depict a specific key moment or location from the film.

### Category: Minimalist/Typographic (2-3 concepts)
Posters that rely on typography, negative space, and minimal imagery.

### Category: Mood/Atmospheric (2-3 concepts)
Posters that capture the film's tone through color, texture, and abstract visuals.

### Category: Collage/Ensemble (1-2 concepts)
Posters that combine multiple elements, characters, or scenes into a unified composition.

---

## Poster Series Ideas
Suggest 2-3 ways these concepts could work as a series (e.g., character-specific variants, teaser + theatrical + home release, international variants).

## Production Notes
- Recommended poster dimensions: 27x40 inches (theatrical), 16:9 (digital)
- Key art that works at thumbnail size (streaming) vs. full size (theater lobby)
- Suggest which concepts scale down best for social media

Output ONLY the markdown document. No commentary outside the document.`;
