---
name: Refactor Safely
description: Plan and execute safe refactoring using dependency analysis
---

## Refactor Safely

Use the knowledge graph to plan and execute refactoring with confidence.

**Note:** `refactor_tool`, `apply_refactor_tool`, and `find_large_functions` have not been empirically validated on this codebase. Treat the suggestions they produce as hypotheses, not prescriptions -- verify each edit against the actual code.

### Steps

1. Verify the graph is on the current branch (`pipx run code-review-graph==2.3.2 status`). Rebuild after `git checkout` / `git pull`: `pipx run code-review-graph==2.3.2 build`. A stale graph produces misleading refactor suggestions.
2. Use `refactor_tool` with mode="suggest" for community-driven refactoring suggestions.
3. Use `refactor_tool` with mode="dead_code" to find unreferenced code.
4. For renames, use `refactor_tool` with mode="rename" to preview all affected locations.
5. Use `apply_refactor_tool` with the refactor_id to apply renames.
6. After changes, run `detect_changes` to verify the refactoring impact.

### Safety Checks

- Always preview before applying (rename mode gives you an edit list).
- Check `get_impact_radius` (detail_level="minimal") before major refactors.
- Use `get_affected_flows` to ensure no critical paths are broken.
- Run `find_large_functions` to identify decomposition targets.

See `AGENTS.md` "MCP Tools: code-review-graph" for the full set of rules (detail_level, qualified names, when to use grep instead). Target: complete any refactor planning task in ≤5 tool calls.
