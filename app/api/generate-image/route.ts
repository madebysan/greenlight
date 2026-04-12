import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { DEFAULT_IMAGE_PROMPTS, STYLE_OVERRIDE_PREFIX, STYLE_REINFORCEMENT } from "@/lib/image-prompts";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

export async function POST(request: NextRequest) {
  try {
    const { prompt, camera, stylePrefix } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    // User can override the style prefix from Settings; otherwise fall back
    // to the default Ridley-Scott storyboard look.
    const STYLE_PREFIX =
      typeof stylePrefix === "string" && stylePrefix.trim()
        ? stylePrefix.trim()
        : DEFAULT_IMAGE_PROMPTS.storyboard;

    const storyboardPrompt = [
      STYLE_PREFIX,
      STYLE_OVERRIDE_PREFIX,
      camera ? `Camera: ${camera}.` : "",
      "Subject:",
      prompt,
      STYLE_REINFORCEMENT,
    ].filter(Boolean).join(" ");

    const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", {
      input: {
        prompt: storyboardPrompt,
        aspect_ratio: "16:9",
        num_images: 1,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    // Download and save locally so the image persists
    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const id = randomUUID().slice(0, 12);
    const filename = `${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
