import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { NextRequest, NextResponse } from "next/server";

type SaveLocalBody = {
  filename?: unknown;
  content?: unknown;
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "save-local is dev-only." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as SaveLocalBody;
    const filename = typeof body.filename === "string" ? body.filename : "";
    const content = typeof body.content === "string" ? body.content : "";

    if (!filename || !content) {
      return NextResponse.json({ error: "Missing filename or content" }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const dir = join(homedir(), "Desktop", "greenlight");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, safeName), content, "utf-8");

    return NextResponse.json({ ok: true, filename: safeName });
  } catch {
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
