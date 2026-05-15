import type { Metadata } from "next";
import { DemoContent } from "@/components/demo/demo-content";
import { DUNE_PART_ONE_PROJECT } from "@/lib/demos/dune-part-one";

export const metadata: Metadata = {
  title: "Dune: Part One",
  description:
    "A Greenlight film deck for Dune: Part One: mood, scenes, locations, cast, production design, and posters.",
  alternates: { canonical: "/demo/dune-part-one" },
  openGraph: {
    title: "Dune: Part One - Greenlight film deck",
    description:
      "Mood, scenes, locations, cast, production design, and poster concepts for Dune: Part One.",
    url: "/demo/dune-part-one",
    type: "article",
    images: [
      {
        url: "/demo/dune-part-one/og-image",
        width: 1200,
        height: 630,
        alt: "Dune: Part One Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dune: Part One - Greenlight film deck",
    description:
      "Mood, scenes, cast, production design, and poster concepts for Dune: Part One.",
    images: ["/demo/dune-part-one/og-image"],
  },
};

export default function DunePartOneDemoPage() {
  return <DemoContent project={DUNE_PART_ONE_PROJECT} shareSlug="dune-part-one" />;
}
