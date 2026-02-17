# Manifest

## What Works

- **POST /links** — Creates short links. Idempotent: same `sellerId` + `targetUrl` returns the existing short URL.
- **GET /l/:shortCode** — Redirects (302) to the target URL and records each click.
- **Fraud validation** — Simulated with 500ms delay and 50% pass probability. Injectable for tests.
- **Click tracking** — Every redirect is logged; valid clicks earn $0.05 credit.
- **GET /stats** — Paginated list of links with total valid clicks, total earnings, and monthly breakdown.
- **Monthly aggregation** — Stats include per-month valid clicks and earnings.
- **Unit tests** — Vitest + Supertest cover links, stats, validation, and pagination.

## What Is Missing

Nothing required by the exercise is missing. All specified features are implemented and working.

## Database Justification

PostgreSQL fits this use case well:

- **Relational model** — Links and clicks map cleanly to tables with foreign keys.
- **Aggregations** — `GROUP BY` by month for monthly breakdown is straightforward.
- **Consistency** — ACID transactions keep click counts and earnings consistent.
- **Financial-like tracking** — Strong consistency matters when tracking earnings.

SQLite or NoSQL could work for a toy demo, but PostgreSQL gives a solid base for real tracking and analytics.

## Tradeoffs & Architectural Decisions

**Layers:** Routes → Controllers → Services → Repositories. Each layer has a clear responsibility: routes map URLs, controllers handle HTTP and validation, services hold business logic, repositories talk to the database.

**Dependency injection:** The fraud validator is injected into the links service. In production it would be a real fraud check; in tests it's a mock that always returns `true` or `false`. This keeps tests fast and deterministic.

**Business logic in services:** Controllers stay thin (parse input, validate, call service, format response). Services own the rules (idempotency, short code generation, earnings calculation).

**Tradeoff:** The design favors simplicity and readability over scalability. A high-traffic system would need caching, async workers for click processing, and possibly denormalized stats tables. For an MVP, this structure is easy to reason about and extend.

## AI Usage & Prompts

AI was used to scaffold the project structure, validate the layered architecture, refine specific functions (idempotency logic, stats aggregation), and create documentation.

**Main prompts used:**

```
Goal: implement ONLY the required MVP for the “Short Links + Tracking + Analytics” exercise.

Important:
1) Remove/delete/ignore any code, files, layers, or endpoints that are NOT directly required by the exercise.
2) Focus only on what’s needed to finish fast with clean SOLID code and unit-testable core.
3) Each link MUST be tied to an owner/sellerId to attribute credits properly.

Functional requirements:
A) POST /links
- body: { sellerId: string, targetUrl: string }
- returns a unique shortUrl (e.g. https://localhost:3000/l/{shortCode})
- if multiple requests come with the same sellerId + targetUrl, return the existing shortUrl (idempotent).

B) GET /l/:shortCode
- redirects to the original targetUrl (302)
- award $0.05 credit ONLY if fraud validation passes:
  * simulateFraudValidation(): Promise<boolean>
  * takes 500ms
  * returns true/false with 50% probability each
- when validation is true: store a valid click with timestamp and accumulate earnings for that seller/link.

C) GET /stats
- returns a paginated list of all generated links (?page=&limit=)
- for each link return:
  {
    sellerId,
    targetUrl,
    shortCode,
    totalValidClicks,
    totalEarnings,
    monthlyBreakdown: [{ month: "YYYY-MM", validClicks, earnings }]
  }
- monthlyBreakdown is grouped by month using timestamps of valid clicks.

DB:
- Use PostgreSQL via docker-compose.
- Minimal schema:
  * links(id, seller_id, target_url, short_code, created_at) with UNIQUE(seller_id, target_url) and UNIQUE(short_code)
  * clicks(id, link_id, is_valid, created_at)

Architecture:
- Simple 3 layers: routes -> controllers -> services (+ db/repositories)
- Inject simulateFraudValidation into the service so unit tests don’t rely on randomness.
- Basic validation + error handling (non-empty sellerId/targetUrl, targetUrl must be a valid URL).

Tests (unit):
- Core logic tests:
  1) create link and prevent duplicates (same sellerId+targetUrl)
  2) redirect returns 302 to targetUrl
  3) when fraud=true a valid click is stored and stats change
  4) GET /stats returns correct pagination and correct monthly aggregation from seeded clicks.

Performance:
- In GET redirect you may redirect immediately and record the click async after fraud simulation (if easy). Otherwise validate first then redirect—main goal is correctness.

Please provide:
- final folder structure
- full code for all required files
- SQL migration / init script
- curl examples for each endpoint
- how to run (docker compose up + npm test + npm start)

```
