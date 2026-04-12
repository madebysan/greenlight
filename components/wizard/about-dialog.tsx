"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS = [
  { title: "Overview", desc: "Logline, synopsis, themes, comparables, and scope at a glance." },
  { title: "Mood & Tone", desc: "Atmosphere, tonal descriptors, color palette, music direction, and similar moods." },
  { title: "Scenes", desc: "Scene-by-scene map with inline storyboard frames." },
  { title: "Locations", desc: "Unique locations grouped with scenes, time variations, and set requirements." },
  { title: "Cast & Crew", desc: "Characters with AI portraits plus production insights." },
  { title: "Production Design", desc: "Cross-referenced props and wardrobe with reference sketches." },
  { title: "Title & Palette", desc: "Color palette and title treatment with the full Google Fonts catalog." },
  { title: "Poster Concepts", desc: "Visual directions for how the film could present itself." },
];

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
            </div>
            <div>
              <DialogTitle className="text-lg">Greenlight</DialogTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Script to vision deck in minutes.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-3">
          <p className="text-[13px] leading-[1.65] text-foreground/70 tracking-tight">
            Paste a structured screenplay extraction and Greenlight generates a
            full vision deck — mood, scenes, locations, cast, and visual
            concepts. Everything you need to start the conversation.
          </p>

          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
              What you get
            </div>
            <div className="space-y-px rounded-[10px] overflow-hidden border border-border/60">
              {TABS.map((tab, i) => (
                <div
                  key={tab.title}
                  className="flex items-start gap-3 px-4 py-2.5 bg-card/40"
                >
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-4 shrink-0 pt-0.5">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-foreground tracking-tight">
                      {tab.title}
                    </div>
                    <div className="text-[12px] text-muted-foreground tracking-tight mt-0.5">
                      {tab.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground tracking-tight">
            <span>Claude · FLUX + Gesture Draw LoRA · TMDB</span>
            <span className="flex-1" />
            <a
              href="https://santiagoalonso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              santiagoalonso.com
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
