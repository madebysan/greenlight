import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/claude";
import { resolveTextGenerationConfig } from "@/lib/text-generation";

const SYSTEM_PROMPT = `You are a storyboard artist reimagining a scene for a film.
Given an existing storyboard prompt, write a DIFFERENT visual interpretation of the same scene.
Change the camera angle, framing, focal point, or composition — but keep the same narrative beat.
Output ONLY the new prompt text, nothing else. No labels, no explanation. 1-3 sentences max.`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: unknown;
      slugLine?: unknown;
      apiKey?: unknown;
      apiProvider?: unknown;
    };
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const slugLine = typeof body.slugLine === "string" ? body.slugLine : "";
    const { apiKey, provider } = resolveTextGenerationConfig(body);

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "Missing prompt or selected provider API key" },
        { status: 400 }
      );
    }

    const input = `Scene: ${slugLine || "Unknown"}\n\nCurrent prompt:\n${prompt}\n\nWrite a different visual interpretation of this same scene.`;
    const newPrompt = await generateDocument(SYSTEM_PROMPT, input, { apiKey, provider });

    return NextResponse.json({ prompt: newPrompt.trim() });
  } catch (error) {
    console.error("Prompt regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
