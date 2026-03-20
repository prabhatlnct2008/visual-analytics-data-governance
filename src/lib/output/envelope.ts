import { v4 as uuidv4 } from "uuid";
import type {
  AnalysisResponse,
  DataTable,
  FilterSet,
  ResponseSummary,
  KeyFinding,
  ChartSpec,
  MethodologyNote,
  CoverageNote,
  FreshnessNote,
  Warning,
} from "@/types/responses";
import type { MetricDefinition } from "@/types/metrics";
import type { QueryParameters } from "@/types/queries";

interface EnvelopeInput {
  question: string;
  intentName: string;
  intentTitle: string;
  params: QueryParameters;
  dataTable: DataTable;
  summary: ResponseSummary;
  keyFindings: KeyFinding[];
  metrics: MetricDefinition[];
  chart: ChartSpec | null;
  warnings: Warning[];
  coverageData: {
    regionsIncluded: string[];
    marketsIncluded: string[];
    wavesIncluded: string[];
    storeCount: number | null;
    observationCount: number | null;
  };
  freshness: {
    lastRefreshedAt: string;
    refreshFrequency: string;
  };
}

/**
 * Build a complete response envelope from all component parts.
 */
export function buildResponseEnvelope(input: EnvelopeInput): AnalysisResponse {
  const filtersApplied: FilterSet = {
    category: input.params.filters.category || null,
    brand: input.params.filters.brands || null,
    sku: input.params.filters.skus || null,
    region: input.params.filters.region || null,
    market: input.params.filters.market || null,
    channel: input.params.filters.channel || null,
    waveRange: input.params.timeScope?.waveCount
      ? {
          from: `Last ${input.params.timeScope.waveCount} waves`,
          to: "Latest",
          count: input.params.timeScope.waveCount,
        }
      : null,
    additionalFilters: null,
  };

  const methodology: MethodologyNote = {
    metrics: input.metrics.map((m) => ({
      metricId: m.metricId,
      businessName: m.businessName,
      definition: m.description,
      numeratorConcept: m.numeratorConcept,
      denominatorConcept: m.denominatorConcept,
      cautionNotes: m.cautionNotes,
    })),
    aggregationLevel: `Aggregated at ${input.dataTable.grain} level`,
    calculationNotes: input.metrics
      .map((m) => m.explanationCopy)
      .join(" "),
    exclusions: null,
  };

  const isStale =
    new Date(input.freshness.lastRefreshedAt).getTime() <
    Date.now() - 180 * 24 * 60 * 60 * 1000; // 6 months

  const dataFreshness: FreshnessNote = {
    lastRefreshedAt: input.freshness.lastRefreshedAt,
    refreshFrequency: input.freshness.refreshFrequency,
    isStale,
    staleWarning: isStale
      ? "Data is older than expected. Results may not reflect the latest observations."
      : null,
  };

  const dataCoverage: CoverageNote = {
    ...input.coverageData,
    coveragePercentage: null,
    missingDataNote:
      input.dataTable.totalRows === 0
        ? "No data available for the selected filters."
        : null,
    sourceDataset: "Retail Observations Dataset",
  };

  const warnings = [...input.warnings];
  if (isStale) {
    warnings.push({
      type: "STALE_DATA",
      message: dataFreshness.staleWarning!,
      severity: "WARNING",
    });
  }
  if (input.dataTable.totalRows === 0) {
    warnings.push({
      type: "PARTIAL_RESULT",
      message: "No data matched the selected filters.",
      severity: "CRITICAL",
    });
  }

  return {
    id: uuidv4(),
    status: input.dataTable.totalRows === 0 ? "PARTIAL" : "SUCCESS",
    timestamp: new Date().toISOString(),
    request: {
      originalQuestion: input.question,
      interpretedIntent: input.intentName,
      interpretedTitle: input.intentTitle,
    },
    summary: input.summary,
    keyFindings: input.keyFindings,
    chart: input.chart,
    dataTable: input.dataTable,
    filtersApplied,
    methodology,
    dataCoverage,
    dataFreshness,
    warnings,
    exportMetadata: {
      exportable: input.dataTable.totalRows > 0,
      availableFormats: ["CSV", "XLSX"],
      exportEndpoint: "/api/export",
      includesMethodology: true,
      includesFilters: true,
    },
  };
}
