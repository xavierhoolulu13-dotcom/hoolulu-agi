/**
 * Basic Cron Agent Template
 *
 * Minimal skeleton: fetches a URL on a schedule, logs the result.
 * Copy this file, replace the main() body with your agent logic.
 *
 * Deploy via ZIP upload — see references/deploy.md.
 * The builder runs `npm install` automatically from package.json.
 *
 * package.json (deploy alongside this file):
 * {
 *   "name": "my-agent",
 *   "version": "1.0.0",
 *   "main": "index.js",
 *   "dependencies": { "@sapiom/fetch": "^0.3.0" },
 *   "scripts": { "start": "node index.js" }
 * }
 */

const { createFetch } = require("@sapiom/fetch");

const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});

async function main() {
  console.log(`[${new Date().toISOString()}] Agent starting...`);

  const res = await safeFetch("https://firecrawl.services.sapiom.ai/v1/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://news.ycombinator.com",
      formats: ["markdown"],
    }),
  });

  if (!res.ok) {
    console.error(`Scrape failed: HTTP ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Scraped ${data.data.metadata.title} (${data.data.markdown.length} chars)`);

  // TODO: Process the data, call an LLM, send alerts, store results, etc.

  console.log(`[${new Date().toISOString()}] Agent done.`);
}

main().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
