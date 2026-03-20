"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/datasets", label: "Datasets" },
  { href: "/admin/templates", label: "Query Templates" },
  { href: "/admin/vocabulary", label: "Vocabulary" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Governance Console</h1>
            <p className="text-xs text-gray-500">Manage metrics, datasets, templates, and vocabulary</p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            Back to Copilot
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <nav className="flex gap-1 border-b border-gray-200 mt-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <div className="py-6">{children}</div>
      </div>
    </div>
  );
}
