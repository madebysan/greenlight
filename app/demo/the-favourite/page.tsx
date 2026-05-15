import type { Metadata } from "next";
import { DemoContent } from "@/components/demo/demo-content";
import { THE_FAVOURITE_PROJECT } from "@/lib/demos/the-favourite";

export const metadata: Metadata = {
  title: "The Favourite",
  description:
    "A Greenlight film deck for Yorgos Lanthimos' The Favourite: mood, scenes, locations, cast, production design, and posters.",
  alternates: { canonical: "/demo/the-favourite" },
  openGraph: {
    title: "The Favourite - Greenlight film deck",
    description:
      "Mood, scenes, locations, cast, production design, and poster concepts for The Favourite.",
    url: "/demo/the-favourite",
    type: "article",
    images: [
      {
        url: "/demo/the-favourite/og-image",
        width: 1200,
        height: 630,
        alt: "The Favourite Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Favourite - Greenlight film deck",
    description:
      "Mood, scenes, cast, production design, and poster concepts for The Favourite.",
    images: ["/demo/the-favourite/og-image"],
  },
};

export default function TheFavouriteDemoPage() {
  return <DemoContent project={THE_FAVOURITE_PROJECT} shareSlug="the-favourite" />;
}
