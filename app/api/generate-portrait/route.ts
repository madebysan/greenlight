import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

const STYLE_PREFIX =
  "Character portrait sketch, production art style. " +
  "Black felt-tip marker on white paper, head and shoulders only, centered in frame. " +
  "Loose but confident linework, simple crosshatching for shadows. " +
  "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
  "No text, no labels, no signatures, no watermarks. Square composition.";

export async function POST(request: NextRequest) {
  try {
    const { description, name } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Missing description" },
        { status: 400 }
      );
    }

    const prompt = `${STYLE_PREFIX} Character: ${name || "Unknown"}. ${description}`;

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square",
        num_images: 1,
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image returned from fal.ai");
    }

    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const id = randomUUID().slice(0, 12);
    const filename = `portrait-${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Portrait generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Portrait generation failed" },
      { status: 500 }
    );
  }
}
