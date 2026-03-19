import { db } from "@/lib/db";
import {
  factObservations,
  dimWaves,
  dimRegions,
  dimMarkets,
  dimStores,
  dimCategories,
  dimBrands,
  dimSkus,
} from "@/lib/db/schema";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import type { QueryParameters } from "@/types/queries";
import type { DataTable, ColumnDef } from "@/types/responses";

/**
 * Execute a governed query based on validated parameters.
 * This is the single entry point for all data retrieval.
 * All queries are parameterised — no string interpolation of user input.
 */
export async function executeGovernedQuery(
  params: QueryParameters
): Promise<DataTable> {
  // Build the query based on the intent
  switch (params.intentName) {
    case "compare_brand_share_across_waves":
      return executeBrandShareComparison(params);
    case "summarise_category_performance":
      return executeCategoryPerformanceSummary(params);
    case "compare_brands_across_regions":
      return executeBrandRegionComparison(params);
    case "rank_execution_gaps":
      return executeExecutionGapRanking(params);
    case "show_distribution":
      return executeDistributionQuery(params);
    case "rank_by_metric_change":
      return executeMetricChangeRanking(params);
    case "compare_channels":
      return executeChannelComparison(params);
    case "show_top_movers":
      return executeTopMovers(params);
    default:
      throw new Error(`Unsupported intent: ${params.intentName}`);
  }
}

// ─── Query Builders ──────────────────────────────────────────────────────────

async function executeBrandShareComparison(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      brandName: dimBrands.brandName,
      waveName: dimWaves.waveName,
      waveNumber: dimWaves.waveNumber,
      totalFacings: sql<number>`sum(${factObservations.facings})`,
      categoryFacings: sql<number>`sum(sum(${factObservations.facings})) over (partition by ${dimWaves.id})`,
    })
    .from(factObservations)
    .innerJoin(dimBrands, eq(factObservations.brandId, dimBrands.id))
    .innerJoin(dimWaves, eq(factObservations.waveId, dimWaves.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .where(and(...conditions))
    .groupBy(dimBrands.brandName, dimWaves.waveName, dimWaves.waveNumber, dimWaves.id)
    .orderBy(asc(dimWaves.waveNumber), desc(sql`sum(${factObservations.facings})`));

  const columns: ColumnDef[] = [
    { field: "brandName", label: "Brand", type: "STRING", format: null, isSortable: true },
    { field: "waveName", label: "Wave", type: "STRING", format: null, isSortable: true },
    { field: "brandShare", label: "Brand Share", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "totalFacings", label: "Facings", type: "NUMBER", format: "#,##0", isSortable: true },
  ];

  const mappedRows = rows.map((row) => ({
    brandName: row.brandName,
    waveName: row.waveName,
    brandShare: row.categoryFacings > 0 ? row.totalFacings / row.categoryFacings : 0,
    totalFacings: row.totalFacings,
  }));

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "brand × wave",
  };
}

async function executeCategoryPerformanceSummary(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      categoryName: dimCategories.categoryName,
      totalFacings: sql<number>`sum(${factObservations.facings})`,
      totalStores: sql<number>`count(distinct ${factObservations.storeId})`,
      presentCount: sql<number>`count(case when ${factObservations.isPresent} then 1 end)`,
      totalObservations: sql<number>`count(*)`,
      compliantCount: sql<number>`count(case when ${factObservations.isCompliant} then 1 end)`,
    })
    .from(factObservations)
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .where(and(...conditions))
    .groupBy(dimCategories.categoryName)
    .orderBy(desc(sql`sum(${factObservations.facings})`));

  const columns: ColumnDef[] = [
    { field: "categoryName", label: "Category", type: "STRING", format: null, isSortable: true },
    { field: "totalFacings", label: "Total Facings", type: "NUMBER", format: "#,##0", isSortable: true },
    { field: "distribution", label: "Distribution", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "executionRate", label: "Execution Rate", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "storeCount", label: "Stores", type: "NUMBER", format: "#,##0", isSortable: true },
  ];

  const mappedRows = rows.map((row) => ({
    categoryName: row.categoryName,
    totalFacings: row.totalFacings,
    distribution: row.totalObservations > 0 ? row.presentCount / row.totalObservations : 0,
    executionRate: row.totalObservations > 0 ? row.compliantCount / row.totalObservations : 0,
    storeCount: row.totalStores,
  }));

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "category",
  };
}

async function executeBrandRegionComparison(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      brandName: dimBrands.brandName,
      regionName: dimRegions.regionName,
      totalFacings: sql<number>`sum(${factObservations.facings})`,
      presentCount: sql<number>`count(case when ${factObservations.isPresent} then 1 end)`,
      totalObservations: sql<number>`count(*)`,
    })
    .from(factObservations)
    .innerJoin(dimBrands, eq(factObservations.brandId, dimBrands.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .where(and(...conditions))
    .groupBy(dimBrands.brandName, dimRegions.regionName)
    .orderBy(dimBrands.brandName, dimRegions.regionName);

  const columns: ColumnDef[] = [
    { field: "brandName", label: "Brand", type: "STRING", format: null, isSortable: true },
    { field: "regionName", label: "Region", type: "STRING", format: null, isSortable: true },
    { field: "totalFacings", label: "Facings", type: "NUMBER", format: "#,##0", isSortable: true },
    { field: "distribution", label: "Distribution", type: "PERCENTAGE", format: "0.1%", isSortable: true },
  ];

  const mappedRows = rows.map((row) => ({
    brandName: row.brandName,
    regionName: row.regionName,
    totalFacings: row.totalFacings,
    distribution: row.totalObservations > 0 ? row.presentCount / row.totalObservations : 0,
  }));

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "brand × region",
  };
}

async function executeExecutionGapRanking(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      marketName: dimMarkets.marketName,
      categoryName: dimCategories.categoryName,
      compliantCount: sql<number>`count(case when ${factObservations.isCompliant} then 1 end)`,
      totalObservations: sql<number>`count(*)`,
    })
    .from(factObservations)
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .where(and(...conditions))
    .groupBy(dimMarkets.marketName, dimCategories.categoryName)
    .orderBy(asc(sql`count(case when ${factObservations.isCompliant} then 1 end)::float / nullif(count(*), 0)`));

  const columns: ColumnDef[] = [
    { field: "marketName", label: "Market", type: "STRING", format: null, isSortable: true },
    { field: "categoryName", label: "Category", type: "STRING", format: null, isSortable: true },
    { field: "executionRate", label: "Execution Rate", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "gapSize", label: "Gap from 100%", type: "PERCENTAGE", format: "0.1%", isSortable: true },
  ];

  const mappedRows = rows.map((row) => {
    const rate = row.totalObservations > 0 ? row.compliantCount / row.totalObservations : 0;
    return {
      marketName: row.marketName,
      categoryName: row.categoryName,
      executionRate: rate,
      gapSize: 1 - rate,
    };
  });

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "market × category",
  };
}

async function executeDistributionQuery(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      brandName: dimBrands.brandName,
      marketName: dimMarkets.marketName,
      presentCount: sql<number>`count(case when ${factObservations.isPresent} then 1 end)`,
      totalObservations: sql<number>`count(*)`,
      storeCount: sql<number>`count(distinct ${factObservations.storeId})`,
    })
    .from(factObservations)
    .innerJoin(dimBrands, eq(factObservations.brandId, dimBrands.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .where(and(...conditions))
    .groupBy(dimBrands.brandName, dimMarkets.marketName)
    .orderBy(desc(sql`count(case when ${factObservations.isPresent} then 1 end)::float / nullif(count(*), 0)`));

  const columns: ColumnDef[] = [
    { field: "brandName", label: "Brand", type: "STRING", format: null, isSortable: true },
    { field: "marketName", label: "Market", type: "STRING", format: null, isSortable: true },
    { field: "distribution", label: "Distribution", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "storeCount", label: "Stores Covered", type: "NUMBER", format: "#,##0", isSortable: true },
  ];

  const mappedRows = rows.map((row) => ({
    brandName: row.brandName,
    marketName: row.marketName,
    distribution: row.totalObservations > 0 ? row.presentCount / row.totalObservations : 0,
    storeCount: row.storeCount,
  }));

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "brand × market",
  };
}

async function executeMetricChangeRanking(
  params: QueryParameters
): Promise<DataTable> {
  // Simplified: compare first and last wave in scope
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      brandName: dimBrands.brandName,
      waveName: dimWaves.waveName,
      waveNumber: dimWaves.waveNumber,
      totalFacings: sql<number>`sum(${factObservations.facings})`,
    })
    .from(factObservations)
    .innerJoin(dimBrands, eq(factObservations.brandId, dimBrands.id))
    .innerJoin(dimWaves, eq(factObservations.waveId, dimWaves.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .where(and(...conditions))
    .groupBy(dimBrands.brandName, dimWaves.waveName, dimWaves.waveNumber)
    .orderBy(dimBrands.brandName, asc(dimWaves.waveNumber));

  // Compute change between first and last wave per brand
  const brandMap = new Map<string, { first: number; last: number; firstWave: string; lastWave: string }>();
  for (const row of rows) {
    const existing = brandMap.get(row.brandName);
    if (!existing) {
      brandMap.set(row.brandName, {
        first: row.totalFacings,
        last: row.totalFacings,
        firstWave: row.waveName,
        lastWave: row.waveName,
      });
    } else {
      existing.last = row.totalFacings;
      existing.lastWave = row.waveName;
    }
  }

  const columns: ColumnDef[] = [
    { field: "brandName", label: "Brand", type: "STRING", format: null, isSortable: true },
    { field: "firstWaveValue", label: "Start Value", type: "NUMBER", format: "#,##0", isSortable: true },
    { field: "lastWaveValue", label: "End Value", type: "NUMBER", format: "#,##0", isSortable: true },
    { field: "change", label: "Change", type: "NUMBER", format: "+#,##0;-#,##0", isSortable: true },
    { field: "changePercent", label: "Change %", type: "PERCENTAGE", format: "+0.1%;-0.1%", isSortable: true },
  ];

  const mappedRows = Array.from(brandMap.entries())
    .map(([brandName, data]) => ({
      brandName,
      firstWaveValue: data.first,
      lastWaveValue: data.last,
      change: data.last - data.first,
      changePercent: data.first > 0 ? (data.last - data.first) / data.first : 0,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    columns,
    rows: params.limit ? mappedRows.slice(0, params.limit) : mappedRows,
    totalRows: mappedRows.length,
    grain: "brand",
  };
}

async function executeChannelComparison(
  params: QueryParameters
): Promise<DataTable> {
  const conditions = buildBaseConditions(params);

  const rows = await db
    .select({
      channelType: dimStores.channelType,
      brandName: dimBrands.brandName,
      totalFacings: sql<number>`sum(${factObservations.facings})`,
      presentCount: sql<number>`count(case when ${factObservations.isPresent} then 1 end)`,
      totalObservations: sql<number>`count(*)`,
      compliantCount: sql<number>`count(case when ${factObservations.isCompliant} then 1 end)`,
    })
    .from(factObservations)
    .innerJoin(dimStores, eq(factObservations.storeId, dimStores.id))
    .innerJoin(dimBrands, eq(factObservations.brandId, dimBrands.id))
    .innerJoin(dimCategories, eq(factObservations.categoryId, dimCategories.id))
    .innerJoin(dimMarkets, eq(factObservations.marketId, dimMarkets.id))
    .innerJoin(dimRegions, eq(dimMarkets.regionId, dimRegions.id))
    .where(and(...conditions))
    .groupBy(dimStores.channelType, dimBrands.brandName)
    .orderBy(dimStores.channelType, desc(sql`sum(${factObservations.facings})`));

  const columns: ColumnDef[] = [
    { field: "channelType", label: "Channel", type: "STRING", format: null, isSortable: true },
    { field: "brandName", label: "Brand", type: "STRING", format: null, isSortable: true },
    { field: "totalFacings", label: "Facings", type: "NUMBER", format: "#,##0", isSortable: true },
    { field: "distribution", label: "Distribution", type: "PERCENTAGE", format: "0.1%", isSortable: true },
    { field: "executionRate", label: "Execution Rate", type: "PERCENTAGE", format: "0.1%", isSortable: true },
  ];

  const mappedRows = rows.map((row) => ({
    channelType: row.channelType,
    brandName: row.brandName,
    totalFacings: row.totalFacings,
    distribution: row.totalObservations > 0 ? row.presentCount / row.totalObservations : 0,
    executionRate: row.totalObservations > 0 ? row.compliantCount / row.totalObservations : 0,
  }));

  return {
    columns,
    rows: mappedRows,
    totalRows: mappedRows.length,
    grain: "channel × brand",
  };
}

async function executeTopMovers(
  params: QueryParameters
): Promise<DataTable> {
  // Reuse the metric change ranking with a default limit
  const limitedParams = { ...params, limit: params.limit ?? 10 };
  return executeMetricChangeRanking(limitedParams);
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

function buildBaseConditions(params: QueryParameters) {
  const conditions: ReturnType<typeof eq>[] = [];

  if (params.filters.category) {
    conditions.push(
      sql`lower(${dimCategories.categoryName}) = lower(${params.filters.category})` as unknown as ReturnType<typeof eq>
    );
  }

  if (params.filters.brands && params.filters.brands.length > 0) {
    conditions.push(
      inArray(dimBrands.brandName, params.filters.brands) as unknown as ReturnType<typeof eq>
    );
  }

  if (params.filters.region) {
    conditions.push(
      sql`lower(${dimRegions.regionName}) = lower(${params.filters.region})` as unknown as ReturnType<typeof eq>
    );
  }

  if (params.filters.market) {
    conditions.push(
      sql`lower(${dimMarkets.marketName}) = lower(${params.filters.market})` as unknown as ReturnType<typeof eq>
    );
  }

  if (params.filters.channel) {
    conditions.push(
      sql`lower(${dimStores.channelType}) = lower(${params.filters.channel})` as unknown as ReturnType<typeof eq>
    );
  }

  return conditions;
}
