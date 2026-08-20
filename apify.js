const fetch = require('node-fetch');
require('dotenv').config();

class ApifyClient {
  constructor() {
    this.key = process.env.APIFY_API_KEY;
    this.base = "https://api.apify.com/v2";
  }

  async generate(prompt) {
    const res = await fetch(`${this.base}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.key}`
      },
      body: JSON.stringify({ content: prompt })
    });

    return await res.json();
  }
}

module.exports = ApifyClient;
