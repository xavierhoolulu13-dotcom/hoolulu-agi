# Vector Storage — Upstash Vector

Store and search embeddings for semantic similarity. Useful for RAG, content deduplication, and recommendation.

## Architecture

Upstash Vector uses a **two-tier architecture**:

1. **Management plane** (`https://upstash.services.sapiom.ai`) — provision and delete vector indexes
2. **Data plane** (`https://{indexId}.vector.data.sapiom.ai`) — upsert, query, and manage vectors for a specific index

You must provision an index first, then use the returned ID to construct the data plane URL.

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,
});
const MGMT = "https://upstash.services.sapiom.ai";
```

## Step 1: Provision an Index

```js
const res = await safeFetch(`${MGMT}/v1/vector/indexes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "my-vector-index",
    region: "us-east-1",        // optional
    dimensions: 1536,            // must match your embedding model output
    similarityFunction: "cosine", // "cosine" | "euclidean" | "dot_product"
  }),
});

const index = await res.json();
// index.id → e.g., "vct_abc123"
const VECTOR = `https://${index.id}.vector.data.sapiom.ai`;
```

**Response shape:**
```json
{
  "id": "vct_abc123",
  "name": "my-vector-index",
  "status": "active",
  "dimensions": 1536,
  "region": "us-east-1"
}
```

## Step 2: Upsert Vectors

Each upsert call takes an array.

```js
// Using pre-computed embeddings
await safeFetch(`${VECTOR}/upsert/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    {
      id: "article-1",
      vector: [0.1, 0.2, ...],   // float array, length must match index dimensions
      metadata: { source: "example.com", date: "2026-02-23" },
    },
  ]),
});
```

```js
// Using auto-embedding (pass `data` string — Upstash embeds for you)
await safeFetch(`${VECTOR}/upsert-data/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    {
      id: "article-1",
      data: "The quick brown fox jumps over the lazy dog",
      metadata: { source: "example.com" },
    },
  ]),
});
```

The namespace (`default`, `ns-alpha`, etc.) isolates vectors within the same index.

## Step 3: Query (Semantic Search)

```js
const res = await safeFetch(`${VECTOR}/query/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    vector: [0.1, 0.2, ...],
    topK: 5,
    includeMetadata: true,
    includeData: true,
  }),
});

const results = await res.json();
// [{ id, score, metadata, data }, ...]
```

## Other Data Plane Operations

```js
// Fetch vectors by ID
await safeFetch(`${VECTOR}/fetch/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["article-1", "article-2"] }),
});

// Delete vectors
await safeFetch(`${VECTOR}/delete/default`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["article-1"] }),
});

// Update metadata
await safeFetch(`${VECTOR}/update/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: "article-1", metadata: { updated: true } }),
});

// Range scan
await safeFetch(`${VECTOR}/range/default`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cursor: "0", limit: 100 }),
});
```

## Delete an Index

```js
await safeFetch(`${MGMT}/v1/vector/indexes/${index.id}`, { method: "DELETE" });
```


## Gotchas

- **`dimensions` must match your embedding model** — 1536 for OpenAI `text-embedding-ada-002`, 3072 for `text-embedding-3-large`
- **Use `upsert-data` for auto-embedding** — no need to generate embeddings yourself
- **Namespace vectors** — use different namespace paths to isolate logical groups within one index; avoids provisioning multiple indexes
- **`topK` max is 1000** — paginate with range for larger result sets
- **Metadata is filterable** — use it to scope searches by source, date, etc.
- **Resource ID is stable** — store `index.id` if you need to reconnect to the same index later
