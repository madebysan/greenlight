import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

fal.config({ credentials: process.env.FAL_KEY });

const IMAGES_DIR = join(process.cwd(), ".cache", "images");

// Prop reference sketches — matches the character portrait aesthetic so the
// whole bible reads as a single artist's hand. Black-and-white pen work, the
// kind a production designer would pin to a reference board.
const STYLE_PREFIX =
  "Prop reference sketch, production art style. " +
  "Black felt-tip marker on white paper. Single isolated object, centered in frame, no background detail. " +
  "Loose but confident linework, simple crosshatching for shadows. " +
  "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
  "No people, no text, no labels, no signatures, no watermarks. Square composition.";

export async function POST(request: NextRequest) {
  try {
    const { name, notes } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Missing prop name" }, { status: 400 });
    }

    const description = notes ? `${name}. ${notes}` : name;
    const prompt = `${STYLE_PREFIX} Subject: ${description}`;

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
    const filename = `prop-${id}.jpg`;
    mkdirSync(IMAGES_DIR, { recursive: true });
    writeFileSync(join(IMAGES_DIR, filename), buffer);

    return NextResponse.json({ url: `/api/serve-image/${filename}` });
  } catch (error) {
    console.error("Prop generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prop generation failed" },
      { status: 500 },
    );
  }
}
