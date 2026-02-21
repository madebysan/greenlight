"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { validateScreenplayJson } from "@/lib/schema";

type StepJsonInputProps = {
  onSubmit: (json: string) => void;
  onBack: () => void;
};

export function StepJsonInput({ onSubmit, onBack }: StepJsonInputProps) {
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [showExample, setShowExample] = useState(false);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setErrors(["Please paste your JSON data"]);
      return;
    }

    const result = validateScreenplayJson(trimmed);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    onSubmit(trimmed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Step 2: Paste Your JSON</h2>
        <p className="text-muted-foreground">
          Paste the JSON output from the extraction prompt. The app will validate it before generating your documents.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="json-input" className="text-sm font-medium">
            Screenplay JSON
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? "Hide example" : "Show example"}
          </Button>
        </div>

        {showExample && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap text-muted-foreground">
{`{
  "title": "The Last Light",
  "genre": ["Drama", "Thriller"],
  "setting_period": "Contemporary",
  "total_pages": 95,
  "scenes": [
    {
      "scene_number": 1,
      "slug_line": "INT. APARTMENT - NIGHT",
      "location": "apartment",
      "int_ext": "INT",
      "time_of_day": "NIGHT",
      "page_start": 1,
      "page_end": 3,
      "characters_present": ["JOHN", "SARAH"],
      "key_visual_moment": "John stands in doorway...",
      "emotional_beat": "revelation",
      "props": ["wedding ring"],
      "wardrobe_notes": ["John in rumpled suit"],
      "vfx_stunts": [],
      "music_cue": "",
      "notes": ""
    }
  ],
  "characters": [...],
  "locations": [...],
  "props_master": [...],
  "themes": ["loss", "redemption"],
  "tone": "dark intimate drama"
}`}
              </pre>
            </CardContent>
          </Card>
        )}

        <Textarea
          id="json-input"
          placeholder='Paste your JSON here — it should start with { "title": ...'
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (errors.length > 0) setErrors([]);
          }}
          rows={16}
          className="font-mono text-sm"
        />

        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Validation errors:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-destructive/80">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} size="lg">
          Generate Documents
        </Button>
      </div>
    </div>
  );
}
