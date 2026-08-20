# Web Search — Linkup

Search the web for real-time information. Returns relevant URLs and content snippets.

**Gateway:** `https://linkup.services.sapiom.ai`

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const LINKUP = "https://linkup.services.sapiom.ai";
```

## Search

```js
const res = await safeFetch(`${LINKUP}/v1/search`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    q: "latest AI news February 2026",
    depth: "standard",
    outputType: "searchResults",
  }),
});

const data = await res.json();
for (const result of data.results) {
  console.log(`${result.name}: ${result.url}`);
}
```

## Sourced Answer Mode

Get a synthesized answer with citations:

```js
body: JSON.stringify({
  q: "What is the current price of Bitcoin?",
  depth: "standard",
  outputType: "sourcedAnswer",
})
// Returns: { answer: "Bitcoin is currently...", sources: [{ name, url }] }
```

## Options

| Parameter | Values | Description |
|-----------|--------|-------------|
| `q` | string | Search query |
| `depth` | `"standard"`, `"deep"` | Deep searches more sources, costs more |
| `outputType` | `"searchResults"`, `"sourcedAnswer"` | Raw results vs. synthesized answer |

## Gotchas

- **POST, not GET** — search is a POST request with JSON body
- **`q` not `query`** — the parameter name is `q`
- **Content may be truncated** — for full page content, follow up with Firecrawl scrape
