---
name: code-graph-explore-codebase
description: Use FIRST for any cross-file code lookup in this monorepo - finding callers of a function, importers of a file, dependency chains, references to a symbol, methods on a class, blast radius, or "who uses X". The pre-built knowledge graph returns structured results 2-6x cheaper than Grep+Read traversal. Trigger on phrases like "who calls", "what imports", "where is X used", "find references", "dependency chain", "methods of class", "callers of", "callees of", or any question that spans multiple files - even when you think Grep would work.
---

## Explore Codebase

Use the code-review-graph MCP tools to explore and understand the codebase.

**Before the first graph call in a session**, load the tool schemas: call `ToolSearch` with `query: "select:mcp__code-review-graph__query_graph_tool"` (comma-separate names to load several at once). Graph MCP tools are deferred at session start, so calling them without this bootstrap fails with `InputValidationError`. This is one cheap call that unblocks every subsequent graph query for the rest of the session.

### Steps

1. Run `list_graph_stats` to see overall codebase metrics.
2. Use `list_communities` to find major modules, then `get_community` for a specific area.
3. Use `semantic_search_nodes` to find specific functions or classes by name (keyword matching, not natural language).
4. Use `query_graph` with patterns like `callers_of`, `callees_of`, `importers_of` to trace relationships.
5. Use `query_graph` with `children_of` on a class to list its methods.
6. Use `list_flows` and `get_flow` to understand execution paths.

### Tips

- Do NOT call `get_architecture_overview` -- it returns 3.9M characters and will overflow context.
- For single-file structure, grep is faster and cheaper than `children_of`.

See `AGENTS.md` "MCP Tools: code-review-graph" for the full set of rules (detail_level, qualified names, when to use grep instead). Target: complete any exploration task in ≤5 tool calls.
