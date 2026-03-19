import type { ChartType } from "./metrics";

export type ResponseStatus =
  | "SUCCESS"
  | "PARTIAL"
  | "UNSUPPORTED"
  | "ERROR"
  | "CLARIFICATION_NEEDED";

export interface AnalysisResponse {
  id: string;
  status: ResponseStatus;
  timestamp: string;
  request: RequestContext;
  summary: ResponseSummary | null;
  keyFindings: KeyFinding[];
  chart: ChartSpec | null;
  dataTable: DataTable;
  filtersApplied: FilterSet;
  methodology: MethodologyNote | null;
  dataCoverage: CoverageNote | null;
  dataFreshness: FreshnessNote | null;
  warnings: Warning[];
  exportMetadata: ExportMetadata;
}

export interface RequestContext {
  originalQuestion: string;
  interpretedIntent: string;
  interpretedTitle: string;
}

export interface ResponseSummary {
  text: string;
  evidenceBound: boolean;
}

export interface KeyFinding {
  text: string;
  metric: string;
  direction: "UP" | "DOWN" | "STABLE" | "MIXED" | null;
  magnitude: string | null;
  entity: string | null;
  period: string | null;
}

export interface ChartSpec {
  chartType: ChartType;
  title: string;
  xAxis: AxisSpec;
  yAxis: AxisSpec;
  series: ChartSeries[];
  options: ChartOptions;
}

export interface AxisSpec {
  label: string;
  field: string;
  type: "CATEGORY" | "NUMERIC" | "TIME";
}

export interface ChartSeries {
  name: string;
  field: string;
  color: string | null;
}

export interface ChartOptions {
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  percentageAxis: boolean;
}

export interface DataTable {
  columns: ColumnDef[];
  rows: Record<string, string | number | boolean | null>[];
  totalRows: number;
  grain: string;
}

export interface ColumnDef {
  field: string;
  label: string;
  type: "STRING" | "NUMBER" | "PERCENTAGE" | "BOOLEAN" | "DATE";
  format: string | null;
  isSortable: boolean;
}

export interface FilterSet {
  category: string | null;
  brand: string[] | null;
  sku: string[] | null;
  region: string | null;
  market: string | null;
  channel: string | null;
  waveRange: {
    from: string;
    to: string;
    count: number;
  } | null;
  additionalFilters: Record<string, string> | null;
}

export interface MethodologyNote {
  metrics: MetricDefinitionNote[];
  aggregationLevel: string;
  calculationNotes: string;
  exclusions: string | null;
}

export interface MetricDefinitionNote {
  metricId: string;
  businessName: string;
  definition: string;
  numeratorConcept: string | null;
  denominatorConcept: string | null;
  cautionNotes: string | null;
}

export interface CoverageNote {
  regionsIncluded: string[];
  marketsIncluded: string[];
  wavesIncluded: string[];
  storeCount: number | null;
  observationCount: number | null;
  coveragePercentage: number | null;
  missingDataNote: string | null;
  sourceDataset: string;
}

export interface FreshnessNote {
  lastRefreshedAt: string;
  refreshFrequency: string;
  isStale: boolean;
  staleWarning: string | null;
}

export interface Warning {
  type:
    | "LOW_COVERAGE"
    | "STALE_DATA"
    | "PARTIAL_RESULT"
    | "APPROXIMATION"
    | "SCOPE_LIMIT";
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export interface ExportMetadata {
  exportable: boolean;
  availableFormats: ("CSV" | "XLSX")[];
  exportEndpoint: string;
  includesMethodology: boolean;
  includesFilters: boolean;
}

export interface UnsupportedResponse {
  id: string;
  status: "UNSUPPORTED";
  timestamp: string;
  request: { originalQuestion: string };
  reason: string;
  unsupportedElements: string[];
  suggestions: string[];
  availableMetrics: string[];
  availableDimensions: string[];
}

export interface ClarificationResponse {
  id: string;
  status: "CLARIFICATION_NEEDED";
  timestamp: string;
  request: { originalQuestion: string };
  clarification: {
    question: string;
    options: ClarificationOption[];
  };
}

export interface ClarificationOption {
  label: string;
  value: string;
  description: string;
}

export interface ErrorResponse {
  id: string;
  status: "ERROR";
  timestamp: string;
  request: { originalQuestion: string };
  error: {
    code: string;
    message: string;
    details: string | null;
  };
}
