"use client";

import { useEffect, useState } from "react";
import { ShareableView } from "@/components/share/shareable-view";
import { loadProject, type SavedProject } from "@/lib/reports";
import { DEMO_PROJECT } from "@/lib/demo-project";

export default function SharePage() {
  const [project, setProject] = useState<SavedProject | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "demo") {
      setProject(DEMO_PROJECT);
    } else {
      setProject(loadProject());
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          No active project. Start one on the home page to use the shareable view.
        </p>
        <a href="/" className="text-sm text-foreground underline underline-offset-4">
          Go to Greenlight
        </a>
      </div>
    );
  }

  return <ShareableView project={project} />;
}
