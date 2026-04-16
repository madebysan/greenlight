"use client";

import { DEMO_PROJECT } from "@/lib/demo-project";
import { DemoContent } from "@/components/demo/demo-content";

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
