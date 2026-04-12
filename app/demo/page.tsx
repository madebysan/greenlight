"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Sun, Moon, Info, Share2 } from "lucide-react";
import { DEMO_PROJECT } from "@/lib/demo-project";
import { StepResults } from "@/components/wizard/step-results";
import { HeaderButton, MoreMenu } from "@/components/wizard/header-menu";
import { AboutDialog } from "@/components/wizard/about-dialog";
import type { DocumentResult } from "@/components/wizard/wizard-shell";
import type { SavedImage, SavedProject } from "@/lib/reports";

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

function DemoContent({ project }: { project: SavedProject }) {
  // Local-only state — reloading the page resets everything to the committed
  // snapshot. Visitors can interact (shuffle taglines, disable roles, toggle
  // scene expansions) but nothing persists.
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setTheme(localStorage.getItem("greenlight-theme") === "light" ? "light" : "dark");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("greenlight-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleDocumentUpdate = (slug: string, newContent: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.slug === slug ? { ...d, content: newContent } : d)),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
            </div>
            <div>
              <h1 className="text-[17px] font-medium tracking-[-0.02em]">
                Greenlight{" "}
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground ml-1 align-middle">
                  · Demo
                </span>
              </h1>
              <p className="text-[12px] text-foreground/70 tracking-tight">Script to vision deck in minutes.</p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <HeaderButton
                icon={<RotateCcw size={14} />}
                label="Back to Greenlight"
                onClick={() => {
                  window.location.href = "/";
                }}
                title="Exit the demo"
              />
              <MoreMenu
                items={[
                  {
                    icon: <Share2 size={14} />,
                    label: "Share",
                    onClick: () => window.open("/share?source=demo", "_blank"),
                  },
                  "divider",
                  {
                    icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />,
                    label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
                    onClick: toggleTheme,
                  },
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
      <main className="mx-auto px-6 py-6 max-w-6xl">
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
