/**
 * ============================================================================
 * HOOLULU FIREWALL  ·  FIRECRAWL CLIENT
 * ============================================================================
 * Thin, dependency-free wrapper around the Firecrawl v2 API using Node's
 * built-in global fetch (Node 18+). Supports every core Firecrawl primitive
 * so the Hoolulu Factory bot can crawl, scrape, map, search and extract the
 * web — no limits.
 *
 * Set your key in the environment:
 *   FIRECRAWL_API_KEY=fc-xxxx
 * Optionally override the API base:
 *   FIRECRAWL_API_URL=https://api.firecrawl.dev
 * ============================================================================
 */

"use strict";

const BASE_URL = process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev";

class FirecrawlClient {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey || process.env.FIRECRAWL_API_KEY;
    this.baseUrl = opts.baseUrl || BASE_URL;

    if (!this.apiKey) {
      throw new Error(
        "FirecrawlClient: FIRECRAWL_API_KEY is not set. Add it to .env"
      );
    }
  }

  /** Shared authenticated request helper. */
  async _request(method, path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const detail = json.error || json.message || text || res.statusText;
      const err = new Error(`Firecrawl ${method} ${path} failed (${res.status}): ${detail}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }

    return json;
  }

  /**
   * Scrape a single page and return clean, structured content.
   * @param {string} url - page to scrape
   * @param {object} opts - { formats, onlyMainContent, waitFor, timeout }
   */
  async scrape(url, opts = {}) {
    const body = {
      url,
      formats: opts.formats || ["markdown", "html", "links"],
      onlyMainContent: opts.onlyMainContent !== false,
    };
    if (opts.waitFor) body.waitFor = opts.waitFor;
    if (opts.timeout) body.timeout = opts.timeout;
    if (opts.extract) body.extract = opts.extract;

    const json = await this._request("POST", "/v2/scrape", body);
    return json.data || json;
  }

  /**
   * Crawl a whole site (or a set of pages) and collect every page's content.
   * This is the "clone a site into one" primitive. Firecrawl crawl is async —
   * we submit a job and poll it to completion.
   * @param {string} url - seed URL
   * @param {object} opts - { limit, maxDepth, maxPages, scrapeOptions }
   * @returns {Array<{url, title, markdown}>} collected pages
   */
  async crawl(url, opts = {}) {
    const body = {
      url,
      limit: opts.limit || opts.maxPages || 25,
      maxDepth: opts.maxDepth || 3,
      scrapeOptions: {
        formats: ["markdown", "links"],
        onlyMainContent: true,
        ...(opts.scrapeOptions || {}),
      },
    };
    if (opts.includeSubdomains !== undefined) body.includeSubdomains = opts.includeSubdomains;
    if (opts.ignoreSitemap !== undefined) body.ignoreSitemap = opts.ignoreSitemap;
    if (opts.allowBackwardCrawling !== undefined) body.allowBackwardCrawling = opts.allowBackwardCrawling;
    if (opts.ignoreRobotsTxt !== undefined) body.ignoreRobotsTxt = opts.ignoreRobotsTxt;

    const start = await this._request("POST", "/v2/crawl", body);
    const crawlId = start.id;

    // Poll until the crawl finishes.
    const started = Date.now();
    const pollTimeoutMs = opts.pollTimeoutMs || 180000;
    let job = null;

    while (Date.now() - started < pollTimeoutMs) {
      job = await this._request("GET", `/v2/crawl/${crawlId}`);
      if (job.status === "completed") break;
      if (job.status === "failed" || job.status === "cancelled") break;
      await new Promise((r) => setTimeout(r, opts.pollIntervalMs || 2000));
    }

    const pages = (job && job.data) || [];

    return pages.map((p) => ({
      url: p.metadata && p.metadata.sourceURL,
      title: p.metadata && p.metadata.title,
      markdown: p.markdown || "",
    }));
  }

  /**
   * Map a site's URLs without scraping — returns the URL graph.
   * @param {string} url - site root
   * @returns {Array<string>} discovered URLs
   */
  async map(url, opts = {}) {
    const body = { url, ...(opts.limit ? { limit: opts.limit } : {}) };
    const json = await this._request("POST", "/v2/map", body);
    return json.links || [];
  }

  /**
   * Web search with Firecrawl's search endpoint.
   * @param {string} query - search query
   * @param {object} opts - { limit, country }
   */
  async search(query, opts = {}) {
    const body = { query, limit: opts.limit || 5 };
    if (opts.country) body.country = opts.country;
    if (opts.lang) body.lang = opts.lang;

    const json = await this._request("POST", "/v2/search", body);
    return (json.data || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      markdown: r.markdown,
    }));
  }

  /**
   * Structured extraction from one or more URLs using a prompt + JSON schema.
   * @param {object} opts - { urls|url, prompt, schema }
   */
  async extract(opts = {}) {
    const body = {
      urls: opts.urls || (opts.url ? [opts.url] : []),
      prompt: opts.prompt,
    };
    if (opts.schema) body.schema = opts.schema;

    const start = await this._request("POST", "/v2/extract", body);
    if (start.id) {
      // async job — poll
      const started = Date.now();
      let job = null;
      while (Date.now() - started < (opts.pollTimeoutMs || 120000)) {
        job = await this._request("GET", `/v2/extract/${start.id}`);
        if (job.status === "completed" || job.status === "failed") break;
        await new Promise((r) => setTimeout(r, opts.pollIntervalMs || 2000));
      }
      return job;
    }
    return start.data || start;
  }

  /**
   * Combine several crawled/scraped pages into ONE unified document — the
   * "clone of multiple sites into one" operation. Every page is stitched
   * together with clear headings and source URLs.
   * @param {Array<{url,title,markdown}>} pages
   * @param {string} name - optional title for the combined document
   */
  combineIntoOne(pages, name = "Combined Web Clone") {
    const parts = [
      `# ${name}\n`,
      `> Aggregated by the Hoolulu Firecrawl Bot · ${new Date().toISOString()}\n`,
    ];

    for (const page of pages) {
      if (!page || (!page.markdown && !page.title)) continue;
      parts.push(`\n---\n\n## ${page.title || page.url || "Untitled page"}`);
      if (page.url) parts.push(`\n*Source: ${page.url}*`);
      if (page.markdown) parts.push(`\n${page.markdown}`);
    }

    return parts.join("\n");
  }
}

module.exports = FirecrawlClient;
