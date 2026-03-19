# Response Schema

## Trusted Analytics Copilot — Response Structure Definition

---

## 1. Response Envelope

Every successful analysis response uses the same envelope structure. This ensures consistency across all supported query types.

```typescript
interface AnalysisResponse {
  // Metadata
  id: string;                          // Unique response ID
  status: "SUCCESS" | "PARTIAL" | "UNSUPPORTED" | "ERROR";
  timestamp: string;                   // ISO 8601 UTC

  // Request context
  request: {
    originalQuestion: string;          // User's exact input
    interpretedIntent: string;         // Matched intent name
    interpretedTitle: string;          // Human-readable analysis title
  };

  // Core response sections (ordered)
  summary: ResponseSummary;
  keyFindings: KeyFinding[];
  chart: ChartSpec | null;
  dataTable: DataTable;
  filtersApplied: FilterSet;
  methodology: MethodologyNote;
  dataCoverage: CoverageNote;
  dataFreshness: FreshnessNote;
  warnings: Warning[];
  exportMetadata: ExportMetadata;
}
```

---

## 2. Response Sections

### 2.1 Summary

**Required**: Yes (for SUCCESS and PARTIAL status)

```typescript
interface ResponseSummary {
  text: string;                        // 2-4 sentence executive summary
  evidenceBound: boolean;              // Must be true — confirms no fabrication
}
```

**Rules**:
- Must describe only what is in the result data
- Must mention the metric, scope, and time period
- Must not make causal claims unless explicitly supported
- Must note limitations if status is PARTIAL

### 2.2 Key Findings

**Required**: Yes (for SUCCESS and PARTIAL status)

```typescript
interface KeyFinding {
  text: string;                        // One finding statement
  metric: string;                      // Which metric this relates to
  direction: "UP" | "DOWN" | "STABLE" | "MIXED" | null;
  magnitude: string | null;            // e.g., "+3.2 pp", "-12%"
  entity: string | null;               // Which brand/category/market
  period: string | null;               // Which wave or period
}
```

**Rules**:
- Each finding must reference specific data from the result set
- Findings should be ordered by significance (largest change first)
- Maximum 8 key findings per response
- No vague statements like "performed strongly" without numbers

### 2.3 Chart Specification

**Required**: No (only when the query type supports charting)

```typescript
interface ChartSpec {
  chartType: "LINE" | "BAR" | "STACKED_BAR" | "HEATMAP";
  title: string;
  xAxis: AxisSpec;
  yAxis: AxisSpec;
  series: ChartSeries[];
  options: ChartOptions;
}

interface AxisSpec {
  label: string;
  field: string;                       // Column from data table
  type: "CATEGORY" | "NUMERIC" | "TIME";
}

interface ChartSeries {
  name: string;
  field: string;                       // Column from data table
  color: string | null;                // Optional colour hint
}

interface ChartOptions {
  showLegend: boolean;
  showGrid: boolean;
  showTooltip: boolean;
  percentageAxis: boolean;             // Whether Y-axis is percentage
}
```

**Rules**:
- Chart type must be in the metric's `allowed_chart_types`
- Chart data must come exclusively from the data table (no additional data)
- Chart must not imply unsupported data transformations

### 2.4 Data Table

**Required**: Yes

```typescript
interface DataTable {
  columns: ColumnDef[];
  rows: Record<string, string | number | boolean | null>[];
  totalRows: number;
  grain: string;                       // e.g., "brand × wave"
}

interface ColumnDef {
  field: string;                       // Column key
  label: string;                       // Display header
  type: "STRING" | "NUMBER" | "PERCENTAGE" | "BOOLEAN" | "DATE";
  format: string | null;               // e.g., "0.1%", "#,##0"
  isSortable: boolean;
}
```

**Rules**:
- Columns must be typed and labelled
- Numeric columns should have format hints
- Percentage values stored as decimals (0.0–1.0) with format "PERCENTAGE"
- Table should show full result set (pagination if > 100 rows)

### 2.5 Filters Applied

**Required**: Yes

```typescript
interface FilterSet {
  category: string | null;
  brand: string[] | null;
  sku: string[] | null;
  region: string | null;
  market: string | null;
  channel: string | null;
  waveRange: {
    from: string;                      // Wave name
    to: string;                        // Wave name
    count: number;                     // Number of waves
  } | null;
  additionalFilters: Record<string, string> | null;
}
```

**Rules**:
- Must show ALL filters that were applied, including defaults
- Must show filters that were auto-resolved from user input
- Empty/null means "no filter applied" (all values included)

### 2.6 Methodology Note

**Required**: Yes

```typescript
interface MethodologyNote {
  metrics: MetricDefinitionNote[];
  aggregationLevel: string;            // e.g., "Aggregated at brand × wave level"
  calculationNotes: string;            // How the metric was calculated
  exclusions: string | null;           // What was excluded, if anything
}

interface MetricDefinitionNote {
  metricId: string;
  businessName: string;
  definition: string;                  // From metric registry
  numeratorConcept: string | null;
  denominatorConcept: string | null;
  cautionNotes: string | null;
}
```

**Rules**:
- Must include the definition of every metric shown in the response
- Must explain the aggregation level
- Must note any exclusions or assumptions

### 2.7 Data Coverage Note

**Required**: Yes

```typescript
interface CoverageNote {
  regionsIncluded: string[];
  marketsIncluded: string[];
  wavesIncluded: string[];
  storeCount: number | null;           // How many stores contributed
  observationCount: number | null;     // Total observations
  coveragePercentage: number | null;   // If measurable
  missingDataNote: string | null;      // Explicit gap description
  sourceDataset: string;               // Which dataset was used
}
```

**Rules**:
- Must list what was included
- Must note any missing or partial data
- Must identify the source dataset

### 2.8 Freshness Note

**Required**: Yes

```typescript
interface FreshnessNote {
  lastRefreshedAt: string;             // ISO 8601 UTC
  refreshFrequency: string;            // e.g., "Quarterly"
  isStale: boolean;                    // True if older than expected
  staleWarning: string | null;         // Warning text if stale
}
```

### 2.9 Warnings

**Required**: Only when applicable (empty array if none)

```typescript
interface Warning {
  type: "LOW_COVERAGE" | "STALE_DATA" | "PARTIAL_RESULT" | "APPROXIMATION" | "SCOPE_LIMIT";
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}
```

### 2.10 Export Metadata

**Required**: Yes

```typescript
interface ExportMetadata {
  exportable: boolean;
  availableFormats: ("CSV" | "XLSX")[];
  exportEndpoint: string;              // API endpoint for download
  includesMethodology: boolean;        // Whether export includes methodology
  includesFilters: boolean;            // Whether export includes filter info
}
```

---

## 3. Error Response

```typescript
interface ErrorResponse {
  id: string;
  status: "ERROR";
  timestamp: string;
  request: {
    originalQuestion: string;
  };
  error: {
    code: string;                      // e.g., "METRIC_NOT_FOUND", "QUERY_FAILED"
    message: string;                   // User-friendly error message
    details: string | null;            // Technical details (admin only)
  };
}
```

---

## 4. Unsupported Response

```typescript
interface UnsupportedResponse {
  id: string;
  status: "UNSUPPORTED";
  timestamp: string;
  request: {
    originalQuestion: string;
  };
  reason: string;
  unsupportedElements: string[];
  suggestions: string[];               // Reformulated supported questions
  availableMetrics: string[];
  availableDimensions: string[];
}
```

---

## 5. Clarification Response

When the system needs disambiguation before executing.

```typescript
interface ClarificationResponse {
  id: string;
  status: "CLARIFICATION_NEEDED";
  timestamp: string;
  request: {
    originalQuestion: string;
  };
  clarification: {
    question: string;                  // What the system needs to know
    options: ClarificationOption[];
  };
}

interface ClarificationOption {
  label: string;                       // Display text
  value: string;                       // Machine value
  description: string;                 // Explanation of what this means
}
```

---

## 6. Export File Structure

### 6.1 CSV Export

- Row 1: Column headers from `DataTable.columns[].label`
- Rows 2+: Data rows
- Final rows: Metadata block separated by empty row
  - `Metric: <business_name>`
  - `Definition: <definition>`
  - `Filters: <filter summary>`
  - `Data Coverage: <coverage summary>`
  - `Generated: <timestamp>`
  - `Source: Trusted Analytics Copilot`

### 6.2 Excel Export

**Sheet 1: "Data"**
- Column headers with formatting
- Data rows with number formatting applied
- Auto-width columns

**Sheet 2: "Methodology"**
- Metric definitions used
- Calculation notes
- Aggregation level
- Exclusions

**Sheet 3: "Metadata"**
- Original question
- Interpreted intent
- Filters applied
- Data coverage
- Data freshness
- Generated timestamp
- Warnings (if any)

---

## 7. Chart Type Governance

| Query Pattern | Allowed Charts | Default |
|--------------|---------------|---------|
| Trend across waves | LINE, BAR | LINE |
| Comparison across entities | BAR, STACKED_BAR | BAR |
| Share breakdown | STACKED_BAR | STACKED_BAR |
| Gap analysis / heatmap | HEATMAP, BAR | HEATMAP |
| Ranking | BAR | BAR |
| Distribution | BAR | BAR |
