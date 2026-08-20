# Neon Postgres Database

Provision on-demand PostgreSQL databases via the Sapiom Neon gateway. Each database is a full Neon project with a connection URI — use it from your agent to store structured data, track state across runs, or persist results.

**Base URL:** `https://neon.services.sapiom.ai`

## Create a Database

```js
const res = await safeFetch("https://neon.services.sapiom.ai/v1/databases", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    handle: "my-agent-db",          // optional — unique, LLM-friendly lookup key
    name: "My Agent Database",      // optional — human-readable name
    description: "Stores scraped HN stories", // optional — helps pick the right DB later
    duration: "24h",                // required — "15m" | "1h" | "4h" | "24h" | "7d"
    region: "aws-us-east-1",        // optional — default "aws-us-east-1"
    pgVersion: 17,                  // optional — 15 | 16 | 17 (default 17)
  }),
});

const db = await res.json();
// db.connectionUri → "postgres://user:pass@host/dbname?sslmode=require"
// db.id            → "ndb_abc123"
// db.expiresAt     → "2025-06-02T12:00:00Z"
```

**Response shape:**
```json
{
  "id": "ndb_abc123",
  "handle": "my-agent-db",
  "name": "My Agent Database",
  "description": "Stores scraped HN stories",
  "status": "active",
  "region": "aws-us-east-1",
  "pgVersion": 17,
  "duration": "24h",
  "connectionUri": "postgres://user:pass@host/dbname?sslmode=require",
  "expiresAt": "2025-06-02T12:00:00Z",
  "createdAt": "2025-06-01T12:00:00Z"
}
```

## Get a Database (by ID or Handle)

```js
const res = await safeFetch("https://neon.services.sapiom.ai/v1/databases/my-agent-db");
const db = await res.json();
// Use db.connectionUri to reconnect
```

Accepts either the database ID (`ndb_xxx`) or handle as the path parameter.

## List All Databases

```js
const res = await safeFetch("https://neon.services.sapiom.ai/v1/databases");
const databases = await res.json();
// Returns array of DatabaseResponse, sorted newest first
// Only includes active/provisioning databases (not expired/deleted)
```

## Delete a Database

```js
await safeFetch("https://neon.services.sapiom.ai/v1/databases/my-agent-db", {
  method: "DELETE",
});
```

Irreversible. Accepts ID or handle.

## Available Durations

`"15m"` | `"1h"` | `"4h"` | `"24h"` | `"7d"`

## Using the Connection URI

The `connectionUri` is a standard PostgreSQL connection string. Use any Postgres client:

```js
// With pg (node-postgres) — add "pg" to package.json dependencies
const { Client } = require("pg");

const client = new Client({ connectionString: db.connectionUri });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT,
    score INT,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

await client.query(
  "INSERT INTO stories (title, url, score) VALUES ($1, $2, $3)",
  ["Show HN: Cool Project", "https://example.com", 142]
);

const { rows } = await client.query("SELECT * FROM stories ORDER BY score DESC LIMIT 10");
console.log(rows);

await client.end();
```

## Agent Pattern: Run Tracking

Every agent that uses Postgres should create an `agent_runs` table to track execution history. This gives you observability into when the agent ran, whether it succeeded, and what it produced.

```js
await client.query(`
  CREATE TABLE IF NOT EXISTS agent_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'completed' | 'failed'
    items_processed INT DEFAULT 0,
    error TEXT,
    summary TEXT
  )
`);
```

Use it to bookend every run:

```js
async function main() {
  const client = /* ... connect ... */;

  // Start run
  const { rows } = await client.query(
    "INSERT INTO agent_runs (status) VALUES ('running') RETURNING id"
  );
  const runId = rows[0].id;

  try {
    // ... agent work ...
    let processed = 0;

    // When persisting results, link them back to the run
    await client.query(
      "INSERT INTO results (run_id, data) VALUES ($1, $2)",
      [runId, someData]
    );
    processed++;

    // Complete run
    await client.query(
      `UPDATE agent_runs SET status = 'completed', finished_at = NOW(),
       items_processed = $1, summary = $2 WHERE id = $3`,
      [processed, `Processed ${processed} items`, runId]
    );
  } catch (err) {
    await client.query(
      "UPDATE agent_runs SET status = 'failed', finished_at = NOW(), error = $1 WHERE id = $2",
      [err.message, runId]
    );
    throw err;
  }
}
```

Data tables should include a `run_id` foreign key so you can trace any row back to the run that created it:

```sql
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  run_id INT REFERENCES agent_runs(id),
  -- ... your columns ...
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This makes it easy to query run history (`SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 10`), debug failures, and correlate output with specific runs.

## Agent Pattern: Provision Once, Reconnect Later

Use a **handle** so your agent can find its database across runs without storing the ID:

```js
async function getOrCreateDb(safeFetch) {
  // Try to reconnect to existing DB
  const existing = await safeFetch("https://neon.services.sapiom.ai/v1/databases/my-agent-db");
  if (existing.ok) {
    const db = await existing.json();
    return db.connectionUri;
  }

  // First run — provision a new one
  const res = await safeFetch("https://neon.services.sapiom.ai/v1/databases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: "my-agent-db",
      description: "Persistent storage for my agent",
      duration: "7d",
    }),
  });

  if (!res.ok) throw new Error(`DB provision failed: ${res.status}`);
  const db = await res.json();
  return db.connectionUri;
}
```
