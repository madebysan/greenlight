"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";

export function HeaderButton({
  icon,
  label,
  onClick,
  title,
}: {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border hover:border-foreground/20 transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

export type MenuItem =
  | { icon: ReactNode; label: string; onClick: () => void }
  | "divider"
  | null
  | false;

export function MoreMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Collapse consecutive dividers and drop trailing/leading ones so the menu
  // never renders an orphaned separator when conditional items are hidden.
  const cleaned: ({ icon: ReactNode; label: string; onClick: () => void } | "divider")[] = [];
  for (const it of items) {
    if (!it) continue;
    if (it === "divider") {
      if (cleaned.length === 0) continue;
      if (cleaned[cleaned.length - 1] === "divider") continue;
      cleaned.push("divider");
    } else {
      cleaned.push(it);
    }
  }
  while (cleaned.length && cleaned[cleaned.length - 1] === "divider") cleaned.pop();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="More options"
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[100] min-w-[220px] rounded-lg border border-border bg-popover shadow-lg py-1">
          {cleaned.map((item, i) => {
            if (item === "divider") {
              return <div key={`d-${i}`} className="my-1 h-px bg-border/60" />;
            }
            return (
              <button
                key={`${i}-${item.label}`}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
