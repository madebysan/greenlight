import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientKey = formData.get("apiKey") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      // Sonnet 4.6 supports up to 64k output tokens. Screenplay extractions
      // can easily run 20-30k tokens of JSON, so 16k was too tight and caused
      // mid-JSON truncation → parse failure. 32k is a safe middle ground.
      max_tokens: 32768,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: STAGE_0_PROMPT,
            },
          ],
        },
      ],
    });

    const output = message.content[0]?.type === "text" ? message.content[0].text : "";
    const stopReason = message.stop_reason;

    // Truncation detection: if we hit the output cap, the tail of the JSON is
    // guaranteed invalid. Surface a clear error instead of a generic parse
    // failure so the user knows to try a shorter script.
    if (stopReason === "max_tokens") {
      console.error("[extract-screenplay] hit max_tokens", {
        outputLength: output.length,
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens,
      });
      return NextResponse.json(
        {
          error:
            "Your screenplay was too long for one pass. Try a shorter script or split it into parts.",
        },
        { status: 413 },
      );
    }

    // Three-stage JSON extraction: raw → fenced block → first balanced braces.
    // Covers the common drift modes where Claude adds preamble/trailing prose
    // despite the "Output ONLY valid JSON" instruction.
    const json = extractJson(output);
    if (!json) {
      console.error("[extract-screenplay] could not extract JSON", {
        stopReason,
        outputLength: output.length,
        head: output.slice(0, 200),
        tail: output.slice(-200),
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens,
      });
      return NextResponse.json(
        { error: "Claude returned invalid JSON. Try again or use the manual Gemini method." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      json,
      tokens: {
        input: message.usage?.input_tokens,
        output: message.usage?.output_tokens,
      },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}

// Forgiving JSON extraction. Returns the parsed-clean JSON string, or null if
// nothing parses. Tries three strategies in order:
//   1. Raw parse — happy path, model followed instructions.
//   2. First ```json ... ``` fenced block — model wrapped the JSON in a fence.
//   3. First balanced-brace span — model added preamble/trailing prose. Scans
//      from the first `{`, tracking brace depth (and respecting strings so
//      braces inside string values don't throw off the count) until the
//      matching close brace.
function extractJson(raw: string): string | null {
  const tryParse = (s: string): string | null => {
    try {
      JSON.parse(s);
      return s;
    } catch {
      return null;
    }
  };

  const rawTrimmed = raw.trim();
  const direct = tryParse(rawTrimmed);
  if (direct) return direct;

  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) {
    const fenced = tryParse(fenceMatch[1].trim());
    if (fenced) return fenced;
  }

  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = raw.slice(start, i + 1);
        return tryParse(candidate);
      }
    }
  }
  return null;
}
