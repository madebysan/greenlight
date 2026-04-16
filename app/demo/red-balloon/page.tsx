"use client";

import { RED_BALLOON_PROJECT } from "@/lib/demos/red-balloon";
import { DemoContent } from "@/components/demo/demo-content";

export default function RedBalloonDemoPage() {
  return <DemoContent project={RED_BALLOON_PROJECT} shareSlug="red-balloon" />;
}
