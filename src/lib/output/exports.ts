import ExcelJS from "exceljs";
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

/**
 * Generate an XLSX workbook buffer from an analysis response.
 * Sheet 1: Data (formatted table)
 * Sheet 2: Methodology (metric definitions, calculation notes)
 * Sheet 3: Metadata (question, filters, coverage, freshness, warnings)
 */
export async function generateXLSX(response: AnalysisResponse): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Trusted Analytics Copilot";
  workbook.created = new Date();

  // ─── Sheet 1: Data ───────────────────────────────────────────────
  const dataSheet = workbook.addWorksheet("Data");

  // Header row
  const headerRow = dataSheet.addRow(
    response.dataTable.columns.map((c) => c.label)
  );
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };

  // Data rows
  for (const row of response.dataTable.rows) {
    const values = response.dataTable.columns.map((col) => {
      const val = row[col.field];
      if (val === null || val === undefined) return "";
      if (col.type === "PERCENTAGE") return Number(val);
      if (col.type === "NUMBER") return Number(val);
      return val;
    });
    dataSheet.addRow(values);
  }

  // Apply percentage formatting
  response.dataTable.columns.forEach((col, idx) => {
    const colNum = idx + 1;
    if (col.type === "PERCENTAGE") {
      dataSheet.getColumn(colNum).numFmt = "0.0%";
    } else if (col.type === "NUMBER") {
      dataSheet.getColumn(colNum).numFmt = "#,##0";
    }
    // Auto-width (approximate)
    dataSheet.getColumn(colNum).width = Math.max(col.label.length + 4, 12);
  });

  // ─── Sheet 2: Methodology ────────────────────────────────────────
  const methodSheet = workbook.addWorksheet("Methodology");
  methodSheet.getColumn(1).width = 25;
  methodSheet.getColumn(2).width = 60;

  const methodHeader = methodSheet.addRow(["Field", "Value"]);
  methodHeader.font = { bold: true };
  methodHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };

  if (response.methodology) {
    for (const m of response.methodology.metrics) {
      methodSheet.addRow(["Metric", m.businessName]);
      methodSheet.addRow(["Definition", m.definition]);
      if (m.numeratorConcept) methodSheet.addRow(["Numerator", m.numeratorConcept]);
      if (m.denominatorConcept) methodSheet.addRow(["Denominator", m.denominatorConcept]);
      if (m.cautionNotes) {
        const cautionRow = methodSheet.addRow(["Caution", m.cautionNotes]);
        cautionRow.getCell(2).font = { color: { argb: "FFD97706" } };
      }
      methodSheet.addRow(["", ""]); // Spacer
    }
    methodSheet.addRow(["Aggregation Level", response.methodology.aggregationLevel]);
    methodSheet.addRow(["Calculation Notes", response.methodology.calculationNotes]);
    if (response.methodology.exclusions) {
      methodSheet.addRow(["Exclusions", response.methodology.exclusions]);
    }
  }

  // ─── Sheet 3: Metadata ──────────────────────────────────────────
  const metaSheet = workbook.addWorksheet("Metadata");
  metaSheet.getColumn(1).width = 25;
  metaSheet.getColumn(2).width = 60;

  const metaHeader = metaSheet.addRow(["Field", "Value"]);
  metaHeader.font = { bold: true };
  metaHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8E8E8" },
  };

  metaSheet.addRow(["Original Question", response.request.originalQuestion]);
  metaSheet.addRow(["Analysis Type", response.request.interpretedTitle]);
  metaSheet.addRow(["Intent", response.request.interpretedIntent]);
  metaSheet.addRow(["Status", response.status]);
  metaSheet.addRow(["Generated", response.timestamp]);
  metaSheet.addRow(["", ""]); // Spacer

  // Filters
  metaSheet.addRow(["--- Filters ---", ""]);
  if (response.filtersApplied.category) metaSheet.addRow(["Category", response.filtersApplied.category]);
  if (response.filtersApplied.region) metaSheet.addRow(["Region", response.filtersApplied.region]);
  if (response.filtersApplied.market) metaSheet.addRow(["Market", response.filtersApplied.market]);
  if (response.filtersApplied.brand) metaSheet.addRow(["Brands", response.filtersApplied.brand.join(", ")]);
  if (response.filtersApplied.channel) metaSheet.addRow(["Channel", response.filtersApplied.channel]);
  if (response.filtersApplied.waveRange) {
    metaSheet.addRow(["Wave Range", `${response.filtersApplied.waveRange.from} to ${response.filtersApplied.waveRange.to} (${response.filtersApplied.waveRange.count} waves)`]);
  }
  metaSheet.addRow(["", ""]); // Spacer

  // Coverage
  if (response.dataCoverage) {
    metaSheet.addRow(["--- Data Coverage ---", ""]);
    if (response.dataCoverage.regionsIncluded.length > 0)
      metaSheet.addRow(["Regions", response.dataCoverage.regionsIncluded.join(", ")]);
    if (response.dataCoverage.marketsIncluded.length > 0)
      metaSheet.addRow(["Markets", response.dataCoverage.marketsIncluded.join(", ")]);
    if (response.dataCoverage.observationCount != null)
      metaSheet.addRow(["Observations", response.dataCoverage.observationCount]);
    metaSheet.addRow(["Source Dataset", response.dataCoverage.sourceDataset]);
    if (response.dataCoverage.missingDataNote)
      metaSheet.addRow(["Missing Data", response.dataCoverage.missingDataNote]);
  }
  metaSheet.addRow(["", ""]); // Spacer

  // Freshness
  if (response.dataFreshness) {
    metaSheet.addRow(["--- Data Freshness ---", ""]);
    metaSheet.addRow(["Last Refreshed", response.dataFreshness.lastRefreshedAt]);
    metaSheet.addRow(["Frequency", response.dataFreshness.refreshFrequency]);
    if (response.dataFreshness.isStale) {
      const staleRow = metaSheet.addRow(["Stale Warning", response.dataFreshness.staleWarning || "Data may be outdated"]);
      staleRow.getCell(2).font = { color: { argb: "FFD97706" } };
    }
  }
  metaSheet.addRow(["", ""]); // Spacer

  // Warnings
  if (response.warnings.length > 0) {
    metaSheet.addRow(["--- Warnings ---", ""]);
    for (const w of response.warnings) {
      const warnRow = metaSheet.addRow([`[${w.severity}]`, w.message]);
      if (w.severity === "CRITICAL") {
        warnRow.getCell(2).font = { color: { argb: "FFDC2626" } };
      }
    }
  }

  metaSheet.addRow(["", ""]); // Spacer
  metaSheet.addRow(["Source", "Trusted Analytics Copilot"]);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
