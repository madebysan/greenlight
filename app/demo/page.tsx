import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_PROJECT } from "@/lib/demo-project";
import { DemoContent } from "@/components/demo/demo-content";

export const metadata: Metadata = {
  title: "Night of the Living Dead",
  description:
    "A Greenlight film deck for George A. Romero's Night of the Living Dead: mood, scenes, cast, and posters.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Night of the Living Dead - Greenlight film deck",
    description:
      "Mood, scenes, cast, and posters for George A. Romero's 1968 horror classic.",
    url: "/demo",
    type: "article",
    images: [
      {
        url: "/demo/og-image",
        width: 1200,
        height: 630,
        alt: "Night of the Living Dead Greenlight film deck",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Night of the Living Dead - Greenlight film deck",
    description:
      "Mood, scenes, cast, and poster concepts for Romero's 1968 horror classic.",
    images: ["/demo/og-image"],
  },
};

export default function DemoPage() {
  if (!DEMO_PROJECT) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-sm text-foreground/80">No demo snapshot has been saved yet.</p>
          <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
            Build a project at{" "}
            <Link href="/" className="underline underline-offset-2 hover:text-foreground">
              /
            </Link>
            , then click <span className="text-foreground">Save as demo</span> in the More menu
            to snapshot the current state into this route.
          </p>
        </div>
      </div>
    );
  }

  return <DemoContent project={DEMO_PROJECT} />;
}
