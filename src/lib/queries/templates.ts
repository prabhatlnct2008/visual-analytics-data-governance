import { db } from "@/lib/db";
import { queryTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { IntentName, QueryTemplate } from "@/types/queries";

/**
 * Resolve a query template by intent name.
 */
export async function resolveTemplate(
  intentName: IntentName
): Promise<QueryTemplate | null> {
  const rows = await db
    .select()
    .from(queryTemplates)
    .where(eq(queryTemplates.intentName, intentName));

  if (rows.length === 0) return null;

  const row = rows[0];
  if (!row.isActive) return null;

  return mapRowToTemplate(row);
}

/**
 * Get all active query templates.
 */
export async function getActiveTemplates(): Promise<QueryTemplate[]> {
  const rows = await db
    .select()
    .from(queryTemplates)
    .where(eq(queryTemplates.isActive, true));

  return rows.map(mapRowToTemplate);
}

function mapRowToTemplate(
  row: typeof queryTemplates.$inferSelect
): QueryTemplate {
  return {
    id: row.id,
    intentName: row.intentName as IntentName,
    displayName: row.displayName,
    description: row.description,
    requiredInputs: row.requiredInputs as string[],
    optionalInputs: row.optionalInputs as string[],
    supportedMetrics: row.supportedMetrics as string[],
    supportedFilters: row.supportedFilters as string[],
    supportedGroupings: row.supportedGroupings as string[],
    resultGrain: row.resultGrain,
    builderKey: row.builderKey,
    isActive: row.isActive,
  };
}
