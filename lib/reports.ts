// Report history — persisted to localStorage

export type SavedReport = {
  id: string;
  title: string;
  createdAt: string;
  jsonData?: string;
  documents: {
    name: string;
    slug: string;
    status: "done" | "error";
    content: string | null;
    error: string | null;
  }[];
};

const REPORTS_KEY = "stp-reports";

export function loadReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: SavedReport): void {
  const reports = loadReports();
  // Replace if same id exists, otherwise prepend
  const idx = reports.findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    reports[idx] = report;
  } else {
    reports.unshift(report);
  }
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Storage full — remove oldest reports to make room
    while (reports.length > 5) {
      reports.pop();
    }
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    } catch {
      // Give up
    }
  }
}

export function deleteReport(id: string): void {
  const reports = loadReports().filter((r) => r.id !== id);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function extractTitle(jsonData: string): string {
  try {
    const parsed = JSON.parse(jsonData);
    return parsed.title || "Untitled";
  } catch {
    return "Untitled";
  }
}
