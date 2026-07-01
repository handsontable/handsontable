# Walkontable Rendering Engine

Self-contained rendering engine for viewport calculation, DOM rendering, scroll synchronization, and the overlay system.

## Architecture Boundary

- Walkontable lives in `src/3rdparty/walkontable/src/` (TypeScript, included in the main tsconfig for type-checking — separate build/test pipeline)
- The bridge to core Handsontable is `src/tableView.ts` (TableView class)
- Plugins must NEVER access Walkontable internals directly - always go through TableView
- Do not import core Handsontable modules from Walkontable code

## Dependency injection & DOM reads (mandatory)

- **Wiring:** every module is built through the single composition root `wire.ts` (`buildContext(wot)` → `EngineContext`). Each module has a co-located `create<Module>Deps(ctx)` factory whose type is **inferred** (`export type XDeps = ReturnType<typeof createXDeps>`) — do **not** hand-write dep interfaces. Modules store deps in a private `#deps` and take a single `deps` constructor argument (plus at most one per-instance identity arg like a table `name` or overlay `type`). A read-only `get deps()` getter is used only where a subclass/mixin/collaborator must reach the deps (Table, Overlay, RowUtils, ColumnUtils). Copy any existing module (`scroll.ts` is the simplest) when adding a new one.
- **DOM geometry reads MUST go through the `GeometryReader` proxy — never read the DOM directly.** All layout-forcing reads (`getBoundingClientRect`, `getComputedStyle`, `offset{Width,Height,Top,Left,Parent}`, `client{Width,Height}`, `scroll{Width,Height,Top,Left}` reads, `inner{Width,Height}`, `scroll{X,Y}`, `page{X,Y}Offset`) go through the injected reader: `this.#deps.geometryReader.X(el)` / `this.deps.geometryReader.X(el)`, or `wotInstance.domBindings.geometryReader.X(el)` where only the instance is available. This is the seam a `CachingGeometryReader` will slot into for per-draw memoization — a single raw read defeats it.
- **If the proxy lacks a method for a read, add it** to both `geometry/geometryReader.ts` (interface) and `geometry/liveGeometryReader.ts` (adapter), then use it. Never fall back to a direct read.
- **Enforced by ESLint:** `handsontable/no-direct-dom-geometry-read` (`error`) flags any direct read across all of `src/3rdparty/walkontable/src` (only `geometry/**`, the adapter itself, is exempt). It allows access on a `geometryReader`, writes (`el.scrollTop = n`), and `this.<field>`. The rule lives in `handsontable/.config/plugin/eslint/rules/`; it is a pnpm `file:` dep that is **copied**, so after editing the rule run `pnpm install` or eslint errors "definition not found".

## Key Subsystems

- **Overlay system** (6 types): Frozen rows/columns and scroll sync. Fragile - proceed with caution.
- **Viewport calculation**: Determines visible rows/columns based on scroll position
- **Renderer**: DOM element management, cell reuse
- **Scroll handling**: requestAnimationFrame batching required

## Known Tech Debt

- The DAO layer has been replaced by constructor injection + the `wire.ts` composition root (see the DI section above) — do not reintroduce DAO getters or `wot`-god-object passing.
- Filter objects are recreated instead of updated
- Overlays still reach the master through `this.wot.wtTable`/`.wtViewport`/`.wtOverlays` in their hot-path methods (the deep `wot` decoupling is deferred; the `Clone` is a second Walkontable instance holding a handle to the master)
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
