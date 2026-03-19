import { getAnthropicClient } from "./client";
import {
  INTENT_CLASSIFICATION_PROMPT,
  buildIntentClassificationMessage,
} from "./prompts";
import type { IntentName, ParsedIntent, QueryFilters } from "@/types/queries";

interface RawIntentResponse {
  intent: string | null;
  confidence: number;
  metrics: string[];
  filters: {
    category?: string | null;
    brands?: string[] | null;
    region?: string | null;
    market?: string | null;
    channel?: string | null;
  };
  groupings: string[];
  timeScope: { waveCount?: number | null } | null;
  ambiguities: string[] | null;
  reasoning: string;
}

const VALID_INTENTS: IntentName[] = [
  "compare_brand_share_across_waves",
  "summarise_category_performance",
  "compare_brands_across_regions",
  "rank_execution_gaps",
  "show_distribution",
  "rank_by_metric_change",
  "compare_channels",
  "show_top_movers",
];

/**
 * Classify user intent using Claude API.
 * Returns null if the question cannot be mapped to an approved intent.
 */
export async function classifyIntent(
  question: string
): Promise<{ parsed: ParsedIntent | null; ambiguities: string[] | null; reasoning: string }> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: INTENT_CLASSIFICATION_PROMPT,
    messages: [
      {
        role: "user",
        content: buildIntentClassificationMessage(question),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { parsed: null, ambiguities: null, reasoning: "Failed to parse AI response" };
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const raw: RawIntentResponse = JSON.parse(jsonStr);

  // Validate the intent is in our approved list
  if (!raw.intent || !VALID_INTENTS.includes(raw.intent as IntentName)) {
    return {
      parsed: null,
      ambiguities: raw.ambiguities,
      reasoning: raw.reasoning,
    };
  }

  const filters: QueryFilters = {};
  if (raw.filters.category) filters.category = raw.filters.category;
  if (raw.filters.brands) filters.brands = raw.filters.brands;
  if (raw.filters.region) filters.region = raw.filters.region;
  if (raw.filters.market) filters.market = raw.filters.market;
  if (raw.filters.channel) filters.channel = raw.filters.channel;

  const parsed: ParsedIntent = {
    intentName: raw.intent as IntentName,
    confidence: raw.confidence,
    metrics: raw.metrics,
    filters,
    groupings: raw.groupings,
    timeScope: raw.timeScope?.waveCount
      ? { waveCount: raw.timeScope.waveCount }
      : null,
  };

  return {
    parsed,
    ambiguities: raw.ambiguities,
    reasoning: raw.reasoning,
  };
}
