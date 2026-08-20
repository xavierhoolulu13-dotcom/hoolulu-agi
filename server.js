/**
 * ============================================================================
 * HOOLULU SYSTEMS HUB — SERVER
 * ============================================================================
 * Boots the Hoolulu AgentFactory, spawns and registers the Firecrawl Bot, then
 * exposes a modern REST API + a single-page web app so you can drive the bot
 * from the browser: clone multiple sites into one, scrape, search, map and
 * "build anything" with Firecrawl — no limits.
 * ============================================================================
 */

"use strict";

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const AgentFactory = require("./HooluluSystemsHub/AgentFactory");
const FirecrawlBot = require("./firecrawl/firecrawl-bot");

const app = express();
const PORT = process.env.PORT || 3000;
const ENV_FILE = path.join(__dirname, ".env");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* --------------------------------------------------------------------------
 * Boot the factory + the Firecrawl Bot
 * ------------------------------------------------------------------------ */
const factory = new AgentFactory({
  name: process.env.AGENT_FACTORY_NAME || "HooluluAgentFactory",
  environment: process.env.NODE_ENV || "development",
});

let bot = null;

/**
 * (Re)create the Firecrawl bot with a given API key.
 * Safe to call at boot and again whenever the user connects a new key.
 */
async function startBot(apiKey) {
  if (!apiKey) return false;
  try {
    const fresh = new FirecrawlBot(factory, { apiKey });
    if (fresh.registration) await fresh.registration;
    bot = fresh;
    process.env.FIRECRAWL_API_KEY = apiKey;
    console.log("[server] FirecrawlBot online:", bot.name);
    return true;
  } catch (e) {
    console.warn("[server] FirecrawlBot not started:", e.message);
    return false;
  }
}

/**
 * Persist the key to .env so it survives restarts — users never have to edit
 * the file by hand. We only touch/replace the FIRECRAWL_API_KEY line.
 */
function saveKeyToEnv(apiKey) {
  try {
    let content = "";
    if (fs.existsSync(ENV_FILE)) {
      content = fs.readFileSync(ENV_FILE, "utf8");
    }
    const hasLine = /^\s*FIRECRAWL_API_KEY\s*=/m.test(content);
    if (hasLine) {
      content = content.replace(/^\s*FIRECRAWL_API_KEY\s*=.*$/m, `FIRECRAWL_API_KEY=${apiKey}`);
    } else {
      content += (content.endsWith("\n") || content === "" ? "" : "\n") + `FIRECRAWL_API_KEY=${apiKey}\n`;
    }
    fs.writeFileSync(ENV_FILE, content);
    return true;
  } catch (e) {
    console.warn("[server] could not save key to .env:", e.message);
    return false;
  }
}

// Auto-connect at boot if a key is already present.
(async () => {
  await factory.initialize(); // ensure capability defaults are loaded
  const key = process.env.FIRECRAWL_API_KEY;
  if (key) await startBot(key);
  else console.warn("[server] No FIRECRAWL_API_KEY yet — connect one in the web app.");
})();

/* --------------------------------------------------------------------------
 * Factory status
 * ------------------------------------------------------------------------ */
app.get("/api/status", (req, res) => {
  res.json({
    factory: factory.getStatus(),
    bot: bot ? bot.status() : { online: false, reason: "No API key connected yet" },
    firecrawl: {
      configured: Boolean(process.env.FIRECRAWL_API_KEY),
      baseUrl: process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev",
    },
  });
});

/* --------------------------------------------------------------------------
 * Connect / disconnect an API key (no .env editing required)
 * ------------------------------------------------------------------------ */
app.post("/api/connect", async (req, res) => {
  const apiKey = (req.body && req.body.apiKey || "").trim();
  if (!apiKey) {
    return res.status(400).json({ ok: false, error: "Paste your Firecrawl API key first." });
  }
  const ok = await startBot(apiKey);
  if (!ok) {
    return res.status(400).json({ ok: false, error: "Could not connect — check the key and try again." });
  }
  saveKeyToEnv(apiKey); // best-effort persistence
  res.json({ ok: true, message: "Connected! Firecrawl bot is online.", bot: bot.status() });
});

app.post("/api/disconnect", (req, res) => {
  bot = null;
  delete process.env.FIRECRAWL_API_KEY;
  res.json({ ok: true, message: "Disconnected. The bot is now offline." });
});

/* --------------------------------------------------------------------------
 * Bot actions
 * ------------------------------------------------------------------------ */
function requireBot(req, res) {
  if (!bot) {
    res.status(503).json({
      ok: false,
      error: "Firecrawl bot is offline. Paste your Firecrawl API key in the Connect panel above and hit Connect.",
    });
    return false;
  }
  return true;
}

app.post("/api/bot/run", async (req, res) => {
  if (!requireBot(req, res)) return;
  const result = await bot.run(req.body || {});
  res.status(result.ok ? 200 : 400).json(result);
});

// Convenience shorthands
app.post("/api/scrape", async (req, res) => {
  if (!requireBot(req, res)) return;
  res.json(await bot.run({ action: "scrape", ...req.body }));
});
app.post("/api/search", async (req, res) => {
  if (!requireBot(req, res)) return;
  res.json(await bot.run({ action: "search", ...req.body }));
});
app.post("/api/map", async (req, res) => {
  if (!requireBot(req, res)) return;
  res.json(await bot.run({ action: "map", ...req.body }));
});
app.post("/api/clone", async (req, res) => {
  if (!requireBot(req, res)) return;
  res.json(await bot.run({ action: "clone", ...req.body }));
});
app.post("/api/build", async (req, res) => {
  if (!requireBot(req, res)) return;
  res.json(await bot.run({ action: "build", ...req.body }));
});

// Legacy AgentFactory chat endpoint (kept for compatibility)
app.post("/agent/chat", async (req, res) => {
  const userMessage = (req.body && req.body.message) || "";
  res.json({ reply: `Firecrawl Bot online — say "clone these sites", "search X", or "scrape URL". (You said: ${userMessage})` });
});

// Let the factory run agents directly, e.g. list registry
app.get("/api/agents", (req, res) => {
  res.json(factory.listAgents().map((a) => ({
    id: a.id,
    name: a.name,
    templateId: a.templateId,
    status: a.status,
    capabilities: a.capabilities,
  })));
});

/* --------------------------------------------------------------------------
 * Listen on all interfaces so the live preview can reach it.
 * ------------------------------------------------------------------------ */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Hoolulu Systems Hub running on http://0.0.0.0:${PORT}`);
  console.log(`   Factory:  ${factory.getStatus().name} v${factory.getStatus().version}`);
  console.log(`   Bot:      ${bot ? bot.name + " online" : "OFFLINE — set FIRECRAWL_API_KEY"}\n`);
});
