# Web Scraping — Firecrawl

Scrape any web page and get clean markdown. Handles JavaScript rendering, anti-bot protection, and content extraction.

**Gateway:** `https://firecrawl.services.sapiom.ai`

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const FIRECRAWL = "https://firecrawl.services.sapiom.ai";
```

## Scrape a Page

```js
const res = await safeFetch(`${FIRECRAWL}/v2/scrape`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://news.ycombinator.com",
    formats: ["markdown"],
  }),
});

const data = await res.json();
const markdown = data.data.markdown;
const title = data.data.metadata.title;
```

## Extract Structured Data

```js
const res = await safeFetch(`${FIRECRAWL}/v2/scrape`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com/product",
    formats: ["extract"],
    extract: {
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          price: { type: "number" },
        },
        required: ["title", "price"],
      },
    },
  }),
});

const extracted = (await res.json()).data.extract;
```

## Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `formats` | — | `["markdown"]`, `["html"]`, `["extract"]`, or combinations |
| `onlyMainContent` | `true` | Strip nav, footer, ads |
| `waitFor` | — | Wait ms for JS to render |
| `timeout` | 30000 | Request timeout ms |

## Gotchas

- **`formats` is an array** — `["markdown"]` not `"markdown"`
- **Content is in `data.data`** — response wraps in `{ success, data: { markdown, metadata } }`
- **Large pages** — markdown can be very long; truncate before sending to LLM
