# Planning Document

## Trusted Analytics Copilot for Governed Retail Insights

---

## 1. Product Goal

Build an internal, governed analytics copilot that enables business users to ask natural-language questions about retail execution and performance data, receiving trustworthy, structured, explainable answers backed by approved metrics, controlled query logic, and auditable methodology.

The system is **not** a general chatbot. It is a governed analytics product with an AI interpretation layer deployed on Vercel using Next.js and Vercel Postgres.

---

## 2. MVP Scope

### 2.1 Supported Capabilities

- **10–20 approved analytics use cases** mapped to governed query templates
- **Natural language query intake** with intent parsing and slot extraction
- **Approved metric resolution** from a centralised metric registry
- **Controlled query execution** via parameterised query builders (no arbitrary SQL)
- **Structured response output** with summary, key findings, data table, chart spec, methodology, coverage, freshness, and export actions
- **Ambiguity resolution** with controlled clarification prompts
- **Unsupported request blocking** with safe explanations and reformulation suggestions
- **CSV and Excel export** of result data with metadata
- **Session-based conversation history**
- **Admin governance console** for managing metrics, templates, datasets, vocabulary mappings, and audit logs

### 2.2 Approved Metrics (Initial Set)

| Metric ID | Business Name | Description |
|-----------|--------------|-------------|
| `share_of_shelf` | Share of Shelf | Proportion of shelf space occupied by a brand/category |
| `facings` | Facings | Number of product facings on shelf |
| `distribution` | Distribution | Presence/availability of brand/SKU across locations |
| `rate_of_execution` | Rate of Execution | Compliance score for planogram/execution standards |
| `brand_share` | Brand Share | Brand's share within a category by facings or space |
| `sku_presence` | SKU Presence | Whether specific SKUs are present at a location |
| `category_performance` | Category Performance | Composite performance of a category across metrics |

### 2.3 Approved Dimensions

- Category (spirits, wine, beer, tobacco, confectionery, etc.)
- Brand
- SKU
- Region (Asia, MENA, Europe, Americas)
- Market (Dubai, Heathrow, Singapore, etc.)
- Channel (airport, non-airport, duty-free, etc.)
- Wave / Time Period
- Store / Outlet (where available)

### 2.4 Example Use Cases for MVP

1. Show brand share change for spirits in Dubai across the last 3 waves
2. Summarise category performance for Heathrow
3. Compare two brands across regions and time periods
4. Where are the biggest execution gaps?
5. Show distribution of brand/SKU in Asia and MENA
6. Rank categories by change in facings over time
7. Compare brand execution between airport and non-airport locations
8. Show top gainers and decliners by market and wave

---

## 3. Assumptions

### 3.1 Data Assumptions

- Structured retail datasets are available in a normalised format suitable for loading into Vercel Postgres
- Data follows a wave-based collection model (periodic survey waves)
- Each observation has a clear grain: wave × market × store × category × brand × SKU
- Historical data spans at least 3–5 waves for trend analysis
- Data is pre-cleaned and validated before ingestion

### 3.2 Technology Assumptions

- **Frontend + Backend**: Next.js 14+ (App Router) deployed on Vercel
- **Database**: Vercel Postgres (Neon-backed PostgreSQL)
- **AI Layer**: Claude API for intent parsing, slot extraction, and response narration
- **Charts**: Client-side charting library (Recharts or similar)
- **Exports**: Server-side CSV/Excel generation
- **Auth**: Simple auth for MVP (Vercel auth or basic session management)

### 3.3 User Assumptions

- Users are internal business stakeholders (not external customers)
- Users understand retail analytics concepts (brands, categories, share, distribution)
- Admin users are data/insights team members who understand metric governance
- No row-level security by region in MVP

### 3.4 Governance Assumptions

- Metric definitions are stable and agreed upon before MVP launch
- Query templates are pre-approved and cover the supported use cases
- Business vocabulary mappings are seeded and maintainable by admins
- All metric logic is centralised in the metric registry, not scattered across code

---

## 4. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM hallucinating metrics or data | High | Strict tool-calling schema, no arbitrary SQL, validate all outputs against approved registries |
| Metric definitions inconsistent across code paths | High | Single source of truth in metric registry table, no hardcoded logic |
| Ambiguous user queries causing wrong interpretation | Medium | Pre-execution review screen, controlled clarification flow |
| Data freshness misleading users | Medium | Freshness metadata on every response, stale data warnings |
| Vercel Postgres connection limits under load | Medium | Connection pooling, efficient query patterns, caching where appropriate |
| Export files missing context | Low | Include metadata (filters, definitions, timestamp) in exports |
| Scope creep into general chatbot | Medium | Hard boundaries on supported intents, explicit unsupported request handling |

---

## 5. Success Criteria

### 5.1 Functional Success

- All 8 example use cases execute correctly with governed outputs
- Every response includes summary, table, methodology, coverage, and freshness
- Unsupported requests are blocked safely with helpful guidance
- CSV and Excel exports work reliably with metadata
- Admin console allows metric and template management

### 5.2 Trust Success

- No metric can be calculated via two different code paths
- No response claims findings unsupported by the result set
- Every response shows the metric definition used
- Every response shows filters applied and data coverage

### 5.3 Technical Success

- Deploys cleanly on Vercel with Vercel Postgres
- Responds within acceptable interactive latency (< 5s for most queries)
- Clean, modular codebase ready for extension
- All layers (data, governance, orchestration, output, UI) are clearly separated

---

## 6. What Will NOT Be Built Now

- Unrestricted SQL generation or ad-hoc metric creation
- Freeform dashboard building
- Writeback to source systems
- External user access or public-facing interface
- Row-level access control by region/market
- Predictive modelling or forecasting
- Automated alerts or scheduled reports
- Saved dashboards composed from query blocks
- Drill-down from brand → SKU → store cluster
- Voice input support
- Multi-tenant deployment

---

## 7. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router, React Server Components) | UI rendering, routing |
| Backend API | Next.js API Routes / Server Actions | Request handling, orchestration |
| Database | Vercel Postgres (Neon) | Data storage, metric registry, audit logs |
| AI Layer | Claude API (Anthropic) | Intent parsing, slot extraction, response narration |
| Charts | Recharts | Client-side chart rendering |
| Exports | xlsx / csv-stringify | Server-side file generation |
| Styling | Tailwind CSS | UI styling |
| Deployment | Vercel | Hosting, CI/CD, edge functions |
| ORM / Query | Drizzle ORM | Type-safe database queries |
