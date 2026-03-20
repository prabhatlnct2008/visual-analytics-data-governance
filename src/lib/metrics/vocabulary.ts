import { db } from "@/lib/db";
import { vocabularyMappings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { VocabularyMapping } from "@/types/metrics";

/**
 * Resolve a user term to its approved system term.
 * Returns the approved term if found, or the original term if no mapping exists.
 */
export async function resolveUserTerm(
  userTerm: string,
  termType?: VocabularyMapping["termType"]
): Promise<string> {
  const conditions = [
    eq(vocabularyMappings.isActive, true),
  ];

  if (termType) {
    conditions.push(eq(vocabularyMappings.termType, termType));
  }

  const rows = await db
    .select()
    .from(vocabularyMappings)
    .where(and(...conditions));

  const normalised = userTerm.toLowerCase().trim();
  const match = rows.find(
    (row) => row.userTerm.toLowerCase().trim() === normalised
  );

  return match ? match.approvedTerm : userTerm;
}

/**
 * Get all active vocabulary mappings.
 */
export async function getAllVocabularyMappings(): Promise<VocabularyMapping[]> {
  const rows = await db
    .select()
    .from(vocabularyMappings)
    .where(eq(vocabularyMappings.isActive, true));

  return rows.map((row) => ({
    id: row.id,
    userTerm: row.userTerm,
    approvedTerm: row.approvedTerm,
    termType: row.termType as VocabularyMapping["termType"],
    isActive: row.isActive,
  }));
}
