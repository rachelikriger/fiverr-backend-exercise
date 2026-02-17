# Short Links + Tracking + Analytics

MVP for short link creation, redirect tracking, fraud validation, and earnings analytics.

## Folder Structure

```
fiverr-backend-exercise/
├── scripts/
│   └── init.sql              # DB schema (links, clicks)
├── src/
│   ├── config/
│   │   └── db.ts              # PostgreSQL pool
│   ├── db/
│   │   ├── links.repository.ts
│   │   ├── clicks.repository.ts
│   │   └── stats.repository.ts
│   ├── services/
│   │   ├── fraud.service.ts   # simulateFraudValidation (injectable)
│   │   ├── links.service.ts
│   │   └── stats.service.ts
│   ├── controllers/
│   │   ├── links.controller.ts
│   │   └── stats.controller.ts
│   ├── routes/
│   │   ├── links.routes.ts
│   │   └── stats.routes.ts
│   ├── middlewares/
│   │   └── error.middleware.ts
│   ├── __tests__/
│   │   ├── globalSetup.ts
│   │   ├── setup.ts
│   │   ├── links.test.ts
│   │   ├── stats.test.ts
│   │   └── validation.test.ts
│   ├── app.ts
│   └── server.ts
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## How to Run

### 1. Start PostgreSQL

```bash
docker compose up -d
```

The schema (`scripts/init.sql`) runs automatically on first container start. For an existing volume, run it manually:
```bash
docker exec -i fiverr-backend-exercise-postgres-1 psql -U postgres -d postgres < scripts/init.sql
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run tests

```bash
npm test
```

### 4. Start the server

```bash
npm start
```

Or for development with hot reload:

```bash
npm run dev
```

## API Endpoints

### POST /links

Create a short link. Idempotent: same `sellerId` + `targetUrl` returns the existing short URL.

**Request:**
```bash
curl -X POST http://localhost:3000/links \
  -H "Content-Type: application/json" \
  -d '{"sellerId":"seller-123","targetUrl":"https://example.com/my-page"}'
```

**Response (201):**
```json
{"shortUrl":"https://localhost:3000/l/abc12XYZ"}
```

### GET /l/:shortCode

Redirects (302) to the original target URL. Runs fraud validation (500ms, 50% pass); valid clicks earn $0.05 credit for the seller.

```bash
curl -L -w "%{url_effective}\n" http://localhost:3000/l/abc12XYZ
```

Or without following redirects (to see 302):
```bash
curl -I http://localhost:3000/l/abc12XYZ
```

### GET /stats

Paginated list of all links with click counts and earnings.

**Query params:** `page` (default 1), `limit` (default 10, max 100)

```bash
curl "http://localhost:3000/stats?page=1&limit=10"
```

**Response (200):**
```json
[
  {
    "sellerId": "seller-123",
    "targetUrl": "https://example.com/my-page",
    "shortCode": "abc12XYZ",
    "totalValidClicks": 5,
    "totalEarnings": 0.25,
    "monthlyBreakdown": [
      {"month": "2025-02", "validClicks": 3, "earnings": 0.15},
      {"month": "2025-01", "validClicks": 2, "earnings": 0.1}
    ]
  }
]
```

## Environment

Copy `.env.example` to `.env` and adjust:

| Variable   | Default             | Description                    |
|-----------|---------------------|--------------------------------|
| DB_HOST   | localhost           | PostgreSQL host                |
| DB_PORT   | 5432                | PostgreSQL port                |
| DB_NAME   | postgres            | Database name                  |
| DB_USER   | postgres            | Database user                  |
| DB_PASSWORD | postgres          | Database password              |
| PORT      | 3000                | Server port                    |
| BASE_URL  | https://localhost:3000 | Base URL for short links   |

## Database Schema

- **links**: `id`, `seller_id`, `target_url`, `short_code`, `created_at`  
  - UNIQUE(`seller_id`, `target_url`), UNIQUE(`short_code`)
- **clicks**: `id`, `link_id`, `is_valid`, `created_at`  
  - FK to `links`, `is_valid` from fraud validation
