import type { Metadata } from "next";
import { DemoContent } from "@/components/demo/demo-content";
import { PAST_LIVES_PROJECT } from "@/lib/demos/past-lives";

export const metadata: Metadata = {
  title: "Past Lives",
  description:
    "A Greenlight film deck for Celine Song's Past Lives: mood, scenes, locations, cast, production design, and posters.",
  alternates: { canonical: "/demo/past-lives" },
  openGraph: {
    title: "Past Lives - Greenlight film deck",
    description:
      "Mood, scenes, locations, cast, production design, and poster concepts for Past Lives.",
    url: "/demo/past-lives",
    type: "article",
    images: [
      {
        url: "/demo/past-lives/og-image",
        width: 1200,
        height: 630,
        alt: "Past Lives Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Past Lives - Greenlight film deck",
    description:
      "Mood, scenes, cast, production design, and poster concepts for Past Lives.",
    images: ["/demo/past-lives/og-image"],
  },
};

export default function PastLivesDemoPage() {
  return <DemoContent project={PAST_LIVES_PROJECT} shareSlug="past-lives" />;
}
