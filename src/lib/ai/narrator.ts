import { getOpenAIClient } from "./client";
import { NARRATION_PROMPT, buildNarrationMessage } from "./prompts";
import type { MetricDefinition } from "@/types/metrics";
import type { DataTable, ResponseSummary, KeyFinding } from "@/types/responses";

interface NarrationResult {
  summary: ResponseSummary;
  keyFindings: KeyFinding[];
}

/**
 * Generate a narrative summary and key findings from structured result data.
 * The AI is bounded to ONLY the data provided — no external knowledge.
 */
export async function narrateResults(
  question: string,
  intentName: string,
  dataTable: DataTable,
  metrics: MetricDefinition[]
): Promise<NarrationResult> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages: [
      {
        role: "system",
        content: NARRATION_PROMPT,
      },
      {
        role: "user",
        content: buildNarrationMessage(question, intentName, dataTable, metrics),
      },
    ],
    temperature: 0,
  });

  const text = response.choices[0]?.message?.content || "";

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: generate a basic summary from the data
    return {
      summary: {
        text: `Analysis completed with ${dataTable.totalRows} results across ${dataTable.grain}.`,
        evidenceBound: true,
      },
      keyFindings: [],
    };
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const raw = JSON.parse(jsonStr);

  return {
    summary: {
      text: raw.summary || `Analysis completed with ${dataTable.totalRows} results.`,
      evidenceBound: true,
    },
    keyFindings: (raw.keyFindings || []).slice(0, 8).map(
      (f: Record<string, unknown>) => ({
        text: f.text as string,
        metric: f.metric as string,
        direction: f.direction as KeyFinding["direction"],
        magnitude: (f.magnitude as string) || null,
        entity: (f.entity as string) || null,
        period: (f.period as string) || null,
      })
    ),
  };
}
