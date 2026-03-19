import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // ─── Regions ───────────────────────────────────────────────────────
  const [mena, asia, europe] = await db
    .insert(schema.dimRegions)
    .values([
      { regionName: "MENA", regionCode: "MENA" },
      { regionName: "Asia", regionCode: "ASIA" },
      { regionName: "Europe", regionCode: "EUR" },
    ])
    .returning();

  // ─── Markets ───────────────────────────────────────────────────────
  const [dubai, abuDhabi, singapore, heathrow, paris] = await db
    .insert(schema.dimMarkets)
    .values([
      { regionId: mena.id, marketName: "Dubai", marketCode: "DXB", marketType: "AIRPORT" },
      { regionId: mena.id, marketName: "Abu Dhabi", marketCode: "AUH", marketType: "AIRPORT" },
      { regionId: asia.id, marketName: "Singapore", marketCode: "SIN", marketType: "AIRPORT" },
      { regionId: europe.id, marketName: "Heathrow", marketCode: "LHR", marketType: "AIRPORT" },
      { regionId: europe.id, marketName: "Paris CDG", marketCode: "CDG", marketType: "AIRPORT" },
    ])
    .returning();

  // ─── Stores ────────────────────────────────────────────────────────
  const stores = await db
    .insert(schema.dimStores)
    .values([
      { marketId: dubai.id, storeName: "Dubai DF Terminal 1", storeCode: "DXB-DF-T1", channelType: "DUTY_FREE" },
      { marketId: dubai.id, storeName: "Dubai DF Terminal 3", storeCode: "DXB-DF-T3", channelType: "DUTY_FREE" },
      { marketId: abuDhabi.id, storeName: "Abu Dhabi DF Main", storeCode: "AUH-DF-01", channelType: "DUTY_FREE" },
      { marketId: singapore.id, storeName: "Changi DFS T1", storeCode: "SIN-DFS-T1", channelType: "DUTY_FREE" },
      { marketId: singapore.id, storeName: "Changi DFS T3", storeCode: "SIN-DFS-T3", channelType: "DUTY_FREE" },
      { marketId: heathrow.id, storeName: "Heathrow WHSmith T5", storeCode: "LHR-WH-T5", channelType: "TRAVEL_RETAIL" },
      { marketId: heathrow.id, storeName: "Heathrow DF T5", storeCode: "LHR-DF-T5", channelType: "DUTY_FREE" },
      { marketId: paris.id, storeName: "CDG Buy Paris T2E", storeCode: "CDG-BP-T2E", channelType: "DUTY_FREE" },
    ])
    .returning();

  // ─── Categories ────────────────────────────────────────────────────
  const [spirits, wine, beer, tobacco] = await db
    .insert(schema.dimCategories)
    .values([
      { categoryName: "Spirits", categoryCode: "SPIRITS" },
      { categoryName: "Wine", categoryCode: "WINE" },
      { categoryName: "Beer", categoryCode: "BEER" },
      { categoryName: "Tobacco", categoryCode: "TOBACCO" },
    ])
    .returning();

  // ─── Brands ────────────────────────────────────────────────────────
  const brands = await db
    .insert(schema.dimBrands)
    .values([
      { categoryId: spirits.id, brandName: "Johnnie Walker", brandCode: "JW", brandOwner: "Diageo" },
      { categoryId: spirits.id, brandName: "Jack Daniels", brandCode: "JD", brandOwner: "Brown-Forman" },
      { categoryId: spirits.id, brandName: "Absolut", brandCode: "ABS", brandOwner: "Pernod Ricard" },
      { categoryId: spirits.id, brandName: "Hennessy", brandCode: "HEN", brandOwner: "LVMH" },
      { categoryId: wine.id, brandName: "Moët & Chandon", brandCode: "MOET", brandOwner: "LVMH" },
      { categoryId: wine.id, brandName: "Penfolds", brandCode: "PEN", brandOwner: "TWE" },
      { categoryId: beer.id, brandName: "Heineken", brandCode: "HEIN", brandOwner: "Heineken NV" },
      { categoryId: beer.id, brandName: "Corona", brandCode: "COR", brandOwner: "AB InBev" },
      { categoryId: tobacco.id, brandName: "Marlboro", brandCode: "MARL", brandOwner: "Philip Morris" },
      { categoryId: tobacco.id, brandName: "Camel", brandCode: "CAM", brandOwner: "JTI" },
    ])
    .returning();

  // ─── SKUs ──────────────────────────────────────────────────────────
  const skus = await db
    .insert(schema.dimSkus)
    .values([
      { brandId: brands[0].id, skuName: "Johnnie Walker Black Label 1L", skuCode: "JW-BL-1L", sizeMl: 1000, variant: "Black Label" },
      { brandId: brands[0].id, skuName: "Johnnie Walker Blue Label 750ml", skuCode: "JW-BLUE-750", sizeMl: 750, variant: "Blue Label" },
      { brandId: brands[1].id, skuName: "Jack Daniels Old No.7 1L", skuCode: "JD-ON7-1L", sizeMl: 1000, variant: "Old No.7" },
      { brandId: brands[2].id, skuName: "Absolut Original 1L", skuCode: "ABS-OG-1L", sizeMl: 1000, variant: "Original" },
      { brandId: brands[3].id, skuName: "Hennessy VS 700ml", skuCode: "HEN-VS-700", sizeMl: 700, variant: "VS" },
      { brandId: brands[4].id, skuName: "Moët Impérial 750ml", skuCode: "MOET-IMP-750", sizeMl: 750, variant: "Impérial" },
      { brandId: brands[5].id, skuName: "Penfolds Bin 389 750ml", skuCode: "PEN-389-750", sizeMl: 750, variant: "Bin 389" },
      { brandId: brands[6].id, skuName: "Heineken Original 330ml 6pk", skuCode: "HEIN-OG-6PK", sizeMl: 330, variant: "Original" },
      { brandId: brands[7].id, skuName: "Corona Extra 330ml 6pk", skuCode: "COR-EX-6PK", sizeMl: 330, variant: "Extra" },
      { brandId: brands[8].id, skuName: "Marlboro Gold KS", skuCode: "MARL-G-KS", variant: "Gold" },
      { brandId: brands[9].id, skuName: "Camel Blue KS", skuCode: "CAM-B-KS", variant: "Blue" },
    ])
    .returning();

  // ─── Waves ─────────────────────────────────────────────────────────
  const waves = await db
    .insert(schema.dimWaves)
    .values([
      { waveName: "Wave 1 2024", waveNumber: 1, startDate: "2024-01-01", endDate: "2024-03-31" },
      { waveName: "Wave 2 2024", waveNumber: 2, startDate: "2024-04-01", endDate: "2024-06-30" },
      { waveName: "Wave 3 2024", waveNumber: 3, startDate: "2024-07-01", endDate: "2024-09-30" },
      { waveName: "Wave 4 2024", waveNumber: 4, startDate: "2024-10-01", endDate: "2024-12-31" },
      { waveName: "Wave 1 2025", waveNumber: 5, startDate: "2025-01-01", endDate: "2025-03-31" },
    ])
    .returning();

  // ─── Fact Observations ─────────────────────────────────────────────
  console.log("Generating observations...");
  const observations = [];

  for (const wave of waves) {
    for (const store of stores) {
      for (const sku of skus) {
        const brand = brands.find((b) => b.id === sku.brandId)!;
        const category = [spirits, wine, beer, tobacco].find((c) => c.id === brand.categoryId)!;
        const market = [dubai, abuDhabi, singapore, heathrow, paris].find((m) => m.id === store.marketId)!;

        observations.push({
          waveId: wave.id,
          marketId: market.id,
          storeId: store.id,
          categoryId: category.id,
          brandId: brand.id,
          skuId: sku.id,
          facings: Math.floor(Math.random() * 8) + 1,
          shelfSpaceCm: String((Math.random() * 50 + 10).toFixed(2)),
          isPresent: Math.random() > 0.15,
          isCompliant: Math.random() > 0.25,
          priceLocal: String((Math.random() * 100 + 10).toFixed(2)),
          positionScore: Math.floor(Math.random() * 5) + 1,
        });
      }
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < observations.length; i += 100) {
    const batch = observations.slice(i, i + 100);
    await db.insert(schema.factObservations).values(batch);
  }
  console.log(`Inserted ${observations.length} observations`);

  // ─── Metric Definitions ────────────────────────────────────────────
  await db.insert(schema.metricDefinitions).values([
    {
      metricId: "brand_share",
      businessName: "Brand Share",
      description: "Brand's share within a category, calculated as brand facings divided by total category facings within the same scope.",
      calculationType: "RATIO",
      numeratorConcept: "Sum of facings for the brand",
      denominatorConcept: "Sum of facings for the entire category",
      allowedDimensions: ["category", "brand", "region", "market", "wave", "channel"],
      allowedFilters: ["category", "brand", "region", "market", "wave", "channel"],
      allowedChartTypes: ["LINE", "BAR", "STACKED_BAR"],
      defaultGrain: "brand × wave",
      cautionNotes: "Brand share is based on facings count, not shelf space. Do not compare across categories.",
      explanationCopy: "Brand Share is calculated as the sum of a brand's facings divided by the total category facings within the same wave, market, and store scope.",
    },
    {
      metricId: "share_of_shelf",
      businessName: "Share of Shelf",
      description: "Proportion of total shelf space (in cm) occupied by a brand or category.",
      calculationType: "RATIO",
      numeratorConcept: "Sum of shelf space (cm) for the brand",
      denominatorConcept: "Sum of shelf space (cm) for the entire category",
      allowedDimensions: ["category", "brand", "region", "market", "wave"],
      allowedFilters: ["category", "brand", "region", "market", "wave"],
      allowedChartTypes: ["LINE", "BAR", "STACKED_BAR"],
      defaultGrain: "brand × wave",
      cautionNotes: "Based on measured shelf space in centimetres.",
      explanationCopy: "Share of Shelf is calculated as the sum of a brand's shelf space divided by the total category shelf space within the same scope.",
    },
    {
      metricId: "facings",
      businessName: "Facings",
      description: "Total number of product facings observed on shelf.",
      calculationType: "SUM",
      numeratorConcept: "Count of product facings",
      denominatorConcept: null,
      allowedDimensions: ["category", "brand", "sku", "region", "market", "wave", "store", "channel"],
      allowedFilters: ["category", "brand", "sku", "region", "market", "wave", "channel"],
      allowedChartTypes: ["LINE", "BAR"],
      defaultGrain: "brand × wave",
      cautionNotes: "Facings are additive across stores but NOT across waves (would double-count).",
      explanationCopy: "Facings represents the total number of product facings observed on shelf within the selected scope.",
    },
    {
      metricId: "distribution",
      businessName: "Distribution",
      description: "Percentage of stores where the brand/SKU is present.",
      calculationType: "RATIO",
      numeratorConcept: "Number of stores where product is present",
      denominatorConcept: "Total number of stores surveyed",
      allowedDimensions: ["category", "brand", "sku", "region", "market", "wave"],
      allowedFilters: ["category", "brand", "sku", "region", "market", "wave"],
      allowedChartTypes: ["BAR", "HEATMAP"],
      defaultGrain: "brand × market",
      cautionNotes: "Distribution percentages cannot be simply averaged across regions — must recalculate from raw counts.",
      explanationCopy: "Distribution is calculated as the number of stores where the product was present divided by the total stores surveyed in the scope.",
    },
    {
      metricId: "rate_of_execution",
      businessName: "Rate of Execution",
      description: "Compliance percentage — proportion of observations meeting planogram or execution standards.",
      calculationType: "RATIO",
      numeratorConcept: "Number of compliant observations",
      denominatorConcept: "Total observations",
      allowedDimensions: ["category", "brand", "region", "market", "wave", "channel", "store"],
      allowedFilters: ["category", "brand", "region", "market", "wave", "channel"],
      allowedChartTypes: ["BAR", "HEATMAP"],
      defaultGrain: "market × category",
      cautionNotes: "Execution compliance is binary per observation. Low sample sizes may affect reliability.",
      explanationCopy: "Rate of Execution is calculated as the proportion of observations that met compliance standards within the selected scope.",
    },
    {
      metricId: "sku_presence",
      businessName: "SKU Presence",
      description: "Whether specific SKUs are present at surveyed locations.",
      calculationType: "RATIO",
      numeratorConcept: "SKU present observations",
      denominatorConcept: "Total SKU observations",
      allowedDimensions: ["brand", "sku", "region", "market", "wave", "store"],
      allowedFilters: ["brand", "sku", "region", "market", "wave"],
      allowedChartTypes: ["BAR", "HEATMAP"],
      defaultGrain: "sku × market",
      cautionNotes: "Presence is binary per observation. Aggregation shows percentage of stores with presence.",
      explanationCopy: "SKU Presence shows the percentage of surveyed stores where the specified SKU was found present.",
    },
    {
      metricId: "category_performance",
      businessName: "Category Performance",
      description: "Composite view of category health across multiple metrics (share, distribution, execution).",
      calculationType: "COMPOSITE",
      numeratorConcept: null,
      denominatorConcept: null,
      allowedDimensions: ["category", "region", "market", "wave"],
      allowedFilters: ["category", "region", "market", "wave"],
      allowedChartTypes: ["BAR", "STACKED_BAR"],
      defaultGrain: "category",
      cautionNotes: "Composite metric — individual components should be reviewed for detailed analysis.",
      explanationCopy: "Category Performance is a composite view showing facings, distribution, and execution rate for each category within the selected scope.",
    },
  ]);

  // ─── Query Templates ───────────────────────────────────────────────
  await db.insert(schema.queryTemplates).values([
    {
      intentName: "compare_brand_share_across_waves",
      displayName: "Brand Share Trend Analysis",
      description: "Compare brand share across time waves for a category and market.",
      requiredInputs: ["metric_id", "category"],
      optionalInputs: ["brand_filter", "market_filter", "region_filter"],
      supportedMetrics: ["brand_share", "share_of_shelf"],
      supportedFilters: ["category", "brand", "region", "market", "wave"],
      supportedGroupings: ["brand", "wave"],
      resultGrain: "brand × wave",
      builderKey: "brand_share_comparison",
    },
    {
      intentName: "summarise_category_performance",
      displayName: "Category Performance Summary",
      description: "Summarise overall category performance for a market or region.",
      requiredInputs: ["market_filter"],
      optionalInputs: ["category_filter", "time_scope"],
      supportedMetrics: ["brand_share", "distribution", "facings", "rate_of_execution", "category_performance"],
      supportedFilters: ["category", "region", "market", "wave"],
      supportedGroupings: ["category"],
      resultGrain: "category",
      builderKey: "category_performance_summary",
    },
    {
      intentName: "compare_brands_across_regions",
      displayName: "Brand Regional Comparison",
      description: "Compare two or more brands across regions and time periods.",
      requiredInputs: ["brands"],
      optionalInputs: ["metric_id", "region_filter", "market_filter", "category_filter"],
      supportedMetrics: ["brand_share", "facings", "distribution"],
      supportedFilters: ["brand", "category", "region", "market", "wave"],
      supportedGroupings: ["brand", "region", "market"],
      resultGrain: "brand × region",
      builderKey: "brand_region_comparison",
    },
    {
      intentName: "rank_execution_gaps",
      displayName: "Execution Gap Ranking",
      description: "Identify and rank execution compliance gaps by geography or category.",
      requiredInputs: [],
      optionalInputs: ["grouping", "region_filter", "market_filter", "category_filter"],
      supportedMetrics: ["rate_of_execution"],
      supportedFilters: ["category", "region", "market", "wave"],
      supportedGroupings: ["market", "category", "brand"],
      resultGrain: "market × category",
      builderKey: "execution_gap_ranking",
    },
    {
      intentName: "show_distribution",
      displayName: "Distribution Analysis",
      description: "Show distribution of brands or SKUs across markets and regions.",
      requiredInputs: [],
      optionalInputs: ["brand_filter", "sku_filter", "region_filter", "market_filter", "category_filter"],
      supportedMetrics: ["distribution", "sku_presence"],
      supportedFilters: ["brand", "sku", "category", "region", "market", "wave"],
      supportedGroupings: ["brand", "market", "sku"],
      resultGrain: "brand × market",
      builderKey: "distribution_query",
    },
    {
      intentName: "rank_by_metric_change",
      displayName: "Metric Change Ranking",
      description: "Rank entities by change in a metric over time.",
      requiredInputs: ["metric_id"],
      optionalInputs: ["entity_type", "region_filter", "market_filter", "category_filter", "sort_direction", "limit"],
      supportedMetrics: ["brand_share", "facings", "distribution", "rate_of_execution"],
      supportedFilters: ["category", "brand", "region", "market", "wave"],
      supportedGroupings: ["brand", "category", "sku"],
      resultGrain: "entity",
      builderKey: "metric_change_ranking",
    },
    {
      intentName: "compare_channels",
      displayName: "Channel Comparison",
      description: "Compare performance across retail channel types.",
      requiredInputs: ["channels"],
      optionalInputs: ["metric_id", "brand_filter", "category_filter", "region_filter"],
      supportedMetrics: ["brand_share", "facings", "distribution", "rate_of_execution"],
      supportedFilters: ["channel", "brand", "category", "region", "market", "wave"],
      supportedGroupings: ["channel", "brand", "category"],
      resultGrain: "channel × brand",
      builderKey: "channel_comparison",
    },
    {
      intentName: "show_top_movers",
      displayName: "Top Gainers and Decliners",
      description: "Show entities with the largest gains or declines in a metric.",
      requiredInputs: ["metric_id"],
      optionalInputs: ["entity_type", "region_filter", "market_filter", "category_filter", "limit"],
      supportedMetrics: ["brand_share", "facings", "distribution"],
      supportedFilters: ["category", "brand", "region", "market", "wave"],
      supportedGroupings: ["brand", "category", "market"],
      resultGrain: "entity",
      builderKey: "top_movers",
    },
  ]);

  // ─── Vocabulary Mappings ───────────────────────────────────────────
  await db.insert(schema.vocabularyMappings).values([
    { userTerm: "shelf share", approvedTerm: "share_of_shelf", termType: "METRIC" },
    { userTerm: "market share", approvedTerm: "brand_share", termType: "METRIC" },
    { userTerm: "OSA", approvedTerm: "distribution", termType: "METRIC" },
    { userTerm: "on shelf availability", approvedTerm: "distribution", termType: "METRIC" },
    { userTerm: "compliance", approvedTerm: "rate_of_execution", termType: "METRIC" },
    { userTerm: "execution", approvedTerm: "rate_of_execution", termType: "METRIC" },
    { userTerm: "availability", approvedTerm: "distribution", termType: "METRIC" },
    { userTerm: "gulf markets", approvedTerm: "MENA", termType: "GEOGRAPHY" },
    { userTerm: "middle east", approvedTerm: "MENA", termType: "GEOGRAPHY" },
    { userTerm: "duty free", approvedTerm: "DUTY_FREE", termType: "FILTER_VALUE" },
    { userTerm: "travel retail", approvedTerm: "TRAVEL_RETAIL", termType: "FILTER_VALUE" },
  ]);

  // ─── Dataset Registry ──────────────────────────────────────────────
  await db.insert(schema.datasetRegistry).values([
    {
      datasetName: "Retail Observations Dataset",
      description: "Primary dataset containing shelf audit observations across travel retail and duty-free locations.",
      refreshFrequency: "Quarterly",
      lastRefreshedAt: new Date("2025-03-15"),
      coverageDescription: "Covers MENA, Asia, and Europe regions across 5 markets and 8 stores.",
      owner: "Data & Insights Team",
      status: "ACTIVE",
    },
  ]);

  console.log("Seeding complete!");
}

seed().catch(console.error);
