---
name: Review Changes
description: Perform a structured code review using change detection and impact
---

## Review Changes

Perform a thorough, risk-aware code review using the knowledge graph.

### Steps

1. Verify the graph is on the correct branch (`code-review-graph status`). If it was built on a different branch, rebuild first (`code-review-graph build`) -- a stale graph causes `detect_changes` to report function names from unrelated files.
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

## Token Efficiency Rules
- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.
