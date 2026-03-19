# Architecture Document

## Trusted Analytics Copilot — Next.js + Vercel Postgres

---

## 1. System Overview

The system is a six-layer governed analytics copilot deployed as a single Next.js application on Vercel with Vercel Postgres (Neon-backed) as the data store.

```
┌─────────────────────────────────────────────────────┐
│                   Vercel Edge/Serverless             │
│  ┌───────────────────────────────────────────────┐  │
│  │            Layer 6: Product Interface          │  │
│  │         (Next.js App Router + React)           │  │
│  ├───────────────────────────────────────────────┤  │
│  │           Layer 5: Output Assembly             │  │
│  │    (Response Envelope, Charts, Exports)        │  │
│  ├───────────────────────────────────────────────┤  │
│  │          Layer 4: AI Orchestration             │  │
│  │   (Claude API, Intent Mapping, Narration)      │  │
│  ├───────────────────────────────────────────────┤  │
│  │         Layer 3: Query Governance              │  │
│  │   (Templates, Builders, Validation)            │  │
│  ├───────────────────────────────────────────────┤  │
│  │        Layer 2: Metric Governance              │  │
│  │   (Metric Registry, Definitions, Rules)        │  │
│  ├───────────────────────────────────────────────┤  │
│  │          Layer 1: Data Model                   │  │
│  │    (Facts, Dimensions, Drizzle ORM)            │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│                   Vercel Postgres                     │
│                     (Neon)                            │
└─────────────────────────────────────────────────────┘
                        │
                  Claude API (Anthropic)
```

---

## 2. Layer Responsibilities

### Layer 1: Data Model Layer

**Module**: `src/lib/db/`

- Drizzle ORM schema definitions for all fact and dimension tables
- Database connection management with connection pooling
- Migration files
- Seed scripts

**Key files**:
- `src/lib/db/schema.ts` — Drizzle table definitions
- `src/lib/db/index.ts` — Database client singleton
- `src/lib/db/migrations/` — Migration files
- `src/lib/db/seed.ts` — Seed data scripts

### Layer 2: Metric Governance Layer

**Module**: `src/lib/metrics/`

- Metric registry access (read from `metric_definitions` table)
- Metric resolution: map user terms to approved metric IDs
- Metric validation: check allowed dimensions, filters, chart types
- Vocabulary mapping resolution

**Key files**:
- `src/lib/metrics/registry.ts` — Metric lookup and validation
- `src/lib/metrics/types.ts` — Metric type definitions
- `src/lib/metrics/vocabulary.ts` — Business term mapping

### Layer 3: Query Governance Layer

**Module**: `src/lib/queries/`

- Query template registry and lookup
- Parameterised query builders for each supported intent
- Filter validation (valid values, compatible combinations)
- Query execution via Drizzle ORM

**Key files**:
- `src/lib/queries/templates.ts` — Template registry and resolution
- `src/lib/queries/builders/` — One builder per intent type
- `src/lib/queries/validation.ts` — Filter and parameter validation
- `src/lib/queries/executor.ts` — Safe query execution

### Layer 4: AI Orchestration Layer

**Module**: `src/lib/ai/`

- Claude API client
- Intent classification from natural language
- Slot extraction (metrics, dimensions, filters, time scope)
- Ambiguity detection and clarification prompt generation
- Response narration from structured results (summary + key findings)

**Key files**:
- `src/lib/ai/client.ts` — Claude API wrapper
- `src/lib/ai/intent.ts` — Intent classifier
- `src/lib/ai/slots.ts` — Slot extractor
- `src/lib/ai/narrator.ts` — Result summary generator
- `src/lib/ai/prompts.ts` — Prompt templates (short, bounded)

### Layer 5: Output Assembly Layer

**Module**: `src/lib/output/`

- Response envelope construction
- Chart spec generation (Recharts-compatible)
- Methodology note generation from metric definitions
- Coverage and freshness note generation
- CSV and Excel file generation

**Key files**:
- `src/lib/output/envelope.ts` — Response envelope builder
- `src/lib/output/charts.ts` — Chart spec generator
- `src/lib/output/methodology.ts` — Methodology note builder
- `src/lib/output/exports.ts` — CSV/Excel generation

### Layer 6: Product Interface Layer

**Module**: `src/app/`

- Next.js App Router pages and layouts
- React Server Components for data-heavy views
- Client Components for interactive elements (query input, charts, filters)
- Server Actions for form submissions and mutations

**Key files**:
- `src/app/page.tsx` — Home / Query Workspace
- `src/app/analysis/[id]/page.tsx` — Analysis Result Screen
- `src/app/history/page.tsx` — Saved Reports / History
- `src/app/admin/` — Admin Governance Console
- `src/components/` — Shared UI components

---

## 3. Request Lifecycle

```
User Question
     │
     ▼
[1] API Route: POST /api/analyze
     │
     ▼
[2] AI Orchestration: Intent Classification + Slot Extraction
     │  (Claude API call with structured tool-calling schema)
     │
     ├── Unsupported? → Return blocking response with alternatives
     ├── Ambiguous? → Return clarification options
     │
     ▼
[3] Metric Governance: Resolve metrics, validate dimensions/filters
     │
     ├── Invalid metric? → Return error with approved alternatives
     ├── Invalid filter? → Return error with valid options
     │
     ▼
[4] Query Governance: Select template, build parameterised query
     │
     ▼
[5] Query Execution: Run governed query via Drizzle ORM
     │
     ▼
[6] Result Validation: Check completeness, coverage, data quality
     │
     ▼
[7] AI Narration: Generate summary + key findings from result data
     │  (Claude API call bounded to result set only)
     │
     ▼
[8] Output Assembly: Build response envelope
     │  (summary, findings, table, chart spec, methodology,
     │   coverage, freshness, filters, warnings, export metadata)
     │
     ▼
[9] Audit Logging: Log query, interpretation, status, result metadata
     │
     ▼
[10] Return structured response to client
```

---

## 4. Data Flow

```
                    ┌──────────────┐
                    │  User Input  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Claude API  │──── Intent + Slots
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │  Metric Registry (DB)   │──── Validated Metrics
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Query Template (DB)    │──── Selected Template
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Query Builder          │──── Parameterised SQL
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Vercel Postgres        │──── Raw Result Set
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Claude API (Narration) │──── Summary + Findings
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Response Envelope      │──── Structured Output
              └────────────┬────────────┘
                           │
                    ┌──────▼───────┐
                    │   Client UI  │
                    └──────────────┘
```

---

## 5. Trust Boundaries

| Boundary | Rule |
|----------|------|
| User Input → AI Layer | LLM classifies intent but cannot invent metrics or queries |
| AI Layer → Metric Registry | Only approved metric IDs are accepted; unknown metrics are rejected |
| Metric Registry → Query Builder | Query builders only accept validated parameters from approved templates |
| Query Builder → Database | All queries are parameterised; no string interpolation of user input |
| Database → Narration | Narrator receives only the result set; it cannot query additional data |
| Narration → Output | Summary claims must be evidence-bound to the result set |
| Output → Export | Exports include methodology and filter metadata for standalone trust |

---

## 6. Failure Handling

| Failure Scenario | Handling |
|-----------------|----------|
| Intent not recognised | Return unsupported state with suggested approved questions |
| Metric not in registry | Block execution, show approved metric list |
| Invalid filter values | Block execution, show valid filter options |
| Incompatible dimension combination | Explain incompatibility, suggest valid combinations |
| No data returned | State clearly with filters shown; do not fabricate |
| Partial data coverage | Show result with explicit coverage warning |
| Stale data | Display freshness warning banner |
| Claude API timeout/error | Return graceful error, log for monitoring |
| Database error | Return graceful error, log for monitoring |
| Ambiguous request | Present controlled clarification options |

---

## 7. Extension Strategy

The architecture supports extension through:

1. **New metrics**: Add rows to `metric_definitions` table via admin console
2. **New query templates**: Add rows to `query_templates` table and implement corresponding builder module
3. **New dimensions**: Add dimension tables and update schema; extend filter validation
4. **New datasets**: Register in `dataset_registry`; extend data model as needed
5. **New chart types**: Add chart spec generators to output layer
6. **New export formats**: Add generators to export module
7. **Role-based access**: Add user roles table and permission checks at API layer
8. **Scheduled reports**: Add cron-based job that re-runs saved queries and emails results

Each extension follows the same layered pattern: data model → governance → query → output → UI.

---

## 8. Project Structure

```
visual-analytics-data-governance/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home / Query Workspace
│   │   ├── analysis/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Analysis Result Screen
│   │   ├── history/
│   │   │   └── page.tsx              # Saved Reports
│   │   ├── admin/
│   │   │   ├── page.tsx              # Admin Dashboard
│   │   │   ├── metrics/
│   │   │   │   └── page.tsx          # Metric Library
│   │   │   ├── templates/
│   │   │   │   └── page.tsx          # Query Templates
│   │   │   ├── datasets/
│   │   │   │   └── page.tsx          # Dataset Registry
│   │   │   ├── vocabulary/
│   │   │   │   └── page.tsx          # Business Vocabulary
│   │   │   └── audit/
│   │   │       └── page.tsx          # Audit Log
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts          # Main analysis endpoint
│   │       ├── export/
│   │       │   └── route.ts          # Export endpoint
│   │       └── admin/
│   │           └── [...slug]/
│   │               └── route.ts      # Admin CRUD endpoints
│   ├── components/                   # Shared React components
│   │   ├── ui/                       # Base UI components
│   │   ├── query/                    # Query-related components
│   │   ├── results/                  # Result display components
│   │   └── admin/                    # Admin console components
│   ├── lib/                          # Core business logic
│   │   ├── db/                       # Layer 1: Data Model
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── metrics/                  # Layer 2: Metric Governance
│   │   │   ├── registry.ts
│   │   │   ├── types.ts
│   │   │   └── vocabulary.ts
│   │   ├── queries/                  # Layer 3: Query Governance
│   │   │   ├── templates.ts
│   │   │   ├── builders/
│   │   │   ├── validation.ts
│   │   │   └── executor.ts
│   │   ├── ai/                       # Layer 4: AI Orchestration
│   │   │   ├── client.ts
│   │   │   ├── intent.ts
│   │   │   ├── slots.ts
│   │   │   ├── narrator.ts
│   │   │   └── prompts.ts
│   │   └── output/                   # Layer 5: Output Assembly
│   │       ├── envelope.ts
│   │       ├── charts.ts
│   │       ├── methodology.ts
│   │       └── exports.ts
│   └── types/                        # Shared TypeScript types
│       ├── metrics.ts
│       ├── queries.ts
│       ├── responses.ts
│       └── admin.ts
├── drizzle.config.ts                 # Drizzle ORM configuration
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
├── .env.local.example                # Environment variable template
├── planning.md
├── phases.md
├── architecture.md
├── data_contracts.md
├── query_governance.md
└── response_schema.md
```
