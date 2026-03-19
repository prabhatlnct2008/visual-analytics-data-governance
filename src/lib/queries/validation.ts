import { resolveMetric, validateDimensions } from "@/lib/metrics/registry";
import type {
  QueryParameters,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "@/types/queries";

/**
 * Validate query parameters before execution.
 * Checks metric existence, dimension compatibility, filter validity, and scope.
 */
export async function validateQueryParameters(
  params: QueryParameters
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate each metric exists and is active
  for (const metricId of params.metricIds) {
    const metric = await resolveMetric(metricId);
    if (!metric) {
      errors.push({
        field: "metricIds",
        message: `Metric "${metricId}" is not available in the approved metric library.`,
        suggestions: [],
      });
      continue;
    }

    // Validate dimensions are allowed for this metric
    const dimResult = validateDimensions(metric, params.groupings);
    if (!dimResult.valid) {
      errors.push({
        field: "groupings",
        message: `Dimensions [${dimResult.invalidDimensions.join(", ")}] are not supported for metric "${metric.businessName}".`,
        suggestions: metric.allowedDimensions,
      });
    }
  }

  // Validate time scope for comparison intents
  const comparisonIntents = [
    "compare_brand_share_across_waves",
    "rank_by_metric_change",
    "show_top_movers",
  ];
  if (comparisonIntents.includes(params.intentName) && !params.timeScope) {
    errors.push({
      field: "timeScope",
      message: "This analysis requires a time scope with at least 2 waves for comparison.",
    });
  }

  // Validate scope is not too broad
  const hasGeographyFilter =
    params.filters.region || params.filters.market;
  const hasCategoryFilter = params.filters.category;
  if (!hasGeographyFilter && !hasCategoryFilter) {
    warnings.push({
      field: "filters",
      message:
        "No geography or category filter applied. Results may be very broad. Consider narrowing scope.",
    });
  }

  // Validate incompatible dimension combinations
  if (
    params.filters.skus &&
    params.filters.skus.length > 0 &&
    !params.filters.category &&
    !params.filters.brands
  ) {
    warnings.push({
      field: "filters",
      message:
        "SKU-level analysis without a category or brand filter may produce overly broad results.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
