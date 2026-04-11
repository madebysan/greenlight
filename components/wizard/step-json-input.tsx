"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { validateScreenplayJson } from "@/lib/schema";
import { SAMPLES } from "@/lib/sample-data";

type StepJsonInputProps = {
  onSubmit: (json: string) => void;
  onBack: () => void;
};

const OUTPUT_DOCS = [
  { name: "Overview", desc: "Logline, synopsis, comparables, and scope at a glance" },
  { name: "Mood & Tone", desc: "Atmosphere, palette, music direction, references" },
  { name: "Scenes", desc: "Scene-by-scene map of the film" },
  { name: "Locations", desc: "Unique locations with visual moments and set requirements" },
  { name: "Cast & Crew", desc: "Characters with arcs plus scope-based crew roles" },
  { name: "Visuals", desc: "Storyboard frames and poster concepts for your art team" },
];

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

  const hasContent = input.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          Paste Your Screenplay Data
        </h2>
        <p className="text-[15px] text-muted-foreground max-w-[60ch]">
          Paste the JSON output from your AI extraction. The app will validate
          the structure before generating your production documents.
        </p>
      </div>

      {/* JSON input area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="json-input" className="text-sm font-medium">
            Screenplay JSON
          </label>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 px-3"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? "Hide example" : "Show example"}
          </Button>
        </div>

        {showExample && (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-4">
              <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap text-muted-foreground font-mono">
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
          className="font-mono text-sm h-[300px] resize-none overflow-y-auto"
        />

        {!hasContent && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Or try with:</span>
            {SAMPLES.map((s, i) => (
              <span key={s.title}>
                {i > 0 && <span className="mx-0.5">&middot;</span>}
                <button
                  onClick={() => setInput(s.json)}
                  className="hover:text-foreground transition-colors underline underline-offset-2"
                >
                  {s.title}
                </button>
              </span>
            ))}
          </div>
        )}

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

      {/* What you'll get */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Documents You&apos;ll Get
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {OUTPUT_DOCS.map((doc, i) => (
            <div
              key={doc.name}
              className="rounded-lg border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold truncate">{doc.name}</span>
              </div>
              <p className="text-[11px] leading-[1.5] text-muted-foreground">
                {doc.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          &larr; Back
        </Button>
        <Button onClick={handleSubmit} size="lg" className="px-8" disabled={!hasContent}>
          Generate &rarr;
        </Button>
      </div>
    </div>
  );
}
