/**
 * Smoke test for the Firecrawl Bot wiring — no API key needed for these parts.
 * Run: npm test
 */
require("dotenv").config();
const assert = require("assert");
const AgentFactory = require("./HooluluSystemsHub/AgentFactory");
const FirecrawlClient = require("./firecrawl/client");
const FirecrawlBot = require("./firecrawl/firecrawl-bot");

async function main() {
  // 1. combineIntoOne merges multiple sites into one document
  const client = new FirecrawlClient({ apiKey: "test-key" });
  const combined = client.combineIntoOne([
    { url: "https://a.com", title: "Page A", markdown: "# A\nhello" },
    { url: "https://b.com", title: "Page B", markdown: "# B\nworld" },
  ], "Test Clone");
  assert(combined.includes("Page A"));
  assert(combined.includes("Page B"));
  assert(combined.includes("Test Clone"));
  console.log("✓ combineIntoOne merges multiple sites");

  // 2. FirecrawlBot registers into the AgentFactory registry
  const factory = new AgentFactory({ environment: "test" });
  await factory.initialize(); // ensure capability defaults are loaded
  const bot = new FirecrawlBot(factory, { apiKey: "test-key" });
  await bot.registration;
  assert(bot.id, "bot has id");
  const registered = factory.listAgents().find((a) => a.id === bot.id);
  assert(registered, "bot should be registered in factory registry");
  assert(registered.capabilities.includes("task-execution"));
  // Firecrawl skill should be registered on the capability manager
  const skill = factory.capabilityManager
    .getCapability("task-execution")
    .skills.find((s) => s.id === "firecrawl-scrape");
  assert(skill, "firecrawl-scrape skill should be registered");
  console.log("✓ FirecrawlBot registered in AgentFactory as", bot.id, "+ firecrawl skill");

  // 3. Action guessing logic
  assert.strictEqual(bot._guessAction({ prompt: "search the web for ai" }), "search");
  assert.strictEqual(bot._guessAction({ prompt: "clone these sites into one" }), "clone");
  assert.strictEqual(bot._guessAction({ url: "https://a.com" }), "scrape");
  console.log("✓ action guessing works");

  // 4. Missing-key handling
  delete process.env.FIRECRAWL_API_KEY;
  assert.throws(() => new FirecrawlClient({}), /FIRECRAWL_API_KEY/);
  console.log("✓ client guards against missing key");

  // 5. status
  assert(bot.status().online === true);
  console.log("✓ bot reports online");

  console.log("\n✅ All wiring tests passed.");
}

main().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
