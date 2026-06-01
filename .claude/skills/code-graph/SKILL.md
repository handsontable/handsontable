---
name: code-graph
description: Use the pre-built code-review-graph knowledge graph for ANY cross-file task in this monorepo — exploring code, debugging symptom→root-cause, planning a safe refactor/rename, or reviewing a branch/PR. Reach for this BEFORE manual Grep+Read of call chains; results are 2-6x cheaper. Trigger on "who calls X", "what imports Y", "where is X used", "dependency chain", "blast radius", "trace this bug", "rename X across the codebase", "find dead code", "what would break if I change", "review this PR" — or any question that spans multiple files, even when Grep seems enough.
---

# Code graph (code-review-graph MCP)

One pre-built Tree-sitter knowledge graph over the whole monorepo answers cross-file questions far more cheaply than walking call chains with Grep+Read. It serves four modes — explore, debug, refactor, review — that share the same setup and tools.

## Bootstrap once per session

Graph MCP tools are deferred at session start, so a direct call fails with `InputValidationError`. Before your first graph call, load the schemas with one `ToolSearch`:

```
ToolSearch query: "select:mcp__code-review-graph__query_graph_tool,mcp__code-review-graph__get_impact_radius_tool,mcp__code-review-graph__detect_changes_tool,mcp__code-review-graph__get_affected_flows_tool"
```

Comma-separate whichever tools the task needs. One cheap call unblocks every graph query for the rest of the session.

## Keep the graph current

A graph built on another branch makes `detect_changes` report function names from unrelated files. Verify and rebuild when needed (the `PostToolUse` hook keeps it in sync after edits, so a manual rebuild is only needed after `git checkout` / `git pull` / large merges):

```
pipx run code-review-graph==2.3.2 status
pipx run code-review-graph==2.3.2 build
```

## Pick your mode

### Explore and understand

1. `list_graph_stats` for overall metrics.
2. `list_communities`, then `get_community` for a specific area.
3. `semantic_search_nodes` to find a function or class by name (keyword match, not natural language).
4. `query_graph` with `callers_of` / `callees_of` / `importers_of` to trace relationships, or `children_of` on a class to list its methods.
5. `list_flows` and `get_flow` to follow execution paths.

### Debug an issue

1. `semantic_search_nodes` to locate code related to the symptom.
2. `query_graph` `callers_of` and `callees_of` to trace the call chain in both directions — the entry point that triggers the bug is usually upstream.
3. `get_flow` for full execution paths through suspect areas.
4. `get_impact_radius` on suspect files to see what else is affected.
5. Recent changes are the most common cause — verify the branch, then use `detect_changes`.

### Plan a refactor

1. `get_impact_radius` and `get_affected_flows` to measure blast radius before touching code.
2. `refactor_tool` mode `rename` previews every affected location; `dead_code` finds unreferenced code; `suggest` proposes community-driven splits.
3. `apply_refactor_tool` with the `refactor_id` applies a previewed rename.
4. After changes, `detect_changes` to verify the impact.

**Caveat:** `refactor_tool`, `apply_refactor_tool`, and `find_large_functions` are not empirically validated on this codebase. Treat their output as hypotheses, not prescriptions — verify each edit against the real code, and always preview before applying.

### Review changes

1. `detect_changes` for risk-scored change analysis.
2. `get_affected_flows` for impacted execution paths.
3. `get_impact_radius` for the blast radius.
4. Test coverage: grep for `*.spec.js` / `*.unit.js` (do NOT use `tests_for` — it returns 0 incorrectly for many files). Suggest specific cases for untested changes.

Report findings grouped by risk (high/medium/low): what changed and why it matters, test-coverage status, suggested improvements, and an overall merge recommendation.

## Cross-cutting rules

- Always pass `detail_level: "minimal"` — standard mode repeats absolute paths per node and inflates tokens ~6x.
- Use fully qualified names: `path/to/file.ts::ClassName.methodName`. Bare names return an "ambiguous" error.
- Do NOT call `get_architecture_overview` — it returns ~3.9M characters and overflows context. Use `list_communities` + `get_community` instead.
- For single-file structure, grep is cheaper than `children_of`.
- Full setup, version pin, rebuild, and troubleshooting: `.ai/MCP.md` ("code-review-graph MCP").

Target: complete any graph task in ≤5 tool calls.
