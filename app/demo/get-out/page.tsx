import type { Metadata } from "next";
import { DemoContent } from "@/components/demo/demo-content";
import { GET_OUT_PROJECT } from "@/lib/demos/get-out";

export const metadata: Metadata = {
  title: "Get Out",
  description:
    "A Greenlight film deck for Jordan Peele's Get Out: mood, scenes, locations, cast, production design, and posters.",
  alternates: { canonical: "/demo/get-out" },
  openGraph: {
    title: "Get Out - Greenlight film deck",
    description:
      "Mood, scenes, locations, cast, production design, and poster concepts for Jordan Peele's Get Out.",
    url: "/demo/get-out",
    type: "article",
    images: [
      {
        url: "/demo/get-out/og-image",
        width: 1200,
        height: 630,
        alt: "Get Out Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Out - Greenlight film deck",
    description:
      "Mood, scenes, cast, production design, and poster concepts for Get Out.",
    images: ["/demo/get-out/og-image"],
  },
};

export default function GetOutDemoPage() {
  return <DemoContent project={GET_OUT_PROJECT} shareSlug="get-out" />;
}
