"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShareableView } from "@/components/share/shareable-view";
import { loadProject, type SavedProject } from "@/lib/reports";
import { DEMO_PROJECT } from "@/lib/demo-project";
import { GET_OUT_PROJECT } from "@/lib/demos/get-out";
import { RED_BALLOON_PROJECT } from "@/lib/demos/red-balloon";

const DEMO_SHARE_SOURCES: Partial<Record<string, SavedProject | null>> = {
  demo: DEMO_PROJECT,
  "get-out": GET_OUT_PROJECT,
  "red-balloon": RED_BALLOON_PROJECT,
};

const SHARE_PAGE_CLASS = "share-light min-h-screen bg-background text-foreground";

export default function SharePage() {
  const [project, setProject] = useState<SavedProject | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") || "";
    const demoProject = DEMO_SHARE_SOURCES[source];

    if (demoProject) {
      setProject(demoProject);
    } else {
      setProject(loadProject());
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!hydrated) {
    return (
      <main className={`${SHARE_PAGE_CLASS} flex items-center justify-center text-muted-foreground text-sm`}>
        Loading deck...
      </main>
    );
  }

  if (!project) {
    return (
      <main className={`${SHARE_PAGE_CLASS} flex flex-col items-center justify-center gap-3 px-6 text-center`}>
        <p className="text-sm text-muted-foreground">
          No active project yet. Start one from Greenlight first.
        </p>
        <Link href="/" className="text-sm text-foreground underline underline-offset-4">
          Go to Greenlight
        </Link>
      </main>
    );
  }

  return (
    <main className={SHARE_PAGE_CLASS}>
      <ShareableView project={project} />
    </main>
  );
}
