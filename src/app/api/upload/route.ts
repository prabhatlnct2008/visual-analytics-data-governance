import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
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
import { eq, sql } from "drizzle-orm";

// ─── Supported upload formats ────────────────────────────────────────────────
// CSV  (.csv)  — comma or semicolon delimited
// JSON (.json) — array of observation objects
// Excel (.xlsx) is parsed client-side to JSON before POSTing (browser reads the file)

// ─── Required columns for observation uploads ────────────────────────────────
const REQUIRED_COLUMNS = [
  "wave_name",
  "market_name",
  "store_code",
  "category_name",
  "brand_name",
  "sku_code",
  "is_present",
];

const OPTIONAL_COLUMNS = [
  "facings",
  "shelf_space_cm",
  "is_compliant",
  "price_local",
  "position_score",
];

interface UploadRow {
  wave_name: string;
  market_name: string;
  store_code: string;
  category_name: string;
  brand_name: string;
  sku_code: string;
  facings?: string | number;
  shelf_space_cm?: string | number;
  is_present: string | boolean;
  is_compliant?: string | boolean;
  price_local?: string | number;
  position_score?: string | number;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

interface DimensionCache {
  waves: Map<string, string>;
  markets: Map<string, string>;
  stores: Map<string, string>;
  categories: Map<string, string>;
  brands: Map<string, string>;
  skus: Map<string, string>;
}

// ─── POST /api/upload — validate and preview ─────────────────────────────────
// POST with ?action=preview to validate and return preview
// POST with ?action=import to validate and insert

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "preview";
  const contentType = request.headers.get("content-type") || "";

  let rows: UploadRow[];

  try {
    if (contentType.includes("multipart/form-data")) {
      // File upload (CSV)
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }

      const filename = file.name.toLowerCase();
      const text = await file.text();

      if (filename.endsWith(".csv")) {
        rows = parseCSV(text);
      } else if (filename.endsWith(".json")) {
        rows = JSON.parse(text);
      } else {
        return NextResponse.json(
          { error: `Unsupported file format. Allowed: .csv, .json. Got: ${filename}` },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      // JSON body (from client-side Excel parsing or direct JSON)
      const body = await request.json();
      rows = body.rows || body;
      if (!Array.isArray(rows)) {
        return NextResponse.json({ error: "Expected an array of row objects." }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use multipart/form-data (CSV file) or application/json." },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "File contains no data rows." }, { status: 400 });
    }

    if (rows.length > 50000) {
      return NextResponse.json(
        { error: `Too many rows (${rows.length}). Maximum is 50,000 per upload.` },
        { status: 400 }
      );
    }

    // Validate columns
    const columnErrors = validateColumns(rows[0]);
    if (columnErrors.length > 0) {
      return NextResponse.json({
        status: "VALIDATION_FAILED",
        errors: columnErrors,
        message: `Missing required columns: ${columnErrors.map((e) => e.column).join(", ")}`,
      }, { status: 400 });
    }

    // Validate row data
    const rowErrors = validateRows(rows);

    // Load dimension caches for FK resolution
    const cache = await loadDimensionCache();

    // Resolve foreign keys and collect unresolved references
    const { resolved, unresolvedErrors } = resolveRows(rows, cache);

    const allErrors = [...rowErrors, ...unresolvedErrors];

    if (action === "preview") {
      return NextResponse.json({
        status: allErrors.length > 0 ? "VALIDATION_WARNINGS" : "VALID",
        totalRows: rows.length,
        validRows: resolved.length,
        errorCount: allErrors.length,
        errors: allErrors.slice(0, 50), // Show first 50 errors
        preview: rows.slice(0, 10), // Show first 10 rows
        columns: Object.keys(rows[0]),
        requiredColumns: REQUIRED_COLUMNS,
        optionalColumns: OPTIONAL_COLUMNS,
      });
    }

    // action === "import"
    if (allErrors.some((e) => e.message.includes("not found in database"))) {
      return NextResponse.json({
        status: "IMPORT_BLOCKED",
        message: "Cannot import: some dimension values don't exist in the database. Create them first via the admin console or fix your data.",
        errorCount: allErrors.length,
        errors: allErrors.slice(0, 50),
      }, { status: 400 });
    }

    // Insert in batches of 200
    let insertedCount = 0;
    for (let i = 0; i < resolved.length; i += 200) {
      const batch = resolved.slice(i, i + 200);
      await db.insert(factObservations).values(batch);
      insertedCount += batch.length;
    }

    return NextResponse.json({
      status: "IMPORTED",
      totalRows: rows.length,
      insertedRows: insertedCount,
      skippedRows: rows.length - insertedCount,
      warnings: allErrors.filter((e) => !e.message.includes("not found")),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

// ─── GET /api/upload — return schema documentation ───────────────────────────

export async function GET() {
  return NextResponse.json({
    description: "Upload observation data to the governed analytics system.",
    allowedFormats: ["CSV (.csv)", "JSON (.json)", "Excel (.xlsx — parsed client-side)"],
    maxRows: 50000,
    requiredColumns: REQUIRED_COLUMNS,
    optionalColumns: OPTIONAL_COLUMNS,
    columnDescriptions: {
      wave_name: "Wave name (must exist in dim_waves, e.g., 'Wave 1 2024')",
      market_name: "Market name (must exist in dim_markets, e.g., 'Dubai')",
      store_code: "Store code (must exist in dim_stores, e.g., 'DXB-DF-T1')",
      category_name: "Category name (must exist in dim_categories, e.g., 'Spirits')",
      brand_name: "Brand name (must exist in dim_brands, e.g., 'Johnnie Walker')",
      sku_code: "SKU code (must exist in dim_skus, e.g., 'JW-BL-1L')",
      is_present: "Whether SKU was present (true/false, 1/0, yes/no)",
      facings: "Number of facings (integer, optional)",
      shelf_space_cm: "Shelf space in cm (decimal, optional)",
      is_compliant: "Whether execution was compliant (true/false, optional)",
      price_local: "Price in local currency (decimal, optional)",
      position_score: "Shelf position quality 1-5 (integer, optional)",
    },
    endpoints: {
      "POST ?action=preview": "Validate file and return preview (no data inserted)",
      "POST ?action=import": "Validate and insert data into fact_observations",
      "GET": "This schema documentation",
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCSV(text: string): UploadRow[] {
  const result = Papa.parse<UploadRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });
  return result.data;
}

function validateColumns(firstRow: UploadRow): ValidationError[] {
  const errors: ValidationError[] = [];
  const keys = Object.keys(firstRow).map((k) => k.toLowerCase());
  for (const col of REQUIRED_COLUMNS) {
    if (!keys.includes(col)) {
      errors.push({ row: 0, column: col, message: `Required column "${col}" is missing.` });
    }
  }
  return errors;
}

function validateRows(rows: UploadRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.wave_name?.toString().trim()) {
      errors.push({ row: i + 1, column: "wave_name", message: "wave_name is empty" });
    }
    if (!row.market_name?.toString().trim()) {
      errors.push({ row: i + 1, column: "market_name", message: "market_name is empty" });
    }
    if (!row.store_code?.toString().trim()) {
      errors.push({ row: i + 1, column: "store_code", message: "store_code is empty" });
    }
    if (!row.category_name?.toString().trim()) {
      errors.push({ row: i + 1, column: "category_name", message: "category_name is empty" });
    }
    if (!row.brand_name?.toString().trim()) {
      errors.push({ row: i + 1, column: "brand_name", message: "brand_name is empty" });
    }
    if (!row.sku_code?.toString().trim()) {
      errors.push({ row: i + 1, column: "sku_code", message: "sku_code is empty" });
    }

    if (row.facings !== undefined && row.facings !== "") {
      const n = Number(row.facings);
      if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
        errors.push({ row: i + 1, column: "facings", message: "facings must be a non-negative integer" });
      }
    }

    if (row.position_score !== undefined && row.position_score !== "") {
      const n = Number(row.position_score);
      if (isNaN(n) || n < 1 || n > 5 || !Number.isInteger(n)) {
        errors.push({ row: i + 1, column: "position_score", message: "position_score must be 1-5" });
      }
    }

    // Limit error output
    if (errors.length > 100) break;
  }
  return errors;
}

function parseBool(val: string | boolean | undefined): boolean {
  if (typeof val === "boolean") return val;
  if (val === undefined || val === null || val === "") return false;
  const s = val.toString().toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

async function loadDimensionCache(): Promise<DimensionCache> {
  const [waves, markets, stores, categories, brands, skus] = await Promise.all([
    db.select({ name: dimWaves.waveName, id: dimWaves.id }).from(dimWaves),
    db.select({ name: dimMarkets.marketName, id: dimMarkets.id }).from(dimMarkets),
    db.select({ code: dimStores.storeCode, id: dimStores.id, marketId: dimStores.marketId }).from(dimStores),
    db.select({ name: dimCategories.categoryName, id: dimCategories.id }).from(dimCategories),
    db.select({ name: dimBrands.brandName, id: dimBrands.id, categoryId: dimBrands.categoryId }).from(dimBrands),
    db.select({ code: dimSkus.skuCode, id: dimSkus.id, brandId: dimSkus.brandId }).from(dimSkus),
  ]);

  return {
    waves: new Map(waves.map((w) => [w.name.toLowerCase(), w.id])),
    markets: new Map(markets.map((m) => [m.name.toLowerCase(), m.id])),
    stores: new Map(stores.map((s) => [s.code.toLowerCase(), s.id])),
    categories: new Map(categories.map((c) => [c.name.toLowerCase(), c.id])),
    brands: new Map(brands.map((b) => [b.name.toLowerCase(), b.id])),
    skus: new Map(skus.map((s) => [s.code.toLowerCase(), s.id])),
  };
}

function resolveRows(
  rows: UploadRow[],
  cache: DimensionCache
): {
  resolved: (typeof factObservations.$inferInsert)[];
  unresolvedErrors: ValidationError[];
} {
  const resolved: (typeof factObservations.$inferInsert)[] = [];
  const unresolvedErrors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const waveId = cache.waves.get(row.wave_name?.toString().toLowerCase().trim());
    const marketId = cache.markets.get(row.market_name?.toString().toLowerCase().trim());
    const storeId = cache.stores.get(row.store_code?.toString().toLowerCase().trim());
    const categoryId = cache.categories.get(row.category_name?.toString().toLowerCase().trim());
    const brandId = cache.brands.get(row.brand_name?.toString().toLowerCase().trim());
    const skuId = cache.skus.get(row.sku_code?.toString().toLowerCase().trim());

    if (!waveId) unresolvedErrors.push({ row: rowNum, column: "wave_name", message: `"${row.wave_name}" not found in database` });
    if (!marketId) unresolvedErrors.push({ row: rowNum, column: "market_name", message: `"${row.market_name}" not found in database` });
    if (!storeId) unresolvedErrors.push({ row: rowNum, column: "store_code", message: `"${row.store_code}" not found in database` });
    if (!categoryId) unresolvedErrors.push({ row: rowNum, column: "category_name", message: `"${row.category_name}" not found in database` });
    if (!brandId) unresolvedErrors.push({ row: rowNum, column: "brand_name", message: `"${row.brand_name}" not found in database` });
    if (!skuId) unresolvedErrors.push({ row: rowNum, column: "sku_code", message: `"${row.sku_code}" not found in database` });

    if (waveId && marketId && storeId && categoryId && brandId && skuId) {
      resolved.push({
        waveId,
        marketId,
        storeId,
        categoryId,
        brandId,
        skuId,
        facings: row.facings !== undefined && row.facings !== "" ? Number(row.facings) : null,
        shelfSpaceCm: row.shelf_space_cm !== undefined && row.shelf_space_cm !== "" ? String(row.shelf_space_cm) : null,
        isPresent: parseBool(row.is_present),
        isCompliant: row.is_compliant !== undefined && row.is_compliant !== "" ? parseBool(row.is_compliant) : null,
        priceLocal: row.price_local !== undefined && row.price_local !== "" ? String(row.price_local) : null,
        positionScore: row.position_score !== undefined && row.position_score !== "" ? Number(row.position_score) : null,
      });
    }

    if (unresolvedErrors.length > 100) break;
  }

  return { resolved, unresolvedErrors };
}
