"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";

type StepInstructionsProps = {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onNext: () => void;
};

export function StepInstructions({ apiKey, onApiKeyChange, onNext }: StepInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STAGE_0_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          Extract Screenplay Data
        </h2>
        <p className="text-[15px] text-muted-foreground max-w-[60ch]">
          Before the app can generate your documents, you need to extract
          structured data from your screenplay using an AI chat.
        </p>
      </div>

      {/* Steps as horizontal cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            num: "1",
            title: "Upload PDF",
            desc: (
              <>
                Open your screenplay in{" "}
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  Claude.ai
                </a>{" "}
                or{" "}
                <a
                  href="https://chat.openai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  ChatGPT
                </a>
              </>
            ),
          },
          {
            num: "2",
            title: "Paste Prompt",
            desc: "Copy the extraction prompt below and paste it with your PDF",
          },
          {
            num: "3",
            title: "Generate",
            desc: "Paste the JSON here and generate your production bible — scene breakdowns, matrices, marketing brief, and more",
          },
          {
            num: "4",
            title: "Review & Use",
            desc: "Review your production bible and use it to guide every stage of making your film",
          },
        ].map((step) => (
          <div
            key={step.num}
            className="rounded-xl border bg-card p-4 space-y-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {step.num}
            </div>
            <div className="text-sm font-semibold">{step.title}</div>
            <div className="text-[12px] leading-[1.6] text-muted-foreground">
              {step.desc}
            </div>
          </div>
        ))}
      </div>

      {/* API Key */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Claude API Key
        </h3>
        <p className="text-[13px] text-muted-foreground max-w-[60ch]">
          Your key is stored in your browser only and sent directly to the Anthropic API. Get one at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            console.anthropic.com
          </a>
        </p>
        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {apiKey && !apiKey.startsWith("sk-ant-") && (
          <p className="text-xs text-destructive">
            API keys usually start with &quot;sk-ant-&quot;
          </p>
        )}
      </div>

      {/* Extraction prompt with copy button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Extraction Prompt
          </h3>
          <Button
            variant={copied ? "outline" : "default"}
            size="sm"
            onClick={handleCopy}
            className="min-w-[120px]"
          >
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
        </div>
        <div className="relative">
          <pre className="rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap font-mono">
            {STAGE_0_PROMPT}
          </pre>
          {/* Scroll fade hint */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-xl bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <Button onClick={onNext} size="lg" className="px-8">
          I have my JSON &rarr;
        </Button>
      </div>
    </div>
  );
}
