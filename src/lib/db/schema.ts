import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Dimension Tables ───────────────────────────────────────────────────────

export const dimWaves = pgTable("dim_waves", {
  id: uuid("id").defaultRandom().primaryKey(),
  waveName: varchar("wave_name", { length: 100 }).notNull(),
  waveNumber: integer("wave_number").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimRegions = pgTable("dim_regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  regionName: varchar("region_name", { length: 100 }).notNull(),
  regionCode: varchar("region_code", { length: 20 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimMarkets = pgTable("dim_markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => dimRegions.id),
  marketName: varchar("market_name", { length: 200 }).notNull(),
  marketCode: varchar("market_code", { length: 20 }).notNull(),
  marketType: varchar("market_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimStores = pgTable("dim_stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id")
    .notNull()
    .references(() => dimMarkets.id),
  storeName: varchar("store_name", { length: 200 }).notNull(),
  storeCode: varchar("store_code", { length: 50 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimCategories = pgTable("dim_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryName: varchar("category_name", { length: 100 }).notNull(),
  categoryCode: varchar("category_code", { length: 20 }).notNull(),
  parentCategoryId: uuid("parent_category_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimBrands = pgTable("dim_brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => dimCategories.id),
  brandName: varchar("brand_name", { length: 200 }).notNull(),
  brandCode: varchar("brand_code", { length: 50 }).notNull(),
  brandOwner: varchar("brand_owner", { length: 200 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dimSkus = pgTable("dim_skus", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => dimBrands.id),
  skuName: varchar("sku_name", { length: 300 }).notNull(),
  skuCode: varchar("sku_code", { length: 50 }).notNull(),
  sizeMl: integer("size_ml"),
  variant: varchar("variant", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Fact Table ─────────────────────────────────────────────────────────────

export const factObservations = pgTable("fact_observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  waveId: uuid("wave_id")
    .notNull()
    .references(() => dimWaves.id),
  marketId: uuid("market_id")
    .notNull()
    .references(() => dimMarkets.id),
  storeId: uuid("store_id")
    .notNull()
    .references(() => dimStores.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => dimCategories.id),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => dimBrands.id),
  skuId: uuid("sku_id")
    .notNull()
    .references(() => dimSkus.id),
  facings: integer("facings"),
  shelfSpaceCm: decimal("shelf_space_cm", { precision: 10, scale: 2 }),
  isPresent: boolean("is_present").notNull(),
  isCompliant: boolean("is_compliant"),
  priceLocal: decimal("price_local", { precision: 12, scale: 2 }),
  positionScore: integer("position_score"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Governance Tables ──────────────────────────────────────────────────────

export const metricDefinitions = pgTable("metric_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  metricId: varchar("metric_id", { length: 50 }).notNull().unique(),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  calculationType: varchar("calculation_type", { length: 50 }).notNull(),
  numeratorConcept: text("numerator_concept"),
  denominatorConcept: text("denominator_concept"),
  allowedDimensions: jsonb("allowed_dimensions").notNull(),
  allowedFilters: jsonb("allowed_filters").notNull(),
  allowedChartTypes: jsonb("allowed_chart_types").notNull(),
  defaultGrain: varchar("default_grain", { length: 50 }).notNull(),
  cautionNotes: text("caution_notes"),
  explanationCopy: text("explanation_copy").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const queryTemplates = pgTable("query_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  intentName: varchar("intent_name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  requiredInputs: jsonb("required_inputs").notNull(),
  optionalInputs: jsonb("optional_inputs").notNull(),
  supportedMetrics: jsonb("supported_metrics").notNull(),
  supportedFilters: jsonb("supported_filters").notNull(),
  supportedGroupings: jsonb("supported_groupings").notNull(),
  resultGrain: varchar("result_grain", { length: 100 }).notNull(),
  builderKey: varchar("builder_key", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vocabularyMappings = pgTable("vocabulary_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userTerm: varchar("user_term", { length: 200 }).notNull(),
  approvedTerm: varchar("approved_term", { length: 200 }).notNull(),
  termType: varchar("term_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const datasetRegistry = pgTable("dataset_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  datasetName: varchar("dataset_name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  refreshFrequency: varchar("refresh_frequency", { length: 50 }).notNull(),
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
  coverageDescription: text("coverage_description").notNull(),
  owner: varchar("owner", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 200 }),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  originalQuestion: text("original_question").notNull(),
  resolvedIntent: varchar("resolved_intent", { length: 100 }),
  resolvedMetrics: jsonb("resolved_metrics"),
  resolvedFilters: jsonb("resolved_filters"),
  templateUsed: varchar("template_used", { length: 100 }),
  wasSuccessful: boolean("was_successful").notNull(),
  blockReason: text("block_reason"),
  exportFormat: varchar("export_format", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const savedReports = pgTable("saved_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 200 }),
  title: varchar("title", { length: 300 }).notNull(),
  originalQuestion: text("original_question").notNull(),
  resolvedIntent: varchar("resolved_intent", { length: 100 }).notNull(),
  resolvedFilters: jsonb("resolved_filters").notNull(),
  resolvedMetrics: jsonb("resolved_metrics").notNull(),
  resultData: jsonb("result_data").notNull(),
  responseEnvelope: jsonb("response_envelope").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
