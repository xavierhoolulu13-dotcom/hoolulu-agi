# Compute Patterns

## Orchestrator + Workers

When a periodic task needs to process N items in parallel:

1. Deploy an **orchestrator** as a scheduled job (has the scraping/diffing logic)
2. Deploy a **worker** as a batch job (has the per-item processing logic)
3. Orchestrator triggers worker executions with task payloads

### Example: Monitor + Process

**Orchestrator** (scheduled job, runs every 2h):

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const GATEWAY = "https://blaxel.services.sapiom.ai";

async function main() {
  // 1. Scrape a page for items
  const scrapeRes = await safeFetch("https://firecrawl.services.sapiom.ai/v1/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/items" }),
  });
  const { data } = await scrapeRes.json();

  // 2. Extract items and diff against known items
  const newItems = extractNewItems(data.markdown); // your logic here

  if (newItems.length === 0) {
    console.log("No new items found");
    return;
  }

  // 3. Fan out to worker
  const tasks = newItems.map((item) => ({ item }));
  const execRes = await safeFetch(`${GATEWAY}/v1/jobs/my-worker/executions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tasks }),
  });

  if (!execRes.ok) throw new Error(`Fan-out failed: HTTP ${execRes.status}: ${await execRes.text()}`);
  const execution = await execRes.json();
  console.log(`Triggered ${tasks.length} worker tasks (execution: ${execution.executionId})`);
}

main().catch(console.error);
```

**Worker** (batch job, no schedule):

```js
const { blStartJob } = require("@blaxel/core");

blStartJob(async (args) => {
  const { item } = args;
  console.log(`Processing item: ${JSON.stringify(item)}`);

  // Your per-item logic here (e.g., enrich, analyze, store)
});
```

Worker `package.json` must include `@blaxel/core` in dependencies:

```json
{
  "dependencies": {
    "@sapiom/fetch": "^0.3.0",
    "@blaxel/core": "latest"
  }
}
```

### Deploy Sequence

1. Deploy the worker first (batch job, no schedule):
   ```
   POST /v1/jobs?name=my-worker  (ZIP body, no schedule param)
   ```

2. Deploy the orchestrator (scheduled job):
   ```
   POST /v1/jobs?name=my-orchestrator&schedule=0 */2 * * *  (ZIP body)
   ```

3. The orchestrator runs on schedule and triggers worker executions automatically.

## When to Use Orchestrator + Workers vs. Sequential

- **< 5 items**: just loop sequentially in a single scheduled job
- **5+ items or > 30s per item**: use orchestrator + workers
- Each worker task is isolated — one failure doesn't affect others
- Worker tasks run in parallel, so total time ≈ time for one task (not N × time)
