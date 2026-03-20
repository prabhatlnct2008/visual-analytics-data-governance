"use client";

import { useEffect, useState } from "react";

interface Template {
  id: string;
  intentName: string;
  displayName: string;
  description: string;
  requiredInputs: string[];
  optionalInputs: string[];
  supportedMetrics: string[];
  supportedFilters: string[];
  supportedGroupings: string[];
  resultGrain: string;
  builderKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/admin/templates");
    setTemplates(await res.json());
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await fetch("/api/admin/templates/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  async function handleDeactivate(id: string) {
    await fetch("/api/admin/templates/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading templates...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Query Templates</h2>
      <p className="text-xs text-gray-500 mb-4">
        Each template defines an approved analysis intent. Only <strong>active</strong> templates are available to the copilot.
        Deactivating a template immediately prevents that analysis type from being used.
      </p>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{t.displayName}</h3>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t.intentName}</code>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{t.description}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-gray-500">
                  <div>
                    <span className="font-medium text-gray-700">Required:</span>{" "}
                    {(t.requiredInputs || []).join(", ") || "None"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Optional:</span>{" "}
                    {(t.optionalInputs || []).join(", ") || "None"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Metrics:</span>{" "}
                    {(t.supportedMetrics || []).join(", ")}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Groupings:</span>{" "}
                    {(t.supportedGroupings || []).join(", ")}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Result Grain:</span> {t.resultGrain}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Builder:</span>{" "}
                    <code className="bg-gray-50 px-1 rounded">{t.builderKey}</code>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                {!t.isActive ? (
                  <button onClick={() => handleApprove(t.id)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                    Approve
                  </button>
                ) : (
                  <button onClick={() => handleDeactivate(t.id)}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-gray-400">No query templates found.</p>}
      </div>
    </div>
  );
}
