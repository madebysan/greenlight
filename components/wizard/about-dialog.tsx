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

const STEPS = [
  {
    num: "1",
    label: "Extract",
    desc: "Upload your screenplay to Claude or ChatGPT with the extraction prompt",
    color: "text-violet-400",
  },
  {
    num: "2",
    label: "Paste",
    desc: "Paste the structured JSON output into the app",
    color: "text-sky-400",
  },
  {
    num: "3",
    label: "Generate",
    desc: "AI creates a first-pass breakdown for every department",
    color: "text-emerald-400",
  },
  {
    num: "4",
    label: "Refine",
    desc: "Edit, regenerate images, shuffle taglines, and iterate",
    color: "text-amber-400",
  },
];

const TABS = [
  {
    color: "text-violet-400 bg-violet-500/15",
    title: "Overview",
    desc: "Logline, taglines, synopsis, written-by credit, themes, and a scope-at-a-glance card for the whole film.",
  },
  {
    color: "text-sky-400 bg-sky-500/15",
    title: "Mood & Tone",
    desc: "Atmosphere prose, tonal descriptors, reference points, music & sound direction with soundtrack references, and Similar Moods — each film resolved through TMDB.",
  },
  {
    color: "text-emerald-400 bg-emerald-500/15",
    title: "Scenes",
    desc: "Scene-by-scene breakdown with inline storyboard frames. Toggle between sequence and location grouping. Generate all frames in batch.",
  },
  {
    color: "text-amber-400 bg-amber-500/15",
    title: "Locations · Cast & Crew · Production Design",
    desc: "Derived directly from the screenplay JSON. Cast & Crew gets AI portraits. Production Design gets AI prop reference sketches. Every card can be disabled.",
  },
  {
    color: "text-pink-400 bg-pink-500/15",
    title: "Key Art",
    desc: "Color palette with reshuffle, title treatment powered by the full Google Fonts catalog, and 15 AI-generated poster concepts across 5 categories.",
  },
];

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 shrink-0 rounded-[8px] bg-white flex items-center justify-center shadow-pill text-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Greenlight" className="w-[70%] h-[70%]" />
            </div>
            <div>
              <DialogTitle className="text-lg">Greenlight</DialogTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                A 1st AD&apos;s first pass.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-3 text-[13px] leading-relaxed">
          <p className="text-foreground/70">
            Turn any screenplay into a complete first-pass breakdown. Extract structured
            data, generate a brief for every department, and produce visual assets — all
            from a single JSON file.
          </p>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">How it works</h3>
            <div className="grid grid-cols-4 gap-3">
              {STEPS.map((step) => (
                <div key={step.num} className="rounded-xl border bg-card/50 p-3">
                  <span className={`text-lg font-bold ${step.color}`}>{step.num}</span>
                  <div className="text-[12px] font-semibold text-foreground mt-1">
                    {step.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">What you get</h3>
            <div className="space-y-2.5">
              {TABS.map((tab) => (
                <div
                  key={tab.title}
                  className="flex items-start gap-3 rounded-lg border px-3.5 py-3"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 text-[11px] font-mono uppercase ${tab.color}`}
                  >
                    ●
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">
                      {tab.title}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                      {tab.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-3 border-t text-[11px] text-muted-foreground">
            <span>Powered by Claude (Anthropic) + FLUX Schnell (fal.ai) + TMDB</span>
            <span className="flex-1" />
            <span>
              Made by{" "}
              <a
                href="https://santiagoalonso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                santiagoalonso.com
              </a>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
