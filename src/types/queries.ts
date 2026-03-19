export type IntentName =
  | "compare_brand_share_across_waves"
  | "summarise_category_performance"
  | "compare_brands_across_regions"
  | "rank_execution_gaps"
  | "show_distribution"
  | "rank_by_metric_change"
  | "compare_channels"
  | "show_top_movers";

export interface QueryTemplate {
  id: string;
  intentName: IntentName;
  displayName: string;
  description: string;
  requiredInputs: string[];
  optionalInputs: string[];
  supportedMetrics: string[];
  supportedFilters: string[];
  supportedGroupings: string[];
  resultGrain: string;
  builderKey: string;
  isActive: boolean;
}

export interface ParsedIntent {
  intentName: IntentName;
  confidence: number;
  metrics: string[];
  filters: QueryFilters;
  groupings: string[];
  timeScope: TimeScope | null;
}

export interface QueryFilters {
  category?: string;
  brands?: string[];
  skus?: string[];
  region?: string;
  market?: string;
  channel?: string;
  waveRange?: TimeScope;
}

export interface TimeScope {
  fromWave?: string;
  toWave?: string;
  waveCount?: number;
}

export interface QueryParameters {
  intentName: IntentName;
  metricIds: string[];
  filters: QueryFilters;
  groupings: string[];
  timeScope: TimeScope | null;
  sortDirection?: "ASC" | "DESC";
  limit?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  suggestions?: string[];
}

export interface ValidationWarning {
  field: string;
  message: string;
}
