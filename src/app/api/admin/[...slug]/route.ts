import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  metricDefinitions,
  queryTemplates,
  vocabularyMappings,
  datasetRegistry,
  auditLog,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Metrics CRUD ────────────────────────────────────────────────────────────

async function handleMetrics(request: NextRequest, action: string) {
  if (action === "list") {
    const rows = await db.select().from(metricDefinitions);
    return NextResponse.json(rows);
  }

  if (action === "create") {
    const body = await request.json();
    const [row] = await db.insert(metricDefinitions).values({
      metricId: body.metricId,
      businessName: body.businessName,
      description: body.description,
      calculationType: body.calculationType,
      numeratorConcept: body.numeratorConcept || null,
      denominatorConcept: body.denominatorConcept || null,
      allowedDimensions: body.allowedDimensions || [],
      allowedFilters: body.allowedFilters || [],
      allowedChartTypes: body.allowedChartTypes || [],
      defaultGrain: body.defaultGrain,
      cautionNotes: body.cautionNotes || null,
      explanationCopy: body.explanationCopy,
      isActive: false, // New metrics start inactive — must be approved
    }).returning();
    return NextResponse.json(row, { status: 201 });
  }

  if (action === "approve") {
    const body = await request.json();
    const [row] = await db
      .update(metricDefinitions)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(metricDefinitions.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "deactivate") {
    const body = await request.json();
    const [row] = await db
      .update(metricDefinitions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(metricDefinitions.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "update") {
    const body = await request.json();
    const { id, ...updates } = body;
    const [row] = await db
      .update(metricDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(metricDefinitions.id, id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "delete") {
    const body = await request.json();
    await db.delete(metricDefinitions).where(eq(metricDefinitions.id, body.id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── Datasets CRUD ───────────────────────────────────────────────────────────

async function handleDatasets(request: NextRequest, action: string) {
  if (action === "list") {
    const rows = await db.select().from(datasetRegistry);
    return NextResponse.json(rows);
  }

  if (action === "create") {
    const body = await request.json();
    const [row] = await db.insert(datasetRegistry).values({
      datasetName: body.datasetName,
      description: body.description,
      refreshFrequency: body.refreshFrequency,
      lastRefreshedAt: body.lastRefreshedAt ? new Date(body.lastRefreshedAt) : null,
      coverageDescription: body.coverageDescription,
      owner: body.owner,
      status: "ACTIVE",
    }).returning();
    return NextResponse.json(row, { status: 201 });
  }

  if (action === "update-status") {
    const body = await request.json();
    const [row] = await db
      .update(datasetRegistry)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(datasetRegistry.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "update") {
    const body = await request.json();
    const { id, ...updates } = body;
    const [row] = await db
      .update(datasetRegistry)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(datasetRegistry.id, id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "delete") {
    const body = await request.json();
    await db.delete(datasetRegistry).where(eq(datasetRegistry.id, body.id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── Query Templates CRUD ────────────────────────────────────────────────────

async function handleTemplates(request: NextRequest, action: string) {
  if (action === "list") {
    const rows = await db.select().from(queryTemplates);
    return NextResponse.json(rows);
  }

  if (action === "approve") {
    const body = await request.json();
    const [row] = await db
      .update(queryTemplates)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(queryTemplates.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "deactivate") {
    const body = await request.json();
    const [row] = await db
      .update(queryTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(queryTemplates.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  if (action === "create") {
    const body = await request.json();
    const [row] = await db.insert(queryTemplates).values({
      intentName: body.intentName,
      displayName: body.displayName,
      description: body.description,
      requiredInputs: body.requiredInputs || [],
      optionalInputs: body.optionalInputs || [],
      supportedMetrics: body.supportedMetrics || [],
      supportedFilters: body.supportedFilters || [],
      supportedGroupings: body.supportedGroupings || [],
      resultGrain: body.resultGrain,
      builderKey: body.builderKey,
      isActive: false,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── Vocabulary Mappings CRUD ────────────────────────────────────────────────

async function handleVocabulary(request: NextRequest, action: string) {
  if (action === "list") {
    const rows = await db.select().from(vocabularyMappings);
    return NextResponse.json(rows);
  }

  if (action === "create") {
    const body = await request.json();
    const [row] = await db.insert(vocabularyMappings).values({
      userTerm: body.userTerm,
      approvedTerm: body.approvedTerm,
      termType: body.termType,
      isActive: true,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  }

  if (action === "delete") {
    const body = await request.json();
    await db.delete(vocabularyMappings).where(eq(vocabularyMappings.id, body.id));
    return NextResponse.json({ success: true });
  }

  if (action === "toggle") {
    const body = await request.json();
    const rows = await db.select().from(vocabularyMappings).where(eq(vocabularyMappings.id, body.id));
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [row] = await db
      .update(vocabularyMappings)
      .set({ isActive: !rows[0].isActive })
      .where(eq(vocabularyMappings.id, body.id))
      .returning();
    return NextResponse.json(row);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

async function handleAuditLog() {
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(auditLog.createdAt)
    .limit(200);
  return NextResponse.json(rows);
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const resource = slug[0];

  switch (resource) {
    case "metrics":
      return handleMetrics(request, "list");
    case "datasets":
      return handleDatasets(request, "list");
    case "templates":
      return handleTemplates(request, "list");
    case "vocabulary":
      return handleVocabulary(request, "list");
    case "audit":
      return handleAuditLog();
    default:
      return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const resource = slug[0];
  const action = slug[1] || "create";

  switch (resource) {
    case "metrics":
      return handleMetrics(request, action);
    case "datasets":
      return handleDatasets(request, action);
    case "templates":
      return handleTemplates(request, action);
    case "vocabulary":
      return handleVocabulary(request, action);
    default:
      return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
}
