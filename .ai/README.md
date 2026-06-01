# `.ai/` Reference System

The `.ai/` directories hold **deep reference documentation** — the "how it works
and why" layer. They are loaded on demand: linked from the always-loaded
`AGENTS.md` files and from skills, not read on every turn.

## Three-layer model

| Layer | Role | Loaded |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` | Lean must-not-violate rules plus a navigation map for the directory it lives in. Answers *"what must I never get wrong here, and where do I look next."* | Always, within its subtree |
| `.ai/` | Deep reference: architecture, conventions, concerns, testing detail, diagrams. Answers *"how does this work and why."* | On demand |
| `.claude/skills/` | Step-by-step task workflows. Answers *"how do I do task X."* | On skill trigger |

`CLAUDE.md` is a symlink to the sibling `AGENTS.md` in each directory.

## Where each topic lives

### Monorepo scope — root `.ai/`

Monorepo-wide orientation, not core internals.

| File | Contents |
|---|---|
| [`README.md`](README.md) | This index. |
| [`STACK.md`](STACK.md) | Tech stack and tooling: languages, runtime, frameworks, build and test tools with versions, build outputs, CSS themes, platform targets, CI workflows. |
| [`STRUCTURE.md`](STRUCTURE.md) | Top-level monorepo tree and workspace map. |
| [`BUILD-RELEASE.md`](BUILD-RELEASE.md) | Build order (core before wrappers), build variants, output locations, `env-cmd`, SemVer and LTS policy, branching, changelog and release flow. |
| [`DOC-STANDARDS.md`](DOC-STANDARDS.md) | Monorepo-wide documentation standards: when docs are required, docs branch conventions, the 13 writing-style rules, migration-guide spec, and trademark rules. |
| [`TESTING.md`](TESTING.md) | Overview of every test pipeline with its run command and a pointer to the deep reference. |
| [`MCP.md`](MCP.md) | code-review-graph and context tooling (monorepo-wide). |

### Core scope — `handsontable/.ai/`

Internals of the core data grid package.

| File | Contents |
|---|---|
| `handsontable/.ai/ARCHITECTURE.md` | Microkernel design, Core and TableView, registry, entry points, plugin/data/event diagrams. |
| `handsontable/.ai/CONVENTIONS.md` | Core coding conventions. |
| `handsontable/.ai/CONCERNS.md` | Core technical debt. |
| `handsontable/.ai/STRUCTURE.md` | `handsontable/src/` tree and plugin inventory. |
| `handsontable/.ai/INDEX-MAPPING.md` | The index-mapping subsystem (`src/translations/`): IndexMapper, map types, the physical/visual/renderable translation chain, cache, and observers. |
| `handsontable/.ai/META-MANAGEMENT.md` | The metadata subsystem (`src/dataMap/metaManager/`): the cell → column → global cascade, `metaSchema` defaults, MetaManager API, dynamic meta, and physical-index keying. |
| `handsontable/.ai/HOOKS.md` | The hook / event system (`src/core/hooks/`): the `Hooks` singleton and per-instance buckets, the `before*`/`after*` bus, registration, and removed/deprecated hooks. |
| `handsontable/.ai/INTEGRATIONS.md` | External integrations and framework bridging. |
| `handsontable/.ai/TESTING.md` | Full core testing detail: Jest and Jasmine setup, theme-aware assertions, helpers, mocking, fixtures, custom matchers. |

### Rendering engine scope — `handsontable/src/3rdparty/walkontable/.ai/`

Internals of the Walkontable rendering engine.

| File | Contents |
|---|---|
| `handsontable/src/3rdparty/walkontable/.ai/ARCHITECTURE.md` | Overlays, viewport calculation, scroll handling, DOM reuse, the TableView bridge, rendering-pipeline diagram. |
| `handsontable/src/3rdparty/walkontable/.ai/CONCERNS.md` | Walkontable-specific debt (DAO layer, overlay fragility, filter recreation). |

## Conventions

- Cross-references use repo-root-relative paths (for example
  `handsontable/.ai/TESTING.md`), not filesystem-relative `../` paths.
- Wrappers (`wrappers/react-wrapper`, `wrappers/angular-wrapper`,
  `wrappers/vue3`) and `docs/` keep their own `AGENTS.md` and have no `.ai/`
  directory.
- Diagrams live only in `.ai/` files, never in the always-loaded `AGENTS.md`.
