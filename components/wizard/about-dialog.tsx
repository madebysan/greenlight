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
  { title: "Overview", desc: "Logline, synopsis, themes, shoot shape." },
  { title: "Mood & Tone", desc: "Atmosphere, references, color, sound." },
  { title: "Scenes", desc: "Scene map with storyboard frames." },
  { title: "Locations", desc: "Places, moves, nights, scout notes." },
  { title: "Cast & Crew", desc: "Performance load, chemistry, specialty hires." },
  { title: "Production Design", desc: "Props, wardrobe, continuity." },
  { title: "Title & Palette", desc: "Color and type." },
  { title: "Poster Concepts", desc: "One-sheet directions." },
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
                Script to film deck.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-3">
          <p className="text-[13px] leading-[1.65] text-foreground/70 tracking-normal">
            Paste screenplay data and Greenlight builds the first pass: mood,
            scenes, locations, cast, design, and posters.
          </p>

          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Deck sections
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
                    <div className="text-[13px] font-medium text-foreground tracking-normal">
                      {tab.title}
                    </div>
                    <div className="text-[12px] text-muted-foreground tracking-normal mt-0.5">
                      {tab.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground tracking-normal">
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
