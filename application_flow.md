# Functional Product Document

## Trusted Analytics Copilot for Governed Retail Insights

## 1. Document Purpose

This document defines the functional scope, user journeys, screens, workflows, user stories, and system behavior for a trusted internal analytics copilot that answers governed business questions over structured retail datasets.

The purpose of the product is to allow business users to ask natural-language analytical questions while ensuring that every response is based only on approved datasets, approved metric definitions, controlled query logic, and clearly explained methodology.

This product is not a general chatbot. It is a governed analytics system designed for trust, repeatability, explainability, and exportable business reporting.

---

## 2. Product Vision

Build an internal analytics agent that helps users explore retail execution and performance data through natural language, while preserving strict control over:

* which datasets can be used
* which metrics can be used
* how queries are constructed
* how results are explained
* how outputs are exported and reused

The product should behave like a highly disciplined analytics assistant, not an open-ended AI model.

---

## 3. Primary Goal

Enable users to ask questions such as:

* Show brand share change for spirits in Dubai across the last 3 waves
* Summarise category performance for Heathrow
* Compare two brands across regions and time periods
* Where are the biggest execution gaps?
* Show me distribution of brand / SKU in Asia and MENA

And receive:

* a concise summary
* structured findings
* a governed data table
* charts where available
* methodology / metric definitions
* data coverage and freshness notes
* downloadable exports

---

## 4. Product Principles

### 4.1 Trust First

The system must never invent metrics, unsupported logic, or unavailable data.

### 4.2 Governed Intelligence

The AI interprets intent, but does not independently decide how metrics are calculated.

### 4.3 Explainability by Default

Every result must show how it was produced, what filters were applied, and what data was included.

### 4.4 Structured Outputs Over Freeform Answers

The system should prioritise tables, clear sections, governed summaries, and exports over long conversational text.

### 4.5 Business-Ready Analysis

The output should be useful for internal stakeholders, analysts, category managers, and leadership without requiring heavy manual clean-up.

---

## 5. In-Scope for MVP

The MVP should support:

* 10 to 20 approved analytics use cases
* approved datasets only
* approved dimensions and filters only
* approved metric library only
* controlled query execution
* result summaries
* data tables
* charts for selected query types
* methodology and coverage notes
* CSV / Excel export
* conversation history for current session

---

## 6. Out of Scope for MVP

The MVP should not include:

* unrestricted SQL generation
* ad hoc metric creation by end users
* freeform dashboard building
* writeback into source systems
* external user access
* advanced permissions by row-level region unless explicitly requested later
* predictive modelling unless specifically defined
* automated alerts unless explicitly added later

---

## 7. Target Users

### 7.1 Business Analyst

Needs fast answers to common questions without manually writing queries.

### 7.2 Category / Brand Manager

Needs summary insights on brand, category, region, market, wave, and execution performance.

### 7.3 Regional / Market Lead

Needs comparative views across geographies, time periods, and retail channels.

### 7.4 Data / Insights Team

Needs a trusted self-service layer that reduces repetitive request load while keeping governance intact.

### 7.5 Admin / Governance Owner

Needs to control which datasets, metrics, query templates, and definitions are allowed.

---

## 8. Core Functional Modules

### 8.1 Query Intake and Intent Parsing

Accept user questions in natural language and identify:

* analysis intent
* requested entity level
* geography / region filters
* category / brand / SKU filters
* time period / wave filters
* comparison intent
* output type intent

### 8.2 Approved Metric Resolution

Map the user’s request to only approved metrics such as:

* share of shelf
* facings
* distribution
* rate of execution
* brand share
* SKU presence
* category performance

### 8.3 Controlled Query Builder

Construct queries only through governed logic using approved templates, filters, dimensions, and measures.

### 8.4 Result Processing and Validation

Check that returned data meets minimum standards for:

* data availability
* filter validity
* result completeness
* confidence in interpretation
* consistency with requested scope

### 8.5 Insight Generation

Generate summary and key findings only from returned result data and metadata.

### 8.6 Output Composer

Build a structured response with:

* summary
* key findings
* charts
* data table
* filters applied
* coverage note
* freshness note
* methodology
* export actions

### 8.7 Governance and Admin Controls

Allow internal admins to manage:

* approved metrics
* metric definitions
* approved dimensions
* dataset availability
* approved query templates
* glossary / business language mappings

---

## 9. High-Level User Flow

1. User lands on analytics copilot workspace
2. User enters question in natural language
3. System interprets request
4. System maps request to approved use case or governed query template
5. System validates filters, dimensions, and metrics
6. System runs controlled query
7. System receives structured result set
8. System generates summary and findings from result set
9. System displays response with methodology and coverage notes
10. User optionally refines query, changes filters, or exports output

---

## 10. Key Screens

## Screen 1: Home / Query Workspace

### Purpose

Primary entry point where users ask questions and review recent analysis.

### Layout

* top navigation bar
* page title and short description
* query input box
* suggested prompts
* recent queries list
* saved reports section
* optional dataset status banner

### Components

#### A. Header

Shows product title such as Trusted Analytics Copilot and a short subtitle like Ask governed questions across approved retail datasets.

#### B. Query Input Panel

Contains:

* large natural language text box
* submit button
* optional example prompts
* optional voice or paste support in later phases

#### C. Suggested Questions

Examples based on approved use cases, such as:

* Compare two brands across MENA over the last 3 waves
* Show execution gaps by category in Heathrow
* Summarise spirits performance in Dubai

#### D. Recent Analysis

Shows previous questions in current user scope with status and timestamp.

#### E. Saved Reports Shortcut

Shows recently saved or exported reports for quick reopening.

### Functions

* accept and submit question
* route user to result screen
* let user reuse prior prompts
* let user access saved reports

### User Stories

* As a business user, I want example prompts so I know how to ask supported questions.
* As a returning user, I want to see recent analysis so I can reopen work quickly.
* As a user, I want to know the system uses only approved logic so I can trust it.

---

## Screen 2: Query Interpretation / Pre-Execution Review

### Purpose

Allow users to see how the system understood the question before or alongside execution, especially when ambiguity exists.

### Layout

* original question banner
* interpreted query card
* requested metrics section
* filters section
* dimensions section
* date / wave scope section
* validation messages
* run analysis button

### Components

#### A. Parsed Intent Card

Shows how the system translated the question into structured intent.
Example:

* Metric: Brand Share
* Category: Spirits
* Market: Dubai
* Time Scope: Last 3 waves
* Grain: Brand by wave

#### B. Approved Definitions Section

Shows which approved metric definitions will be used.

#### C. Ambiguity / Clarification State

If the question could map to more than one approved interpretation, the system shows controlled options.
Example:

* Did you mean brand share by facings or brand share by shelf space?

#### D. Validation Status

Confirms whether the request is supported, partially supported, or blocked.

### Functions

* resolve ambiguous requests
* show approved interpretation
* prevent unsupported queries from running
* confirm filter mapping

### User Stories

* As a user, I want to see how the system interpreted my question so I can catch mistakes early.
* As a user, I want controlled clarifications instead of silent assumptions.
* As a governance owner, I want unsupported queries blocked before execution.

---

## Screen 3: Analysis Result Screen

### Purpose

Display the final governed answer in a structured and reusable format.

### Layout

* query summary header
* executive summary block
* key findings block
* chart section
* data table section
* methodology / definitions panel
* data coverage and freshness panel
* export actions
* refinement prompts

### Components

#### A. Query Header

Includes:

* original user question
* interpreted analysis title
* timestamp
* run status

#### B. Executive Summary

Short, business-readable explanation of what happened in the data.
Example:
Brand share for spirits in Dubai declined across the last three waves, with the largest drop occurring between Wave 2 and Wave 3. Two brands drove most of the decline, while premium segments remained relatively stable.

#### C. Key Findings

Bullet-style structured findings such as:

* Brand A decreased by X percentage points
* Brand B gained distribution in Wave 3
* Execution gaps were highest in modern trade stores
* Coverage in Wave 1 was lower than later waves

#### D. Chart Panel

Possible chart types:

* trend line by wave
* bar comparison by region
* stacked share chart by brand
* gap heatmap by market and category

The chart panel should only show chart types approved for the selected use case.

#### E. Data Table

Structured table with columns based on the result grain.
Examples:

* wave, brand, share
* region, category, distribution
* market, SKU, facings, execution score

#### F. Methodology / Definitions Panel

Shows:

* metric definitions used
* aggregation logic
* grouping level
* exclusions if any
* approved calculation note

#### G. Data Coverage Panel

Shows:

* regions included
* waves included
* sample or observation coverage where relevant
* missing data note if applicable
* source dataset used

#### H. Freshness Panel

Shows last refresh date or warehouse data freshness.

#### I. Export Actions

Buttons for:

* export CSV
* export Excel
* copy summary
* save report

### Functions

* render structured answer
* allow export
* show chart where supported
* show methodology and trust notes
* allow refinement or follow-up actions

### User Stories

* As a business user, I want a concise summary and a detailed table so I can both understand and verify the answer.
* As a manager, I want charts to quickly see trends and changes.
* As an analyst, I want methodology notes so I can trust the calculation.
* As a user, I want export options so I can share results with stakeholders.

---

## Screen 4: Unsupported / Partial Support State

### Purpose

Handle requests that cannot be fully answered within governed scope.

### Layout

* message banner
* reason for limitation
* supported alternatives
* suggested reformulations
* approved prompt examples

### Behavior

If a user asks for something unsupported, the system should not hallucinate or improvise.
Instead, it should explain:

* what part of the request is unsupported
* what metrics or dimensions are available
* how the user can reframe the request

### Examples

* The requested metric is not in the approved metric library.
* The requested geography is not available in the selected dataset.
* The query combines dimensions that are not supported together.

### User Stories

* As a user, I want the system to tell me clearly why it cannot answer a question instead of giving a risky answer.
* As a governance owner, I want unsupported requests safely redirected to approved paths.

---

## Screen 5: Saved Reports / History

### Purpose

Allow users to reopen previous governed analyses and exported outputs.

### Layout

* filter bar
* report list
* report metadata
* reopen button
* export history

### Fields per item

* report title
* original question
* created by
* created date
* filters used
* output type
* export status

### Functions

* reopen prior analysis
* duplicate and rerun with new filters
* view export history

### User Stories

* As a user, I want to revisit prior reports without rebuilding them from scratch.
* As a manager, I want consistent reports that can be rerun over time.

---

## Screen 6: Admin Governance Console

### Purpose

Provide internal control over metrics, definitions, templates, approved datasets, and business glossary mappings.

### Layout

* admin side navigation
* approved metrics section
* query template section
* dataset registry section
* business term mapping section
* audit log section

### Core Areas

#### A. Metric Library

Admin can view and manage:

* metric name
* business definition
* calculation rule reference
* allowed dimensions
* allowed filters
* chart compatibility
* active / inactive status

#### B. Query Template Library

Admin can manage approved templates such as:

* compare brands across regions and periods
* summarise category performance by market
* show distribution by brand and SKU
* rank execution gaps by geography

#### C. Dataset Registry

Admin can manage:

* approved dataset name
* availability status
* refresh frequency
* coverage description
* owner

#### D. Business Vocabulary Mapping

Admin can map business phrasing to approved terms.
Example:

* shelf share → share of shelf
* OSA → on shelf availability
* gulf markets → MENA subset if approved

#### E. Audit Log

Shows:

* who ran which query
* which template was used
* what filters were applied
* whether a result was exported
* whether any request was blocked

### User Stories

* As an admin, I want to control which metrics and templates the assistant can use.
* As a governance owner, I want an audit trail for trust and compliance.
* As a data owner, I want to deactivate outdated definitions without changing the user interface.

---

## 11. Core Functional Workflows

## Workflow A: Ask and Answer a Supported Question

1. User enters a supported question
2. System parses intent
3. System resolves approved metrics and filters
4. System chooses governed query template
5. System executes controlled query
6. System validates result completeness
7. System generates summary and structured findings
8. System displays result with chart, table, methodology, and coverage
9. User exports report if needed

## Workflow B: Resolve Ambiguity Before Running

1. User enters ambiguous question
2. System detects multiple valid interpretations
3. System presents controlled clarification choices
4. User selects intended meaning
5. System continues with supported execution path

## Workflow C: Reject Unsupported Request Safely

1. User enters unsupported question
2. System validates against approved metric library and template registry
3. System blocks unsafe execution
4. System shows explanation and reformulation suggestions

## Workflow D: Export Results

1. User views completed result
2. User clicks export CSV or export Excel
3. System packages current result table and metadata
4. File download begins
5. Export action is logged

## Workflow E: Save Report

1. User clicks save report
2. System stores query text, resolved interpretation, filters, and result metadata
3. Saved report appears in history

---

## 12. Functional Requirements

### 12.1 Query Input Requirements

* The system must accept natural language questions.
* The system must support approved business terminology and synonyms.
* The system must detect missing required elements where necessary.
* The system must preserve the original question for auditability.

### 12.2 Intent Mapping Requirements

* The system must map user requests only to approved use cases.
* The system must identify metrics, dimensions, filters, comparison axes, and time scope.
* The system must not generate open-ended logic outside approved mappings.

### 12.3 Metric Governance Requirements

* The system must use only approved metrics.
* Each metric must have a defined business definition and approved calculation method.
* The system must show the metric definitions used in the response.

### 12.4 Query Execution Requirements

* The system must execute only governed query patterns.
* The system must use structured parameters rather than unrestricted user-generated query logic.
* The system must validate requested filters before execution.

### 12.5 Result Generation Requirements

* The system must produce a structured response format.
* The system must generate summaries only from returned data.
* The system must not claim findings that are unsupported by the result set.

### 12.6 Trust and Explainability Requirements

* The system must show filters applied.
* The system must show data coverage.
* The system must show data freshness.
* The system must show methodology notes.
* The system must show limitations where relevant.

### 12.7 Export Requirements

* The system must support CSV export in MVP.
* The system must support Excel export in MVP.
* Exported files should include result data and enough metadata for reuse where feasible.

### 12.8 Chart Requirements

* The system should render charts for approved result types.
* Chart types must be governed and chosen based on query structure.
* Charts must not imply unsupported data transformations.

### 12.9 Audit and Logging Requirements

* The system must log query requests.
* The system must log resolved query interpretation.
* The system must log execution status and export actions.
* The system must log blocked requests.

---

## 13. Response Structure Standard

Every successful result should contain the following sections in the same consistent order:

### 13.1 Summary

A short executive explanation in plain business language.

### 13.2 Key Findings

A structured list of the most important changes, comparisons, or gaps.

### 13.3 Chart

Shown only when supported.

### 13.4 Data Table

Detailed governed result grid.

### 13.5 Filters Applied

Selected geography, category, brand, SKU, channel, wave, and any other active constraints.

### 13.6 Method / Definitions

Approved metric definitions and calculation notes.

### 13.7 Data Coverage

Which data was included and any relevant completeness note.

### 13.8 Freshness

Warehouse refresh or source refresh information.

### 13.9 Export Actions

CSV / Excel download options.

---

## 14. Example Supported Use Cases

### Use Case 1

Show brand share change for spirits in Dubai across the last 3 waves.

### Use Case 2

Summarise category performance for Heathrow.

### Use Case 3

Compare two brands across regions and time periods.

### Use Case 4

Where are the biggest execution gaps?

### Use Case 5

Show distribution of brand / SKU in Asia and MENA.

### Use Case 6

Rank categories by change in facings over time.

### Use Case 7

Compare brand execution between airport and non-airport locations.

### Use Case 8

Show top gainers and decliners by market and wave.

These use cases should each map to one or more approved query templates.

---

## 15. User Stories by Role

## Business User Stories

* As a business user, I want to ask analytical questions in plain language so I do not need to write SQL.
* As a business user, I want concise summaries so I can quickly understand performance.
* As a business user, I want exportable tables so I can share outputs in meetings.
* As a business user, I want charts so I can see trends visually.

## Analyst User Stories

* As an analyst, I want to verify the filters and metric definitions used so I can trust the result.
* As an analyst, I want structured tables at the right grain so I can reuse them.
* As an analyst, I want unsupported requests blocked rather than answered badly.

## Admin User Stories

* As an admin, I want to manage approved metrics and templates so the system stays governed.
* As an admin, I want a clear audit trail for every query and export.
* As an admin, I want to update vocabulary mappings so the system understands business phrasing safely.

## Governance Owner User Stories

* As a governance owner, I want every response to include methodology, coverage, and freshness notes.
* As a governance owner, I want the system to avoid hallucinated or inferred data.
* As a governance owner, I want query behavior to remain controlled even when users ask questions conversationally.

---

## 16. Error and Edge Case Handling

### 16.1 No Data Returned

If the query is valid but no data is available for the selected filters, the system should state that clearly and show the filters used.

### 16.2 Partial Data Coverage

If some requested markets, brands, waves, or SKUs are missing, the system should surface the limitation explicitly.

### 16.3 Metric Not Approved

If the user requests an unsupported metric, the system should block execution and suggest approved alternatives.

### 16.4 Ambiguous Terms

If a term maps to multiple business concepts, the system should ask a controlled clarification question.

### 16.5 Incompatible Dimension Combination

If the request combines dimensions that are not valid together, the system should explain the incompatibility and suggest a supported version.

### 16.6 Stale Data Warning

If the underlying data freshness is older than expected, the system should display a warning.

---

## 17. Non-Functional Product Expectations

Although this document is functional rather than technical, the product behavior should reflect the following qualities:

* high trust
* consistent response structure
* fast enough for interactive use
* strong auditability
* clean internal governance
* reusable output format
* minimal risk of unsupported reasoning

---

## 18. MVP Release Definition

The MVP can be considered complete when:

* users can submit natural-language questions from an approved set of use cases
* the system maps requests to governed metrics and templates
* structured responses are generated consistently
* tables and charts are shown for supported cases
* methodology, coverage, filters, and freshness notes are always visible
* exports to CSV and Excel work reliably
* unsupported requests are blocked safely
* admin users can manage the core metric and template registry

---

## 19. Future Enhancements

Possible later additions:

* saved dashboards built from approved query blocks
* scheduled report delivery
* role-based access by market or region
* presentation-ready export layouts
* narrative comparison between current and prior periods
* anomaly or gap highlighting under governance rules
* benchmark packs and scorecards
* drill-down from brand to SKU to store cluster where supported

---

## 20. Suggested Delivery Framing for Client Discussion

This product should be presented to the client as a governed analytics assistant rather than a generic AI chatbot.

The strongest value proposition is:

* trusted answers from approved data
* strict metric consistency
* explainable outputs
* reduced manual analytics effort
* reusable structured reporting

That framing aligns with the client’s emphasis on accuracy, trust, and data integrity.

---

## 21. Closing Note

The success of this product depends less on conversational sophistication and more on disciplined control of metrics, query behavior, and result explanation. The AI layer should act as an orchestration and interpretation layer above a governed analytics foundation, not as an uncontrolled reasoning engine.
