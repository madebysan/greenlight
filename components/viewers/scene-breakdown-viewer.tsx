"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

type Scene = {
  number: number;
  slugLine: string;
  intExt: "INT" | "EXT" | "";
  timeOfDay: string;
  fields: { label: string; value: string }[];
};

type Overview = { label: string; value: string }[];

function parseSceneBreakdown(md: string): { title: string; overview: Overview; scenes: Scene[] } {
  const lines = md.split("\n");
  let title = "";
  const overview: Overview = [];
  const scenes: Scene[] = [];
  let current: Scene | null = null;

  for (const line of lines) {
    if (/^# /.test(line) && !title) {
      title = line.replace(/^# (Scene Breakdown:\s*)?/, "").trim();
      continue;
    }

    const sceneMatch = line.match(/^### Scene (\d+):\s*(.+)/);
    if (sceneMatch) {
      if (current) scenes.push(current);
      const slugLine = sceneMatch[2].trim();
      const intExtMatch = slugLine.match(/^(INT|EXT)\b/i);
      const timeMatch = slugLine.match(/- (NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i);
      current = {
        number: parseInt(sceneMatch[1]),
        slugLine,
        intExt: intExtMatch ? (intExtMatch[1].toUpperCase() as "INT" | "EXT") : "",
        timeOfDay: timeMatch ? timeMatch[1] : "",
        fields: [],
      };
      continue;
    }

    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+)/);
    if (fieldMatch) {
      if (current) {
        current.fields.push({ label: fieldMatch[1], value: fieldMatch[2] });
      } else {
        overview.push({ label: fieldMatch[1], value: fieldMatch[2] });
      }
      continue;
    }

    const overviewMatch = line.match(/^- (.+?):\s*(.+)/);
    if (overviewMatch && !current) {
      overview.push({ label: overviewMatch[1].replace(/\*\*/g, ""), value: overviewMatch[2] });
    }
  }
  if (current) scenes.push(current);

  return { title, overview, scenes };
}

function scenesToMarkdown(title: string, overview: Overview, scenes: Scene[]): string {
  let md = `# Scene Breakdown: ${title}\n\n`;
  for (const item of overview) {
    md += `- **${item.label}:** ${item.value}\n`;
  }
  md += "\n";
  for (const scene of scenes) {
    md += `### Scene ${scene.number}: ${scene.slugLine}\n`;
    for (const field of scene.fields) {
      md += `- **${field.label}:** ${field.value}\n`;
    }
    md += "\n";
  }
  return md;
}

const INT_EXT_STYLES = {
  INT: "bg-amber-100 text-amber-800 border-amber-200",
  EXT: "bg-sky-100 text-sky-800 border-sky-200",
  "": "bg-muted text-muted-foreground",
};

const TIME_STYLES: Record<string, string> = {
  NIGHT: "bg-indigo-100 text-indigo-800",
  DAY: "bg-yellow-50 text-yellow-800",
  MORNING: "bg-orange-50 text-orange-800",
  AFTERNOON: "bg-amber-50 text-amber-800",
  EVENING: "bg-purple-50 text-purple-800",
  DAWN: "bg-pink-50 text-pink-800",
  DUSK: "bg-violet-50 text-violet-800",
};

const EMPHASIS_FIELDS = new Set(["Key Visual Moment", "Emotional Beat"]);
const SKIP_FIELDS = new Set(["Location", "Time"]);

// --- Edit form for a scene ---
function SceneEditForm({
  scene,
  onSave,
  onCancel,
}: {
  scene: Scene;
  onSave: (updated: Scene) => void;
  onCancel: () => void;
}) {
  const [slugLine, setSlugLine] = useState(scene.slugLine);
  const [fields, setFields] = useState(scene.fields.map((f) => ({ ...f })));

  const updateField = (index: number, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], value };
    setFields(updated);
  };

  const handleSave = () => {
    const intExtMatch = slugLine.match(/^(INT|EXT)\b/i);
    const timeMatch = slugLine.match(/- (NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i);
    onSave({
      ...scene,
      slugLine,
      intExt: intExtMatch ? (intExtMatch[1].toUpperCase() as "INT" | "EXT") : "",
      timeOfDay: timeMatch ? timeMatch[1] : "",
      fields,
    });
  };

  return (
    <div className="px-4 pb-4 pt-3 border-t mx-4 mb-3 space-y-3">
      <div>
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
          Slug Line
        </label>
        <input
          value={slugLine}
          onChange={(e) => setSlugLine(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {fields.map((field, i) => (
        <div key={field.label}>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
            {field.label}
          </label>
          {field.value.length > 60 ? (
            <textarea
              value={field.value}
              onChange={(e) => updateField(i, e.target.value)}
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          ) : (
            <input
              value={field.value}
              onChange={(e) => updateField(i, e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Check size={12} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- Main component ---
type SceneBreakdownViewerProps = {
  content: string;
  onContentChange?: (newContent: string) => void;
};

export function SceneBreakdownViewer({ content, onContentChange }: SceneBreakdownViewerProps) {
  const parsed = useMemo(() => parseSceneBreakdown(content), [content]);
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(() => new Set([1]));
  const [editingScene, setEditingScene] = useState<number | null>(null);

  const { title, overview, scenes } = parsed;

  const toggleScene = (num: number) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const expandAll = () => setExpandedScenes(new Set(scenes.map((s) => s.number)));
  const collapseAll = () => setExpandedScenes(new Set());

  const handleEditSave = (updated: Scene) => {
    if (!onContentChange) return;
    const newScenes = scenes.map((s) => (s.number === updated.number ? updated : s));
    onContentChange(scenesToMarkdown(title, overview, newScenes));
    setEditingScene(null);
  };

  const handleDeleteScene = (num: number) => {
    if (!onContentChange) return;
    const newScenes = scenes.filter((s) => s.number !== num);
    onContentChange(scenesToMarkdown(title, overview, newScenes));
  };

  const handleAddScene = () => {
    if (!onContentChange) return;
    const maxNum = scenes.length > 0 ? Math.max(...scenes.map((s) => s.number)) : 0;
    const newScene: Scene = {
      number: maxNum + 1,
      slugLine: "INT. NEW LOCATION - DAY",
      intExt: "INT",
      timeOfDay: "DAY",
      fields: [
        { label: "Location", value: "" },
        { label: "Characters", value: "" },
        { label: "Pages", value: "" },
        { label: "Key Visual Moment", value: "" },
        { label: "Emotional Beat", value: "" },
        { label: "Props", value: "" },
        { label: "Wardrobe", value: "" },
        { label: "VFX/Stunts", value: "" },
        { label: "Notes", value: "" },
      ],
    };
    const newScenes = [...scenes, newScene];
    onContentChange(scenesToMarkdown(title, overview, newScenes));
    setExpandedScenes((prev) => new Set([...prev, newScene.number]));
    setEditingScene(newScene.number);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight mb-1">{title || "Scene Breakdown"}</h1>

      {/* Overview stats */}
      {overview.length > 0 && (
        <div className="flex gap-4 mt-4 mb-6">
          {overview.map((item) => (
            <div key={item.label} className="rounded-lg border bg-muted/30 px-4 py-3 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {item.label.replace("Total ", "")}
              </div>
              <div className="text-lg font-semibold mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Scenes</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex gap-1 items-center">
          {onContentChange && (
            <button
              onClick={handleAddScene}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-colors mr-2"
            >
              <Plus size={12} />
              Add scene
            </button>
          )}
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

      {/* Scene cards */}
      <div className="space-y-2">
        {scenes.map((scene) => {
          const isExpanded = expandedScenes.has(scene.number);
          const isEditing = editingScene === scene.number;
          const characters = scene.fields.find((f) => f.label === "Characters")?.value || "";
          const location = scene.fields.find((f) => f.label === "Location")?.value || "";
          const pages = scene.fields.find((f) => f.label === "Pages")?.value || "";

          return (
            <div
              key={scene.number}
              className={`rounded-xl border transition-all ${
                isExpanded ? "bg-background shadow-sm" : "bg-muted/10 hover:bg-muted/20"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleScene(scene.number)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 text-xs font-bold shrink-0 tabular-nums">
                    {scene.number}
                  </span>
                  {scene.intExt && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${INT_EXT_STYLES[scene.intExt]}`}>
                      {scene.intExt}
                    </span>
                  )}
                  <span className="text-sm font-semibold flex-1 truncate">
                    {scene.slugLine.replace(/^(INT|EXT)\.\s*/, "").replace(/\s*-\s*(NIGHT|DAY|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS)\s*$/i, "")}
                  </span>
                  {scene.timeOfDay && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIME_STYLES[scene.timeOfDay.toUpperCase()] || "bg-muted text-muted-foreground"}`}>
                      {scene.timeOfDay}
                    </span>
                  )}
                  {pages && (
                    <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">pp. {pages}</span>
                  )}
                </button>

                {/* Edit/Delete actions */}
                {onContentChange && isExpanded && !isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => setEditingScene(scene.number)}
                      className="text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors"
                      title="Edit scene"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene.number)}
                      className="text-muted-foreground/50 hover:text-destructive p-1 rounded transition-colors"
                      title="Delete scene"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Edit mode */}
              {isExpanded && isEditing && (
                <SceneEditForm
                  scene={scene}
                  onSave={handleEditSave}
                  onCancel={() => setEditingScene(null)}
                />
              )}

              {/* View mode */}
              {isExpanded && !isEditing && (
                <div className="px-4 pb-4 pt-1 border-t mx-4 mb-3 mt-0">
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                    {location && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full px-2.5 py-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {location}
                      </span>
                    )}
                    {characters && characters.split(",").map((char) => (
                      <span key={char.trim()} className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-full px-2.5 py-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <circle cx="12" cy="8" r="5" />
                          <path d="M20 21a8 8 0 0 0-16 0" />
                        </svg>
                        {char.trim()}
                      </span>
                    ))}
                  </div>

                  {scene.fields
                    .filter((f) => !SKIP_FIELDS.has(f.label) && f.label !== "Characters" && f.label !== "Pages")
                    .map((field) => {
                      if (EMPHASIS_FIELDS.has(field.label)) {
                        return (
                          <div key={field.label} className="mb-3">
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                              {field.label}
                            </div>
                            <p className="text-[13px] leading-[1.7] text-foreground/80">{field.value}</p>
                          </div>
                        );
                      }
                      if (field.value === "None" || !field.value.trim()) return null;
                      return (
                        <div key={field.label} className="flex gap-2 mb-1.5">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium shrink-0 w-24 pt-0.5">
                            {field.label}
                          </span>
                          <span className="text-[13px] text-foreground/75">{field.value}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
