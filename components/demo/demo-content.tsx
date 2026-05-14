"use client";

// Shared demo viewer. Renders a committed SavedProject snapshot in a read-only
// flavor of StepResults. Used by both /demo (Night of the Living Dead) and
// /demo/red-balloon. Local-only state — reloading the page resets everything
// to the committed snapshot.

import { useEffect, useState } from "react";
import { RotateCcw, Info, Share2 } from "lucide-react";
import { StepResults } from "@/components/wizard/step-results";
import { HeaderButton, MoreMenu } from "@/components/wizard/header-menu";
import { AboutDialog } from "@/components/wizard/about-dialog";
import type { DocumentResult } from "@/components/wizard/wizard-shell";
import type { SavedImage, SavedProject } from "@/lib/reports";

type DemoContentProps = {
  project: SavedProject;
  /** URL slug used for the Share link query param. Defaults to "demo". */
  shareSlug?: string;
};

export function DemoContent({ project, shareSlug = "demo" }: DemoContentProps) {
  const [documents, setDocuments] = useState<DocumentResult[]>(() =>
    project.documents.map((d) => ({
      ...d,
      status: d.status as DocumentResult["status"],
    })),
  );
  const [storyboardImages, setStoryboardImages] = useState<Record<number, SavedImage>>(
    () => project.images || {},
  );
  const [posterImages, setPosterImages] = useState<Record<number, SavedImage>>(
    () => project.posterImages || {},
  );
  const [portraits, setPortraits] = useState<Record<string, SavedImage>>(
    () => project.portraits || {},
  );
  const [propImages, setPropImages] = useState<Record<string, SavedImage>>(
    () => project.propImages || {},
  );
  const [promptOverrides, setPromptOverrides] = useState<Record<number, string>>(
    () => project.promptOverrides || {},
  );
  const [disabledItems, setDisabledItems] = useState<Record<string, boolean>>(
    () => project.disabledItems || {},
  );
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleDocumentUpdate = (slug: string, newContent: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.slug === slug ? { ...d, content: newContent } : d)),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1180px] px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-white text-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-normal text-foreground">
                Greenlight{" "}
                <span className="ml-1 align-middle font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  · Demo
                </span>
              </h1>
              <p className="text-[12px] text-foreground/58">Script to film deck.</p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <HeaderButton
                icon={<RotateCcw size={14} />}
                label="Back to Greenlight"
                onClick={() => {
                  window.location.href = "/";
                }}
                title="Leave the demo"
              />
              <MoreMenu
                items={[
                  {
                    icon: <Share2 size={14} />,
                    label: "Share",
                    onClick: () => {
                      window.location.href = `/share?source=${shareSlug}`;
                    },
                  },
                  "divider",
                  {
                    icon: <Info size={14} />,
                    label: "About Greenlight",
                    onClick: () => setShowAbout(true),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 py-6">
        <StepResults
          documents={documents}
          jsonData={project.jsonData}
          onStartOver={() => {
            window.location.href = "/";
          }}
          onDocumentUpdate={handleDocumentUpdate}
          storyboardImages={storyboardImages}
          onStoryboardImagesChange={setStoryboardImages}
          promptOverrides={promptOverrides}
          onPromptOverridesChange={setPromptOverrides}
          posterImages={posterImages}
          onPosterImagesChange={setPosterImages}
          portraits={portraits}
          onPortraitsChange={setPortraits}
          propImages={propImages}
          onPropImagesChange={setPropImages}
          disabledItems={disabledItems}
          onDisabledItemsChange={setDisabledItems}
        />
      </main>
      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </div>
  );
}
