import { NextRequest, NextResponse } from "next/server";
import { generateCSV, generateXLSX } from "@/lib/output/exports";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import type { AnalysisResponse } from "@/types/responses";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response: AnalysisResponse = body.response;
  const format: string = body.format || "CSV";

  if (!response || !response.dataTable) {
    return NextResponse.json(
      { error: "No analysis data to export." },
      { status: 400 }
    );
  }

  try {
    if (format === "CSV") {
      const csv = generateCSV(response);
      await logExport(response.request.originalQuestion, "CSV");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analysis-${response.id}.csv"`,
        },
      });
    }

    if (format === "XLSX") {
      const buffer = await generateXLSX(response);
      await logExport(response.request.originalQuestion, "XLSX");

      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="analysis-${response.id}.xlsx"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported export format: "${format}". Use CSV or XLSX.` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 }
    );
  }
}

async function logExport(question: string, format: string) {
  try {
    await db.insert(auditLog).values({
      actionType: "EXPORT",
      originalQuestion: question,
      wasSuccessful: true,
      exportFormat: format,
    });
  } catch (e) {
    console.error("Failed to log export:", e);
  }
}
