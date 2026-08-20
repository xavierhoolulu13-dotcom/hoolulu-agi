# Contributing to Sapiom Skills

Thanks for your interest in contributing. This guide covers the structure, standards, and process for submitting skills.

## What is a skill?

A skill is a markdown document that gives an AI agent actionable guidance for a specific task or capability. When an agent loads a skill, it gets the context it needs to call APIs, handle edge cases, and make good decisions — without reading full documentation.

Good skills are **opinionated and specific**. They tell the agent what to do, not everything it could do.

## Skill structure

Each skill lives in its own directory under `skills/`:

```
skills/
  my-skill/
    SKILL.md              # Main skill file (required)
    references/           # Supporting docs (optional)
      api-reference.md
      examples.md
```

### SKILL.md

Every skill needs a `SKILL.md` with YAML frontmatter:

```yaml
---
name: my-skill
description: One sentence describing when an agent should load this skill. Be specific about the trigger — what task is the agent trying to accomplish?
---
```

The description is how agents decide whether to load your skill. Write it from the agent's perspective: "Use when building X that needs Y" is better than "Documentation for Y."

### References

Use a `references/` directory when the API surface is large enough that putting everything in `SKILL.md` would dilute the core guidance. The main skill file should be self-contained for the common case — references are for deep dives.

**Put in SKILL.md:** Setup, core patterns, the 80% use case, decision guidance, common errors.

**Put in references/:** Full parameter tables, response schemas, advanced configurations, edge cases.

## What makes a good skill

1. **Actionable over comprehensive.** An agent loading your skill should be able to complete a task, not just understand a system. Lead with working code.
2. **Scoped tightly.** One skill, one job. "Search the web via Sapiom" is good. "Use Sapiom" is too broad. "Search the web via Linkup with standard depth" is too narrow.
3. **Honest about limitations.** Include "when NOT to use this" guidance so agents don't load your skill for the wrong task.
4. **Tested against real usage.** Before submitting, verify that an agent can actually follow your skill to complete the task. Code examples should work.

## Submitting a skill

1. Fork the repo and create a branch.
2. Add your skill directory under `skills/`.
3. Update `README.md` to include your skill in the Available Skills table.
4. Open a PR with:
   - **What the skill does** — one sentence.
   - **Why it's useful** — what gap does it fill?
   - **How you tested it** — did an agent successfully use it?

We'll review for structure, accuracy, and scope. Expect feedback — we'd rather iterate toward a great skill than merge a mediocre one.

## Conventions

- Use `@sapiom/fetch` or `@sapiom/axios` in code examples to stay consistent with the existing skill.
- Fetch live docs when details might change (pricing, model lists). Don't hardcode volatile information.
- Keep frontmatter descriptions under 200 characters.
- Use standard markdown. No HTML.

## Ideas for skills

Not sure what to build? Here are areas where skills would be valuable:

- **Workflow recipes** — multi-step patterns that combine Sapiom services (e.g., "research and summarize a topic" using search + AI models)
- **Framework integrations** — using Sapiom with specific frameworks (Vercel AI SDK, LangChain, etc.)
- **Domain-specific patterns** — e.g., content generation pipelines, data enrichment workflows, monitoring setups

If you want to discuss an idea before building, open an issue.

## Questions?

Open an issue or reach out at [docs.sapiom.ai](https://docs.sapiom.ai).
