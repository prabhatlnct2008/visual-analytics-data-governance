"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface UploadResult {
  status: string;
  totalRows?: number;
  validRows?: number;
  insertedRows?: number;
  skippedRows?: number;
  errorCount?: number;
  errors?: { row: number; column: string; message: string }[];
  preview?: Record<string, unknown>[];
  columns?: string[];
  message?: string;
  error?: string;
  warnings?: { row: number; column: string; message: string }[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<Record<string, unknown>[] | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setResult(null);
    setJsonData(null);

    const name = selected.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".json")) {
      setFile(selected);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      // Parse Excel client-side to JSON
      parseExcelClientSide(selected);
    } else {
      setResult({ status: "ERROR", error: `Unsupported format: ${selected.name}. Use .csv, .json, or .xlsx` });
    }
  }

  async function parseExcelClientSide(excelFile: File) {
    try {
      const XLSX = await import("xlsx");
      const buffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: "",
        raw: false,
      });

      // Normalise headers to snake_case
      const normalised = rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          out[key.trim().toLowerCase().replace(/\s+/g, "_")] = val;
        }
        return out;
      });

      setJsonData(normalised);
      setFile(excelFile);
    } catch {
      setResult({ status: "ERROR", error: "Failed to parse Excel file." });
    }
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      let res: Response;
      if (jsonData) {
        // Excel was parsed client-side → send as JSON
        res = await fetch("/api/upload?action=preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: jsonData }),
        });
      } else {
        // CSV or JSON file → send as multipart
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/upload?action=preview", {
          method: "POST",
          body: formData,
        });
      }
      setResult(await res.json());
    } catch {
      setResult({ status: "ERROR", error: "Failed to connect to upload service." });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);

    try {
      let res: Response;
      if (jsonData) {
        res = await fetch("/api/upload?action=import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: jsonData }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/upload?action=import", {
          method: "POST",
          body: formData,
        });
      }
      setResult(await res.json());
    } catch {
      setResult({ status: "ERROR", error: "Import failed." });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setJsonData(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="flex-1 bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Data Upload</h1>
            <p className="mt-1 text-sm text-gray-500">Import observation data into the governed analytics system</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Copilot</Link>
            <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Admin</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Format Guide */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Accepted Formats</h2>
          <div className="grid gap-4 sm:grid-cols-3 text-xs text-gray-600">
            <div className="border rounded p-3">
              <p className="font-medium text-gray-900 mb-1">CSV (.csv)</p>
              <p>Comma-delimited with header row. Semicolon-delimited also supported.</p>
            </div>
            <div className="border rounded p-3">
              <p className="font-medium text-gray-900 mb-1">Excel (.xlsx)</p>
              <p>First sheet is read. Header row must match required columns.</p>
            </div>
            <div className="border rounded p-3">
              <p className="font-medium text-gray-900 mb-1">JSON (.json)</p>
              <p>Array of objects with keys matching required columns.</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Required columns:</p>
            <code className="bg-gray-50 px-2 py-1 rounded">
              wave_name, market_name, store_code, category_name, brand_name, sku_code, is_present
            </code>
            <p className="mt-2 font-medium text-gray-700 mb-1">Optional columns:</p>
            <code className="bg-gray-50 px-2 py-1 rounded">
              facings, shelf_space_cm, is_compliant, price_local, position_score
            </code>
            <p className="mt-2 text-amber-600">
              All dimension values (waves, markets, stores, categories, brands, SKUs) must already exist in the database.
              Add them via the Admin Console first.
            </p>
          </div>
        </div>

        {/* File Input */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select file</label>
          <div className="flex gap-3 items-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileChange}
              className="text-sm text-gray-600"
            />
            {file && (
              <div className="flex gap-2">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Validating..." : "Validate & Preview"}
                </button>
                <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            )}
          </div>
          {file && <p className="mt-2 text-xs text-gray-400">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Error */}
            {(result.status === "ERROR" || result.error) && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{result.error || result.message}</p>
              </div>
            )}

            {/* Validation Result */}
            {(result.status === "VALID" || result.status === "VALIDATION_WARNINGS") && (
              <div className={`rounded-md border p-4 ${
                result.status === "VALID" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
              }`}>
                <h3 className={`text-sm font-medium ${
                  result.status === "VALID" ? "text-green-800" : "text-amber-800"
                }`}>
                  {result.status === "VALID" ? "Validation Passed" : "Validation Warnings"}
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p>Total rows: {result.totalRows?.toLocaleString()}</p>
                  <p>Valid rows: {result.validRows?.toLocaleString()}</p>
                  {result.errorCount! > 0 && <p className="text-amber-700">Issues: {result.errorCount}</p>}
                </div>

                {/* Import button */}
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? "Importing..." : `Import ${result.validRows?.toLocaleString()} rows`}
                </button>
              </div>
            )}

            {/* Import Success */}
            {result.status === "IMPORTED" && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <h3 className="text-sm font-medium text-green-800">Import Complete</h3>
                <p className="mt-1 text-sm text-green-700">
                  {result.insertedRows?.toLocaleString()} rows inserted successfully.
                  {result.skippedRows! > 0 && ` ${result.skippedRows} rows skipped due to errors.`}
                </p>
              </div>
            )}

            {/* Import Blocked */}
            {result.status === "IMPORT_BLOCKED" && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <h3 className="text-sm font-medium text-red-800">Import Blocked</h3>
                <p className="mt-1 text-sm text-red-700">{result.message}</p>
              </div>
            )}

            {/* Validation Errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">
                    Issues ({result.errorCount} total{result.errorCount! > 50 ? ", showing first 50" : ""})
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Column</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Issue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.errors.map((err, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-gray-700">{err.row}</td>
                          <td className="px-3 py-1.5"><code className="bg-gray-50 px-1 rounded">{err.column}</code></td>
                          <td className="px-3 py-1.5 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {result.preview && result.preview.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700">Preview (first 10 rows)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {result.columns?.map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.preview.map((row, i) => (
                        <tr key={i}>
                          {result.columns?.map((col) => (
                            <td key={col} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
