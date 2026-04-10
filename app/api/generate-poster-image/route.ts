import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

const STYLE_PREFIX =
  "Film poster concept sketch, production art style. " +
  "Black felt-tip marker on white paper. " +
  "Loose but confident linework, simple crosshatching for shadows, gestural figures with just enough detail to convey the composition. " +
  "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
  "No text, no words, no letters, no titles, no signatures, no watermarks, no dates. Image only.";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const posterPrompt = `${STYLE_PREFIX} ${prompt}`;

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: posterPrompt,
        image_size: {
          width: 720,
          height: 1008,
        },
        num_images: 1,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    // Download and save locally
    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const id = randomUUID().slice(0, 12);
    const filename = `poster-${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Poster image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
