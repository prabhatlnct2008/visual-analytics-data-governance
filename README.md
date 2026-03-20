# Trusted Analytics Copilot

A governed analytics copilot for retail insights. Users ask natural-language questions about retail execution and performance data, and receive trustworthy, structured, explainable answers backed by approved metrics, controlled query logic, and auditable methodology.

This is **not** a general chatbot. It is a governed analytics product with an AI interpretation layer.

---

## How It Works

### Architecture (6 Layers)

```
User Question
     │
     ▼
┌─ Layer 6: Product Interface ──────────────────┐
│  Next.js App Router + React + Tailwind CSS     │
├─ Layer 5: Output Assembly ─────────────────────┤
│  Response envelope, charts, CSV/Excel exports  │
├─ Layer 4: AI Orchestration ────────────────────┤
│  OpenAI GPT-4o for intent parsing & narration  │
├─ Layer 3: Query Governance ────────────────────┤
│  Parameterised query builders, validation      │
├─ Layer 2: Metric Governance ───────────────────┤
│  Metric registry, definitions, vocabulary      │
├─ Layer 1: Data Model ─────────────────────────-┤
│  Facts, dimensions, Drizzle ORM                │
└────────────────────────────────────────────────┘
                    │
              Vercel Postgres
```

### Request Lifecycle

1. **User submits a question** in natural language (e.g., "Show brand share change for spirits in Dubai across the last 3 waves")
2. **AI Intent Classification** — GPT-4o maps the question to one of 8 approved analysis intents, extracts metrics, filters, and dimensions
3. **Metric Resolution** — System resolves requested metrics against the approved metric registry
4. **Validation** — Checks metric existence, dimension compatibility, filter validity, and scope
5. **Governed Query Execution** — Runs a parameterised query (no arbitrary SQL) via Drizzle ORM against Postgres
6. **AI Narration** — GPT-4o generates a summary and key findings bounded to the result data only
7. **Response Assembly** — Packages everything into a structured envelope: summary, findings, data table, chart spec, methodology, coverage, freshness, warnings, export metadata
8. **Audit Logging** — Every query, export, and blocked request is logged

### Supported Analysis Types

| Intent | Example Question |
|--------|-----------------|
| Brand Share Trend | "Show brand share change for spirits in Dubai across the last 3 waves" |
| Category Performance | "Summarise category performance for Heathrow" |
| Brand Comparison | "Compare Johnnie Walker and Jack Daniels across regions" |
| Execution Gaps | "Where are the biggest execution gaps?" |
| Distribution | "Show distribution of brands in Asia and MENA" |
| Metric Change Ranking | "Rank categories by change in facings over time" |
| Channel Comparison | "Compare brand execution between duty-free and travel retail" |
| Top Movers | "Show top gainers and decliners by market" |

### Approved Metrics

- **Brand Share** — Brand's share within a category (by facings)
- **Share of Shelf** — Proportion of shelf space (by cm)
- **Facings** — Number of product facings on shelf
- **Distribution** — Presence/availability across stores (%)
- **Rate of Execution** — Compliance with planogram standards (%)
- **SKU Presence** — Whether specific SKUs are present
- **Category Performance** — Composite view across metrics

### Response Structure

Every successful response includes:
- Executive summary (evidence-bound)
- Key findings (with direction indicators)
- Data table (with typed columns)
- Filters applied
- Methodology & metric definitions
- Data coverage
- Data freshness
- Export options (CSV/Excel)

### Trust & Governance

- No arbitrary SQL — all queries are parameterised through governed templates
- No metric invention — only approved metrics from the registry can be used
- No hallucinated findings — AI narration is bounded to the returned result set
- Every response shows how it was produced (methodology, filters, coverage)
- Unsupported requests are blocked safely with reformulation suggestions
- Full audit trail for every query and export

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Vercel Postgres (Neon) |
| ORM | Drizzle ORM |
| AI | OpenAI GPT-4o |
| Exports | CSV (xlsx planned) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Vercel account
- An OpenAI API key

### 1. Clone and install

```bash
git clone <repo-url>
cd visual-analytics-data-governance
npm install
```

### 2. Set up Vercel Postgres

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database (or link to an existing project)
3. Copy the environment variables from the Vercel dashboard

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

```env
# Vercel Postgres (from Vercel dashboard)
POSTGRES_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...

# OpenAI
OPENAI_API_KEY=sk-...
```

### 4. Set up the database

Push the schema to your database:

```bash
npm run db:push
```

Seed with sample data (regions, markets, stores, categories, brands, SKUs, observations, metrics, templates, vocabulary):

```bash
npm run db:seed
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start asking questions.

---

## Deploy to Vercel

### Option A: Connect via Git

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add a Postgres database from the Vercel Storage tab
4. Set `OPENAI_API_KEY` in the Environment Variables section
5. Deploy

The database connection variables (`POSTGRES_URL`, etc.) are automatically set when you link a Vercel Postgres database.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel link
vercel env pull .env.local    # pulls Postgres credentials
vercel deploy
```

After first deploy, run the seed script against your production database:

```bash
vercel env pull .env.local
npm run db:push
npm run db:seed
```

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home / Query Workspace
│   └── api/
│       ├── analyze/route.ts    # Main analysis endpoint
│       └── export/route.ts     # CSV export endpoint
├── lib/                        # Core business logic (6 layers)
│   ├── db/                     # Layer 1: Data Model
│   │   ├── schema.ts           # Drizzle table definitions
│   │   ├── index.ts            # Database client
│   │   └── seed.ts             # Seed script
│   ├── metrics/                # Layer 2: Metric Governance
│   │   ├── registry.ts         # Metric lookup & validation
│   │   └── vocabulary.ts       # Business term mapping
│   ├── queries/                # Layer 3: Query Governance
│   │   ├── templates.ts        # Template registry
│   │   ├── executor.ts         # Governed query execution
│   │   └── validation.ts       # Parameter validation
│   ├── ai/                     # Layer 4: AI Orchestration
│   │   ├── client.ts           # OpenAI client
│   │   ├── intent.ts           # Intent classifier
│   │   ├── narrator.ts         # Result narrator
│   │   └── prompts.ts          # System prompts
│   └── output/                 # Layer 5: Output Assembly
│       ├── envelope.ts         # Response envelope builder
│       ├── charts.ts           # Chart spec generator
│       └── exports.ts          # CSV generation
└── types/                      # Shared TypeScript types
    ├── metrics.ts
    ├── queries.ts
    ├── responses.ts
    └── admin.ts
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database with sample data |

---

## Planning Documents

These documents define the system design and were created before implementation:

- [planning.md](./planning.md) — Product goal, MVP scope, assumptions, risks
- [phases.md](./phases.md) — Implementation phases with objectives and deliverables
- [architecture.md](./architecture.md) — System layers, request lifecycle, trust boundaries
- [data_contracts.md](./data_contracts.md) — Entity schemas, grains, relationships, aggregation rules
- [query_governance.md](./query_governance.md) — Supported intents, metric mappings, validation rules
- [response_schema.md](./response_schema.md) — Response envelope, export structure, chart governance

---

## Database Schema

### Dimension Tables
- `dim_waves` — Survey collection periods
- `dim_regions` — Top-level geography (MENA, Asia, Europe)
- `dim_markets` — Specific markets (Dubai, Heathrow, Singapore, etc.)
- `dim_stores` — Individual retail outlets with channel type
- `dim_categories` — Product categories (Spirits, Wine, Beer, Tobacco)
- `dim_brands` — Brands within categories
- `dim_skus` — Individual SKUs within brands

### Fact Table
- `fact_observations` — Shelf audit observations (facings, shelf space, presence, compliance, price, position) at the grain of wave x market x store x category x brand x SKU

### Governance Tables
- `metric_definitions` — Approved metrics with definitions, allowed dimensions, chart types
- `query_templates` — Approved analysis intents with inputs, outputs, validation rules
- `vocabulary_mappings` — Business language to system term mappings
- `dataset_registry` — Approved datasets with freshness and coverage info
- `audit_log` — Query and export audit trail
- `saved_reports` — Saved analysis results for later retrieval
