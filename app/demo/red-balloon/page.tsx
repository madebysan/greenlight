import type { Metadata } from "next";
import { RED_BALLOON_PROJECT } from "@/lib/demos/red-balloon";
import { DemoContent } from "@/components/demo/demo-content";

export const metadata: Metadata = {
  title: "The Red Balloon",
  description:
    "A vision deck for Albert Lamorisse's 1956 short The Red Balloon — mood, scenes, cast, and poster concepts, built with Greenlight.",
  alternates: { canonical: "/demo/red-balloon" },
  openGraph: {
    title: "The Red Balloon — Greenlight vision deck",
    description:
      "Mood, scenes, cast, and poster concepts for Albert Lamorisse's 1956 short film, built with Greenlight.",
    url: "/demo/red-balloon",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Red Balloon — Greenlight vision deck",
    description:
      "Mood, scenes, cast, and poster concepts for Lamorisse's 1956 short film.",
  },
};

export default function RedBalloonDemoPage() {
  return <DemoContent project={RED_BALLOON_PROJECT} shareSlug="red-balloon" />;
}
