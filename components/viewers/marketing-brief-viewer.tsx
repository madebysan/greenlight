"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil, RefreshCw, ChevronDown, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ColorEntry = { name: string; hex: string; description: string };
type Tagline = { type: string; text: string };
type Comp = { title: string; description: string };

type FilmIdentity = { label: string; value: string }[];

type ParsedBrief = {
  title: string;
  filmIdentity: FilmIdentity;
  logline: string;
  synopsisFree: string;
  fullPlot: string;
  taglines: Tagline[];
  comparables: Comp[];
  colors: ColorEntry[];
  remainingSections: { title: string; content: string }[];
};

function parseMarketingBrief(md: string): ParsedBrief {
  const result: ParsedBrief = {
    title: "",
    filmIdentity: [],
    logline: "",
    synopsisFree: "",
    fullPlot: "",
    taglines: [],
    comparables: [],
    colors: [],
    remainingSections: [],
  };

  const lines = md.split("\n");
  let currentSection = "";
  let buffer = "";

  const flush = () => {
    const text = buffer.trim();
    if (!text) { buffer = ""; return; }

    if (currentSection.toLowerCase().includes("film identity")) {
      const fieldMatches = text.matchAll(/- \*\*(.+?):\*\*\s*(.+)/g);
      for (const m of fieldMatches) {
        result.filmIdentity.push({ label: m[1], value: m[2] });
      }
    } else if (currentSection.toLowerCase() === "logline") {
      result.logline = text;
    } else if (currentSection.toLowerCase().includes("synopsis") && currentSection.toLowerCase().includes("spoiler")) {
      result.synopsisFree = text;
    } else if (currentSection.toLowerCase().includes("full plot")) {
      result.fullPlot = text;
    } else if (currentSection.toLowerCase() === "taglines") {
      const tagMatches = text.matchAll(/\d+\.\s+\*\*(.+?):\*\*\s*"(.+?)"/g);
      for (const m of tagMatches) {
        result.taglines.push({ type: m[1], text: m[2] });
      }
    } else if (currentSection.toLowerCase().includes("comparable")) {
      const compMatches = text.matchAll(/- \*\*(.+?)\*\*\s*[—–-]\s*(.+)/g);
      for (const m of compMatches) {
        result.comparables.push({ title: m[1], description: m[2] });
      }
    } else if (currentSection.toLowerCase().includes("color palette")) {
      const colorMatches = text.matchAll(/- \*\*(.+?)\*\*\s*[—–-]\s*(#[0-9a-fA-F]{6})\s*[—–-]\s*(.+)/g);
      for (const m of colorMatches) {
        result.colors.push({ name: m[1], hex: m[2], description: m[3] });
      }
    } else if (currentSection) {
      result.remainingSections.push({ title: currentSection, content: text });
    }
    buffer = "";
  };

  for (const line of lines) {
    if (/^# /.test(line) && !result.title) {
      result.title = line.replace(/^# (Marketing Brief:\s*)?/, "").trim();
      continue;
    }

    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2 || h3) {
      flush();
      currentSection = (h2 || h3)![1].trim();
      continue;
    }

    buffer += line + "\n";
  }
  flush();

  return result;
}

// --- Reusable edit/rewrite button pair ---
function SectionActions({
  onEdit,
  onRewrite,
  isRewriting,
  editLabel = "Edit",
  rewriteLabel = "Rewrite",
}: {
  onEdit?: () => void;
  onRewrite?: () => void;
  isRewriting?: boolean;
  editLabel?: string;
  rewriteLabel?: string;
}) {
  return (
    <span className="flex items-center gap-1.5 shrink-0">
      {onEdit && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-colors normal-case tracking-normal"
        >
          <Pencil size={11} />
          {editLabel}
        </button>
      )}
      {onRewrite && (
        <button
          onClick={onRewrite}
          disabled={isRewriting}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-colors normal-case tracking-normal disabled:opacity-40 disabled:pointer-events-none"
        >
          <RefreshCw size={11} className={isRewriting ? "animate-spin" : ""} />
          {isRewriting ? "Rewriting..." : rewriteLabel}
        </button>
      )}
    </span>
  );
}

// --- Section header ---
function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-3">
      {title}
      <span className="flex-1 h-px bg-border" />
      {children}
    </h2>
  );
}

type MarketingBriefViewerProps = {
  content: string;
  onContentChange?: (newContent: string) => void;
  onRewrite?: () => Promise<void>;
};

export function MarketingBriefViewer({ content, onContentChange, onRewrite }: MarketingBriefViewerProps) {
  const brief = useMemo(() => parseMarketingBrief(content), [content]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [plotExpanded, setPlotExpanded] = useState(false);

  // Generic edit dialog state
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    title: string;
    value: string;
    onSave: (value: string) => void;
  }>({ open: false, title: "", value: "", onSave: () => {} });

  // Film identity edit dialog state
  const [identityDialog, setIdentityDialog] = useState(false);
  const [identityFields, setIdentityFields] = useState<FilmIdentity>([]);

  const openEditDialog = (title: string, currentValue: string, onSave: (value: string) => void) => {
    setEditDialog({ open: true, title, value: currentValue, onSave });
  };

  const handleEditSave = () => {
    editDialog.onSave(editDialog.value.trim());
    setEditDialog((prev) => ({ ...prev, open: false }));
  };

  // Replace a specific text in markdown content
  const replaceInContent = (oldText: string, newText: string) => {
    if (!onContentChange) return;
    onContentChange(content.replace(oldText, newText));
  };

  // Rewrite whole document
  const handleRewrite = async () => {
    if (!onRewrite) return;
    setIsRewriting(true);
    try {
      await onRewrite();
    } finally {
      setIsRewriting(false);
    }
  };

  // Film identity form handlers
  const openIdentityEdit = () => {
    setIdentityFields(brief.filmIdentity.map((f) => ({ ...f })));
    setIdentityDialog(true);
  };

  const saveIdentityEdit = () => {
    if (!onContentChange) return;
    let updated = content;
    for (let i = 0; i < brief.filmIdentity.length; i++) {
      const original = brief.filmIdentity[i];
      const edited = identityFields[i];
      if (original && edited && original.value !== edited.value) {
        updated = updated.replace(
          `**${original.label}:** ${original.value}`,
          `**${original.label}:** ${edited.value}`
        );
      }
    }
    onContentChange(updated);
    setIdentityDialog(false);
  };

  return (
    <div>
      {/* Film Identity card */}
      {brief.filmIdentity.length > 0 && (
        <div className="rounded-xl border bg-muted/20 p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Film Identity</span>
            <SectionActions
              onEdit={onContentChange ? openIdentityEdit : undefined}
              onRewrite={onRewrite ? handleRewrite : undefined}
              isRewriting={isRewriting}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {brief.filmIdentity.map((item) => (
              <div key={item.label}>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  {item.label}
                </div>
                <div className="text-sm font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logline */}
      {brief.logline && (
        <section className="mb-8">
          <SectionHeader title="Logline">
            <SectionActions
              onEdit={onContentChange ? () => openEditDialog(
                "Edit Logline",
                brief.logline,
                (val) => replaceInContent(brief.logline, val)
              ) : undefined}
              onRewrite={onRewrite ? handleRewrite : undefined}
              isRewriting={isRewriting}
            />
          </SectionHeader>
          <blockquote className="text-[15px] leading-[1.8] text-foreground/85 border-l-2 border-primary/30 pl-4 italic">
            {brief.logline}
          </blockquote>
        </section>
      )}

      {/* Taglines */}
      {brief.taglines.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Taglines">
            <SectionActions
              onRewrite={onRewrite ? handleRewrite : undefined}
              isRewriting={isRewriting}
              rewriteLabel="Rewrite All"
            />
          </SectionHeader>
          <div className="grid grid-cols-1 gap-2">
            {brief.taglines.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3 group">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted rounded px-2 py-0.5 shrink-0">
                  {t.type}
                </span>
                <span className="text-[14px] font-medium italic flex-1">&ldquo;{t.text}&rdquo;</span>
                <button
                  onClick={onRewrite ? handleRewrite : undefined}
                  disabled={isRewriting || !onRewrite}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border hover:border-foreground/20 transition-all normal-case tracking-normal disabled:opacity-40 disabled:pointer-events-none shrink-0"
                >
                  <RefreshCw size={11} className={isRewriting ? "animate-spin" : ""} />
                  Rewrite
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Color Palette */}
      {brief.colors.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Color Palette">
            <SectionActions
              onRewrite={onRewrite ? handleRewrite : undefined}
              isRewriting={isRewriting}
              rewriteLabel="Regenerate"
            />
          </SectionHeader>
          {/* Swatch strip */}
          <div className="flex rounded-xl overflow-hidden mb-4 h-16">
            {brief.colors.map((c) => (
              <div
                key={c.hex}
                className="flex-1 relative flex items-center justify-center cursor-default"
                style={{ backgroundColor: c.hex }}
                title={`${c.name} — ${c.hex}`}
              >
                <span className="text-white text-xs font-mono font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{c.hex}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {brief.colors.map((c) => (
              <div key={c.hex} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded shrink-0 border mt-0.5"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{c.hex}</span>
                  </div>
                  <p className="text-[12px] text-foreground/60 leading-relaxed">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Synopsis */}
      {brief.synopsisFree && (
        <section className="mb-8">
          <SectionHeader title="Synopsis (Spoiler-Free)">
            <SectionActions
              onEdit={onContentChange ? () => openEditDialog(
                "Edit Synopsis",
                brief.synopsisFree,
                (val) => replaceInContent(brief.synopsisFree, val)
              ) : undefined}
              onRewrite={onRewrite ? handleRewrite : undefined}
              isRewriting={isRewriting}
            />
          </SectionHeader>
          <p className="text-[13px] leading-[1.8] text-foreground/75">
            {brief.synopsisFree}
          </p>
        </section>
      )}

      {/* Comparable Films */}
      {brief.comparables.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Comparable Films" />
          <div className="grid grid-cols-1 gap-2">
            {brief.comparables.map((comp) => (
              <div key={comp.title} className="flex gap-3 rounded-lg border px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
                  <Film size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{comp.title}</div>
                  <p className="text-[12px] text-foreground/60 leading-relaxed mt-0.5">{comp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full Plot (collapsible) */}
      {brief.fullPlot && (
        <section className="mb-8">
          <button
            onClick={() => setPlotExpanded(!plotExpanded)}
            className="w-full text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 cursor-pointer py-1"
          >
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform ${plotExpanded ? "" : "-rotate-90"}`}
            />
            Full Plot Summary (Spoilers)
            <span className="flex-1 h-px bg-border" />
          </button>
          {plotExpanded && (
            <p className="text-[13px] leading-[1.8] text-foreground/75 mt-4 whitespace-pre-line">
              {brief.fullPlot}
            </p>
          )}
        </section>
      )}

      {/* Remaining sections rendered as markdown */}
      {brief.remainingSections.map((sec) => (
        <section key={sec.title} className="mb-8">
          <SectionHeader title={sec.title} />
          <div className="rounded-xl border p-5 text-[13px] leading-[1.7] text-foreground/75 [&_strong]:text-foreground [&_strong]:font-semibold [&_p]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:mb-4 [&_li]:mb-1.5 [&_em]:italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sec.content}
            </ReactMarkdown>
          </div>
        </section>
      ))}

      {/* Generic text edit dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialog.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editDialog.value}
            onChange={(e) => setEditDialog((prev) => ({ ...prev, value: e.target.value }))}
            rows={8}
            className="text-[13px] leading-relaxed"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={!onContentChange}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Film identity edit dialog */}
      <Dialog open={identityDialog} onOpenChange={setIdentityDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Film Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {identityFields.map((field, i) => (
              <div key={field.label}>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => {
                    const updated = [...identityFields];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setIdentityFields(updated);
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIdentityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveIdentityEdit} disabled={!onContentChange}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
