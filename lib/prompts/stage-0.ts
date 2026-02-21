// Stage 0 extraction prompt — run manually in Claude.ai or ChatGPT
// with your screenplay PDF attached. Copy the JSON output into the app.

export const STAGE_0_PROMPT = `You are a professional script supervisor and pre-production analyst. Analyze the attached screenplay and extract a comprehensive structured JSON document.

Read the entire screenplay carefully. Extract every scene, character, location, and prop. Be thorough — missing data means missing production planning.

Output ONLY valid JSON matching this exact schema (no markdown, no commentary, no code fences):

{
  "title": "The movie title",
  "genre": ["Primary genre", "Secondary genre"],
  "setting_period": "Time period (e.g., 'Contemporary', '1960s', 'Near future')",
  "total_pages": 120,
  "scenes": [
    {
      "scene_number": 1,
      "slug_line": "INT. LOCATION - TIME OF DAY",
      "location": "location name (lowercase, consistent across scenes)",
      "int_ext": "INT" or "EXT" or "INT/EXT",
      "time_of_day": "DAY" or "NIGHT" or "DAWN" or "DUSK" or "CONTINUOUS",
      "page_start": 1,
      "page_end": 3,
      "characters_present": ["CHARACTER NAME", "CHARACTER NAME"],
      "key_visual_moment": "The single most visually striking or emotionally important moment in the scene — describe it cinematically in one sentence",
      "emotional_beat": "The core emotional shift or tension (e.g., 'confrontation', 'revelation', 'tenderness', 'dread')",
      "props": ["prop1", "prop2"],
      "wardrobe_notes": ["Character in specific outfit description"],
      "vfx_stunts": ["Any VFX, stunts, or special requirements"],
      "music_cue": "Any music direction mentioned or implied",
      "notes": "Any continuity notes, callbacks, or production-relevant details"
    }
  ],
  "characters": [
    {
      "name": "CHARACTER NAME (as written in the script, ALL CAPS)",
      "description": "Physical description, age, key traits as written in the script",
      "arc_summary": "One sentence describing their character arc across the screenplay",
      "scenes_present": [1, 3, 5, 7],
      "special_requirements": ["Any special skills, prosthetics, stunts, etc."],
      "wardrobe_changes": 4
    }
  ],
  "locations": [
    {
      "name": "location name (lowercase, matching scene references)",
      "description": "Physical description of the location as written in the script",
      "scenes": [1, 5, 12],
      "int_ext": "INT" or "EXT" or "BOTH",
      "time_variations": ["NIGHT", "MORNING"],
      "set_requirements": ["Key set dressing, practical effects, or build requirements"]
    }
  ],
  "props_master": [
    {
      "item": "prop name",
      "scenes": [1, 7, 15],
      "hero_prop": true,
      "notes": "Any special requirements (close-up, breakaway, multiples needed, etc.)"
    }
  ],
  "themes": ["Major thematic element 1", "Major thematic element 2"],
  "tone": "Overall tone description in 2-3 words (e.g., 'dark comedic thriller', 'tender coming-of-age')"
}

Rules:
- Include EVERY scene, even brief transitional ones
- Character names must be consistent (use the ALL CAPS version from the script)
- Location names must be consistent across scenes (use lowercase)
- Mark a prop as hero_prop: true if it has narrative significance (appears in multiple scenes, is a plot device, or gets a close-up)
- For wardrobe_notes, only include when the script specifically describes what a character is wearing
- For vfx_stunts, include any visual effects, practical effects, stunts, car chases, explosions, etc.
- If a field has no data for a scene, use an empty array [] or empty string ""
- page_start and page_end should be your best estimate based on script position
- Output ONLY the JSON object. No other text.`;

export const STAGE_0_SCHEMA_DESCRIPTION = `The prompt above will generate a JSON object with:
- title, genre, setting_period, total_pages (metadata)
- scenes[] — every scene with slug line, characters, visual moments, props, wardrobe, VFX
- characters[] — every character with description, arc, scene list, special requirements
- locations[] — every location with scenes, requirements, time variations
- props_master[] — every significant prop with scene appearances
- themes[] and tone`;
