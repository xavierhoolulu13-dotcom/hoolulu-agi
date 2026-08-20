# LLM Inference — OpenRouter

Call any LLM (Claude, GPT, Gemini, DeepSeek, Llama, etc.) via OpenRouter through Sapiom.

**Gateway:** `https://openrouter.services.sapiom.ai`
**API:** OpenAI-compatible (`/v1/chat/completions`)

## Setup

```js
const { createFetch } = require("@sapiom/fetch");
const safeFetch = createFetch({
  apiKey: process.env.SAPIOM_API_KEY,

});
const OPENROUTER = "https://openrouter.services.sapiom.ai/v1";
```

## Chat Completion

```js
const res = await safeFetch(`${OPENROUTER}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "anthropic/claude-sonnet-4.6",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Summarize this article: ..." },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  }),
});

const data = await res.json();
const reply = data.choices[0].message.content;
```

## Recommended Models

| Model | Best For |
|-------|----------|
| `anthropic/claude-sonnet-4.6` | Default — best all-round for agent tasks, 1M context |
| `openai/gpt-4.1-mini` | Budget — fast, 1M context, good tool use |
| `google/gemini-2.0-flash-001` | Budget — fast, 1M context |
| `deepseek/deepseek-v3.2` | Budget — strong reasoning at low cost |
| `anthropic/claude-opus-4.6` | Premium — most capable, complex reasoning |

**Default recommendation:** `anthropic/claude-sonnet-4.6` — best capability/cost ratio for most agent tasks.

## JSON Mode

```js
body: JSON.stringify({
  model: "anthropic/claude-sonnet-4.6",
  messages: [
    { role: "system", content: "Respond with JSON only. Schema: { summary: string, sentiment: 'positive'|'negative'|'neutral' }" },
    { role: "user", content: articleText },
  ],
  response_format: { type: "json_object" },
})
```

## Gotchas

- **No API key needed** — the gateway injects credentials; just use `safeFetch`
- **Set `max_tokens`** — avoid unexpectedly long (expensive) responses
- **Check `res.ok`** — gateway returns 402 for payment issues, OpenRouter returns standard errors for model issues
