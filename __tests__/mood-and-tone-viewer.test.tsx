import { describe, expect, it } from "vitest";

import { parseMoodAndTone } from "@/components/viewers/mood-and-tone-viewer";
import { GET_OUT_PROJECT } from "@/lib/demos/get-out";

describe("parseMoodAndTone", () => {
  it("parses local fixture rows that use hyphen separators", () => {
    const doc = GET_OUT_PROJECT.documents.find((item) => item.slug === "mood-and-tone");

    expect(doc?.content).toBeTruthy();

    const parsed = parseMoodAndTone(doc?.content ?? "");

    expect(parsed.references.length).toBeGreaterThan(0);
    expect(parsed.similarMoods.length).toBeGreaterThan(0);
    expect(parsed.soundtracks.length).toBeGreaterThan(0);
    expect(parsed.palette.length).toBeGreaterThan(0);
    expect(parsed.references.map((item) => item.title)).toContain("Rosemary's Baby");
    expect(parsed.similarMoods.map((item) => item.title)).toContain("Rosemary's Baby");
    expect(parsed.soundtracks.map((item) => item.title)).toContain("Sicario");
    expect(parsed.soundtracks.find((item) => item.title === "Sicario")?.description).toContain("Low-frequency dread");
  });
});
