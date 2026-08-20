# Jobs API Reference

Deploy Node.js scripts as persistent cron jobs via Sapiom. No extra credentials needed — ZIP your code and deploy.

**Base URL:** `https://blaxel.services.sapiom.ai`

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const GATEWAY = "https://blaxel.services.sapiom.ai";
```

## Deploy Flow (3 Steps)

### 1. Write source files and create ZIP

```js
const { mkdirSync, writeFileSync, readFileSync, rmSync } = require("fs");
const { join } = require("path");
const { tmpdir } = require("os");
const { execSync } = require("child_process");

const srcDir = join(tmpdir(), `agent-${Date.now()}`);
const zipPath = join(tmpdir(), `agent-${Date.now()}.zip`);
mkdirSync(srcDir, { recursive: true });

writeFileSync(join(srcDir, "index.js"), agentCode);
writeFileSync(join(srcDir, "package.json"), JSON.stringify({
  name: jobName,
  version: "1.0.0",
  main: "index.js",
  dependencies: { "@sapiom/fetch": "^0.3.0" },
  scripts: { start: "node index.js" },
}));

execSync(`cd "${srcDir}" && zip -r "${zipPath}" .`);
const zipBytes = readFileSync(zipPath);

// Clean up temp files
rmSync(srcDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
```

**Required:** `package.json` with `main` and `scripts.start` — the builder detects Node.js from this.
Files must be at ZIP root (not nested in a subdirectory).

### 2. Deploy the job

Metadata (name, schedule) goes in query parameters since the body is the ZIP binary:

```js
const params = new URLSearchParams({ name: jobName });
if (schedule) params.set("schedule", schedule);

const res = await safeFetch(`${GATEWAY}/v1/jobs?${params}`, {
  method: "POST",
  headers: { "Content-Type": "application/zip" },
  body: zipBytes,
});

if (!res.ok) throw new Error(`Deploy failed: HTTP ${res.status}: ${await res.text()}`);
const job = await res.json();
console.log(`Job deployed: ${job.name} (status: ${job.status})`);
```

The deploy endpoint returns immediately with `status: "building"`. The build continues in the background (typically 60–120 seconds). Poll `GET /v1/jobs/{name}` until `status` is `"deployed"` or `"failed"`.

### 3. Poll Until Deployed

```js
// Poll every 10–15 seconds until status transitions
let status = 'building';
while (status === 'building' || status === 'provisioning') {
  await new Promise(r => setTimeout(r, 12_000));
  const poll = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}`);
  const data = await poll.json();
  status = data.status;
  console.log(`Job status: ${status}`);
}
// status is now 'deployed' (success) or 'failed' (error)
```

## Alternative: JSON Files Map

For simple agents, you can skip ZIP and send files as JSON:

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: jobName,
    files: {
      "index.js": agentCode,
      "package.json": JSON.stringify({
        name: jobName,
        version: "1.0.0",
        main: "index.js",
        dependencies: { "@sapiom/fetch": "^0.3.0" },
        scripts: { start: "node index.js" },
      }),
    },
    schedule: "0 */2 * * *",
    envs: { SAPIOM_API_KEY: process.env.SAPIOM_API_KEY },
    runtimeConfig: {
      memory: 256,             // MB (128–4096)
      timeout: 300,            // seconds (1–3600)
      maxConcurrentTasks: 10,  // for batch executions
      maxRetries: 0,           // per task
    },
  }),
});
```

**JSON body fields:**
- `name` (required) — unique per account, alphanumeric + hyphens
- `files` (required) — source code map (path → content)
- `schedule` — cron expression (omit for on-demand jobs)
- `envs` — environment variables available at runtime
- `runtimeConfig` — memory, timeout, concurrency, retries (all optional)
- `runtime` — auto-detected from files (currently only `node`)

## Update (Redeploy)

To update code on an existing job, use PUT with a ZIP or JSON body:

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}`, {
  method: "PUT",
  headers: { "Content-Type": "application/zip" },
  body: updatedZipBytes,
});
```

## List Jobs

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs`);
const { jobs } = await res.json();
// jobs: [{ name, status, runtime, memory, timeout, schedule, createdAt, updatedAt }]
```

## Get Job Status

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}`);
const job = await res.json();
```

## Delete Job

```js
await safeFetch(`${GATEWAY}/v1/jobs/${jobName}`, { method: "DELETE" });
```

## Trigger Manual Execution

For on-demand jobs or to trigger a scheduled job immediately:

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}/executions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tasks: [{}],  // array of task payloads — each element runs as a parallel task
  }),
});
const execution = await res.json();
// execution: { executionId, jobName, status, taskCount, createdAt }
```

## Batch Execution (Fan-Out)

Deploy a stateless job, then fan out to N parallel tasks:

```js
const res = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}/executions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tasks: [
      { url: "https://example.com/page1" },
      { url: "https://example.com/page2" },
      { url: "https://example.com/page3" },
    ],
    env: { BATCH_MODE: "true" },  // optional env overrides
    memory: 512,                   // optional memory override
  }),
});
```

## Check Execution Status

```js
// List executions
const res = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}/executions`);
const { executions } = await res.json();

// Get specific execution
const detail = await safeFetch(`${GATEWAY}/v1/jobs/${jobName}/executions/${executionId}`);
const exec = await detail.json();
// exec: { executionId, jobName, status, taskCount, tasks, stats, createdAt, completedAt }
```

## Cron Schedule Examples

| Schedule | Cron Expression |
|----------|----------------|
| Every 5 minutes | `*/5 * * * *` |
| Every 15 minutes | `*/15 * * * *` |
| Every hour | `0 * * * *` |
| Every 2 hours | `0 */2 * * *` |
| Every 6 hours | `0 */6 * * *` |
| Every day at 9am UTC | `0 9 * * *` |
| Every Monday at 9am UTC | `0 9 * * 1` |

## Response Shape

All job endpoints return:

```json
{
  "name": "my-agent",
  "status": "deployed",
  "runtime": "node",
  "memory": 256,
  "timeout": 300,
  "schedule": "0 */2 * * *",
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2025-06-15T10:30:00.000Z"
}
```

## Gotchas

- **Deploy is non-blocking** — the POST returns immediately with `status: "building"`. Poll `GET /v1/jobs/{name}` every 10–15s until `"deployed"` or `"failed"` (typically 60–120s).
- **Job names are account-scoped** — the gateway handles namespace isolation
- **Builder needs `package.json`** — without it, the runtime can't detect Node.js
- **`npm install` runs automatically** — the builder installs dependencies from `package.json`
- **Pass `SAPIOM_API_KEY` via `envs`** — the job needs it at runtime to call other gateways
- **ZIP files at root** — files must be at the ZIP root, not in a subdirectory
- **Prefer ZIP over JSON files map** — ZIP handles binary files and is universally supported
