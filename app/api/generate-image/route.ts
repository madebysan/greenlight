import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

export async function POST(request: NextRequest) {
  try {
    const { prompt, camera } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const STYLE_PREFIX =
      "Film production storyboard panel in the style of Ridley Scott's hand-drawn storyboards. " +
      "Black felt-tip marker on white paper, inside a thin rectangular panel border. " +
      "Loose but confident linework, simple crosshatching for shadows, stick-figure proportions with just enough detail to read the action. " +
      "Strictly black and white only. No color whatsoever, no yellow, no red, no tints, pure black ink on white paper. " +
      "No text, no labels, no captions, no signatures, no initials, no watermarks, no dates, no lined paper.";

    const storyboardPrompt = [
      STYLE_PREFIX,
      camera ? `Hand-drawn arrows showing camera movement: ${camera}.` : "",
      prompt,
    ].filter(Boolean).join(" ");

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: storyboardPrompt,
        image_size: "landscape_16_9",
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
