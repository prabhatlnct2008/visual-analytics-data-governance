import Link from "next/link";

const SECTIONS = [
  {
    title: "Metric Library",
    description: "Create, approve, and manage metric definitions. New metrics start inactive and must be approved before the copilot can use them.",
    href: "/admin/metrics",
    actions: "Create metric, Approve metric, Deactivate metric, Edit definition",
  },
  {
    title: "Dataset Registry",
    description: "Register approved datasets, track freshness, and manage availability status (Active / Stale / Deprecated).",
    href: "/admin/datasets",
    actions: "Register dataset, Update status, Edit coverage info",
  },
  {
    title: "Query Templates",
    description: "View and manage approved query templates. Each template defines a supported analysis intent with its inputs, outputs, and validation rules.",
    href: "/admin/templates",
    actions: "Approve template, Deactivate template",
  },
  {
    title: "Business Vocabulary",
    description: "Map business language to approved system terms so the copilot understands synonyms and shorthand.",
    href: "/admin/vocabulary",
    actions: "Add mapping, Remove mapping, Toggle active/inactive",
  },
  {
    title: "Audit Log",
    description: "View all query activity, export events, and blocked requests for trust and compliance.",
    href: "/admin/audit",
    actions: "View log (read-only)",
  },
];

export default function AdminOverview() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Governance Overview</h2>
      <p className="text-sm text-gray-500 mb-6">
        This console controls what the analytics copilot can access. Metrics, datasets, query templates, and vocabulary mappings
        must be explicitly approved here before the copilot uses them.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">{section.description}</p>
            <p className="mt-3 text-xs text-blue-600">{section.actions}</p>
          </Link>
        ))}
      </div>

      {/* Governance Flow Explanation */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">How Governance Works</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-xs text-gray-600">
          <div>
            <p className="font-medium text-gray-900 mb-1">1. Create</p>
            <p>Add a new metric, dataset, template, or vocabulary mapping. New items start in an <strong>inactive/draft</strong> state.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">2. Approve</p>
            <p>Review the definition and activate it. Only <strong>active</strong> items are used by the copilot when answering questions.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">3. Audit</p>
            <p>Every query, export, and blocked request is logged. Use the audit log to verify governance compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
