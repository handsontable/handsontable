---
name: Explore Codebase
description: Navigate and understand codebase structure using the knowledge graph
---

## Explore Codebase

Use the code-review-graph MCP tools to explore and understand the codebase.

### Steps

1. Run `list_graph_stats` to see overall codebase metrics.
2. Use `list_communities` to find major modules, then `get_community` for a specific area.
3. Use `semantic_search_nodes` to find specific functions or classes by name (keyword matching, not natural language).
4. Use `query_graph` with patterns like `callers_of`, `callees_of`, `importers_of` to trace relationships.
5. Use `query_graph` with `children_of` on a class to list its methods.
6. Use `list_flows` and `get_flow` to understand execution paths.

### Tips

- Do NOT call `get_architecture_overview` -- it returns 3.9M characters and will overflow context.
- Use `children_of` on a fully-qualified class name (e.g. `path/to/file.js::ClassName`), not bare names.
- Always pass `detail_level: "minimal"` -- standard mode repeats the full path per node and inflates output 6x.
- For single-file structure, grep is faster and cheaper than `children_of`.

## Token Efficiency Rules
- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
