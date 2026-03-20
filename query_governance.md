# Query Governance

## Trusted Analytics Copilot — Supported Intents, Metric Mappings, and Validation

---

## 1. Supported Intents

Each intent maps to a governed query template with defined inputs, outputs, and validation rules.

### Intent 1: `compare_brand_share_across_waves`

**Description**: Compare a metric for one or more brands across multiple waves within a market or region.

**Example questions**:
- "Show brand share change for spirits in Dubai across the last 3 waves"
- "How has Brand A's share changed over time in MENA?"

**Required inputs**:
- `metric_id`: `brand_share` or `share_of_shelf`
- `category`: Category filter
- `time_scope`: Number of waves or specific wave range

**Optional inputs**:
- `brand_filter`: Specific brand(s) to focus on
- `market_filter`: Specific market
- `region_filter`: Specific region

**Supported groupings**: brand × wave

**Result grain**: brand, wave, metric_value

**Approved chart types**: LINE, BAR

---

### Intent 2: `summarise_category_performance`

**Description**: Show overall category performance for a market or region, including key metrics.

**Example questions**:
- "Summarise category performance for Heathrow"
- "How are categories performing in Dubai?"

**Required inputs**:
- `market_filter` or `region_filter`: At least one geography filter

**Optional inputs**:
- `category_filter`: Specific category (if omitted, show all categories)
- `time_scope`: Specific wave or range

**Supported metrics**: `brand_share`, `distribution`, `facings`, `rate_of_execution`

**Supported groupings**: category (× wave if time comparison)

**Result grain**: category, metric_name, metric_value

**Approved chart types**: BAR, STACKED_BAR

---

### Intent 3: `compare_brands_across_regions`

**Description**: Compare two or more brands across regions and/or time periods.

**Example questions**:
- "Compare Brand A and Brand B across regions"
- "Compare two brands across MENA and Asia for the last wave"

**Required inputs**:
- `brands`: Two or more brand names
- `metric_id`: At least one metric

**Optional inputs**:
- `region_filter`: Specific regions
- `market_filter`: Specific markets
- `time_scope`: Wave range
- `category_filter`: Category context

**Supported groupings**: brand × region, brand × market, brand × wave

**Result grain**: brand, geography, metric_value

**Approved chart types**: BAR, LINE

---

### Intent 4: `rank_execution_gaps`

**Description**: Identify and rank the biggest execution gaps by geography, category, or brand.

**Example questions**:
- "Where are the biggest execution gaps?"
- "Rank execution gaps by region"

**Required inputs**:
- `metric_id`: `rate_of_execution` (default)

**Optional inputs**:
- `grouping`: "region", "market", "category", "brand"
- `region_filter`, `market_filter`, `category_filter`
- `time_scope`: Specific wave

**Supported groupings**: geography, category, brand

**Result grain**: entity, execution_score, gap_size

**Approved chart types**: BAR, HEATMAP

---

### Intent 5: `show_distribution`

**Description**: Show distribution of brands or SKUs across markets/regions.

**Example questions**:
- "Show distribution of brand/SKU in Asia and MENA"
- "Which SKUs have the widest distribution?"

**Required inputs**:
- `metric_id`: `distribution` or `sku_presence`

**Optional inputs**:
- `brand_filter`, `sku_filter`
- `region_filter`, `market_filter`
- `category_filter`
- `time_scope`

**Supported groupings**: brand × market, sku × market, brand × region

**Result grain**: entity, geography, distribution_pct

**Approved chart types**: BAR, HEATMAP

---

### Intent 6: `rank_by_metric_change`

**Description**: Rank entities by change in a metric over time.

**Example questions**:
- "Rank categories by change in facings over time"
- "Which brands gained the most share?"

**Required inputs**:
- `metric_id`: Any approved metric
- `time_scope`: At least 2 waves for comparison

**Optional inputs**:
- `entity_type`: "category", "brand", "sku"
- `region_filter`, `market_filter`, `category_filter`
- `sort_direction`: "ASC" or "DESC"
- `limit`: Top N results

**Supported groupings**: entity × wave (for delta calculation)

**Result grain**: entity, wave_start, wave_end, value_start, value_end, change

**Approved chart types**: BAR, LINE

---

### Intent 7: `compare_channels`

**Description**: Compare brand or category performance between channel types.

**Example questions**:
- "Compare brand execution between airport and non-airport locations"
- "How does distribution differ between duty-free and modern trade?"

**Required inputs**:
- `metric_id`: Any approved metric
- `channels`: Two or more channel types to compare

**Optional inputs**:
- `brand_filter`, `category_filter`
- `region_filter`, `market_filter`
- `time_scope`

**Supported groupings**: channel × brand, channel × category

**Result grain**: channel, entity, metric_value

**Approved chart types**: BAR, STACKED_BAR

---

### Intent 8: `show_top_movers`

**Description**: Show top gainers and decliners by a metric across a dimension.

**Example questions**:
- "Show top gainers and decliners by market and wave"
- "Which brands improved the most in MENA?"

**Required inputs**:
- `metric_id`: Any approved metric
- `time_scope`: At least 2 waves

**Optional inputs**:
- `entity_type`: "brand", "category", "sku", "market"
- `region_filter`, `market_filter`, `category_filter`
- `limit`: Top N gainers + Top N decliners

**Supported groupings**: entity × wave

**Result grain**: entity, change_value, direction (gainer/decliner)

**Approved chart types**: BAR

---

## 2. Approved Metric Mappings

| User Phrasing | Resolved Metric ID | Notes |
|--------------|-------------------|-------|
| brand share, market share by brand | `brand_share` | Facings-based unless specified |
| share of shelf, shelf share | `share_of_shelf` | Space-based (cm) |
| facings, number of facings | `facings` | Raw count |
| distribution, availability | `distribution` | Percentage of stores |
| rate of execution, compliance, execution score | `rate_of_execution` | Compliance percentage |
| SKU presence, SKU availability | `sku_presence` | Binary presence |
| category performance, category summary | `category_performance` | Composite metric |

---

## 3. Supported Filter Combinations

### Valid combinations

- category + market + wave range
- category + region + wave range
- brand + market + wave range
- brand + region + wave range
- category + brand + market + wave
- sku + market + wave
- channel + market + wave
- channel + region + wave

### Invalid combinations (blocked)

- SKU-level across all regions without category/brand filter (too broad)
- Store-level without market filter (too broad)
- Cross-category brand comparison (brands belong to one category)
- Wave-less aggregation of facings (double-counting risk)

---

## 4. Validation Rules

### 4.1 Pre-Execution Validation

| Rule | Condition | Action |
|------|-----------|--------|
| Metric exists | `metric_id` must be in `metric_definitions` with `is_active = true` | Block with "metric not available" |
| Dimension allowed | Requested dimensions must be in metric's `allowed_dimensions` | Block with "dimension not supported for this metric" |
| Filter valid | Filter values must exist in dimension tables | Block with "value not found" + suggestions |
| Time scope present | Comparison intents require >= 2 waves | Block with "need at least 2 waves for comparison" |
| Scope not too broad | Must have at least one geography or category filter | Block with "please narrow your scope" |
| Compatible dimensions | Requested groupings must be compatible | Block with incompatibility explanation |

### 4.2 Post-Execution Validation

| Rule | Condition | Action |
|------|-----------|--------|
| Non-empty result | Query must return > 0 rows | Show "no data available" with filters used |
| Minimum coverage | Result should cover >= 50% of expected scope | Show coverage warning if below threshold |
| Data freshness | Latest wave should not be > 6 months old | Show staleness warning |
| Result consistency | Percentages should sum to ~100% where applicable | Log anomaly, show warning |

---

## 5. Ambiguity Handling

| Ambiguity Type | Detection | Resolution |
|---------------|-----------|------------|
| Multiple metrics possible | "Share" could mean brand_share or share_of_shelf | Ask: "Do you mean brand share (by facings) or share of shelf (by space)?" |
| Geography unclear | "Gulf" could mean multiple markets | Ask: "Which markets? Dubai, Abu Dhabi, Bahrain, ...?" |
| Time scope missing | "How is brand performing?" with no wave context | Default to latest wave, note in response |
| Entity level unclear | "Distribution" could be brand or SKU level | Ask: "Do you want distribution at brand level or SKU level?" |
| Category implied | Brand name maps to a known category | Auto-resolve, show in interpretation panel |

---

## 6. Unsupported Request Handling

### Detection criteria

A request is unsupported if:
- The requested metric is not in the approved registry
- The requested analysis type doesn't match any approved intent
- The request requires arbitrary SQL or ad-hoc calculations
- The request combines incompatible dimensions
- The request asks for predictive or causal analysis
- The request references data not in the approved datasets

### Response structure for unsupported requests

```json
{
  "status": "UNSUPPORTED",
  "original_question": "...",
  "reason": "Clear explanation of why this cannot be answered",
  "unsupported_elements": ["list of specific unsupported parts"],
  "suggestions": [
    "Reformulated question 1 that IS supported",
    "Reformulated question 2 that IS supported"
  ],
  "available_metrics": ["list of relevant approved metrics"],
  "available_dimensions": ["list of relevant dimensions"]
}
```
