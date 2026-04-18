import type { Metadata } from "next";
import { DEMO_PROJECT } from "@/lib/demo-project";
import { DemoContent } from "@/components/demo/demo-content";

export const metadata: Metadata = {
  title: "Night of the Living Dead",
  description:
    "A vision deck for George A. Romero's Night of the Living Dead — mood, scenes, cast, and poster concepts, built with Greenlight.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Night of the Living Dead — Greenlight vision deck",
    description:
      "Mood, scenes, cast, and poster concepts for George A. Romero's 1968 horror classic, built with Greenlight.",
    url: "/demo",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Night of the Living Dead — Greenlight vision deck",
    description:
      "Mood, scenes, cast, and poster concepts for Romero's 1968 horror classic.",
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
            <a href="/" className="underline underline-offset-2 hover:text-foreground">
              /
            </a>
            , then click <span className="text-foreground">Save as demo</span> in the More menu
            to snapshot the current state into this route.
          </p>
        </div>
      </div>
    );
  }

  return <DemoContent project={DEMO_PROJECT} />;
}
