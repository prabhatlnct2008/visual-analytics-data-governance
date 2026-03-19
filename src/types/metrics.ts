export type CalculationType =
  | "RATIO"
  | "COUNT"
  | "SUM"
  | "AVERAGE"
  | "COMPOSITE";

export type ChartType = "LINE" | "BAR" | "STACKED_BAR" | "HEATMAP";

export type DimensionName =
  | "category"
  | "brand"
  | "sku"
  | "region"
  | "market"
  | "channel"
  | "wave"
  | "store";

export interface MetricDefinition {
  id: string;
  metricId: string;
  businessName: string;
  description: string;
  calculationType: CalculationType;
  numeratorConcept: string | null;
  denominatorConcept: string | null;
  allowedDimensions: DimensionName[];
  allowedFilters: string[];
  allowedChartTypes: ChartType[];
  defaultGrain: string;
  cautionNotes: string | null;
  explanationCopy: string;
  isActive: boolean;
}

export interface VocabularyMapping {
  id: string;
  userTerm: string;
  approvedTerm: string;
  termType: "METRIC" | "DIMENSION" | "FILTER_VALUE" | "GEOGRAPHY";
  isActive: boolean;
}
