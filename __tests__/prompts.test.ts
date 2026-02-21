import { describe, it, expect } from "vitest";
import { STAGE_0_PROMPT } from "../lib/prompts/stage-0";
import { SCENE_BREAKDOWN_PROMPT } from "../lib/prompts/scene-breakdown";
import { PRODUCTION_MATRICES_PROMPT } from "../lib/prompts/production-matrices";
import { MARKETING_BRIEF_PROMPT } from "../lib/prompts/marketing-brief";
import { STORYBOARD_PROMPTS_PROMPT } from "../lib/prompts/storyboard-prompts";
import { POSTER_CONCEPTS_PROMPT } from "../lib/prompts/poster-concepts";

describe("Prompts", () => {
  it("Stage 0 prompt includes JSON schema keywords", () => {
    expect(STAGE_0_PROMPT).toContain("scenes");
    expect(STAGE_0_PROMPT).toContain("characters");
    expect(STAGE_0_PROMPT).toContain("locations");
    expect(STAGE_0_PROMPT).toContain("props_master");
    expect(STAGE_0_PROMPT).toContain("slug_line");
  });

  it("Scene breakdown prompt asks for scene-by-scene output", () => {
    expect(SCENE_BREAKDOWN_PROMPT).toContain("Scene");
    expect(SCENE_BREAKDOWN_PROMPT).toContain("markdown");
  });

  it("Production matrices prompt includes all 5 tables", () => {
    expect(PRODUCTION_MATRICES_PROMPT).toContain("Character Matrix");
    expect(PRODUCTION_MATRICES_PROMPT).toContain("Location Matrix");
    expect(PRODUCTION_MATRICES_PROMPT).toContain("Props Catalog");
    expect(PRODUCTION_MATRICES_PROMPT).toContain("Wardrobe Catalog");
    expect(PRODUCTION_MATRICES_PROMPT).toContain("VFX/Stunts Register");
  });

  it("Marketing brief prompt includes all sections", () => {
    expect(MARKETING_BRIEF_PROMPT).toContain("Logline");
    expect(MARKETING_BRIEF_PROMPT).toContain("Taglines");
    expect(MARKETING_BRIEF_PROMPT).toContain("Comparable Films");
    expect(MARKETING_BRIEF_PROMPT).toContain("Color Palette");
    expect(MARKETING_BRIEF_PROMPT).toContain("Target Audience");
  });

  it("Storyboard prompts prompt asks for per-scene outputs", () => {
    expect(STORYBOARD_PROMPTS_PROMPT).toContain("Scene");
    expect(STORYBOARD_PROMPTS_PROMPT).toContain("Camera");
    expect(STORYBOARD_PROMPTS_PROMPT).toContain("Lighting");
  });

  it("Poster concepts prompt asks for many concepts", () => {
    expect(POSTER_CONCEPTS_PROMPT).toContain("12-15");
    expect(POSTER_CONCEPTS_PROMPT).toContain("Character-Driven");
    expect(POSTER_CONCEPTS_PROMPT).toContain("Minimalist");
    expect(POSTER_CONCEPTS_PROMPT).toContain("Symbolic");
  });

  it("All prompts are non-empty strings", () => {
    const prompts = [
      STAGE_0_PROMPT,
      SCENE_BREAKDOWN_PROMPT,
      PRODUCTION_MATRICES_PROMPT,
      MARKETING_BRIEF_PROMPT,
      STORYBOARD_PROMPTS_PROMPT,
      POSTER_CONCEPTS_PROMPT,
    ];
    for (const p of prompts) {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(100);
    }
  });
});
