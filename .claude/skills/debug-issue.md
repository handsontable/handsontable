---
name: Debug Issue
description: Systematically debug issues using graph-powered code navigation
---

## Debug Issue

Use the knowledge graph to systematically trace and debug issues.

### Steps

1. Use `semantic_search_nodes` (detail_level="minimal") to find code related to the issue by name or keyword.
2. Use `query_graph` with `callers_of` and `callees_of` (detail_level="minimal") to trace call chains.
3. Use `get_flow` to see full execution paths through suspected areas.
4. To check if recent changes caused the issue, first verify the graph is on the correct branch (`pipx run code-review-graph==2.3.2 status`). A stale graph makes `detect_changes` report unrelated function names. Rebuild if needed: `pipx run code-review-graph==2.3.2 build`.
5. Use `get_impact_radius` (detail_level="minimal") on suspected files to see what else is affected.

### Tips

- Check both callers and callees to understand the full context.
- Look at affected flows to find the entry point that triggers the bug.
- Recent changes are the most common source of new issues.

See `AGENTS.md` "MCP Tools: code-review-graph" for the full set of rules (detail_level, qualified names, when to use grep instead). Target: complete any debug task in ≤5 tool calls.
