# Message Queue — QStash

Publish messages to HTTP endpoints with guaranteed delivery, retries, and scheduling.

**Gateway:** `https://upstash.services.sapiom.ai`

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,
});
const QSTASH = "https://upstash.services.sapiom.ai";
```

## Publish a Message

Fire-and-forget delivery to an HTTP endpoint.

```js
const res = await safeFetch(`${QSTASH}/v1/qstash/publish/https://my-webhook.example.com/handler`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Upstash-Retries": "3",
    "Upstash-Delay": "30s",
  },
  body: JSON.stringify({ event: "scrape_complete", data: { url: "https://example.com" } }),
});

const data = await res.json();
console.log(`Message ID: ${data.messageId}`);
```

## Enqueue to a Named Queue

Ordered delivery through a named queue. The queue is created automatically on first use.

```js
const res = await safeFetch(`${QSTASH}/v1/qstash/enqueue/my-queue/https://my-webhook.example.com/handler`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ event: "task", payload: { id: 42 } }),
});
```

## Batch Publish

Publish multiple messages in one request.

```js
const res = await safeFetch(`${QSTASH}/v1/qstash/batch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify([
    { destination: "https://my-webhook.example.com/handler-a", body: JSON.stringify({ id: 1 }) },
    { destination: "https://my-webhook.example.com/handler-b", body: JSON.stringify({ id: 2 }) },
  ]),
});
```

## Useful Delivery Headers

| Header | Example | Description |
|--------|---------|-------------|
| `Upstash-Retries` | `"3"` | Number of retry attempts on failure |
| `Upstash-Delay` | `"60s"` | Delay before first delivery |
| `Upstash-Timeout` | `"30s"` | Delivery timeout per attempt |

## Schedules

Create recurring deliveries with a cron expression.

```js
// Create a schedule — Upstash-Cron header is required
const res = await safeFetch(`${QSTASH}/v1/qstash/schedules/https://my-webhook.example.com/handler`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Upstash-Cron": "*/5 * * * *",  // every 5 minutes
  },
  body: JSON.stringify({ event: "tick" }),
});

const { scheduleId } = await res.json();

// List schedules
const list = await safeFetch(`${QSTASH}/v1/qstash/schedules`);
// [{ scheduleId, cron, destination, ... }, ...]

// Get a schedule
const schedule = await safeFetch(`${QSTASH}/v1/qstash/schedules/${scheduleId}`);

// Pause / resume
await safeFetch(`${QSTASH}/v1/qstash/schedules/${scheduleId}/pause`, { method: "PATCH" });
await safeFetch(`${QSTASH}/v1/qstash/schedules/${scheduleId}/resume`, { method: "PATCH" });

// Delete
await safeFetch(`${QSTASH}/v1/qstash/schedules/${scheduleId}`, { method: "DELETE" });
```

## Queue Management

Queues are created lazily when a message is first enqueued.

```js
// List queues
const list = await safeFetch(`${QSTASH}/v1/qstash/queues`);
// [{ name, ... }, ...]

// Get a queue
const queue = await safeFetch(`${QSTASH}/v1/qstash/queues/my-queue`);

// Pause / resume processing
await safeFetch(`${QSTASH}/v1/qstash/queues/my-queue/pause`, { method: "POST" });
await safeFetch(`${QSTASH}/v1/qstash/queues/my-queue/resume`, { method: "POST" });

// Delete a queue
await safeFetch(`${QSTASH}/v1/qstash/queues/my-queue`, { method: "DELETE" });
```

## Message Management

Look up or cancel an in-flight message by its ID.

```js
// Get message status
const msg = await safeFetch(`${QSTASH}/v1/qstash/messages/${messageId}`);

// Cancel (delete) a message before it's delivered
await safeFetch(`${QSTASH}/v1/qstash/messages/${messageId}`, { method: "DELETE" });
```


## Gotchas

- **Destination is in the URL path** — `POST /v1/qstash/publish/{destination-url}` and `POST /v1/qstash/schedules/{destination-url}`
- **Upstash-Cron is required for schedules** — omitting it returns 400
- **Queues are created lazily** — no explicit create endpoint; enqueue to a new queue name and it appears automatically
- **Messages go to HTTP endpoints** — the target must be publicly reachable
- **Use schedules, not Blaxel cron, for webhook fan-out** — use QStash schedules when the recurring action is delivering to an HTTP endpoint; use Blaxel jobs when the recurring action is running your own code
