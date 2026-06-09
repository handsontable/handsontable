# Walkontable Rendering Engine

Self-contained rendering engine for viewport calculation, DOM rendering, scroll synchronization, and the overlay system.

## Architecture Boundary

- Walkontable lives in `src/3rdparty/walkontable/src/` (TypeScript, excluded from main tsconfig — separate build/test pipeline)
- The bridge to core Handsontable is `src/tableView.ts` (TableView class)
- Plugins must NEVER access Walkontable internals directly - always go through TableView
- Do not import core Handsontable modules from Walkontable code

## Key Subsystems

- **Overlay system** (6 types): Frozen rows/columns and scroll sync. Fragile - proceed with caution.
- **Viewport calculation**: Determines visible rows/columns based on scroll position
- **Renderer**: DOM element management, cell reuse
- **Scroll handling**: requestAnimationFrame batching required

## Known Tech Debt

- DAO layer uses Data Access Objects instead of DI (20+ TODO comments)
- Filter objects are recreated instead of updated
- See `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` for full list

## Performance

- Batch scroll events with requestAnimationFrame
- Never `arr.push(...largeArray)` with 10k+ elements
- Reuse DOM elements, minimize layout thrashing

## Testing

Separate test runner - do NOT mix with main E2E tests:
`npm run test:walkontable --prefix handsontable`

Tests in: `src/3rdparty/walkontable/test/`

For detailed guidance: use skills `walkontable-dev`, `walkontable-testing`

## MCP Tools: code-review-graph

A Tree-sitter knowledge graph (28k+ nodes, 419k+ edges) pre-built over the full codebase. Provides structured, function-level results for cross-file queries that would otherwise require many Grep+Read round-trips.

**Prerequisite:** `pipx` must be installed. The MCP server starts automatically via `pipx run` on first use (one-time ~10s PyPI download, then cached). Rebuild after switching branches: `pipx run code-review-graph==2.3.2 build`.

**Maintainer note:** the pinned version `2.3.2` appears in `.mcp.json`, the two hook commands in `.claude/settings.json`, and the guidance tables below. Bumping requires updating all four locations in sync.

### First-call protocol - load schema before grep

Graph MCP tools are **deferred** at session start; their schemas are not loaded. Calling them directly fails with `InputValidationError`. The sequence is always:

1. `ToolSearch` with `query: "select:mcp__code-review-graph__query_graph_tool"` to load the schema (comma-separate names to load several in one call).
2. Call `mcp__code-review-graph__query_graph_tool` with `pattern` and `detail_level: "minimal"`.

If you reach for `grep -r "from.*foo"`, `grep -rn` for a symbol, or repeated `Read` calls to answer a cross-file question, **stop and load the graph tool first.** Grep produces 2-6x more tokens, lacks structural context, and misses dynamic dispatch.

### Trigger phrases - these mean "use the graph"

The first tool call should be `ToolSearch` for the graph schema whenever the user asks any of: "dependency chain", "who calls X", "callers of X", "callees of X", "where is X used", "find references", "what imports Y", "blast radius", "impact of changing X", "methods on class Z", "find dead code", "trace this bug". The matching `code-graph-*` skill is helpful but not required - a single `ToolSearch` -> `query_graph_tool` round trip is fine.

### Use the graph for cross-file traversal

| Task | Tool + pattern | Token advantage |
|------|---------------|-----------------|
| Who calls `foo`? | `query_graph` `callers_of` | ~5k tokens vs ~11k for grep+context (2x cheaper) |
| What does `Foo` call? | `query_graph` `callees_of` | Same advantage as above |
| What files import `bar.ts`? | `query_graph` `importers_of` | Structured; no grep context needed |
| Blast radius before a refactor | `get_impact_radius` | ~100 tokens for count + risk score |

### Use Grep/Read for single-file work

| Task | Why Grep wins |
|------|--------------|
| Methods in one file | `children_of` standard = ~2,845 tokens; grep = ~473 tokens (6x cheaper) |
| Recent change review | `detect_changes` requires the graph to be on the same branch |
| Test coverage lookup | `tests_for` returns 0 incorrectly for files with known tests - not reliable |
| Natural-language search | No embeddings built; `semantic_search_nodes` falls back to keyword matching |
| Architecture overview | `get_architecture_overview` returns 3.9M characters - do not call it |

### Mandatory rules

1. **Always pass `detail_level: "minimal"`** - standard mode repeats the full absolute path per node and inflates token cost 6x.
2. **Use fully qualified names**: `path/to/file.ts::ClassName.methodName`. Bare names return an "ambiguous" error.
3. **Rebuild on branch switch**: `pipx run code-review-graph==2.3.2 build`. A stale graph causes `detect_changes` to report function names from unrelated files.

### Reliable tools

| Tool | Use when |
|------|----------|
| `query_graph` pattern=`callers_of` | Finding all functions that call a target |
| `query_graph` pattern=`callees_of` | Finding all functions a target calls |
| `query_graph` pattern=`importers_of` | Finding all files that import a target |
| `query_graph` pattern=`children_of` | Listing all methods in a class (use minimal mode) |
| `get_impact_radius` | Quick blast-radius count before a large refactor |
| `semantic_search_nodes` | Name-based lookup by exact or partial function/class name |
