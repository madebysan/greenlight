import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const expected = process.env.ACCESS_PASSWORD;

  // No password configured = gate disabled (dev mode)
  if (!expected) {
    return NextResponse.json({ ok: true });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
