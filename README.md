# 🚀 Hoolulu Firewall — Firecrawl Bot

**Hoolulu Systems Hub** + **AgentFactory** + **Firecrawl**, wired together into one
runnable app. Clone multiple websites into a single page, scrape, search, map and
"build anything" from the web — through your own Hoolulu factory. No limits.

---

## ✨ What this is

A modern web app + backend bot that:

- **Clones multiple sites into one** — give it a list of URLs (or a topic) and it
  crawls each one with Firecrawl, pulls the clean markdown, and stitches everything
  into a single unified document.
- **Connects to your factory** — the bot registers itself into your
  `HooluluSystemsHub/AgentFactory` as a first-class agent with a Firecrawl skill.
- **Can build anything** — scrape any page, search the web, map a site's URL graph,
  and extract structured data. Built on the Firecrawl v2 API with no hard limits.
- **Modern UI** — a slick, dark, glassmorphic single-page app to drive it all.

## 📁 Layout

```
firecrawl/
  client.js          # Dependency-free Firecrawl v2 API client (scrape/crawl/map/search/extract)
  firecrawl-bot.js   # The bot agent — registers into AgentFactory, run() dispatches tasks
HooluluSystemsHub/   # Your AgentFactory (extracted from hoolulu-api1.zip)
public/
  index.html         # Modern single-page UI
server.js            # Express server: factory + bot + REST API + static UI
test-firecrawl.js    # Wiring smoke test (no API key needed)
.env.example         # Copy to .env and add your FIRECRAWL_API_KEY
```

## 🚀 Quick start

### Way 1 — easiest (anyone can do it, no files to edit)

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser. A **Connect** panel at the top
lets anyone paste their Firecrawl API key and press **Connect** — the bot comes
online instantly and the key is saved automatically so it persists across restarts.
No `.env` editing required. Get a free key at [firecrawl.dev](https://firecrawl.dev).

### Way 2 — set it in `.env` (optional)

```bash
cp .env.example .env
#  ...edit .env → FIRECRAWL_API_KEY=fc-xxxx
npm start
```

> If no key is set, the app still boots and shows the UI — the bot just reports
> **offline** until someone pastes a key in the Connect panel (or you add one to `.env`).

## 🔌 REST API

| Method | Endpoint          | Purpose                                        |
|--------|-------------------|------------------------------------------------|
| GET    | `/api/status`     | Factory + bot status                           |
| GET    | `/api/agents`     | Agents registered in the factory               |
| POST   | `/api/bot/run`    | Run any action (see payloads below)            |
| POST   | `/api/scrape`     | `{ url }` → clean markdown                     |
| POST   | `/api/search`     | `{ query }` → search results                   |
| POST   | `/api/map`        | `{ url }` → site URL graph                     |
| POST   | `/api/clone`      | `{ urls: [...], name }` → one combined doc     |
| POST   | `/api/build`      | alias of clone / build-anything                |
| POST   | `/api/connect`    | `{ apiKey }` → connect the bot at runtime      |
| POST   | `/api/disconnect` | → disconnect the bot                           |
| POST   | `/agent/chat`     | Legacy AgentFactory chat endpoint              |

### `/api/bot/run` payloads

```jsonc
// Clone multiple sites into one
{ "action": "build", "urls": ["https://a.com", "https://b.com"], "name": "My Clone" }

// Build from a topic (bot searches the web to find sources)
{ "action": "build", "prompt": "latest AI agent frameworks" }

// Scrape a single page
{ "action": "scrape", "url": "https://news.ycombinator.com" }

// Search the web
{ "action": "search", "query": "best no-code tools 2026" }

// Map a site
{ "action": "map", "url": "https://a.com" }
```

## 🧪 Test

```bash
npm test
```

Runs a wiring smoke test (combineIntoOne, factory registration, action guessing,
missing-key guard) — no API key needed.

## ⚙️ Configuration

| Env var               | Default                 | Notes                          |
|-----------------------|-------------------------|--------------------------------|
| `FIRECRAWL_API_KEY`   | —                       | **Required** to run the bot    |
| `FIRECRAWL_API_URL`   | `https://api.firecrawl.dev` | Optional custom gateway     |
| `PORT`                | `3000`                  | Server port                    |
| `AGENT_FACTORY_NAME`  | `HooluluAgentFactory`   | Factory display name           |
| `NODE_ENV`            | `development`           | `development` / `staging` / `production` |

## 📝 Notes

- Uses Node 18+ **global `fetch`** — no extra HTTP dependency required.
- Firecrawl crawl/extract are async jobs; the client polls them to completion.
- The bot's skills (`firecrawl-scrape`, `firecrawl-crawl`, `firecrawl-search`, etc.)
  are registered onto the factory's capability manager, so they show up as real skills.

---

**Built for the Hoolulu Systems Hub.**  *The builder in the Hoolulu Intelligence Ecosystem.*
