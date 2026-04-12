"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { SectionLabelPill } from "@/components/ui/inline-chip";

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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <SectionLabelPill icon={<MapPin size={10} />} className="mb-3">
            Geography
          </SectionLabelPill>
          <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
            Locations
          </h1>
          <p className="text-[13px] text-foreground/60 tracking-tight">
            <span className="tabular-nums">{locations.length}</span> unique {locations.length === 1 ? "location" : "locations"} across{" "}
            <span className="tabular-nums">{scenes.length}</span> {scenes.length === 1 ? "scene" : "scenes"}.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-10">
          <button
            onClick={expanded.size === locations.length ? collapseAll : expandAll}
            className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
          >
            {expanded.size === locations.length ? "Collapse all" : "Expand all"}
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
              className={`rounded-[12px] transition-all ${
                isExpanded
                  ? "bg-card/60 shadow-paper-hover"
                  : "bg-card/30 shadow-paper hover:shadow-paper-hover"
              }`}
            >
              <button
                onClick={() => toggle(loc.name)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-medium capitalize text-foreground flex items-center gap-2 tracking-tight">
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    {loc.name}
                  </h2>
                  {!isExpanded && (
                    <p className="text-[12px] text-foreground/65 mt-1 line-clamp-1 pl-5">
                      {loc.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] px-2 py-[3px] rounded-full bg-white/[0.04] text-muted-foreground shadow-pill">
                    {loc.int_ext}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
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
                          className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[4px] bg-violet-500/15 text-violet-300"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}

                  {loc.set_requirements && loc.set_requirements.length > 0 && (
                    <div className="pt-4 border-t border-border/60">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2.5">
                        Set Requirements
                      </h3>
                      <ul className="text-[13px] space-y-1.5 text-foreground/80">
                        {loc.set_requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-muted-foreground mt-[3px]">·</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {locScenes.length > 0 && (
                    <div className="pt-4 border-t border-border/60">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2.5">
                        Key Visual Moments
                      </h3>
                      <ul className="text-[13px] space-y-2 text-foreground/80">
                        {locScenes.map((s) => (
                          <li key={s.scene_number} className="flex items-start gap-3">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[4px] bg-muted text-muted-foreground shrink-0 mt-[1px]">
                              S{s.scene_number}
                            </span>
                            <span className="leading-[1.55]">{s.key_visual_moment}</span>
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
