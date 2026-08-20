# Redis Cache — Upstash Redis

Fast key-value store for caching, session storage, rate limiting, and ephemeral state.

## Architecture

Upstash Redis uses a **two-tier architecture**:

1. **Management plane** (`https://upstash.services.sapiom.ai`) — provision and delete Redis databases
2. **Data plane** (`https://{databaseId}.redis.data.sapiom.ai`) — execute Redis commands against a specific database

You must provision a database first, then use the returned ID to construct the data plane URL.

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,
});
const MGMT = "https://upstash.services.sapiom.ai";
```

## Step 1: Provision a Database

```js
const res = await safeFetch(`${MGMT}/v1/redis/databases`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "my-cache",
    region: "us-east-1",   // optional
  }),
});

const db = await res.json();
// db.id → e.g., "rdb_abc123"
const REDIS = `https://${db.id}.redis.data.sapiom.ai`;
```

## Step 2: Use Redis Commands

Upstash Redis exposes a REST API that mirrors Redis commands.

### GET / SET

```js
// GET a key
const res = await safeFetch(`${REDIS}/get/my-key`);
const data = await res.json();
// { result: "my-value" } or { result: null }

// SET a key
await safeFetch(`${REDIS}/set/my-key/my-value`, { method: "POST" });
```

### DELETE

```js
await safeFetch(`${REDIS}/del/my-key`, { method: "POST" });
```

### Pipeline (multiple commands in 1 request)

```js
const res = await safeFetch(`${REDIS}/pipeline`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    ["SET", "k1", "v1"],
    ["SET", "k2", "v2"],
    ["GET", "k1"],
  ]),
});
const results = await res.json();
// Array of results, one per command
```

### Transaction (MULTI/EXEC)

```js
const res = await safeFetch(`${REDIS}/multi-exec`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    ["SET", "counter", "0"],
    ["INCR", "counter"],
    ["GET", "counter"],
  ]),
});
```

### Command-in-Body Format

```js
// Alternative: POST / with command as JSON array body
await safeFetch(`${REDIS}/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(["SET", "my-key", "my-value"]),
});
```

## Delete a Database

```js
await safeFetch(`${MGMT}/v1/redis/databases/${db.id}`, { method: "DELETE" });
```

## Use Cases

- **Rate limiting** — `INCR` + `EXPIRE` on a key per user/IP
- **Session caching** — store JSON session data with TTL (`SET key value EX 3600`)
- **Deduplication** — `SETNX` to check if an item was already processed
- **Ephemeral counters** — track in-flight task counts, visit counts, etc.

## Gotchas

- **Prefer Postgres for durable state** — Redis data can be lost if the database is deleted or expires; use Neon Postgres for anything you can't afford to lose
- **Use pipeline for bulk ops** — a pipeline with N commands requires only 1 HTTP round-trip
- **Resource ID is stable** — store `db.id` if you need to reconnect to the same database later
- **TTL on keys** — add `EX {seconds}` to SET commands for automatic expiration; avoids unbounded key growth
