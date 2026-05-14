"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, MapPin, Route, Moon, SunMedium } from "lucide-react";
import { DepartmentLens, EvidencePill, ReportPanel } from "@/components/ui/department-lens";

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

  const nightSceneCount = scenes.filter((scene) => scene.time_of_day === "NIGHT").length;
  const exteriorSceneCount = scenes.filter((scene) => scene.int_ext === "EXT" || scene.int_ext === "BOTH").length;
  const companyMoveCount = Math.max(0, locations.length - 1);
  const priorityLocations = [...locations]
    .sort((a, b) => (b.scenes?.length || 0) - (a.scenes?.length || 0))
    .slice(0, 3);

  if (locations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-12 text-center">
        No locations found in the screenplay data.
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <DepartmentLens
        eyebrow="Geography"
        title="Locations"
        subtitle="Places, moves, nights, and exteriors."
        icon={MapPin}
        primaryRole="Location Scout"
        supportRole="Line Producer"
        focus="location personality, company moves, exterior/night risk"
        signals={[
          { label: "Locations", value: locations.length },
          { label: "Company Moves", value: companyMoveCount },
          { label: "Night Scenes", value: nightSceneCount },
        ]}
      />

      <div className="mb-8 space-y-3">
        <ReportPanel eyebrow="Scout Read" title="Places With the Most Story Weight">
          <div className="space-y-3">
            {priorityLocations.map((loc) => (
              <div
                key={loc.name}
                className="grid gap-3 border-t border-border/70 py-4 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[minmax(150px,220px)_1fr_auto] md:items-start"
              >
                <div className="min-w-0">
                  <h2 className="text-[14px] font-medium capitalize tracking-normal text-foreground">
                    {loc.name}
                  </h2>
                </div>
                <p className="text-[13px] leading-[1.6] tracking-normal text-foreground/70">
                  {loc.description}
                </p>
                <div className="md:justify-self-end">
                  <EvidencePill>{loc.scenes.length} scenes</EvidencePill>
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>

        <ReportPanel eyebrow="Risk" title="Schedule Pressure">
          <div className="grid gap-3 md:grid-cols-3">
            <RiskLine icon={<Route size={13} />} label="Moves" value={`${companyMoveCount} estimated`} />
            <RiskLine icon={<Moon size={13} />} label="Night" value={`${nightSceneCount} scenes`} />
            <RiskLine icon={<SunMedium size={13} />} label="Exterior" value={`${exteriorSceneCount} scenes`} />
          </div>
        </ReportPanel>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Location Cards
        </h2>
        <button
          onClick={expanded.size === locations.length ? collapseAll : expandAll}
          className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded.size === locations.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="space-y-3">
        {locations.map((loc) => {
          const sceneCount = loc.scenes?.length || 0;
          const locScenes = scenes.filter((s) => loc.scenes?.includes(s.scene_number));
          const isExpanded = expanded.has(loc.name);

          return (
            <div
              key={loc.name}
              className={`report-motion-card rounded-[12px] border ${
                isExpanded
                  ? "border-foreground/18 bg-card/45"
                  : "border-border bg-card/25 hover:border-foreground/18 hover:bg-card/40"
              }`}
            >
              <button
                onClick={() => toggle(loc.name)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-medium capitalize text-foreground flex items-center gap-2 tracking-normal">
                    <ChevronDown
                      size={14}
                      className={`report-expand-icon text-muted-foreground ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    {loc.name}
                  </h2>
                  {!isExpanded && (
                    <p className="report-motion-content text-[12px] text-foreground/65 mt-1 line-clamp-1 pl-5">
                      {loc.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="rounded-full border border-border bg-white/[0.03] px-2 py-[3px] font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    {loc.int_ext}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                    {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="report-motion-content px-5 pb-5 pl-[2.75rem] space-y-4">
                  <p className="text-[13px] leading-[1.6] text-foreground/70">
                    {loc.description}
                  </p>

                  {loc.time_variations && loc.time_variations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {loc.time_variations.map((time) => (
                        <span
                          key={time}
                          className="rounded-[5px] border border-border bg-white/[0.03] px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
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
                        Scoutable Visual Moments
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

function RiskLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] border border-border bg-white/[0.02] px-3 py-2">
      <span className="inline-flex items-center gap-2 text-[12px] tracking-normal text-foreground/72">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.11em] text-muted-foreground">
        {value}
      </span>
    </div>
  );
}
