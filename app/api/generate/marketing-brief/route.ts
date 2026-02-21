import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { MARKETING_BRIEF_PROMPT } from "@/lib/prompts/marketing-brief";
import { trimForMarketingBrief } from "@/lib/json-trimmer";
import { getCached, setCache } from "@/lib/response-cache";

const SLUG = "marketing-brief";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    if (!jsonData) {
      return NextResponse.json(
        { error: "Missing jsonData in request body" },
        { status: 400 }
      );
    }

    const cached = getCached(SLUG);
    if (cached) {
      return NextResponse.json({ content: cached });
    }

    const trimmed = trimForMarketingBrief(jsonData);
    const markdown = await generateDocument(MARKETING_BRIEF_PROMPT, trimmed);
    setCache(SLUG, markdown);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Marketing brief generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
