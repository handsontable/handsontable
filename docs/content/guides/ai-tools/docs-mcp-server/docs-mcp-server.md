---
type: explanation
title: Docs MCP Server
metaTitle: Docs MCP Server - JavaScript Data Grid | Handsontable
description: A public MCP server that gives any AI agent semantic search over the Handsontable and HyperFormula docs, API reference, release notes, GitHub issues, and more.
permalink: /docs-mcp-server
react:
  metaTitle: Docs MCP Server - React Data Grid | Handsontable
angular:
  metaTitle: Docs MCP Server - Angular Data Grid | Handsontable
vue:
  metaTitle: Docs MCP Server - Vue Data Grid | Handsontable
searchCategory: Guides
category: AI Tools
menuTag: new
---
The Docs MCP Server is a public <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer">Model Context Protocol</a> endpoint that gives any MCP-capable AI agent live semantic search over the Handsontable and HyperFormula knowledge base:

```
https://docs-assistant.handsontable.com/mcp
```

It runs on the same retrieval that powers the [AI Docs Assistant](@/guides/ai-tools/ai-docs-assistant/ai-docs-assistant.md), exposed as a tool your agent calls while it works. No install, no authentication, no API key.

## What your agent can search

The knowledge base covers more than the docs site:

- Documentation guides and the API reference
- HyperFormula guides
- Code recipes distilled from the [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md)
- Release notes for both products
- GitHub issues for both products, including resolved discussions
- Blog posts

The index always tracks the latest release of each product, so your agent retrieves current APIs instead of guessing from outdated training data.

## Connect your agent

### Claude Code

```bash
claude mcp add --transport http handsontable-docs https://docs-assistant.handsontable.com/mcp
```

If you use Claude Code, also install the [Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md) -- the skills teach Claude how to work with Handsontable, and the MCP server backs that up with live retrieval.

### Cursor

Add the server to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "handsontable-docs": { "url": "https://docs-assistant.handsontable.com/mcp" }
  }
}
```

### Other MCP clients

The server uses the streamable HTTP transport, so any MCP client connects with the URL alone. Add `https://docs-assistant.handsontable.com/mcp` wherever your client configures remote MCP servers.

## The search_docs tool

The server exposes one tool: `search_docs`.

| Argument | Type | Description |
|---|---|---|
| `query` | string, required | What to search for, in natural language or keywords. |
| `limit` | number, optional | Maximum number of snippets to return. |
| `ht_version` | string, optional | Expected Handsontable version. The server validates it against the knowledge base coverage. |
| `hf_version` | string, optional | Expected HyperFormula version. Validated the same way. |

Results are ranked page-level snippets. Each snippet carries a `url` when a public page exists for it, and the response reports which product versions the knowledge base covers.

## Which AI tool should you use?

- **[AI Docs Assistant](@/guides/ai-tools/ai-docs-assistant/ai-docs-assistant.md)** -- you're reading the docs and want answers in chat form.
- **[Skills for Claude Code](@/guides/ai-tools/skills-for-claude-code/skills-for-claude-code.md)** -- you code with Claude Code, Codex, or another agent that supports skills.
- **Docs MCP Server** -- any other MCP-capable agent, or any workflow where the agent should look up current documentation at run time.

They combine well: skills give the agent working knowledge up front, and the MCP server answers the questions that come up along the way.

::: tip

The Docs MCP Server searches documentation. If you want your agent to run spreadsheet calculations through HyperFormula instead, that's the separate <a href="https://hyperformula.handsontable.com/docs/guide/mcp-server.html" target="_blank" rel="noopener noreferrer">HyperFormula MCP Server</a> (early access).

:::
