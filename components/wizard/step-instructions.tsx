"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STAGE_0_PROMPT } from "@/lib/prompts/stage-0";

type StepInstructionsProps = {
  onNext: () => void;
};

export function StepInstructions({ onNext }: StepInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(STAGE_0_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 1: Extract Screenplay Data</h2>
        <p className="text-muted-foreground">
          Before the app can generate your documents, you need to extract structured data from your screenplay.
          This is a one-time manual step that will be automated in a future version.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium text-lg">How it works</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Open your screenplay PDF</span> in{" "}
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-primary hover:text-primary/80">
                Claude.ai
              </a>{" "}
              or{" "}
              <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-primary hover:text-primary/80">
                ChatGPT
              </a>
            </li>
            <li>
              <span className="text-foreground font-medium">Copy the extraction prompt below</span> and paste it along with your PDF
            </li>
            <li>
              <span className="text-foreground font-medium">Copy the JSON response</span> — the entire output
            </li>
            <li>
              <span className="text-foreground font-medium">Come back here</span> and paste it in Step 2
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Extraction Prompt</h3>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
        </div>
        <div className="relative">
          <pre className="rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed overflow-auto max-h-80 whitespace-pre-wrap">
            {STAGE_0_PROMPT}
          </pre>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">
          I have my JSON — Next
        </Button>
      </div>
    </div>
  );
}
