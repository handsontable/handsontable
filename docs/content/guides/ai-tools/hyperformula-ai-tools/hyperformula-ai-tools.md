---
type: explanation
id: ai6k3p2v
title: HyperFormula AI Tools
metaTitle: HyperFormula AI Tools - JavaScript Data Grid | Handsontable
description: Roadmap integrations that give AI agents deterministic spreadsheet computation through HyperFormula -- Vercel AI SDK, LangChain/LangGraph, and an MCP server.
permalink: /hyperformula-ai-tools
react:
  id: ai8z4n0g
  metaTitle: HyperFormula AI Tools - React Data Grid | Handsontable
angular:
  id: ai1c7l9j
  metaTitle: HyperFormula AI Tools - Angular Data Grid | Handsontable
vue:
  id: ai3u5b6s
  metaTitle: HyperFormula AI Tools - Vue Data Grid | Handsontable
searchCategory: Guides
category: AI Tools
---
HyperFormula is working on a set of AI tools for developers and coding agents. Three integrations are being tested internally -- one for the Vercel AI SDK, one for LangChain/LangGraph, and a standalone MCP server. All three expose the same 400+ Excel-compatible functions and the same read/write/trace tools, so an agent gets exact, reproducible, auditable results.

**Note**: These tools are not installable yet -- but you can sign up for early access when they are ready to test. 

## HyperFormula AI SDK for Vercel

A Vercel AI SDK tool that wraps HyperFormula's engine in typed tool calls. Your agent can evaluate any Excel-compatible formula, read and write cells, trace dependencies, and call any of HyperFormula's 400+ built-in functions -- no implementation work on your side. Useful when you're already building on the Vercel AI SDK and want exact spreadsheet math instead of LLM approximations.

[Open the HyperFormula AI SDK for Vercel page](https://hyperformula.handsontable.com/docs/guide/ai-sdk.html)

## Integration with LangChain

The same capabilities, exposed as LangChain and LangGraph tools. Agents built on either framework get deterministic formula evaluation, cell read/write, dependency tracing, and the full HyperFormula function set. If your stack is LangChain-first, this is the integration you want.

[Open the LangChain integration page](https://hyperformula.handsontable.com/docs/guide/integration-with-langchain.html)

## HyperFormula MCP Server

A Model Context Protocol server that exposes HyperFormula to any MCP client -- Claude Desktop, Cursor, and others. The server publishes the same formula evaluation, cell manipulation, and dependency tracing tools as the SDK integrations, so an MCP-enabled assistant can do exact financial modeling, what-if analysis, and data validation without inventing numbers.

[Open the HyperFormula MCP Server page](https://hyperformula.handsontable.com/docs/guide/mcp-server.html)
