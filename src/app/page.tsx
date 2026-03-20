"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalysisResponse, UnsupportedResponse, ClarificationResponse, ErrorResponse } from "@/types/responses";

type AnyResponse = AnalysisResponse | UnsupportedResponse | ClarificationResponse | ErrorResponse;

const SUGGESTED_QUESTIONS = [
  "Show brand share change for spirits in Dubai across the last 3 waves",
  "Summarise category performance for Heathrow",
  "Compare Johnnie Walker and Jack Daniels across regions",
  "Where are the biggest execution gaps?",
  "Show distribution of brands in Asia and MENA",
  "Rank categories by change in facings over time",
  "Compare brand execution between duty-free and travel retail",
  "Show top gainers and decliners by market",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(q?: string) {
    const queryText = q || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText }),
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setError("Failed to connect to the analysis service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "CSV" | "XLSX") {
    if (!response || response.status !== "SUCCESS") return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, format }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-${(response as AnalysisResponse).id}.${format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export. Please try again.");
    }
  }

  return (
    <main className="flex-1 bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Trusted Analytics Copilot
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ask governed questions across approved retail datasets
            </p>
          </div>
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Admin Console
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Query Input */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            Ask a question
          </label>
          <div className="flex gap-3">
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g., Show brand share change for spirits in Dubai across the last 3 waves"
              className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !question.trim()}
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>

        {/* Suggested Questions */}
        {!response && !loading && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Suggested questions</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuestion(q);
                    handleSubmit(q);
                  }}
                  className="rounded-md border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
              <p className="mt-3 text-sm text-gray-500">Analyzing your question...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {response && !loading && <ResultDisplay response={response} onExport={handleExport} />}
      </div>
    </main>
  );
}

function ResultDisplay({ response, onExport }: { response: AnyResponse; onExport: (format: "CSV" | "XLSX") => void }) {
  if (response.status === "UNSUPPORTED") {
    const r = response as UnsupportedResponse;
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-md bg-amber-50 border border-amber-200 p-6">
          <h3 className="text-lg font-medium text-amber-800">Request Not Supported</h3>
          <p className="mt-2 text-sm text-amber-700">{r.reason}</p>
          {r.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-amber-800">Try one of these instead:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {r.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-amber-700">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (response.status === "CLARIFICATION_NEEDED") {
    const r = response as ClarificationResponse;
    return (
      <div className="mt-6 rounded-md bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-lg font-medium text-blue-800">Clarification Needed</h3>
        <p className="mt-2 text-sm text-blue-700">{r.clarification.question}</p>
        <div className="mt-4 space-y-2">
          {r.clarification.options.map((opt, i) => (
            <div key={i} className="rounded border border-blue-200 bg-white px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (response.status === "ERROR") {
    const r = response as ErrorResponse;
    return (
      <div className="mt-6 rounded-md bg-red-50 border border-red-200 p-6">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{r.error.message}</p>
      </div>
    );
  }

  const r = response as AnalysisResponse;

  return (
    <div className="mt-6 space-y-6">
      {/* Query Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Analysis</p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">{r.request.interpretedTitle}</h2>
        <p className="mt-1 text-sm text-gray-500">&ldquo;{r.request.originalQuestion}&rdquo;</p>
      </div>

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="space-y-2">
          {r.warnings.map((w, i) => (
            <div key={i} className={`rounded-md border p-3 text-sm ${
              w.severity === "CRITICAL" ? "bg-red-50 border-red-200 text-red-700" :
              w.severity === "WARNING" ? "bg-amber-50 border-amber-200 text-amber-700" :
              "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {r.summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Executive Summary</h3>
          <p className="mt-2 text-sm text-gray-900 leading-relaxed">{r.summary.text}</p>
        </div>
      )}

      {/* Key Findings */}
      {r.keyFindings.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Key Findings</h3>
          <ul className="mt-3 space-y-2">
            {r.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                  f.direction === "UP" ? "bg-green-500" :
                  f.direction === "DOWN" ? "bg-red-500" :
                  "bg-gray-400"
                }`} />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Table */}
      {r.dataTable.totalRows > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Data Table</h3>
            <p className="mt-1 text-xs text-gray-400">Grain: {r.dataTable.grain} | {r.dataTable.totalRows} rows</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {r.dataTable.columns.map((col) => (
                    <th key={col.field} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {r.dataTable.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {r.dataTable.columns.map((col) => (
                      <td key={col.field} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                        {formatCellValue(row[col.field], col.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters Applied */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Filters Applied</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.filtersApplied.category && <FilterBadge label="Category" value={r.filtersApplied.category} />}
          {r.filtersApplied.region && <FilterBadge label="Region" value={r.filtersApplied.region} />}
          {r.filtersApplied.market && <FilterBadge label="Market" value={r.filtersApplied.market} />}
          {r.filtersApplied.brand && r.filtersApplied.brand.map((b) => <FilterBadge key={b} label="Brand" value={b} />)}
          {r.filtersApplied.channel && <FilterBadge label="Channel" value={r.filtersApplied.channel} />}
          {r.filtersApplied.waveRange && <FilterBadge label="Waves" value={`${r.filtersApplied.waveRange.from} to ${r.filtersApplied.waveRange.to}`} />}
          {!r.filtersApplied.category && !r.filtersApplied.region && !r.filtersApplied.market && !r.filtersApplied.brand && (
            <span className="text-sm text-gray-400">No filters applied — all data included</span>
          )}
        </div>
      </div>

      {/* Methodology */}
      {r.methodology && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Methodology & Definitions</h3>
          <div className="mt-3 space-y-3">
            {r.methodology.metrics.map((m) => (
              <div key={m.metricId} className="text-sm">
                <p className="font-medium text-gray-800">{m.businessName}</p>
                <p className="text-gray-600">{m.definition}</p>
                {m.cautionNotes && <p className="text-amber-600 text-xs mt-1">{m.cautionNotes}</p>}
              </div>
            ))}
            <p className="text-xs text-gray-500 pt-2 border-t">{r.methodology.aggregationLevel}</p>
          </div>
        </div>
      )}

      {/* Data Coverage & Freshness */}
      <div className="grid gap-4 sm:grid-cols-2">
        {r.dataCoverage && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Data Coverage</h3>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              {r.dataCoverage.regionsIncluded.length > 0 && <p>Regions: {r.dataCoverage.regionsIncluded.join(", ")}</p>}
              {r.dataCoverage.marketsIncluded.length > 0 && <p>Markets: {r.dataCoverage.marketsIncluded.join(", ")}</p>}
              {r.dataCoverage.observationCount != null && <p>Observations: {r.dataCoverage.observationCount.toLocaleString()}</p>}
              <p className="text-xs text-gray-400">Source: {r.dataCoverage.sourceDataset}</p>
            </div>
          </div>
        )}
        {r.dataFreshness && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Data Freshness</h3>
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p>Last refreshed: {new Date(r.dataFreshness.lastRefreshedAt).toLocaleDateString()}</p>
              <p>Frequency: {r.dataFreshness.refreshFrequency}</p>
              {r.dataFreshness.isStale && <p className="text-amber-600 font-medium">{r.dataFreshness.staleWarning}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      {r.exportMetadata.exportable && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Export</h3>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => onExport("CSV")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => onExport("XLSX")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
      <span className="font-medium">{label}:</span> {value}
    </span>
  );
}

function formatCellValue(value: string | number | boolean | null, type: string): string {
  if (value === null || value === undefined) return "\u2014";
  if (type === "PERCENTAGE") return `${(Number(value) * 100).toFixed(1)}%`;
  if (type === "NUMBER") return Number(value).toLocaleString();
  if (type === "BOOLEAN") return value ? "Yes" : "No";
  return String(value);
}
