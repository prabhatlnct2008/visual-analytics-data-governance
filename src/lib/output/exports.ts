import type { AnalysisResponse } from "@/types/responses";

/**
 * Generate CSV content from an analysis response.
 * Includes data table and metadata footer.
 */
export function generateCSV(response: AnalysisResponse): string {
  const { dataTable, filtersApplied, methodology, dataCoverage } = response;

  const lines: string[] = [];

  // Header row
  lines.push(dataTable.columns.map((c) => csvEscape(c.label)).join(","));

  // Data rows
  for (const row of dataTable.rows) {
    const values = dataTable.columns.map((col) => {
      const val = row[col.field];
      if (val === null || val === undefined) return "";
      if (col.type === "PERCENTAGE") return (Number(val) * 100).toFixed(1) + "%";
      return csvEscape(String(val));
    });
    lines.push(values.join(","));
  }

  // Metadata footer
  lines.push("");
  lines.push("--- Metadata ---");
  lines.push(`"Original Question","${csvEscape(response.request.originalQuestion)}"`);
  lines.push(`"Analysis Type","${csvEscape(response.request.interpretedTitle)}"`);

  if (methodology) {
    for (const m of methodology.metrics) {
      lines.push(`"Metric: ${csvEscape(m.businessName)}","${csvEscape(m.definition)}"`);
    }
    lines.push(`"Aggregation","${csvEscape(methodology.aggregationLevel)}"`);
  }

  const filterParts: string[] = [];
  if (filtersApplied.category) filterParts.push(`Category: ${filtersApplied.category}`);
  if (filtersApplied.region) filterParts.push(`Region: ${filtersApplied.region}`);
  if (filtersApplied.market) filterParts.push(`Market: ${filtersApplied.market}`);
  if (filtersApplied.brand) filterParts.push(`Brands: ${filtersApplied.brand.join(", ")}`);
  if (filtersApplied.waveRange) filterParts.push(`Waves: ${filtersApplied.waveRange.from} to ${filtersApplied.waveRange.to}`);
  if (filterParts.length > 0) {
    lines.push(`"Filters","${csvEscape(filterParts.join("; "))}"`);
  }

  if (dataCoverage) {
    lines.push(`"Data Source","${csvEscape(dataCoverage.sourceDataset)}"`);
  }

  lines.push(`"Generated","${response.timestamp}"`);
  lines.push(`"Source","Trusted Analytics Copilot"`);

  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
