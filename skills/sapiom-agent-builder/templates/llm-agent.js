/**
 * LLM-Powered Agent Template
 *
 * Full pattern: scrape content, analyze with LLM, take action.
 * Copy and adapt to your use case.
 *
 * package.json (deploy alongside this file):
 * {
 *   "name": "my-llm-agent",
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

const OPENROUTER = "https://openrouter.services.sapiom.ai/v1";
const FIRECRAWL = "https://firecrawl.services.sapiom.ai";

// ─── Step 1: Gather data ────────────────────────────────────────────

async function scrapeUrl(url) {
  const res = await safeFetch(`${FIRECRAWL}/v2/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });

  if (!res.ok) throw new Error(`Scrape failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.data.markdown;
}

// ─── Step 2: Analyze with LLM ──────────────────────────────────────

async function analyzeWithLLM(content, prompt) {
  const res = await safeFetch(`${OPENROUTER}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.6",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`LLM call failed: HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Step 3: Take action ────────────────────────────────────────────

async function takeAction(result) {
  // TODO: Replace with your action — send webhook, store in vector DB, etc.
  console.log("Result:", result);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`[${new Date().toISOString()}] Agent starting...`);

  // 1. Gather
  const content = await scrapeUrl("https://news.ycombinator.com");
  console.log(`Scraped ${content.length} chars`);

  // 2. Analyze
  const summary = await analyzeWithLLM(
    content.slice(0, 8000),
    "Summarize the top 5 stories from this Hacker News page. For each story, give the title and a one-sentence summary. Respond in JSON: { stories: [{ title, summary }] }",
  );
  console.log("LLM analysis complete");

  // 3. Act
  await takeAction(summary);

  console.log(`[${new Date().toISOString()}] Agent done.`);
}

main().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
