"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DocumentViewerProps = {
  content: string;
  name: string;
};

export function DocumentViewer({ content, name }: DocumentViewerProps) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          className="text-sm text-primary hover:text-primary/80 underline underline-offset-2"
        >
          Download as .md
        </button>
      </div>
      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-td:text-foreground prose-th:text-foreground prose-th:font-medium">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
