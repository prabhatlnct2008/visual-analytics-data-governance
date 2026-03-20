# Implementation Phases

## Trusted Analytics Copilot — Next.js + Vercel Postgres

---

## Phase 1: Foundation and Contracts

### Objectives

- Establish project structure, tooling, and deployment pipeline
- Define all typed schemas and contracts before implementation
- Set up Vercel Postgres with Drizzle ORM

### Deliverables

- Next.js 14+ project scaffold with App Router
- Vercel Postgres connection and Drizzle ORM configuration
- TypeScript type definitions for all core domain objects
- Database schema migrations for foundation tables
- ESLint, Prettier, and project configuration
- CI/CD via Vercel Git integration

### Dependencies

- Vercel account with Postgres provisioned
- Anthropic API key for Claude integration

### Risks

- Vercel Postgres connection limits may require pooling configuration early
- Drizzle ORM schema must match the analytical data model precisely

### Test Criteria

- Project builds and deploys to Vercel successfully
- Database migrations run cleanly
- Type definitions compile without errors

---

## Phase 2: Data Model and Metric Registry

### Objectives

- Implement the analytical data model (facts and dimensions) in Postgres
- Build the metric registry as a governed database table
- Seed reference data for dimensions and sample analytical data

### Deliverables

- Fact tables: `fact_observations` (wave × market × store × category × brand × SKU level)
- Dimension tables: `dim_categories`, `dim_brands`, `dim_skus`, `dim_regions`, `dim_markets`, `dim_stores`, `dim_waves`
- Metric registry table: `metric_definitions` with all governance fields
- Business vocabulary mapping table: `vocabulary_mappings`
- Dataset registry table: `dataset_registry`
- Seed scripts with representative sample data
- Database migration files

### Dependencies

- Phase 1 complete (project scaffold, DB connection)

### Risks

- Grain mismatches between fact table and metric expectations
- Missing dimension relationships that block valid queries

### Test Criteria

- All tables created with correct schemas
- Seed data loads without errors
- Basic queries return expected results at correct grain
- Metric registry contains all 7 approved metrics with complete definitions

---

## Phase 3: Query Governance Layer

### Objectives

- Build the governed query template system
- Implement parameterised query builders for each supported use case
- Create validation logic for filters, dimensions, and metric combinations

### Deliverables

- Query template registry table: `query_templates`
- Query builder modules for each supported intent type
- Filter validation logic (valid dimensions, valid filter values, compatible combinations)
- Query parameter schemas with TypeScript types
- Unsupported request detection logic

### Dependencies

- Phase 2 complete (data model, metric registry)

### Risks

- Query templates may not cover edge cases in user phrasing
- Filter validation must handle partial/missing filter gracefully

### Test Criteria

- Each of the 8 example use cases has a working query template
- Invalid filter combinations are rejected with clear messages
- Query builders produce correct SQL for each supported intent
- Unsupported intents are identified and blocked

---

## Phase 4: AI Orchestration Layer

### Objectives

- Integrate Claude API for intent classification and slot extraction
- Build the controlled orchestration pipeline: parse → validate → execute → narrate
- Implement ambiguity detection and controlled clarification

### Deliverables

- Claude API integration with structured tool-calling
- Intent classifier that maps user questions to approved query templates
- Slot extractor for metrics, dimensions, filters, and time scope
- Disambiguation flow for ambiguous requests
- Response narrator that generates summaries from structured results only
- Prompt templates (short, bounded, schema-driven)

### Dependencies

- Phase 3 complete (query governance, validation)
- Anthropic API key configured

### Risks

- LLM may misclassify intent — mitigated by confidence thresholds and fallback to clarification
- Slot extraction may miss filters — mitigated by pre-execution review

### Test Criteria

- All 8 example use cases correctly classified
- Slots extracted accurately for representative questions
- Ambiguous questions trigger clarification flow
- Unsupported questions are blocked, not hallucinated
- Summaries contain only claims supported by result data

---

## Phase 5: Result Schema and Exports

### Objectives

- Implement the deterministic response envelope
- Build CSV and Excel export functionality
- Create chart specification generation for supported result types

### Deliverables

- Response envelope type: summary, key findings, table, chart spec, filters, coverage, freshness, methodology, warnings, export metadata
- Result assembly module that packages query results into the response envelope
- CSV export endpoint with metadata inclusion
- Excel export endpoint with metadata sheet
- Chart spec generator (Recharts-compatible JSON)
- Methodology note generator from metric definitions

### Dependencies

- Phase 4 complete (orchestration returns structured results)

### Risks

- Chart types must be validated against query type to prevent misrepresentation
- Export files must include enough context for standalone use

### Test Criteria

- Every response matches the response envelope schema
- CSV exports contain data table and filter/methodology metadata
- Excel exports include data sheet and metadata sheet
- Chart specs render correctly for each supported chart type
- Methodology notes accurately reflect metric definitions used

---

## Phase 6: UI / Product Interface

### Objectives

- Build all user-facing screens with Tailwind CSS
- Implement the query workspace, interpretation review, result display, and admin console
- Create a polished, trust-communicating interface

### Deliverables

- **Screen 1**: Home / Query Workspace (query input, suggested prompts, recent queries)
- **Screen 2**: Query Interpretation / Pre-Execution Review (parsed intent, validation status)
- **Screen 3**: Analysis Result Screen (summary, findings, chart, table, methodology, exports)
- **Screen 4**: Unsupported / Partial Support State (safe blocking with alternatives)
- **Screen 5**: Saved Reports / History (report list, reopen, export history)
- **Screen 6**: Admin Governance Console (metric library, templates, datasets, vocabulary, audit log)
- Responsive layout with stable, predictable structure
- Loading and error states

### Dependencies

- Phase 5 complete (response schema, exports, chart specs)

### Risks

- UI must not collapse governance layers into a single prompt-driven flow
- Charts must only render approved types for the query context

### Test Criteria

- All 6 screens render correctly and are navigable
- Query submission flows through the full pipeline to result display
- Export buttons trigger downloads
- Admin console CRUD operations work for metrics, templates, vocabulary
- Unsupported requests show the blocking screen, not a broken state
- Mobile-responsive layout

---

## Phase 7: Testing and Hardening

### Objectives

- Comprehensive test coverage across all layers
- Regression tests for all approved use cases
- Security review and edge case handling

### Deliverables

- Unit tests: metric calculations, query builders, validation logic
- Integration tests: full pipeline from question to response
- Intent mapping tests with representative questions
- Unsupported request tests
- Ambiguity handling tests
- Response schema validation tests
- Export format tests
- Audit log verification tests
- Sample fixture datasets for reproducible testing

### Dependencies

- All prior phases complete

### Risks

- Edge cases in user phrasing may surface unexpected behavior
- Data coverage gaps may produce confusing empty results

### Test Criteria

- All 8 example use cases pass end-to-end
- No metric can be calculated via two different code paths
- No response contains fabricated findings
- All validation rules fire correctly
- Export files are well-formed
- Audit log captures all query events

---

## Phase Summary

| Phase | Focus | Key Output |
|-------|-------|-----------|
| 1 | Foundation | Project scaffold, DB setup, types |
| 2 | Data Model | Facts, dimensions, metric registry |
| 3 | Query Governance | Templates, builders, validation |
| 4 | AI Orchestration | Claude integration, intent mapping |
| 5 | Result & Exports | Response envelope, CSV/Excel, charts |
| 6 | UI | All screens, admin console |
| 7 | Hardening | Tests, regression, security |
