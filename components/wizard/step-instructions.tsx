"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/ui/section-head";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";

type StepInstructionsProps = {
  onNext: () => void;
};

const STEPS = [
  {
    num: "01",
    title: "Upload PDF",
    desc: (
      <>
        Open your screenplay in{" "}
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
      </>
    ),
  },
  {
    num: "02",
    title: "Paste Prompt",
    desc: "Copy the extraction prompt below and paste it alongside your PDF.",
  },
  {
    num: "03",
    title: "Generate",
    desc: "Paste the JSON here and generate the full breakdown — scenes, locations, cast, key art, and more.",
  },
  {
    num: "04",
    title: "Review & Use",
    desc: "Review the first-pass breakdown and use it to brief every department.",
  },
];

export function StepInstructions({ onNext }: StepInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STAGE_0_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-14">
      {/* Hero */}
      <div>
        <h2 className="text-[2rem] font-semibold tracking-tight mb-3 leading-[1.05]">
          Extract Screenplay Data
        </h2>
        <p className="text-[15px] leading-[1.6] text-muted-foreground max-w-[62ch]">
          Before the app can generate your documents, you need to extract
          structured data from your screenplay using an AI chat.
        </p>
      </div>

      {/* Steps — unified bordered grid */}
      <section>
        <SectionHead
          index={1}
          meta={
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              4 steps · ~5 min
            </span>
          }
        >
          How it works
        </SectionHead>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-[4px] overflow-hidden">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-background p-5 flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Step {step.num}
              </span>
              <h3 className="text-[16px] font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="text-[13px] leading-[1.6] text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Extraction prompt */}
      <section>
        <SectionHead
          index={2}
          meta={
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                mono
              </span>
              <Button
                variant={copied ? "outline" : "default"}
                size="sm"
                onClick={handleCopy}
                className="min-w-[120px]"
              >
                {copied ? "Copied!" : "Copy Prompt"}
              </Button>
            </>
          }
        >
          Extraction Prompt
        </SectionHead>
        <div className="relative">
          <pre className="rounded-xl border border-border/60 bg-card/40 p-5 text-xs leading-[1.7] overflow-auto max-h-80 whitespace-pre-wrap font-mono text-foreground/85">
            {STAGE_0_PROMPT}
          </pre>
          {/* Scroll fade hint */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-xl bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </section>

      {/* Next buttons */}
      <div className="flex justify-end items-center gap-3 pt-6 border-t border-border/60">
        <a
          href="/demo"
          className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-md border border-border/60 hover:border-foreground/20 transition-colors"
        >
          See a demo
        </a>
        <Button onClick={onNext} size="lg" className="px-8">
          I have my JSON &rarr;
        </Button>
      </div>
    </div>
  );
}
