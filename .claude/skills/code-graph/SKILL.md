---
name: code-graph
description: Query the pre-built code-review-graph knowledge graph (Tree-sitter, whole monorepo) instead of walking call chains with Grep+Read – 2-6x cheaper, and it catches dynamic dispatch that grep misses. Use for ANY task that spans multiple files, even when the user never mentions a graph or asks for it - fixing or tracing a bug ("fix this bug", "why does X happen", "trace this"), exploring unfamiliar code ("how does X work", "who calls X", "what imports Y", "where is X used or handled"), planning or doing a refactor ("rename X", "is it safe to change or remove X", "what would break", "blast radius", "find dead code"), or reviewing changes ("review this PR", "review this branch or diff"). When you are about to Grep for a symbol's callers, callees, or importers, use this skill.
---

# Code graph (code-review-graph MCP)

Four modes (explore, debug, refactor, review) share the same setup and tools. Full setup, version pin, rebuild, troubleshooting: `.ai/MCP.md` ("code-review-graph MCP").

## Bootstrap once per session

Graph MCP tools are deferred, so a direct call fails with `InputValidationError`. Load schemas first with one `ToolSearch` (comma-separate the tools the task needs):

```
ToolSearch query: "select:mcp__code-review-graph__query_graph_tool,mcp__code-review-graph__get_impact_radius_tool,mcp__code-review-graph__detect_changes_tool,mcp__code-review-graph__get_affected_flows_tool"
```

## Keep the graph current

A graph built on another branch makes `detect_changes` report function names from unrelated files. The `PostToolUse` hook syncs after edits; rebuild manually after `git checkout` / `git pull` / large merges:

```
pipx run code-review-graph==2.3.6 status
pipx run code-review-graph==2.3.6 build
```

## Modes

### Explore

1. `list_graph_stats`, then `list_communities` and `get_community`.
2. `semantic_search_nodes` finds a function or class by name (keyword match).
3. `query_graph` with `callers_of` / `callees_of` / `importers_of` / `children_of`.
4. `list_flows` and `get_flow` for execution paths.

### Debug

1. `semantic_search_nodes` for code related to the symptom.
2. `query_graph` `callers_of` and `callees_of`; the triggering entry point is usually upstream.
3. `get_flow` through suspect areas; `get_impact_radius` on suspect files.
4. Verify the branch, then `detect_changes` (recent changes are the most common cause).

### Refactor

1. `get_impact_radius` and `get_affected_flows` before touching code.
2. `refactor_tool` mode `rename` previews every affected location; `dead_code` finds unreferenced code; `suggest` proposes community-driven splits.
3. `apply_refactor_tool` with the `refactor_id` applies a previewed rename.
4. `detect_changes` afterwards.

`refactor_tool`, `apply_refactor_tool`, and `find_large_functions` are not validated on this codebase: treat output as hypotheses, verify each edit against the code, and preview before applying.

### Review

1. `detect_changes` (risk-scored), `get_affected_flows`, `get_impact_radius`.
2. Test coverage: grep for `*.spec.js` / `*.unit.js` (`tests_for` returns 0 incorrectly for many files). Suggest cases for untested changes.

Report grouped by risk (high/medium/low): what changed and why it matters, test-coverage status, suggested improvements, overall merge recommendation.

## Cross-cutting rules

- Pass `detail_level: "minimal"` (standard mode inflates tokens ~6x).
- Use fully qualified names: `path/to/file.ts::ClassName.methodName`; bare names return "ambiguous".
- Use `list_communities` + `get_community` in place of `get_architecture_overview` (~3.9M characters, overflows context).
- Grep is cheaper than `children_of` for single-file structure.

Target: any graph task in 5 tool calls or fewer.
