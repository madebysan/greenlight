"use client";

import { useState } from "react";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";
import { Check, Copy, ChevronDown } from "lucide-react";

type StepInstructionsProps = {
  onNext: () => void;
};

export function StepInstructions({ onNext }: StepInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STAGE_0_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-14">
      {/* Hero */}
      <div>
        <h2 className="text-[2rem] font-semibold tracking-tight mb-3 leading-[1.05]">
          Extract Screenplay Data
        </h2>
        <p className="text-[15px] leading-[1.6] text-muted-foreground max-w-[52ch]">
          Before the app can generate your documents, you need to extract
          structured data from your screenplay using an AI chat.
        </p>
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {/* Step 1 */}
        <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
              1
            </span>
            <div>
              <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
                Open your screenplay in an AI chat
              </h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground">
                Upload your screenplay PDF to{" "}
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-border hover:decoration-foreground text-foreground"
                >
                  Claude.ai
                </a>{" "}
                or{" "}
                <a
                  href="https://chat.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-border hover:decoration-foreground text-foreground"
                >
                  ChatGPT
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
                Paste the extraction prompt alongside your PDF
              </h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
                This prompt tells the AI exactly what to extract. Copy it in one click.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors ${
                    copied
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Prompt"}
                </button>
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPrompt ? "Hide prompt" : "Preview prompt"}
                  <ChevronDown size={12} className={`transition-transform ${showPrompt ? "rotate-180" : ""}`} />
                </button>
              </div>
              {showPrompt && (
                <div className="relative mt-3">
                  <pre className="rounded-lg border border-border/60 bg-background/60 p-4 text-[11px] leading-[1.7] overflow-auto max-h-60 whitespace-pre-wrap font-mono text-foreground/70">
                    {STAGE_0_PROMPT}
                  </pre>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-lg bg-gradient-to-t from-card/80 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-[12px] bg-card/40 shadow-paper px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium shrink-0 mt-0.5">
              3
            </span>
            <div>
              <h3 className="text-[15px] font-medium tracking-tight mb-1.5">
                Paste the JSON you get back
              </h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
                The AI will return structured JSON. Paste it here and Greenlight generates
                your full production bible — scenes, locations, cast, key art, and more.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onNext}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-5 py-2.5 text-[13px] font-medium hover:bg-foreground/90 transition-colors"
                >
                  I have my JSON &rarr;
                </button>
                <a
                  href="/demo"
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  or see a demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
