"use client";

import { useEffect, useState } from "react";

interface Dataset {
  id: string;
  datasetName: string;
  description: string;
  refreshFrequency: string;
  lastRefreshedAt: string | null;
  coverageDescription: string;
  owner: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  datasetName: "",
  description: "",
  refreshFrequency: "Quarterly",
  lastRefreshedAt: "",
  coverageDescription: "",
  owner: "",
};

export default function DatasetsAdmin() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/admin/datasets");
    setDatasets(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/datasets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch("/api/admin/datasets/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    await fetch("/api/admin/datasets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    STALE: "bg-amber-100 text-amber-800",
    DEPRECATED: "bg-red-100 text-red-800",
  };

  if (loading) return <p className="text-sm text-gray-500">Loading datasets...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dataset Registry</h2>
          <p className="text-xs text-gray-500 mt-1">Register approved datasets and manage their availability status.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showForm ? "Cancel" : "Register Dataset"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-200 bg-white p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Register New Dataset</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dataset Name</label>
              <input required value={form.datasetName} onChange={(e) => setForm({ ...form, datasetName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
              <input required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Refresh Frequency</label>
              <select value={form.refreshFrequency} onChange={(e) => setForm({ ...form, refreshFrequency: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Annually</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Refreshed At</label>
              <input type="date" value={form.lastRefreshedAt} onChange={(e) => setForm({ ...form, lastRefreshedAt: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Coverage Description</label>
            <textarea required value={form.coverageDescription} onChange={(e) => setForm({ ...form, coverageDescription: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {saving ? "Registering..." : "Register Dataset"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {datasets.map((d) => (
          <div key={d.id} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{d.datasetName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] || "bg-gray-100 text-gray-600"}`}>
                    {d.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{d.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Owner: {d.owner}</span>
                  <span>Refresh: {d.refreshFrequency}</span>
                  {d.lastRefreshedAt && <span>Last refresh: {new Date(d.lastRefreshedAt).toLocaleDateString()}</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">Coverage: {d.coverageDescription}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                {d.status !== "ACTIVE" && (
                  <button onClick={() => handleStatusChange(d.id, "ACTIVE")}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                    Set Active
                  </button>
                )}
                {d.status !== "STALE" && (
                  <button onClick={() => handleStatusChange(d.id, "STALE")}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                    Mark Stale
                  </button>
                )}
                {d.status !== "DEPRECATED" && (
                  <button onClick={() => handleStatusChange(d.id, "DEPRECATED")}
                    className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                    Deprecate
                  </button>
                )}
                <button onClick={() => handleDelete(d.id)}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {datasets.length === 0 && <p className="text-sm text-gray-400">No datasets registered yet.</p>}
      </div>
    </div>
  );
}
