"use client";

import { useEffect, useState } from "react";

interface Metric {
  id: string;
  metricId: string;
  businessName: string;
  description: string;
  calculationType: string;
  numeratorConcept: string | null;
  denominatorConcept: string | null;
  allowedDimensions: string[];
  allowedFilters: string[];
  allowedChartTypes: string[];
  defaultGrain: string;
  cautionNotes: string | null;
  explanationCopy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DIMENSIONS = ["category", "brand", "sku", "region", "market", "channel", "wave", "store"];
const CHART_TYPES = ["LINE", "BAR", "STACKED_BAR", "HEATMAP"];
const CALC_TYPES = ["RATIO", "COUNT", "SUM", "AVERAGE", "COMPOSITE"];

const EMPTY_FORM = {
  metricId: "",
  businessName: "",
  description: "",
  calculationType: "RATIO",
  numeratorConcept: "",
  denominatorConcept: "",
  allowedDimensions: [] as string[],
  allowedFilters: [] as string[],
  allowedChartTypes: [] as string[],
  defaultGrain: "",
  cautionNotes: "",
  explanationCopy: "",
};

export default function MetricsAdmin() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    const res = await fetch("/api/admin/metrics");
    const data = await res.json();
    setMetrics(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/metrics/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    loadMetrics();
  }

  async function handleApprove(id: string) {
    await fetch("/api/admin/metrics/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMetrics();
  }

  async function handleDeactivate(id: string) {
    await fetch("/api/admin/metrics/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMetrics();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this metric? This cannot be undone.")) return;
    await fetch("/api/admin/metrics/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadMetrics();
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  if (loading) return <p className="text-sm text-gray-500">Loading metrics...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Metric Library</h2>
          <p className="text-xs text-gray-500 mt-1">
            New metrics start <strong>inactive</strong>. Approve them to make them available to the copilot.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Create Metric"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-200 bg-white p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New Metric Definition</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Metric ID (snake_case)</label>
              <input required value={form.metricId} onChange={(e) => setForm({ ...form, metricId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="e.g., brand_share" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Name</label>
              <input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="e.g., Brand Share" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Calculation Type</label>
              <select value={form.calculationType} onChange={(e) => setForm({ ...form, calculationType: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {CALC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Numerator Concept</label>
              <input value={form.numeratorConcept} onChange={(e) => setForm({ ...form, numeratorConcept: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Denominator Concept</label>
              <input value={form.denominatorConcept} onChange={(e) => setForm({ ...form, denominatorConcept: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Allowed Dimensions</label>
            <div className="flex flex-wrap gap-2">
              {DIMENSIONS.map((dim) => (
                <label key={dim} className="inline-flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={form.allowedDimensions.includes(dim)}
                    onChange={() => setForm({ ...form, allowedDimensions: toggleArrayItem(form.allowedDimensions, dim) })} />
                  {dim}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Allowed Chart Types</label>
            <div className="flex flex-wrap gap-2">
              {CHART_TYPES.map((ct) => (
                <label key={ct} className="inline-flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={form.allowedChartTypes.includes(ct)}
                    onChange={() => setForm({ ...form, allowedChartTypes: toggleArrayItem(form.allowedChartTypes, ct) })} />
                  {ct}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Default Grain</label>
              <input required value={form.defaultGrain} onChange={(e) => setForm({ ...form, defaultGrain: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="e.g., brand x wave" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Caution Notes</label>
              <input value={form.cautionNotes} onChange={(e) => setForm({ ...form, cautionNotes: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Explanation Copy (shown in methodology)</label>
            <textarea required value={form.explanationCopy} onChange={(e) => setForm({ ...form, explanationCopy: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>

          <button type="submit" disabled={saving}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create Metric (inactive)"}
          </button>
        </form>
      )}

      {/* Metric List */}
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.id} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{m.businessName}</h3>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.metricId}</code>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {m.isActive ? "Active (Approved)" : "Inactive (Draft)"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Type: {m.calculationType}</span>
                  <span>Grain: {m.defaultGrain}</span>
                  <span>Dimensions: {(m.allowedDimensions || []).join(", ")}</span>
                  <span>Charts: {(m.allowedChartTypes || []).join(", ")}</span>
                </div>
                {m.cautionNotes && <p className="mt-1 text-xs text-amber-600">{m.cautionNotes}</p>}
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                {!m.isActive ? (
                  <button onClick={() => handleApprove(m.id)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                    Approve
                  </button>
                ) : (
                  <button onClick={() => handleDeactivate(m.id)}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                    Deactivate
                  </button>
                )}
                <button onClick={() => handleDelete(m.id)}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
