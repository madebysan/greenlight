"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="max-w-xl space-y-14">
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

      {/* Vertical steps */}
      <div className="space-y-0">
        {/* Step 1 */}
        <div className="relative pl-10 pb-10">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium">
            1
          </div>
          <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border/60" />
          <div className="pt-0.5">
            <h3 className="text-[15px] font-medium tracking-tight mb-2">
              Open your screenplay in an AI chat
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
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

        {/* Step 2 */}
        <div className="relative pl-10 pb-10">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium">
            2
          </div>
          <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border/60" />
          <div className="pt-0.5">
            <h3 className="text-[15px] font-medium tracking-tight mb-2">
              Paste the extraction prompt alongside your PDF
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground mb-3">
              This prompt tells the AI exactly what to extract. Copy it in one click.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant={copied ? "outline" : "default"}
                size="sm"
                onClick={handleCopy}
                className="min-w-[130px]"
              >
                {copied ? (
                  <>
                    <Check size={14} className="mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" />
                    Copy Prompt
                  </>
                )}
              </Button>
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
                <pre className="rounded-lg border border-border/60 bg-card/40 p-4 text-[11px] leading-[1.7] overflow-auto max-h-60 whitespace-pre-wrap font-mono text-foreground/70">
                  {STAGE_0_PROMPT}
                </pre>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-lg bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative pl-10">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-mono font-medium">
            3
          </div>
          <div className="pt-0.5">
            <h3 className="text-[15px] font-medium tracking-tight mb-2">
              Paste the JSON you get back
            </h3>
            <p className="text-[13px] leading-[1.6] text-muted-foreground mb-4">
              The AI will return structured JSON. Paste it here and Greenlight generates
              your full production bible — scenes, locations, cast, key art, and more.
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={onNext} size="lg" className="px-8">
                I have my JSON &rarr;
              </Button>
              <a
                href="/demo"
                className="inline-flex items-center justify-center text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                or see a demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
