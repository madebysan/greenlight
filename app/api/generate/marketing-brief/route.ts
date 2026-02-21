import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { MARKETING_BRIEF_PROMPT } from "@/lib/prompts/marketing-brief";

export async function POST(request: NextRequest) {
  try {
    const { jsonData } = await request.json();

    if (!jsonData) {
      return NextResponse.json(
        { error: "Missing jsonData in request body" },
        { status: 400 }
      );
    }

    const markdown = await generateDocument(MARKETING_BRIEF_PROMPT, jsonData);

    return NextResponse.json({ content: markdown });
  } catch (error) {
    console.error("Marketing brief generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
