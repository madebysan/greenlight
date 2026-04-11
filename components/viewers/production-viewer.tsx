"use client";

import { useState, useMemo, useRef } from "react";
import { Star, Camera, Loader2, RefreshCw, Images, X, Package } from "lucide-react";
import { SectionLabelPill } from "@/components/ui/inline-chip";
import { getStylePrefix } from "@/lib/image-prompts";
import type { SavedImage } from "@/lib/reports";

type SubTab = "props" | "wardrobe";

type PropImageState = { status: "idle" | "generating" | "done" | "error"; url?: string };

type PropMaster = {
  item: string;
  scenes: number[];
  hero_prop?: boolean;
  notes?: string;
};

type SceneData = {
  scene_number: number;
  slug_line: string;
  props?: string[];
  wardrobe_notes?: string[];
  vfx_stunts?: string[];
};

type CharacterData = {
  name: string;
  wardrobe_changes?: number;
  special_requirements?: string[];
};

type ScreenplayData = {
  scenes?: SceneData[];
  characters?: CharacterData[];
  props_master?: PropMaster[];
};

type ProductionViewerProps = {
  jsonData: string;
  propImages: Record<string, SavedImage>;
  onPropImagesChange: (images: Record<string, SavedImage>) => void;
};

function parseData(jsonData: string): ScreenplayData {
  try {
    return JSON.parse(jsonData) as ScreenplayData;
  } catch {
    return {};
  }
}

type WardrobeEntry = { scene: number; note: string };

export function ProductionViewer({
  jsonData,
  propImages,
  onPropImagesChange,
}: ProductionViewerProps) {
  const data = parseData(jsonData);
  const scenes = data.scenes || [];
  const characters = data.characters || [];
  const propsMaster = data.props_master || [];

  const [tab, setTab] = useState<SubTab>("props");
  const [localPropImages, setLocalPropImages] = useState<Record<string, PropImageState>>({});
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genAllProgress, setGenAllProgress] = useState({ done: 0, total: 0 });
  const cancelRef = useRef(false);

  const mergedPropImages: Record<string, PropImageState> = useMemo(() => {
    const merged: Record<string, PropImageState> = {};
    for (const [k, v] of Object.entries(propImages)) {
      merged[k] = { status: "done", url: v.url };
    }
    for (const [k, v] of Object.entries(localPropImages)) {
      merged[k] = v;
    }
    return merged;
  }, [propImages, localPropImages]);

  const fetchPropImage = async (prop: PropMaster): Promise<{ url: string } | null> => {
    setLocalPropImages((prev) => ({ ...prev, [prop.item]: { status: "generating" } }));
    try {
      const res = await fetch("/api/generate-prop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prop.item,
          notes: prop.notes,
          stylePrefix: getStylePrefix("prop"),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = await res.json();
      setLocalPropImages((prev) => ({ ...prev, [prop.item]: { status: "done", url } }));
      return { url };
    } catch {
      setLocalPropImages((prev) => ({ ...prev, [prop.item]: { status: "error" } }));
      return null;
    }
  };

  const generateSingleProp = async (prop: PropMaster) => {
    const result = await fetchPropImage(prop);
    if (result) {
      onPropImagesChange({ ...propImages, [prop.item]: { status: "done", url: result.url } });
    }
  };

  const generateAllPropImages = async () => {
    const toGenerate = propsMaster.filter((p) => !propImages[p.item]);
    if (toGenerate.length === 0) return;
    cancelRef.current = false;
    setGeneratingAll(true);
    setGenAllProgress({ done: 0, total: toGenerate.length });

    let accumulated: Record<string, SavedImage> = { ...propImages };
    for (let i = 0; i < toGenerate.length; i++) {
      if (cancelRef.current) break;
      const prop = toGenerate[i];
      const result = await fetchPropImage(prop);
      if (result) {
        accumulated = { ...accumulated, [prop.item]: { status: "done", url: result.url } };
        onPropImagesChange(accumulated);
      }
      setGenAllProgress({ done: i + 1, total: toGenerate.length });
    }
    setGeneratingAll(false);
  };

  const cancelBulkProps = () => { cancelRef.current = true; };

  const missingPropImages = propsMaster.filter((p) => !propImages[p.item]).length;

  const wardrobeBySceneAndChars = useMemo(() => {
    const wardrobe: WardrobeEntry[] = [];
    for (const s of scenes) {
      for (const note of s.wardrobe_notes || []) {
        wardrobe.push({ scene: s.scene_number, note });
      }
    }
    return wardrobe;
  }, [scenes]);

  const heroPropsCount = propsMaster.filter((p) => p.hero_prop).length;
  const totalWardrobeChanges = characters.reduce((sum, c) => sum + (c.wardrobe_changes || 0), 0);
  const uniqueSceneLocations = new Set(scenes.map((s) => s.slug_line)).size;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <SectionLabelPill icon={<Package size={10} />} className="mb-3">
          Art Department
        </SectionLabelPill>
        <h1 className="text-[32px] font-light tracking-[-0.025em] leading-[1.05] mb-2 text-foreground">
          Production Design
        </h1>
        <p className="text-[13px] text-foreground/60 tracking-tight max-w-[60ch]">
          Cross-referenced props and wardrobe pulled from every scene. What your art department will source, build, or dress.
        </p>
      </div>

      <div className="inline-grid grid-cols-2 md:grid-cols-[repeat(3,160px)] gap-px bg-border/50 rounded-[12px] overflow-hidden mb-8 shadow-paper">
        <StatCard label="Hero Props" value={heroPropsCount} sub={`of ${propsMaster.length} tracked`} />
        <StatCard label="Wardrobe Changes" value={totalWardrobeChanges} sub="across the cast" />
        <StatCard label="Scene Setups" value={uniqueSceneLocations} sub={`across ${scenes.length} scenes`} />
      </div>

      <div className="flex items-center gap-0 border-b border-border/60 mb-6">
        <SubTabButton active={tab === "props"} onClick={() => setTab("props")}>
          Props ({propsMaster.length})
        </SubTabButton>
        <SubTabButton active={tab === "wardrobe"} onClick={() => setTab("wardrobe")}>
          Wardrobe ({wardrobeBySceneAndChars.length})
        </SubTabButton>

        {tab === "props" && propsMaster.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {generatingAll ? (
              <>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {genAllProgress.done}/{genAllProgress.total}
                </span>
                <button
                  onClick={cancelBulkProps}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </>
            ) : (
              missingPropImages > 0 && (
                <button
                  onClick={generateAllPropImages}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
                >
                  <Images size={14} />
                  Generate {missingPropImages === propsMaster.length ? "all" : `${missingPropImages} missing`} prop refs
                </button>
              )
            )}
          </div>
        )}
      </div>

      {tab === "props" && (
        <div className="space-y-3">
          {propsMaster.length === 0 ? (
            <Empty message="No props_master entries in the screenplay JSON." />
          ) : (
            propsMaster.map((p) => (
              <PropCard
                key={p.item}
                prop={p}
                imageState={mergedPropImages[p.item] || { status: "idle" }}
                onGenerate={() => generateSingleProp(p)}
                generatingAll={generatingAll}
              />
            ))
          )}
        </div>
      )}

      {tab === "wardrobe" && (
        <div className="space-y-6">
          {characters.length > 0 && (
            <div>
              <SectionLabel>By Character</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((c) => (
                  <div key={c.name} className="rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover px-4 py-3 transition-all">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-foreground">
                        {c.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                        {c.wardrobe_changes ?? 0} {c.wardrobe_changes === 1 ? "change" : "changes"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Per-Scene Notes</SectionLabel>
            {wardrobeBySceneAndChars.length === 0 ? (
              <Empty message="No wardrobe notes across the screenplay." />
            ) : (
              <div className="space-y-2">
                {wardrobeBySceneAndChars.map((w, i) => (
                  <div
                    key={`${w.scene}-${i}`}
                    className="rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover px-4 py-3 flex items-start gap-3 transition-all"
                  >
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[4px] bg-muted text-muted-foreground shrink-0">
                      S{w.scene}
                    </span>
                    <span className="text-[13px] leading-[1.6] text-foreground/80">{w.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-card/40 px-5 py-6 flex flex-col gap-2 min-w-0">
      <div className="font-mono text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground leading-[1.35] max-w-[11ch]">
        {label}
      </div>
      <div className="text-[34px] font-light tabular-nums text-foreground leading-none tracking-[-0.03em]">
        {value}
      </div>
      <div className="text-[11px] text-foreground/60 tracking-tight">{sub}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
      {children}
    </h3>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-3 text-[12px] font-medium tracking-tight transition-colors ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-px left-2 right-2 h-px bg-foreground" />
      )}
    </button>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground py-8 text-center">{message}</p>;
}

function PropCard({
  prop,
  imageState,
  onGenerate,
  generatingAll,
}: {
  prop: PropMaster;
  imageState: PropImageState;
  onGenerate: () => void;
  generatingAll: boolean;
}) {
  return (
    <div className="rounded-[12px] bg-card/40 shadow-paper hover:shadow-paper-hover p-5 flex gap-5 transition-all">
      <div className="w-24 h-24 rounded-md shrink-0 bg-muted/40 border border-border/60 overflow-hidden flex items-center justify-center relative group">
        {imageState.status === "done" && imageState.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageState.url} alt={prop.item} className="w-full h-full object-cover" />
        ) : imageState.status === "generating" ? (
          <Loader2 size={20} className="text-muted-foreground animate-spin" />
        ) : imageState.status === "error" ? (
          <button
            onClick={onGenerate}
            className="flex flex-col items-center justify-center gap-1 text-[10px] text-destructive/80 hover:text-destructive"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={generatingAll}
            className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Generate prop reference"
          >
            <Camera size={16} />
            Reference
          </button>
        )}

        {imageState.status === "done" && !generatingAll && (
          <button
            onClick={onGenerate}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Regenerate prop reference"
          >
            <RefreshCw size={16} className="text-white" />
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold capitalize text-foreground tracking-tight">{prop.item}</h2>
            {prop.hero_prop && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[4px] bg-amber-500/15 text-amber-400">
                <Star size={10} className="fill-current" />
                Hero
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground shrink-0 tabular-nums">
            {prop.scenes.length} {prop.scenes.length === 1 ? "scene" : "scenes"}
          </span>
        </div>
        {prop.notes && (
          <p className="text-[13px] leading-[1.6] text-foreground/80 mt-1">{prop.notes}</p>
        )}
        {prop.scenes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {prop.scenes.map((sn) => (
              <span
                key={sn}
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[4px] bg-muted text-muted-foreground"
              >
                S{sn}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
