"use client";

import { Button } from "@/components/ui/button";

type StepInstructionsProps = {
  onNext: () => void;
};

export function StepInstructions({ onNext }: StepInstructionsProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Step 1: Extract Screenplay Data</h2>
      <p className="text-muted-foreground mb-6">Placeholder — will be implemented next.</p>
      <Button onClick={onNext}>I have my JSON — Next</Button>
    </div>
  );
}
