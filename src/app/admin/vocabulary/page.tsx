"use client";

import { useEffect, useState } from "react";

interface Mapping {
  id: string;
  userTerm: string;
  approvedTerm: string;
  termType: string;
  isActive: boolean;
  createdAt: string;
}

const TERM_TYPES = ["METRIC", "DIMENSION", "FILTER_VALUE", "GEOGRAPHY"];

export default function VocabularyAdmin() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userTerm: "", approvedTerm: "", termType: "METRIC" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/admin/vocabulary");
    setMappings(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/vocabulary/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ userTerm: "", approvedTerm: "", termType: "METRIC" });
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  async function handleToggle(id: string) {
    await fetch("/api/admin/vocabulary/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this mapping?")) return;
    await fetch("/api/admin/vocabulary/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  const typeColors: Record<string, string> = {
    METRIC: "bg-blue-100 text-blue-800",
    DIMENSION: "bg-purple-100 text-purple-800",
    FILTER_VALUE: "bg-green-100 text-green-800",
    GEOGRAPHY: "bg-amber-100 text-amber-800",
  };

  if (loading) return <p className="text-sm text-gray-500">Loading vocabulary...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Vocabulary</h2>
          <p className="text-xs text-gray-500 mt-1">
            Map business language to approved system terms so the copilot understands synonyms.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Mapping"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-200 bg-white p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">New Vocabulary Mapping</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">User Term (what they say)</label>
              <input required value={form.userTerm} onChange={(e) => setForm({ ...form, userTerm: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="e.g., shelf share" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Approved Term (system term)</label>
              <input required value={form.approvedTerm} onChange={(e) => setForm({ ...form, approvedTerm: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="e.g., share_of_shelf" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term Type</label>
              <select value={form.termType} onChange={(e) => setForm({ ...form, termType: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                {TERM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {saving ? "Adding..." : "Add Mapping"}
          </button>
        </form>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mappings.map((m) => (
              <tr key={m.id} className={m.isActive ? "" : "opacity-50"}>
                <td className="px-4 py-3 text-sm text-gray-900">{m.userTerm}</td>
                <td className="px-4 py-3 text-sm"><code className="bg-gray-50 px-1 rounded">{m.approvedTerm}</code></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[m.termType] || "bg-gray-100 text-gray-600"}`}>
                    {m.termType}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{m.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleToggle(m.id)}
                      className="text-xs text-blue-600 hover:text-blue-800">
                      {m.isActive ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => handleDelete(m.id)}
                      className="text-xs text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mappings.length === 0 && <p className="p-4 text-sm text-gray-400">No vocabulary mappings yet.</p>}
      </div>
    </div>
  );
}
