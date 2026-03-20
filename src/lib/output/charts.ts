import type { ChartSpec, DataTable } from "@/types/responses";
import type { ChartType } from "@/types/metrics";
import type { IntentName } from "@/types/queries";

const INTENT_CHART_MAP: Record<IntentName, { chartType: ChartType; xField: string; xType: "CATEGORY" | "TIME" }> = {
  compare_brand_share_across_waves: { chartType: "LINE", xField: "waveName", xType: "TIME" },
  summarise_category_performance: { chartType: "BAR", xField: "categoryName", xType: "CATEGORY" },
  compare_brands_across_regions: { chartType: "BAR", xField: "regionName", xType: "CATEGORY" },
  rank_execution_gaps: { chartType: "BAR", xField: "marketName", xType: "CATEGORY" },
  show_distribution: { chartType: "BAR", xField: "marketName", xType: "CATEGORY" },
  rank_by_metric_change: { chartType: "BAR", xField: "brandName", xType: "CATEGORY" },
  compare_channels: { chartType: "BAR", xField: "channelType", xType: "CATEGORY" },
  show_top_movers: { chartType: "BAR", xField: "brandName", xType: "CATEGORY" },
};

/**
 * Generate a chart specification from query results.
 * Chart type is governed by the intent — not chosen by the AI.
 */
export function generateChartSpec(
  intentName: IntentName,
  dataTable: DataTable,
  metricLabel: string
): ChartSpec | null {
  if (dataTable.totalRows === 0) return null;

  const config = INTENT_CHART_MAP[intentName];
  if (!config) return null;

  // Find the primary numeric column for the Y axis
  const numericColumns = dataTable.columns.filter(
    (c) => c.type === "NUMBER" || c.type === "PERCENTAGE"
  );
  if (numericColumns.length === 0) return null;

  const yColumn = numericColumns[0];

  // Determine series: if there are multiple entities (e.g., brands), create series per entity
  const entityColumn = dataTable.columns.find(
    (c) => c.type === "STRING" && c.field !== config.xField
  );

  const series = entityColumn
    ? getUniqueSeries(dataTable, entityColumn.field, yColumn.field)
    : [{ name: yColumn.label, field: yColumn.field, color: null }];

  return {
    chartType: config.chartType,
    title: `${metricLabel} by ${config.xField.replace("Name", "").replace("Type", "")}`,
    xAxis: {
      label: dataTable.columns.find((c) => c.field === config.xField)?.label || config.xField,
      field: config.xField,
      type: config.xType,
    },
    yAxis: {
      label: yColumn.label,
      field: yColumn.field,
      type: "NUMERIC",
    },
    series,
    options: {
      showLegend: series.length > 1,
      showGrid: true,
      showTooltip: true,
      percentageAxis: yColumn.type === "PERCENTAGE",
    },
  };
}

function getUniqueSeries(
  dataTable: DataTable,
  entityField: string,
  valueField: string
) {
  const uniqueEntities = [
    ...new Set(dataTable.rows.map((r) => String(r[entityField]))),
  ];

  return uniqueEntities.slice(0, 10).map((name) => ({
    name,
    field: valueField,
    color: null,
  }));
}
