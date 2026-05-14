import type { Metadata } from "next";
import { RED_BALLOON_PROJECT } from "@/lib/demos/red-balloon";
import { DemoContent } from "@/components/demo/demo-content";

export const metadata: Metadata = {
  title: "The Red Balloon",
  description:
    "A Greenlight film deck for Albert Lamorisse's 1956 short The Red Balloon: mood, scenes, cast, and posters.",
  alternates: { canonical: "/demo/red-balloon" },
  openGraph: {
    title: "The Red Balloon - Greenlight film deck",
    description:
      "Mood, scenes, cast, and posters for Albert Lamorisse's 1956 short film.",
    url: "/demo/red-balloon",
    type: "article",
    images: [
      {
        url: "/demo/red-balloon/og-image",
        width: 1200,
        height: 630,
        alt: "The Red Balloon Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Red Balloon - Greenlight film deck",
    description:
      "Mood, scenes, cast, and poster concepts for Lamorisse's 1956 short film.",
    images: ["/demo/red-balloon/og-image"],
  },
};

export default function RedBalloonDemoPage() {
  return <DemoContent project={RED_BALLOON_PROJECT} shareSlug="red-balloon" />;
}
