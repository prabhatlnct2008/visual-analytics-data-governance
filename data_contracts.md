# Data Contracts

## Trusted Analytics Copilot — Entity and Grain Definitions

---

## 1. Naming Conventions

- Table names: `snake_case`, prefixed with `fact_` or `dim_` for analytical tables
- Column names: `snake_case`
- Primary keys: `id` (UUID or serial) on every table
- Foreign keys: `<entity>_id` referencing the dimension table
- Timestamps: `created_at`, `updated_at` (ISO 8601, UTC)
- Boolean flags: `is_<adjective>` (e.g., `is_active`)
- Enum values: `UPPER_SNAKE_CASE`

---

## 2. Core Entities

### 2.1 Fact Table: `fact_observations`

The primary analytical fact table. Each row represents a single observation at the most granular level: one SKU at one store during one wave.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `wave_id` | UUID (FK) | Yes | Reference to `dim_waves` |
| `market_id` | UUID (FK) | Yes | Reference to `dim_markets` |
| `store_id` | UUID (FK) | Yes | Reference to `dim_stores` |
| `category_id` | UUID (FK) | Yes | Reference to `dim_categories` |
| `brand_id` | UUID (FK) | Yes | Reference to `dim_brands` |
| `sku_id` | UUID (FK) | Yes | Reference to `dim_skus` |
| `facings` | INTEGER | No | Number of facings observed |
| `shelf_space_cm` | DECIMAL(10,2) | No | Shelf space in centimetres |
| `is_present` | BOOLEAN | Yes | Whether the SKU was present (distribution) |
| `is_compliant` | BOOLEAN | No | Whether execution met planogram standards |
| `price_local` | DECIMAL(12,2) | No | Observed price in local currency |
| `position_score` | INTEGER | No | Shelf position quality score (1–5) |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: wave × market × store × category × brand × SKU

**Key relationships**:
- One observation belongs to exactly one wave, market, store, category, brand, and SKU
- All dimension foreign keys are required — no orphaned observations

---

### 2.2 Dimension: `dim_waves`

Represents a data collection period (survey wave).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `wave_name` | VARCHAR(100) | Yes | Display name (e.g., "Wave 3 2024") |
| `wave_number` | INTEGER | Yes | Sequential wave number for ordering |
| `start_date` | DATE | Yes | Collection period start |
| `end_date` | DATE | Yes | Collection period end |
| `is_active` | BOOLEAN | Yes | Whether wave is currently available |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per wave

---

### 2.3 Dimension: `dim_regions`

Top-level geographic grouping.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `region_name` | VARCHAR(100) | Yes | Region name (e.g., "MENA", "Asia", "Europe") |
| `region_code` | VARCHAR(20) | Yes | Short code |
| `is_active` | BOOLEAN | Yes | Whether region is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per region

---

### 2.4 Dimension: `dim_markets`

Specific market within a region (e.g., a city or airport hub).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `region_id` | UUID (FK) | Yes | Reference to `dim_regions` |
| `market_name` | VARCHAR(200) | Yes | Market name (e.g., "Dubai", "Heathrow", "Singapore") |
| `market_code` | VARCHAR(20) | Yes | Short code |
| `market_type` | VARCHAR(50) | Yes | Type: "AIRPORT", "CITY", "BORDER" |
| `is_active` | BOOLEAN | Yes | Whether market is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per market

**Hierarchy**: Region → Market

---

### 2.5 Dimension: `dim_stores`

Individual retail outlet or store.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `market_id` | UUID (FK) | Yes | Reference to `dim_markets` |
| `store_name` | VARCHAR(200) | Yes | Store name or identifier |
| `store_code` | VARCHAR(50) | Yes | Unique store code |
| `channel_type` | VARCHAR(50) | Yes | Channel: "DUTY_FREE", "TRAVEL_RETAIL", "MODERN_TRADE", "TRADITIONAL_TRADE" |
| `is_active` | BOOLEAN | Yes | Whether store is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per store

**Hierarchy**: Region → Market → Store

---

### 2.6 Dimension: `dim_categories`

Product category classification.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `category_name` | VARCHAR(100) | Yes | Category name (e.g., "Spirits", "Wine", "Beer") |
| `category_code` | VARCHAR(20) | Yes | Short code |
| `parent_category_id` | UUID (FK) | No | Self-reference for sub-categories |
| `is_active` | BOOLEAN | Yes | Whether category is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per category (supports hierarchy via self-reference)

---

### 2.7 Dimension: `dim_brands`

Brand within a category.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `category_id` | UUID (FK) | Yes | Reference to `dim_categories` |
| `brand_name` | VARCHAR(200) | Yes | Brand name |
| `brand_code` | VARCHAR(50) | Yes | Short code |
| `brand_owner` | VARCHAR(200) | No | Parent company or brand owner |
| `is_active` | BOOLEAN | Yes | Whether brand is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per brand

**Hierarchy**: Category → Brand

---

### 2.8 Dimension: `dim_skus`

Individual SKU (Stock Keeping Unit).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `brand_id` | UUID (FK) | Yes | Reference to `dim_brands` |
| `sku_name` | VARCHAR(300) | Yes | SKU description |
| `sku_code` | VARCHAR(50) | Yes | Unique SKU code |
| `size_ml` | INTEGER | No | Product size in ml (for beverages) |
| `variant` | VARCHAR(100) | No | Product variant (e.g., "Gold Label", "12 Year") |
| `is_active` | BOOLEAN | Yes | Whether SKU is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

**Grain**: One row per SKU

**Hierarchy**: Category → Brand → SKU

---

## 3. Governance Tables

### 3.1 `metric_definitions`

Central registry of all approved metrics.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `metric_id` | VARCHAR(50) | Yes | Unique metric identifier (e.g., "brand_share") |
| `business_name` | VARCHAR(200) | Yes | Display name |
| `description` | TEXT | Yes | Business definition |
| `calculation_type` | VARCHAR(50) | Yes | "RATIO", "COUNT", "SUM", "AVERAGE", "COMPOSITE" |
| `numerator_concept` | TEXT | No | What the numerator represents |
| `denominator_concept` | TEXT | No | What the denominator represents |
| `allowed_dimensions` | JSONB | Yes | Array of allowed dimension names |
| `allowed_filters` | JSONB | Yes | Array of allowed filter fields |
| `allowed_chart_types` | JSONB | Yes | Array of chart types: "LINE", "BAR", "STACKED_BAR", "HEATMAP" |
| `default_grain` | VARCHAR(50) | Yes | Default aggregation grain |
| `caution_notes` | TEXT | No | Warnings about metric usage |
| `explanation_copy` | TEXT | Yes | Methodology text shown in responses |
| `is_active` | BOOLEAN | Yes | Whether metric is available |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last update timestamp |

### 3.2 `query_templates`

Registry of approved query patterns.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `intent_name` | VARCHAR(100) | Yes | Intent identifier (e.g., "compare_brand_share_across_waves") |
| `display_name` | VARCHAR(200) | Yes | Human-readable name |
| `description` | TEXT | Yes | What this template does |
| `required_inputs` | JSONB | Yes | Required parameters |
| `optional_inputs` | JSONB | Yes | Optional parameters |
| `supported_metrics` | JSONB | Yes | Array of metric_ids this template supports |
| `supported_filters` | JSONB | Yes | Allowed filter combinations |
| `supported_groupings` | JSONB | Yes | Allowed GROUP BY dimensions |
| `result_grain` | VARCHAR(100) | Yes | Grain of the result set |
| `builder_key` | VARCHAR(100) | Yes | Key to the query builder module |
| `is_active` | BOOLEAN | Yes | Whether template is available |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last update timestamp |

### 3.3 `vocabulary_mappings`

Maps business language to approved terms.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_term` | VARCHAR(200) | Yes | What the user might say |
| `approved_term` | VARCHAR(200) | Yes | What it maps to in the system |
| `term_type` | VARCHAR(50) | Yes | "METRIC", "DIMENSION", "FILTER_VALUE", "GEOGRAPHY" |
| `is_active` | BOOLEAN | Yes | Whether mapping is active |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |

### 3.4 `dataset_registry`

Tracks approved datasets and their status.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `dataset_name` | VARCHAR(200) | Yes | Dataset name |
| `description` | TEXT | Yes | What data this covers |
| `refresh_frequency` | VARCHAR(50) | Yes | How often data is refreshed |
| `last_refreshed_at` | TIMESTAMPTZ | No | Last refresh timestamp |
| `coverage_description` | TEXT | Yes | Geographic/temporal coverage |
| `owner` | VARCHAR(200) | Yes | Data owner |
| `status` | VARCHAR(20) | Yes | "ACTIVE", "STALE", "DEPRECATED" |
| `created_at` | TIMESTAMPTZ | Yes | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Yes | Last update timestamp |

### 3.5 `audit_log`

Tracks all query and export activity.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | VARCHAR(200) | No | User identifier |
| `action_type` | VARCHAR(50) | Yes | "QUERY", "EXPORT", "BLOCKED", "CLARIFICATION" |
| `original_question` | TEXT | Yes | User's original question |
| `resolved_intent` | VARCHAR(100) | No | Matched intent name |
| `resolved_metrics` | JSONB | No | Metrics used |
| `resolved_filters` | JSONB | No | Filters applied |
| `template_used` | VARCHAR(100) | No | Query template used |
| `was_successful` | BOOLEAN | Yes | Whether the request completed |
| `block_reason` | TEXT | No | Why the request was blocked |
| `export_format` | VARCHAR(20) | No | "CSV", "XLSX" if exported |
| `created_at` | TIMESTAMPTZ | Yes | Event timestamp |

### 3.6 `saved_reports`

Stores saved analysis for later retrieval.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `user_id` | VARCHAR(200) | No | User identifier |
| `title` | VARCHAR(300) | Yes | Report title |
| `original_question` | TEXT | Yes | Original question text |
| `resolved_intent` | VARCHAR(100) | Yes | Matched intent |
| `resolved_filters` | JSONB | Yes | Filters used |
| `resolved_metrics` | JSONB | Yes | Metrics used |
| `result_data` | JSONB | Yes | Cached result data |
| `response_envelope` | JSONB | Yes | Full response envelope |
| `created_at` | TIMESTAMPTZ | Yes | Save timestamp |

---

## 4. Entity Relationships

```
dim_regions
    └── dim_markets (region_id → dim_regions.id)
           └── dim_stores (market_id → dim_markets.id)

dim_categories (self-referencing via parent_category_id)
    └── dim_brands (category_id → dim_categories.id)
           └── dim_skus (brand_id → dim_brands.id)

dim_waves (standalone)

fact_observations
    ├── wave_id → dim_waves.id
    ├── market_id → dim_markets.id
    ├── store_id → dim_stores.id
    ├── category_id → dim_categories.id
    ├── brand_id → dim_brands.id
    └── sku_id → dim_skus.id
```

---

## 5. Aggregation Rules

| Metric | Aggregation | Notes |
|--------|------------|-------|
| Share of Shelf | SUM(brand_shelf_space) / SUM(total_category_shelf_space) | Must aggregate within same wave + market scope |
| Facings | SUM(facings) | Additive across stores; not across waves |
| Distribution | COUNT(DISTINCT stores WHERE is_present) / COUNT(DISTINCT total stores) | Percentage; scope must be explicit |
| Rate of Execution | COUNT(WHERE is_compliant) / COUNT(total observations) | Percentage within scope |
| Brand Share | SUM(brand_facings) / SUM(category_facings) | Within same wave + market + category |
| SKU Presence | BOOL aggregation per store; count across stores | Binary per observation |
| Category Performance | Composite of share + distribution + execution | Requires all component metrics |

### What CANNOT be aggregated together

- Facings across waves (would double-count)
- Share ratios across different markets (must recalculate, not average)
- Distribution percentages across regions (must recalculate from raw counts)
- Observations from different categories in brand share calculation

---

## 6. Assumptions About Data

- **Waves**: Sequential, non-overlapping collection periods. Typically quarterly.
- **Regions**: Top-level geography (MENA, Asia, Europe, Americas). Fixed set.
- **Markets**: Specific cities or airport hubs within regions. Can grow over time.
- **Stores**: Individual outlets. May change between waves (new stores, closed stores).
- **Categories**: Stable hierarchy. Changes are rare and admin-managed.
- **Brands**: Belong to exactly one category. Brand ownership metadata is optional.
- **SKUs**: Belong to exactly one brand. SKU codes are unique.
- **Currency**: Prices are in local currency. No cross-currency aggregation in MVP.
