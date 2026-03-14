"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import React from "react";

type DocumentViewerProps = {
  content: string;
};

// Inline hex color swatch
function ColorSwatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-baseline">
      <span
        className="inline-block h-3 w-3 rounded-[3px] border border-black/15 shrink-0 translate-y-[1px]"
        style={{ backgroundColor: color }}
      />
      <code className="text-xs font-mono text-muted-foreground">{color}</code>
    </span>
  );
}

// Find hex color codes in text and replace with swatches
function renderWithSwatches(text: string): React.ReactNode[] {
  const hexRegex = /#[0-9a-fA-F]{6}\b/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = hexRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<ColorSwatch key={match.index} color={match[0]} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Recursively walk children to swap hex strings for swatches
function processChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      if (/#[0-9a-fA-F]{6}\b/.test(child)) {
        return <>{renderWithSwatches(child)}</>;
      }
      return child;
    }
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      if (props.children) {
        return React.cloneElement(
          child as React.ReactElement<{ children: React.ReactNode }>,
          { children: processChildren(props.children as React.ReactNode) }
        );
      }
    }
    return child;
  });
}

const components: Components = {
  // -- Headings --
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold tracking-tight mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="mt-10 mb-4 flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">
      {children}
    </h3>
  ),

  // -- Text --
  p: ({ children }) => (
    <p className="text-[13px] leading-[1.7] text-foreground/75 mb-3 max-w-[72ch]">
      {processChildren(children)}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-foreground/60">{children}</em>
  ),

  // -- Lists --
  ul: ({ children }) => (
    <ul className="text-[13px] space-y-1 mb-4 ml-5 list-disc marker:text-border">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-[13px] space-y-1 mb-4 ml-5 list-decimal marker:text-muted-foreground/40">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-[1.7] text-foreground/75 pl-1">
      {processChildren(children)}
    </li>
  ),

  // -- Dividers --
  hr: () => <hr className="my-8 border-border/60" />,

  // -- Tables --
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-border/80 my-5 shadow-xs">
      <table className="w-full text-[13px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b whitespace-nowrap">
      {children}
    </th>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border/50">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[13px] text-foreground/75 align-top">
      {processChildren(children)}
    </td>
  ),

  // -- Other --
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/20 pl-4 my-4 text-[13px] text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    if (!className) {
      return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="rounded-lg bg-muted/40 border p-4 overflow-x-auto my-4 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
    >
      {children}
    </a>
  ),
};

export function DocumentViewer({ content }: DocumentViewerProps) {
  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
