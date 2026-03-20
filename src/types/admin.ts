export interface DatasetRegistryEntry {
  id: string;
  datasetName: string;
  description: string;
  refreshFrequency: string;
  lastRefreshedAt: string | null;
  coverageDescription: string;
  owner: string;
  status: "ACTIVE" | "STALE" | "DEPRECATED";
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  actionType: "QUERY" | "EXPORT" | "BLOCKED" | "CLARIFICATION";
  originalQuestion: string;
  resolvedIntent: string | null;
  resolvedMetrics: string[] | null;
  resolvedFilters: Record<string, unknown> | null;
  templateUsed: string | null;
  wasSuccessful: boolean;
  blockReason: string | null;
  exportFormat: string | null;
  createdAt: string;
}

export interface SavedReport {
  id: string;
  userId: string | null;
  title: string;
  originalQuestion: string;
  resolvedIntent: string;
  resolvedFilters: Record<string, unknown>;
  resolvedMetrics: string[];
  createdAt: string;
}
