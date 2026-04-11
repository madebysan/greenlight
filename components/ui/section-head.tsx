type SectionHeadProps = {
  children: React.ReactNode;
  index?: number;
  label?: string;
  labelIcon?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
};

export function SectionHead({
  children,
  index,
  label,
  labelIcon,
  meta,
  className = "",
}: SectionHeadProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {label && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] dark:bg-white/[0.04] text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground shadow-pill">
          {labelIcon}
          {label}
        </div>
      )}
      <div className="flex items-baseline gap-4 pb-3 border-b border-border/60">
        {typeof index === "number" && (
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums tracking-tight">
            {index.toString().padStart(2, "0")}
          </span>
        )}
        <h2 className="text-[15px] font-medium text-foreground flex-1 min-w-0 tracking-tight">
          {children}
        </h2>
        {meta && <div className="flex items-center gap-3 shrink-0">{meta}</div>}
      </div>
    </div>
  );
}
