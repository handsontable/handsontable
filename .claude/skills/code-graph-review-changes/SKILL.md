---
name: code-graph-review-changes
description: Use when reviewing a branch, PR, or set of recent changes - get change detection with risk scoring, affected execution flows, and impact radius across files. Prefer over manually walking the diff line-by-line. Trigger on phrases like "review this PR", "review my changes", "what's the risk of this branch", "what does this change affect", "are there regressions in", "review the diff", or any request to assess the safety or quality of pending changes.
---

## Review Changes

Perform a thorough, risk-aware code review using the knowledge graph.

**Before the first graph call in a session**, load the tool schemas: call `ToolSearch` with `query: "select:mcp__code-review-graph__detect_changes_tool,mcp__code-review-graph__get_affected_flows_tool,mcp__code-review-graph__get_impact_radius_tool"` (or whichever tools you plan to call). Graph MCP tools are deferred at session start, so calling them without this bootstrap fails with `InputValidationError`. One cheap call unblocks every subsequent graph query for the rest of the session.

### Steps

1. Verify the graph is on the correct branch (`pipx run code-review-graph==2.3.2 status`). If it was built on a different branch, rebuild first (`pipx run code-review-graph==2.3.2 build`) -- a stale graph causes `detect_changes` to report function names from unrelated files.
2. Run `detect_changes` (detail_level="minimal") to get risk-scored change analysis.
3. Run `get_affected_flows` to find impacted execution paths.
4. Run `get_impact_radius` (detail_level="minimal") to understand the blast radius.
5. For test coverage, use grep to find `*.spec.js` / `*.unit.js` files rather than `tests_for` -- `tests_for` returns 0 results incorrectly for many files.
6. For any untested changes, suggest specific test cases.

### Output Format

Provide findings grouped by risk level (high/medium/low) with:
- What changed and why it matters
- Test coverage status
- Suggested improvements
- Overall merge recommendation

See `AGENTS.md` "MCP Tools: code-review-graph" for the full set of rules (detail_level, qualified names, when to use grep instead). Target: complete any review task in ≤5 tool calls.
