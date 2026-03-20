import { db } from "@/lib/db";
import { metricDefinitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MetricDefinition, DimensionName } from "@/types/metrics";

/**
 * Fetch all active metrics from the registry.
 */
export async function getActiveMetrics(): Promise<MetricDefinition[]> {
  const rows = await db
    .select()
    .from(metricDefinitions)
    .where(eq(metricDefinitions.isActive, true));

  return rows.map(mapRowToMetric);
}

/**
 * Resolve a metric by its metric_id (e.g., "brand_share").
 * Returns null if not found or inactive.
 */
export async function resolveMetric(
  metricId: string
): Promise<MetricDefinition | null> {
  const rows = await db
    .select()
    .from(metricDefinitions)
    .where(eq(metricDefinitions.metricId, metricId));

  if (rows.length === 0) return null;

  const metric = mapRowToMetric(rows[0]);
  return metric.isActive ? metric : null;
}

/**
 * Validate that a set of dimensions is allowed for a given metric.
 */
export function validateDimensions(
  metric: MetricDefinition,
  requestedDimensions: string[]
): { valid: boolean; invalidDimensions: string[] } {
  const invalidDimensions = requestedDimensions.filter(
    (dim) => !metric.allowedDimensions.includes(dim as DimensionName)
  );

  return {
    valid: invalidDimensions.length === 0,
    invalidDimensions,
  };
}

function mapRowToMetric(row: typeof metricDefinitions.$inferSelect): MetricDefinition {
  return {
    id: row.id,
    metricId: row.metricId,
    businessName: row.businessName,
    description: row.description,
    calculationType: row.calculationType as MetricDefinition["calculationType"],
    numeratorConcept: row.numeratorConcept,
    denominatorConcept: row.denominatorConcept,
    allowedDimensions: row.allowedDimensions as DimensionName[],
    allowedFilters: row.allowedFilters as string[],
    allowedChartTypes: row.allowedChartTypes as MetricDefinition["allowedChartTypes"],
    defaultGrain: row.defaultGrain,
    cautionNotes: row.cautionNotes,
    explanationCopy: row.explanationCopy,
    isActive: row.isActive,
  };
}
