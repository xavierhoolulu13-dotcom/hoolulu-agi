# Sandboxes API Reference

Persistent compute environments with filesystem, processes, and exposed ports.

**Base URL:** `https://blaxel.services.sapiom.ai`

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const GATEWAY = "https://blaxel.services.sapiom.ai";
```

## Create Sandbox

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "my-sandbox",
    tier: "s",           // optional, default "s"
    ttl: "4h",           // optional, default "4h"
    envs: {              // optional, immutable after creation
      NODE_ENV: "production",
      SAPIOM_API_KEY: process.env.SAPIOM_API_KEY,
    },
    ports: [3000, 8080], // optional, ports to expose
  }),
});
const sandbox = await res.json();
// sandbox: { name, status, tier, url, expiresAt, ... }
```

## Tiers

| Tier | Memory |
|------|--------|
| xs | 2 GB |
| s | 4 GB |
| m | 8 GB |
| l | 16 GB |
| xl | 32 GB |

## TTL (Time to Live)

Default: `4h`. Formats: `"10m"`, `"1h"`, `"24h"`, `"7d"`

Extend a sandbox's TTL:

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ttl: "1h" }),
});
```

## Filesystem

### Read a file

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/path/to/file.txt`);
const content = await res.text();
```

### Write a file

```js
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/path/to/file.txt`, {
  method: "PUT",
  body: fileContent,
});
```

### Delete a file

```js
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/path/to/file.txt`, {
  method: "DELETE",
});
```

### Directory tree (read/write/delete)

```js
// Read directory tree
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/tree/path/to/dir`);
const tree = await res.json();

// Write directory tree (create multiple files)
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/tree/path/to/dir`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ files: { "a.txt": "content a", "b.txt": "content b" } }),
});

// Delete directory tree
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/filesystem/tree/path/to/dir`, {
  method: "DELETE",
});
```

## Processes

### Create a process

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/process`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    command: "node",
    args: ["server.js"],
  }),
});
const proc = await res.json();
// proc: { pid, status, ... }
```

### List processes

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/process`);
const { processes } = await res.json();
```

### Get process logs

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/process/${pid}/logs`);
const logs = await res.text();
```

### Kill a process

```js
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}/process/${pid}/kill`, {
  method: "DELETE",
});
```

## Lifecycle

### List sandboxes

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes`);
const { sandboxes } = await res.json();
```

### Get sandbox

```js
const res = await safeFetch(`${GATEWAY}/v1/sandboxes/${name}`);
const sandbox = await res.json();
```

### Delete sandbox

```js
await safeFetch(`${GATEWAY}/v1/sandboxes/${name}`, { method: "DELETE" });
```

## Gotchas

- **TTL expiration** — sandboxes are automatically deleted when the TTL expires. Extend before it runs out if you need more time.
- **Port exposure** — ports must be declared at creation time. The sandbox URL provides access to exposed ports.
- **Envs are immutable** — environment variables cannot be changed after creation. Delete and recreate the sandbox to change envs.
- **Filesystem persistence** — files persist across process restarts within the same sandbox, but are lost when the sandbox is deleted.
