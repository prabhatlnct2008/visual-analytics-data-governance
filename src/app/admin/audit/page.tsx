"use client";

import { useEffect, useState } from "react";

interface AuditEntry {
  id: string;
  userId: string | null;
  actionType: string;
  originalQuestion: string;
  resolvedIntent: string | null;
  resolvedMetrics: string[] | null;
  resolvedFilters: Record<string, unknown> | null;
  templateUsed: string | null;
  wasSuccessful: boolean;
  blockReason: string | null;
  exportFormat: string | null;
  createdAt: string;
}

export default function AuditAdmin() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }, []);

  const typeColors: Record<string, string> = {
    QUERY: "bg-blue-100 text-blue-800",
    EXPORT: "bg-green-100 text-green-800",
    BLOCKED: "bg-red-100 text-red-800",
    CLARIFICATION: "bg-amber-100 text-amber-800",
  };

  if (loading) return <p className="text-sm text-gray-500">Loading audit log...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Audit Log</h2>
      <p className="text-xs text-gray-500 mb-4">
        Every query, export, and blocked request is logged here for trust and compliance. Read-only.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[e.actionType] || "bg-gray-100 text-gray-600"}`}>
                      {e.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {e.originalQuestion}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {e.resolvedIntent || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${e.wasSuccessful ? "bg-green-500" : "bg-red-500"}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {e.blockReason && <span className="text-red-600">{e.blockReason}</span>}
                    {e.exportFormat && <span>Export: {e.exportFormat}</span>}
                    {e.resolvedMetrics && e.resolvedMetrics.length > 0 && (
                      <span>Metrics: {e.resolvedMetrics.join(", ")}</span>
                    )}
                    {!e.blockReason && !e.exportFormat && (!e.resolvedMetrics || e.resolvedMetrics.length === 0) && "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && <p className="p-4 text-sm text-gray-400">No audit entries yet.</p>}
      </div>
    </div>
  );
}
