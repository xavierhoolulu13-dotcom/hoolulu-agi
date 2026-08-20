/**
 * ============================================================================
 * HOOLULU FIREWALL  ·  FIRECRAWL BOT  (Factory Agent)
 * ============================================================================
 * The Firecrawl Bot is registered into the Hoolulu AgentFactory as a first-class
 * agent. It turns a plain-English task into real web work:
 *
 *   • "clone these sites into one page"   → crawl each → combineIntoOne()
 *   • "scrape this page"                  → Firecrawl scrape()
 *   • "search the web for X"              → Firecrawl search()
 *   • "build me a landing page about X"   → gather web content → assemble a page
 *
 * It holds the FirecrawlClient, exposes a `run(task)` entry point the factory
 * can call, and reports structured results back into the factory registry.
 * ============================================================================
 */

"use strict";

const { v4: uuidv4 } = require("uuid");
const FirecrawlClient = require("./client");

class FirecrawlBot {
  /**
   * @param {object} factory - the Hoolulu AgentFactory instance
   * @param {object} opts    - { apiKey, agentId, name }
   */
  constructor(factory, opts = {}) {
    this.factory = factory;
    this.id = opts.agentId || `firecrawl-bot-${uuidv4().slice(0, 8)}`;
    this.name = opts.name || "FirecrawlBot";
    this.createdAt = new Date().toISOString();

    this.client = new FirecrawlClient({ apiKey: opts.apiKey });
    this.log = [];

    // Register the Firecrawl skill on the factory's capability manager so the
    // bot's capabilities are first-class (not just warnings).
    this._registerFactorySkills(factory);

    // Register ourselves into the AgentFactory registry as an agent.
    // createAgent is async, so we keep the promise so callers/tests can await it.
    this.registration = null;
    if (factory && typeof factory.createAgent === "function") {
      try {
        this.registration = factory
          .createAgent("generic-agent", {
            id: this.id,
            name: this.name,
            description:
              "Firecrawl-powered bot that crawls, scrapes, searches and clones the web — connected to the Hoolulu factory.",
            capabilities: ["task-execution", "automation", "reasoning"],
            handler: (task) => this.run(task),
          })
          .then((agent) => {
            this._log(`registered in AgentFactory as "${this.id}"`);
            return agent;
          })
          .catch((e) => {
            this._log(`factory registration note: ${e.message}`);
            return null;
          });
      } catch (e) {
        this._log(`factory registration note: ${e.message}`);
      }
    }
  }

  /** Teach the factory's capability manager about the bot's Firecrawl skills. */
  _registerFactorySkills(factory) {
    if (!factory || !factory.capabilityManager) return;
    const cm = factory.capabilityManager;
    const skills = {
      "web-scraping": {
        id: "firecrawl-scrape",
        name: "Firecrawl Scrape",
        description: "Scrape any page into clean markdown with Firecrawl.",
        handler: (t) => this.run({ action: "scrape", ...t }),
      },
      crawling: {
        id: "firecrawl-crawl",
        name: "Firecrawl Crawl",
        description: "Crawl a site and collect pages.",
        handler: (t) => this.run({ action: "build", ...t }),
      },
      "web-search": {
        id: "firecrawl-search",
        name: "Firecrawl Search",
        description: "Search the web with Firecrawl.",
        handler: (t) => this.run({ action: "search", ...t }),
      },
      "content-extraction": {
        id: "firecrawl-extract",
        name: "Firecrawl Extract",
        description: "Structured extraction from pages.",
        handler: (t) => this.run({ action: "extract", ...t }),
      },
      "site-cloning": {
        id: "firecrawl-clone",
        name: "Firecrawl Clone",
        description: "Clone multiple sites into one unified document.",
        handler: (t) => this.run({ action: "clone", ...t }),
      },
    };
    try {
      for (const cap of ["task-execution", "automation", "reasoning"]) {
        if (!cm.getCapability(cap)) continue;
        for (const skill of Object.values(skills)) {
          try { cm.registerSkill(cap, skill); } catch (e) { /* already registered */ }
        }
      }
    } catch (e) {
      this._log(`skill registration note: ${e.message}`);
    }
  }

  _log(msg) {
    const entry = { at: new Date().toISOString(), msg };
    this.log.push(entry);
    if (this.log.length > 200) this.log.shift();
    return entry;
  }

  _meta() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      capabilities: [
        "web-scraping",
        "crawling",
        "web-search",
        "content-extraction",
        "task-execution",
      ],
    };
  }

  /**
   * The single entry point the factory / HTTP layer calls.
   * Interprets a task string or structured object and dispatches it.
   *
   * @param {object} task - { action?, url?, urls?, query?, prompt?, name? }
   */
  async run(task) {
    const t = typeof task === "string" ? { prompt: task } : task || {};
    const action = (t.action || this._guessAction(t)).toLowerCase();

    const start = Date.now();
    this._log(`running action="${action}"`);

    try {
      let result;

      switch (action) {
        case "scrape":
          result = await this._scrape(t);
          break;
        case "map":
          result = await this._map(t);
          break;
        case "search":
          result = await this._search(t);
          break;
        case "extract":
          result = await this._extract(t);
          break;
        case "clone":
        case "combine":
        case "build":
          result = await this._cloneOrBuild(t);
          break;
        default:
          throw new Error(`Unknown action "${action}"`);
      }

      return {
        action,
        ok: true,
        elapsedMs: Date.now() - start,
        ...result,
        bot: this._meta(),
      };
    } catch (error) {
      this._log(`error on ${action}: ${error.message}`);
      return {
        action,
        ok: false,
        error: error.message,
        elapsedMs: Date.now() - start,
        bot: this._meta(),
      };
    }
  }

  /** Guess the action from the prompt when none is provided. */
  _guessAction(t) {
    const text = [
      t.prompt,
      t.query,
      t.url,
      (t.urls || []).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!text) return "scrape";
    if (/\bsearch\b/.test(text)) return "search";
    if (/\bclone|combine|into one|merge|build\b/.test(text)) return "clone";
    if (/\bmap\b/.test(text) && !/\bscrape\b/.test(text)) return "map";
    return "scrape";
  }

  async _scrape(t) {
    const url = t.url;
    if (!url) throw new Error("scrape requires a `url`");
    const data = await this.client.scrape(url, t.opts || {});
    return {
      type: "scrape",
      url,
      title: data.metadata && data.metadata.title,
      description: data.metadata && data.metadata.description,
      markdown: data.markdown || "",
      links: data.links || [],
    };
  }

  async _map(t) {
    const url = t.url;
    if (!url) throw new Error("map requires a `url`");
    const links = await this.client.map(url, t.opts || {});
    return { type: "map", url, links };
  }

  async _search(t) {
    const q = t.query || t.prompt;
    if (!q) throw new Error("search requires a `query` or `prompt`");
    const results = await this.client.search(q, t.opts || {});
    return { type: "search", query: q, results };
  }

  async _extract(t) {
    const urls = t.urls || (t.url ? [t.url] : []);
    if (!urls.length) throw new Error("extract requires `urls` or `url`");
    const data = await this.client.extract({
      urls,
      prompt: t.prompt,
      schema: t.schema,
    });
    return { type: "extract", urls, data };
  }

  /**
   * The flagship operation: clone several sites into one unified document.
   * Accepts `urls` (array) or a `url` (single). Combines all content.
   */
  async _cloneOrBuild(t) {
    const urls = t.urls && t.urls.length ? t.urls : t.url ? [t.url] : [];
    if (!urls.length) {
      // If given a prompt without URLs, seed it with a web search.
      if (t.prompt) {
        const searchResults = await this.client.search(t.prompt, { limit: 5 });
        for (const r of searchResults) {
          if (r.url) urls.push(r.url);
        }
      }
    }
    if (!urls.length) {
      throw new Error(
        "build/clone needs `urls` (an array of sites) or a `prompt` to search with"
      );
    }

    const pages = [];
    for (const url of urls.slice(0, t.maxSites || 10)) {
      try {
        const one = await this.client.scrape(url, t.opts || {});
        pages.push({
          url,
          title: one.metadata && one.metadata.title,
          markdown: one.markdown || "",
        });
      } catch (e) {
        pages.push({ url, title: url, markdown: `(failed to fetch: ${e.message})` });
      }
    }

    const combined = this.client.combineIntoOne(pages, t.name || "Combined Web Clone");

    return {
      type: "clone",
      sourceCount: pages.length,
      sources: pages.map((p) => p.url),
      combined,
    };
  }

  /** Factory-style status snapshot for the bot. */
  status() {
    return {
      id: this.id,
      name: this.name,
      online: true,
      logEntries: this.log.length,
      lastLog: this.log[this.log.length - 1] || null,
    };
  }
}

module.exports = FirecrawlBot;
