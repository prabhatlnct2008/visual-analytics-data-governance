import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/ai/intent";
import { narrateResults } from "@/lib/ai/narrator";
import { resolveMetric, getActiveMetrics } from "@/lib/metrics/registry";
import { resolveTemplate } from "@/lib/queries/templates";
import { validateQueryParameters } from "@/lib/queries/validation";
import { executeGovernedQuery } from "@/lib/queries/executor";
import { buildResponseEnvelope } from "@/lib/output/envelope";
import { generateChartSpec } from "@/lib/output/charts";
import { checkRateLimit, ANALYZE_RATE_LIMIT } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import type { QueryParameters } from "@/types/queries";
import type { MetricDefinition } from "@/types/metrics";

/** Timeout wrapper: rejects if a promise takes too long */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateCheck = checkRateLimit(`analyze:${ip}`, ANALYZE_RATE_LIMIT);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { status: "ERROR", error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a moment.", details: null } },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Input validation
  const body = await request.json();
  const question: string = body.question;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json(
      { status: "ERROR", error: { code: "INVALID_INPUT", message: "Please provide a question.", details: null } },
      { status: 400 }
    );
  }

  // Sanitize: limit length
  const sanitizedQuestion = question.trim().slice(0, 1000);

  try {
    // Step 1: Classify intent
    const { parsed, ambiguities, reasoning } = await withTimeout(classifyIntent(sanitizedQuestion), 30_000, "Intent classification");

    // Handle unsupported requests
    if (!parsed) {
      const activeMetrics = await getActiveMetrics();
      await logAudit(sanitizedQuestion, null, null, false, "Intent could not be mapped to an approved analysis type.");

      return NextResponse.json({
        id: crypto.randomUUID(),
        status: "UNSUPPORTED",
        timestamp: new Date().toISOString(),
        request: { originalQuestion: sanitizedQuestion },
        reason: "This question could not be mapped to an approved analysis type.",
        unsupportedElements: [reasoning],
        suggestions: [
          "Show brand share change for spirits in Dubai across the last 3 waves",
          "Summarise category performance for Heathrow",
          "Where are the biggest execution gaps?",
        ],
        availableMetrics: activeMetrics.map((m) => m.businessName),
        availableDimensions: ["category", "brand", "region", "market", "channel", "wave"],
      });
    }

    // Handle ambiguities that need clarification
    if (ambiguities && ambiguities.length > 0 && parsed.confidence < 0.7) {
      await logAudit(sanitizedQuestion, parsed.intentName, parsed.metrics, false, null);

      return NextResponse.json({
        id: crypto.randomUUID(),
        status: "CLARIFICATION_NEEDED",
        timestamp: new Date().toISOString(),
        request: { originalQuestion: sanitizedQuestion },
        clarification: {
          question: "Your question could be interpreted in multiple ways. Please clarify:",
          options: ambiguities.map((a) => ({
            label: a,
            value: a,
            description: a,
          })),
        },
      });
    }

    // Step 2: Resolve metrics
    const resolvedMetrics: MetricDefinition[] = [];
    for (const metricId of parsed.metrics) {
      const metric = await resolveMetric(metricId);
      if (metric) resolvedMetrics.push(metric);
    }

    // If no metrics resolved, use a default based on intent
    if (resolvedMetrics.length === 0) {
      const defaultMetric = await resolveMetric(getDefaultMetricForIntent(parsed.intentName));
      if (defaultMetric) resolvedMetrics.push(defaultMetric);
    }

    // Step 3: Build query parameters
    const queryParams: QueryParameters = {
      intentName: parsed.intentName,
      metricIds: resolvedMetrics.map((m) => m.metricId),
      filters: parsed.filters,
      groupings: parsed.groupings,
      timeScope: parsed.timeScope,
    };

    // Step 4: Validate
    const validation = await validateQueryParameters(queryParams);
    if (!validation.isValid) {
      await logAudit(sanitizedQuestion, parsed.intentName, parsed.metrics, false, validation.errors.map((e) => e.message).join("; "));

      return NextResponse.json({
        id: crypto.randomUUID(),
        status: "ERROR",
        timestamp: new Date().toISOString(),
        request: { originalQuestion: sanitizedQuestion },
        error: {
          code: "VALIDATION_FAILED",
          message: validation.errors.map((e) => e.message).join(" "),
          details: null,
        },
        warnings: validation.warnings,
      });
    }

    // Step 5: Execute governed query (timeout: 15s)
    const dataTable = await withTimeout(
      executeGovernedQuery(queryParams),
      15_000,
      "Database query"
    );

    // Step 6: Generate narration (timeout: 30s)
    const { summary, keyFindings } = await withTimeout(
      narrateResults(sanitizedQuestion, parsed.intentName, dataTable, resolvedMetrics),
      30_000,
      "Result narration"
    );

    // Step 7: Generate chart spec
    const chart = generateChartSpec(
      parsed.intentName,
      dataTable,
      resolvedMetrics[0]?.businessName || "Metric"
    );

    // Step 8: Build response envelope
    const template = await resolveTemplate(parsed.intentName);
    const response = buildResponseEnvelope({
      question: sanitizedQuestion,
      intentName: parsed.intentName,
      intentTitle: template?.displayName || parsed.intentName,
      params: queryParams,
      dataTable,
      summary,
      keyFindings,
      metrics: resolvedMetrics,
      chart,
      warnings: validation.warnings.map((w) => ({
        type: "SCOPE_LIMIT" as const,
        message: w.message,
        severity: "INFO" as const,
      })),
      coverageData: {
        regionsIncluded: parsed.filters.region ? [parsed.filters.region] : [],
        marketsIncluded: parsed.filters.market ? [parsed.filters.market] : [],
        wavesIncluded: [],
        storeCount: null,
        observationCount: dataTable.totalRows,
      },
      freshness: {
        lastRefreshedAt: new Date().toISOString(),
        refreshFrequency: "Quarterly",
      },
    });

    // Step 9: Audit log
    await logAudit(sanitizedQuestion, parsed.intentName, parsed.metrics, true, null);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    await logAudit(sanitizedQuestion, null, null, false, String(error));

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        status: "ERROR",
        timestamp: new Date().toISOString(),
        request: { originalQuestion: sanitizedQuestion },
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while processing your question. Please try again.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

function getDefaultMetricForIntent(intentName: string): string {
  const defaults: Record<string, string> = {
    compare_brand_share_across_waves: "brand_share",
    summarise_category_performance: "category_performance",
    compare_brands_across_regions: "brand_share",
    rank_execution_gaps: "rate_of_execution",
    show_distribution: "distribution",
    rank_by_metric_change: "facings",
    compare_channels: "brand_share",
    show_top_movers: "facings",
  };
  return defaults[intentName] || "brand_share";
}

async function logAudit(
  question: string,
  intent: string | null,
  metrics: string[] | null,
  success: boolean,
  blockReason: string | null
) {
  try {
    await db.insert(auditLog).values({
      actionType: success ? "QUERY" : "BLOCKED",
      originalQuestion: question,
      resolvedIntent: intent,
      resolvedMetrics: metrics,
      wasSuccessful: success,
      blockReason,
    });
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}
