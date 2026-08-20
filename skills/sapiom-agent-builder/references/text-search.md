# Text Search — Upstash Search

Full-text search with optional AI reranking for indexing and querying documents.

## Architecture

Upstash Search uses a **two-tier architecture**:

1. **Management plane** (`https://upstash.services.sapiom.ai`) — provision and delete search indexes
2. **Data plane** (`https://{indexId}.search.data.sapiom.ai`) — upsert, search, and manage documents for a specific index

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
const res = await safeFetch(`${MGMT}/v1/search/indexes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "my-search-index",
    region: "us-central1",   // optional
  }),
});

const index = await res.json();
// index.id → e.g., "src_abc123"
const SEARCH = `https://${index.id}.search.data.sapiom.ai`;
```

## Step 2: Upsert Documents

Index name (`articles`, `products`, etc.) is part of the path.

```js
await safeFetch(`${SEARCH}/upsert/articles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    {
      id: "doc-1",
      content: { text: "Introduction to vector databases" },  // content.text, not a plain string
      metadata: { tags: ["database", "vector"] },
    },
    {
      id: "doc-2",
      content: { text: "Redis as a caching layer" },
      metadata: { tags: ["redis", "cache"] },
    },
  ]),
});
```

## Step 3: Search Documents

```js
// Basic search
const res = await safeFetch(`${SEARCH}/search/articles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "AI developments" }),
});

const data = await res.json();
// data = [{ id, content, score, metadata }, ...]
```

```js
// With reranking
const res = await safeFetch(`${SEARCH}/search/articles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "AI developments", reranking: true }),
});
```

Reranking uses AI to re-score results for higher relevance. Worth enabling for user-facing search.

## Other Data Plane Operations

```js
// Fetch documents by ID
await safeFetch(`${SEARCH}/fetch/articles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["doc-1", "doc-2"] }),
});

// Delete documents
await safeFetch(`${SEARCH}/delete/articles`, {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["doc-1"] }),
});

// Range scan
await safeFetch(`${SEARCH}/range/articles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ cursor: "0", limit: 10 }),
});
```

## Delete an Index

```js
await safeFetch(`${MGMT}/v1/search/indexes/${index.id}`, { method: "DELETE" });
```

## Gotchas

- **Use `content.text`** — the document body is `{ content: { text: "..." } }`, not `{ content: "..." }`
- **Index name in path** — every operation includes the index name (e.g., `/search/articles`, `/upsert/articles`). Different index names within the same resource act as separate namespaces.
- **Use for keyword search** — for semantic/meaning-based search, use Upstash Vector instead
- **Reranking adds cost** — only enable for user-facing search where relevance quality matters
- **Index before searching** — documents must be upserted before they appear in results
- **Complement with vector search** — index the same content in both for hybrid search
- **Resource ID is stable** — store `index.id` if you need to reconnect to the same index later
