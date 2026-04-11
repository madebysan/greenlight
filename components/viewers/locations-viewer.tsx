"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type LocationData = {
  name: string;
  description: string;
  scenes: number[];
  int_ext: string;
  time_variations: string[];
  set_requirements?: string[];
};

type SceneData = {
  scene_number: number;
  slug_line: string;
  location: string;
  key_visual_moment: string;
  time_of_day: string;
  int_ext: string;
};

type LocationsViewerProps = {
  jsonData: string;
};

function parseLocations(jsonData: string): { locations: LocationData[]; scenes: SceneData[] } {
  try {
    const parsed = JSON.parse(jsonData);
    return {
      locations: parsed.locations || [],
      scenes: parsed.scenes || [],
    };
  } catch {
    return { locations: [], scenes: [] };
  }
}

export function LocationsViewer({ jsonData }: LocationsViewerProps) {
  const { locations, scenes } = parseLocations(jsonData);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(locations[0]?.name ? [locations[0].name] : []),
  );

  const expandAll = () => setExpanded(new Set(locations.map((l) => l.name)));
  const collapseAll = () => setExpanded(new Set());
  const toggle = (name: string) => {
    const next = new Set(expanded);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpanded(next);
  };

  if (locations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-12 text-center">
        No location data found in the screenplay JSON.
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1">Locations</h1>
          <p className="text-[13px] text-muted-foreground">
            {locations.length} unique {locations.length === 1 ? "location" : "locations"} across{" "}
            {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={expandAll}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Expand all
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={collapseAll}
            className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {locations.map((loc) => {
          const sceneCount = loc.scenes?.length || 0;
          const locScenes = scenes.filter((s) => loc.scenes?.includes(s.scene_number));
          const isExpanded = expanded.has(loc.name);

          return (
            <div
              key={loc.name}
              className={`rounded-xl border transition-colors ${
                isExpanded ? "bg-card/40" : "bg-card/20 hover:bg-card/30"
              }`}
            >
              <button
                onClick={() => toggle(loc.name)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold capitalize text-foreground flex items-center gap-2">
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    {loc.name}
                  </h2>
                  {!isExpanded && (
                    <p className="text-[12px] text-foreground/60 mt-1 line-clamp-1 pl-5">
                      {loc.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {loc.int_ext}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pl-[2.75rem] space-y-4">
                  <p className="text-[13px] leading-[1.6] text-foreground/70">
                    {loc.description}
                  </p>

                  {loc.time_variations && loc.time_variations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {loc.time_variations.map((time) => (
                        <span
                          key={time}
                          className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}

                  {loc.set_requirements && loc.set_requirements.length > 0 && (
                    <div className="pt-3 border-t border-border/60">
                      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Set Requirements
                      </h3>
                      <ul className="text-[12px] space-y-1 text-foreground/70">
                        {loc.set_requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-0.5">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {locScenes.length > 0 && (
                    <div className="pt-3 border-t border-border/60">
                      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Key Visual Moments
                      </h3>
                      <ul className="text-[12px] space-y-2 text-foreground/70">
                        {locScenes.map((s) => (
                          <li key={s.scene_number} className="flex items-start gap-2">
                            <span className="text-muted-foreground font-mono shrink-0">
                              S{s.scene_number}
                            </span>
                            <span className="leading-relaxed">{s.key_visual_moment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
