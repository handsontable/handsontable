<!-- Walkontable file/folder restructuring proposal. Vertical slices + ports/adapters. Companion to PLAN_WOT_LIFECYCLE.md. Produced by an adversarial-verification workflow (5 understand → 3 design → 9 verify → 1 synthesize). -->

# Walkontable — File/Folder Restructuring Proposal

Vertical-slice + ports/adapters reorg of `handsontable/src/3rdparty/walkontable/src`. Branch: `feature/DEV-1995_Walkontable-single-pass-layout`. **STATUS: Groups A/B/C/D + scope refinements are EXECUTED and committed — the whole restructure is done (all gated green). C2 split `overlays.ts` 1214 -> 675 via four collaborators (`overlay/resizeMonitor.ts`, `overlay/spreaderSize.ts`, `overlay/scroll/scrollSync.ts`, `overlay/scroll/nativeScrollInput.ts`) + nested the Overlay class hierarchy into `overlay/regions/`. C3 split `table/baseTable.ts` 946 -> 412 via three mixins (`axisSizing/sizeGetters.ts`, `table/rangeQuery/viewportPredicates.ts`, `axisSizing/oversizedRows.ts`) — C1 had already extracted the event hit-test. See the C2/C3 execution guide below for the delivered breakdown.**

## How this was produced

An adversarial workflow: 5 parallel readers mapped every file's responsibility/role/consumers → 3 independent design proposals (strict-hexagonal, capability-slices, pragmatic-disambiguate) → each attacked by 3 verifiers (naming, cohesion, import-churn) → 1 synthesis grafting the winners.

**Verdict that shaped the result:** the **strict-hexagonal top-level rings** (a `domain/ ports/ adapters/` split at the root) scored **3/10 on vertical-slice cohesion** — verifiers agreed it *recreates technical-layer silos*, the opposite of the goal. The **capability** + **pragmatic** approaches won (import-safety 8/10, naming 5–6). So: **capability slices own their own ports/adapters internally; no top-level hexagonal rings.**

**Cheap to do:** external import surface is tiny. `overlays.ts`, `event.ts`, `settings.ts`, `stickyScrollStrategy.ts` have **zero** importers outside walkontable/src. Only `table.ts` is imported by core — one `import type` in `plugins/mergeCells`. `index.ts` (the public barrel) names none of them directly.

---

## Doubt #1 — the ambiguous slice names, resolved

`geometry` / `layout` / `sizing` all read as "dimensional" and collide. Renamed on a **READS / SUPPLIES / SOLVES** verb ladder × an **element / axis / table** scope ladder, so each name states both *what it does* and *at what scope*:

| Old | New | One-line meaning (unmistakable) |
|---|---|---|
| `geometry/` | **`domMeasure/`** | **READS** raw layout-forcing pixels from **one live DOM element** (`getBoundingClientRect`/`offset*`/`client*`/`scroll*`) behind a port. Reads only — no math, no cache. |
| `sizing/` | **`axisSizing/`** | **SUPPLIES** the intended size of **one row / one column** (settings → size), the prefix-sum caches over them, and border-box conversion. Per-axis scope; its totals feed `boxLayout`. |
| `layout/` | **`boxLayout/`** | **SOLVES** the **whole-table** box decomposition (workspace/inner/viewport/hider) + the 2-variable scrollbar on/off fix-point. Pure math, zero DOM. |

Supporting renames that kill grep-collisions:
- `layout/createLayoutDeps.ts` → `boxLayout/gatherLayoutInput.ts` (names the one impure input-gathering adapter feeding the pure solver).
- `render/table.ts` → `render/tableRenderer.ts` (so it doesn't collide with the base Table once that moves into `table/`).
- `table/{master,top,bottom,inlineStart,*corner}.ts` → `…Table.ts`; `overlay/{top,bottom,…}.ts` → `…Overlay.ts` — ends the 1:1 basename collision between the two region families (`grep top` → `topTable.ts` = DOM half vs `topOverlay.ts` = positioning half).
- `overlays.ts` → `overlay/overlays.ts`; `settings.ts` → `settings/{defaults,accessor,index}.ts` (data vs engine, barrel keeps `./settings` resolving).

*(Open question: keep the `GeometryReader` type name, or rename to `DomMeasureReader`. Recommend keep — the `-Reader` suffix already states intent, 0 rename churn.)*

## Doubt #2 — `table/` conflates three concerns, resolved

The doubt was that `table/` **flatly mixes** the region-subclass family with three files that serve different purposes. Corrected placement (revised 2026-07-06 after import analysis — see note):

| File | Placement | Why |
|---|---|---|
| region subclasses (`master`, `top`, `bottom`, `inlineStart`, `*corner`) | **`table/regions/`** | The 6-strong `<table>`-per-region family, nested so it stops cluttering `table/` top. |
| `table/cellAccess.ts` | **`cellLocator/cellAccess.ts`** (moves out) | coords → TD/TH/TR DOM node — a coordinate *query* capability, not table construction. Co-located with its inverse `hitTest.ts`. |
| `table/domScaffold.ts` | **`table/domScaffold.ts` (stays)** | Table construction mixin (`this: Table`) that builds the `wtSpreader/wtHider/wtHolder` wrapper chain; only `table.ts` imports it. **NOT `render/`** — `render/` is purely per-axis/phase *content* renderers; a structural wrapper builder is out of place there. |
| `table/drawCycle.ts` | **`table/drawCycle.ts` (stays)** | `runDrawCycle(table, fastDraw)` = the Table's draw orchestration; only `table.ts` imports it. **NOT root** — the "avoid a `render→overlay` edge" reason only applied to `render/`; `table/` already imports `overlay/` pervasively (every region subclass + `cellAccess` + `table.ts` import the `CLONE_*` constants), so `table/` is its natural home with zero new coupling. |

> **Import-fact note (why domScaffold/drawCycle stay in `table/`):** grep confirms `table/{top,bottom,inlineStart,*corner}.ts`, `table/cellAccess.ts`, and `table.ts` all already `import … from '../overlay'`. The `table/→overlay/` edge is not new. `domScaffold` imports only DOM helpers + `type Table`; `drawCycle` imports `filter/` + the `CLONE_*` overlay constants + `type Table`. Both are used **only** by the base Table. They are base-Table concerns, so they belong beside `baseTable.ts`, not scattered.

Only `cellAccess.ts` genuinely leaves `table/`: a new **`cellLocator/`** slice pairs `cellAccess.ts` (coords→DOM) with `hitTest.ts` (pixel→coords, extracted from `event.ts`'s hidden `#getCellCoordsFromMousePosition` + `utils/cellCoords.ts`) — both directions of the coord↔pixel↔DOM mapping in one place.

---

## Recommended target tree

```
handsontable/src/3rdparty/walkontable/src/
  index.ts                      # FROZEN public barrel
  constants.ts types.ts ports.ts wire.ts   # STAYS (cross-cutting + composition root)

  core/            # STAYS — core.ts _base.ts clone.ts
  cell/            # FROZEN — coords.ts range.ts (~60 external deep imports)
  facade/          # FROZEN — core.ts (public facade)
  calculator/      # FROZEN — public via barrel; movable but left put
  selection/       # FROZEN — customBorders deep-imports it
  filter/          # STAYS — row.ts column.ts
  utils/
    nodesPool.ts                # STAYS (public via barrel)
    orderView/                  # STAYS (out of scope to rewrite)

  domMeasure/      # was geometry/ — READS raw DOM pixels (one element)
    geometryReader.ts           # port
    liveGeometryReader.ts       # adapter

  axisSizing/      # was sizing/ — SUPPLIES per-row/col size + caches
    axisSizeSource.ts           # port
    defaultSizeSource.ts        # adapter
    boxModel.ts                 # logical->pixel border-box
    rowUtils.ts                 # was utils/row.ts        (B3)
    columnUtils.ts              # was utils/column.ts     (B3)
    positionCache.ts            # was utils/positionCache.ts (B3)
    sizeGetters.ts              # (C) from table.ts
    oversizedRows.ts            # (C) from table.ts

  boxLayout/       # was layout/ — SOLVES table box + scrollbar fix-point (pure)
    layoutSnapshot.ts           # value objects
    resolveLayout.ts            # pure fix-point solver
    gatherLayoutInput.ts        # was createLayoutDeps.ts (the one impure adapter)
    measureWorkspace.ts         # (B4, optional) free-fns split from workspaceSize.ts

  viewport/        # which rows/cols are visible
    viewport.ts
    calculatorFactory.ts
    workspaceSize.ts

  rangeQuery/      # NEW — one port, two adapter families
    renderedRange.ts            # port interfaces
    virtualRange.ts             # (B2) calculator-backed adapter
    stickyRowsTop.ts            # was table/mixin/
    stickyRowsBottom.ts         # was table/mixin/
    stickyColumnsStart.ts       # was table/mixin/

  cellLocator/     # NEW — cell coords <-> pixels <-> DOM node
    cellAccess.ts               # was table/cellAccess.ts (coords -> node)
    cellCoords.ts               # was utils/cellCoords.ts (pixel -> coords)
    hitTest.ts                  # (C) merges cellCoords + event.ts hit-test

  render/          # per-axis/phase CONTENT renderers ONLY (barrel names frozen)
    index.ts _base.ts cells.ts rows.ts colGroup.ts
    columnHeaders.ts columnHeaderRows.ts rowHeaders.ts
    tableRenderer.ts            # was render/table.ts

  table/           # the <table> DOM system
    baseTable.ts                # was root table.ts (abstract base)
    domScaffold.ts              # base table's DOM-construction mixin
    drawCycle.ts                # base table's draw orchestration (runDrawCycle)
    regions/                    # the concrete <table>-per-region subclasses
      masterTable.ts
      topTable.ts
      bottomTable.ts
      inlineStartTable.ts
      topInlineStartCornerTable.ts
      bottomInlineStartCornerTable.ts

  overlay/         # frozen-pane region system
    overlays.ts                 # coordinator: registry/lifecycle/draw (+ thin delegates)
    constants.ts index.ts       # shared constants + barrel
    resizeMonitor.ts            # (C2) ResizeObserver loop-guard collaborator, from overlays.ts
    spreaderSize.ts             # (C2) hider/spreader sizing collaborator, from overlays.ts
    strategies/
      stickyScrollStrategy.ts   # drag-scrollbar gap-fix strategy (owned by Overlays)
    scroll/                     # (C2) overlay-only scroll collaborators (Overlays-owned)
      scrollSync.ts             # shared scroll state + master<->clone sync, from overlays.ts
      nativeScrollInput.ts      # native scroll/wheel/key/resize input wiring, from overlays.ts
    regions/                    # the Overlay class hierarchy (mirrors table/regions/)
      _base.ts                  # abstract Overlay base + createOverlayDeps
      topOverlay.ts bottomOverlay.ts inlineStartOverlay.ts
      topInlineStartCornerOverlay.ts bottomInlineStartCornerOverlay.ts

  scroll/          # viewport scroll intent -> scroll position (shared; used via facade)
    scroll.ts

  input/           # (C) DOM pointer/touch -> cell hooks
    pointerInput.ts             # (C) was root event.ts (minus hit-testing)

  settings/        # was settings.ts
    defaults.ts                 # config DATA (getDefaults)
    accessor.ts                 # getSetting engine (implements SettingsPort)
    index.ts                    # barrel — keeps './settings' resolving

# (C) = arrives with the deferred giant-file split (Group C). Everything else = the git-mv + rename pass (Groups A/B/D).
```

## Giant-orphan splits (the real work)

| File | Split into |
|---|---|
| `overlays.ts` (1214) | `scroll/nativeScrollInput.ts` + `scroll/scrollSync.ts` + `overlay/spreaderSize.ts` + `overlay/resizeMonitor.ts` + residual `overlay/overlays.ts` (registry/lifecycle/draw). Extracted scroll files wire back to Overlays via **callback deps, never a runtime import** (an ESLint `no-restricted-import` rule enforces it). |
| `table.ts` (946) | `axisSizing/sizeGetters.ts` + `axisSizing/oversizedRows.ts` + `rangeQuery/` predicate helpers + thin residual `table/baseTable.ts` (which keeps `domScaffold` + `drawCycle` beside it). Must preserve exact per-region adapter composition (master=virtual+virtual; top/bottom=stickyRow+virtualCol; inlineStart=virtualRow+stickyCol; corners=sticky+sticky). |
| `event.ts` (915) | `cellLocator/hitTest.ts` (the hidden viewport hit-test) + `input/pointerInput.ts` (thin input adapter). |

These are **behavior-preserving code extractions, not `git mv`** — each gated by a **C0 characterization spec** (this branch's own `drawCycle C0` template) pinning observable behavior *before* the extraction.

## Phased plan (each step gated by `test:walkontable` + `eslint`)

- **Group A — pure relocations (`git mv` + import-path fix only).** A1 `geometry→domMeasure` (also edit `.eslintrc.js:121` glob + `no-direct-dom-geometry-read.js:68` default, then `pnpm install` — the rule is a copied `file:` dep). A2 `sizing→axisSizing`. A3 `layout→boxLayout` (+ rename `createLayoutDeps→gatherLayoutInput`). A4 move `table/cellAccess.ts→cellLocator/cellAccess.ts` (the only file leaving `table/`; `domScaffold.ts` + `drawCycle.ts` stay). A4b nest the 6 region subclasses into `table/regions/`. A5 create `rangeQuery/` by moving `renderedRange.ts` + `table/mixin/sticky*`. A6 `stickyScrollStrategy→scroll/`.
- **Group B — low-risk code splits.** B1 `settings.ts→settings/{defaults,accessor,index}` (barrel = zero importer churn). B2 split `renderedRange.ts` into port + `virtualRange.ts`. B3/B4 optional (`utils/{row,column,positionCache}→axisSizing/`; `measureWorkspace` free-fns → `boxLayout/`).
- **Group C — giant-orphan extractions (one PR each, C0 spec first).** C1 `event.ts`. C2 `overlays.ts`. C3 `table.ts`.
- **Group D — navigability renames (optional, highest churn, last).** D1 `table.ts→table/baseTable.ts` + `render/table.ts→render/tableRenderer.ts` (29 internal + 1 external type edit). D2 `table/*→*Table.ts`. D3 `overlay/*→*Overlay.ts` + `overlays.ts→overlay/overlays.ts`.

## Decisions (user-confirmed 2026-07-06)

1. **Cohesion axis → type-split + `rangeQuery/`.** Keep `table/` (region `<table>` subclasses) and `overlay/` (region positioning) as separate families; consolidate the read-side into `rangeQuery/` (one port, two adapter families). Region-by-slice **rejected** (larger move, must special-case `master`).
2. **Scope → relocate-whole first, split later.** This effort does the pure `git mv` relocations/renames only: **Groups A, B, D**. The three giant-orphan internal splits (**Group C** — `overlays.ts`/`table.ts`/`event.ts`) are **deferred** to a separate behavior-refactor effort, each C0-gated. *(The `rangeQuery/`/`axisSizing/`/`cellLocator/` slices therefore land as folders now, populated fully once Group C runs; until then the range predicates + size getters + hit-test stay inside their giant files.)*
3. **`layout/` → `boxLayout/`.** Confirmed.
4. **Navigability renames → do all of Group D.** `table.ts→table/baseTable.ts`, `render/table.ts→render/tableRenderer.ts` (29 internal + 1 external type edit), `table/*→*Table.ts`, `overlay/*→*Overlay.ts`, `overlays.ts→overlay/overlays.ts`. Last, as isolated codemod commits.

5. **`table/` internal shape (confirmed 2026-07-06).** The 6 concrete subclasses go in **`table/regions/`**; `baseTable.ts` + `domScaffold.ts` + `drawCycle.ts` stay at `table/` top (regions/ already isolates the instances, so the two mechanism files sitting beside their only consumer `baseTable.ts` is fine). Not nesting them into `table/base/`; not renaming `regions/` to `instances/`.
6. **`utils/cellCoords.ts` → `cellLocator/cellCoords.ts` now** (pure move); it merges into `cellLocator/hitTest.ts` later with the `event.ts` split (Group C). `utils/{row,column,positionCache}.ts` → `axisSizing/` taken (B3).

**Still open (low-stakes, decide at execution):** keep the `GeometryReader` type name (recommended) vs rename to `DomMeasureReader`.

## Execution status

**ALL EXECUTED 2026-07-06 (commits `84adeb14c7`..`943de724cb`), every step gated green (`test:types` + `test:walkontable` 749/0/2 + `eslint` exit 0).**

- **Group A ✅** A1 `geometry→domMeasure`, A2 `sizing→axisSizing`, A3 `layout→boxLayout` (+`createLayoutDeps→gatherLayoutInput`), A4 cellAccess+cellCoords→cellLocator, A5 `rangeQuery/` created, A6 `stickyScrollStrategy→scroll/`.
- **Group B ✅** B3 `utils/{row,column,positionCache}→axisSizing/`, B1 `settings.ts→settings/{defaults,accessor,index}`, B2 `renderedRange→port + virtualRange`.
- **Group D ✅** D1a `render/table→tableRenderer`, D1b+D2 `table.ts→table/baseTable.ts` + regions→`table/regions/*Table.ts`, D3 `overlay/*→*Overlay.ts` + `overlays.ts→overlay/overlays.ts`.
- **Scope refinements (user-directed, post-audit):**
  - Dissolved `cellLocator/` — a consumer audit showed `cellAccess` is table-only and `cellCoords` is event-only, so the grouping was premature. → `cellAccess.ts` moved to `table/`, `cellCoords.ts` to `utils/`.
  - Nested `rangeQuery/` under `table/` — its only consumers are the table family.
  - Renamed `utils/cellCoords.ts → utils/hitTest.ts` (clashed with `cell/coords.ts` `CellCoords`; content is `findColumnAtX`/`findRowAtY` pixel→cell hit-testing).
  - Moved `stickyScrollStrategy.ts` from `scroll/` to **`overlay/strategies/`** (`79ad955e07`) — it's owned by `Overlays` and mutates overlay spreaders (an overlay behavior, not a scroll concern). `strategies/` is a generic home for future overlay-extending strategies. `scroll/` now holds only `scroll.ts`.
- **Consumer audit — kept at root (multi/cross-cutting consumers):** `domMeasure/` (core+types+wire+deps), `axisSizing/` (calculator+render+table+viewport+wire).
- **`boxLayout/` nested under `viewport/` (user-confirmed 2026-07-06)** — viewport is its only consumer, so `viewport/boxLayout/{layoutSnapshot,resolveLayout,gatherLayoutInput}`. Applies the single-consumer rule strictly; promote back to root if the single-pass work later gives it other consumers. Commit `6135edcf3b`.

<details><summary>Original Group-A-only status (superseded by the above)</summary>

- **Group A ✅ COMPLETE (2026-07-06, commits `84adeb14c7`..`195fd84f50`).** All pure `git mv` relocations, each gated green (`test:types` + `test:walkontable` 749/0/2 + `eslint` exit 0):
  - A1 `geometry/ → domMeasure/` (+ both ESLint couplings + `pnpm install`)
  - A2 `sizing/ → axisSizing/`
  - A3 `layout/ → boxLayout/` (+ `createLayoutDeps.ts → gatherLayoutInput.ts`)
  - A4 `cellAccess.ts` + `utils/cellCoords.ts → cellLocator/`
  - A5 create `rangeQuery/` (`renderedRange.ts` from viewport/ + 3 sticky mixins from `table/mixin/`; empty `table/mixin/` removed)
  - A6 `stickyScrollStrategy.ts → scroll/`
- **Group B — NOT STARTED.** B1 settings split, B2 renderedRange port/virtualRange split, B3 `utils/{row,column,positionCache} → axisSizing/`, B4 optional measureWorkspace split.
- **Group D — NOT STARTED.** baseTable move + `*Table`/`*Overlay` suffixes + `table/regions/` nesting (region nesting folded into D2).
- **Group C — IN PROGRESS** (giant-file splits; core `test:e2e` passed at the pre-C baseline, user-confirmed).
  - **C1 ✅** extracted `getCellCoordsFromMousePosition` (155-line pixel→cell hit-test) from `event.ts` into `utils/pointerToCoords.ts` (joining `findColumnAtX`/`findRowAtY`); `event.ts` 915→760. Verbatim extraction (`this.#deps.`→`deps.`), gated green (types + walkontable 749/0 + eslint + coords e2e 16/0). Commits `a5803b4782`, `8b459de646` (rename `hitTest.ts`→`pointerToCoords.ts`).
  - **C2 — TODO** split `overlay/overlays.ts` (1214 lines). **C3 — TODO** split `table/baseTable.ts` (~950 lines). See the execution guide below.

### C2 / C3 execution guide (for the next session)

**KEY DESIGN FINDING (decides the extraction mechanism):**
- The **mixin pattern** (`mixin(Owner, group)`, used by S4 range-query + S9 viewport) only works for **pure/stateless** method groups. A mixin function runs with `this` = the instance but **cannot access another class's `#private` fields**.
- The overlays scroll/sync/resize methods read+write `#private` state (`#lastVertical/HorizontalScrollPositionForCallback`, `#containerDomResizeCount`(+`Timeout`), `#hasRenderingStateChanged`). So they **cannot be mixins** → extract each stateful concern as a **collaborator class**, modeled on the existing `overlay/strategies/stickyScrollStrategy.ts`: constructed by `Overlays`, owns its own state, wired via a `createXxxDeps(ctx)` factory, **type-only** import of `Overlays` (never a runtime import → no cycle), callbacks passed in deps.
- Pure getter groups (C3 `sizeGetters` — cache reads only) **can** be mixins living in `axisSizing/` and applied via `mixin(Table, sizeGetters)` (same shape as `table/rangeQuery/virtualRange.ts`). Verify each method's `#private`/`this.deps` usage before choosing mixin vs collaborator.

**C2 concern groups in `overlay/overlays.ts` — ✅ ALL DONE** (extracted as collaborator classes, `stickyScrollStrategy` template; `overlays.ts` 1214 -> 675):
1. **resizeMonitor ✅** → `overlay/resizeMonitor.ts` — `ResizeObserver` + `#containerDomResizeCount`/`Timeout` endless-loop guard (`observe()`/`resetResizeCount()`/`destroy()`).
2. **spreaderSize ✅** → `overlay/spreaderSize.ts` — `updateLastSpreaderSize`, `adjustElementsSize`, `expandHider*` + the `#lastSize` cache. Overlays keeps public delegates (called from ~175 sites via `wtOverlays`/`view`); `applyToDOM`/`#adjustElementsSizeIfNeeded` stay in the coordinator (touch sticky + `this.destroyed`).
3. **scrollSync ✅** → `overlay/scroll/scrollSync.ts` — shared scroll state (`scrollableElement`, scroll flags, `#hasRenderingStateChanged`, callback-position cache) + `syncScrollPositions`/`syncScrollWithMaster`/`updateMainScrollableElements`/`fireScrollCallbacksAndReset`. Overlays keeps public delegates + `scrollableElement` getter + `verticalScrolling`/`horizontalScrolling` get/set accessors (external + whitebox-test reads/writes). **Finding:** overlays resolved off the coordinator's own fields, not `wot.wtOverlays`, because `cacheScrollCallbackPositions` runs during the Overlays constructor.
4. **nativeScrollInput ✅** → `overlay/scroll/nativeScrollInput.ts` — `registerListeners` + the scroll/wheel/key/resize handlers, `translateMouseWheelToScroll`, `keyPressed`, browser-line-height. Overlays keeps a public `registerListeners` delegate (ScrollSync re-registers) and public `scrollVertically`/`scrollHorizontally` (the wheel path routes through them; `scroll.spec` spies them via `wtOverlays`).
- **Overlay-only scroll collaborators live in `overlay/scroll/`** (nested, not the shared top-level `scroll/`, and not flat in `overlay/` — grouped so the slice stays navigable).
- **Residual coordinator** in `overlay/overlays.ts`: registry (`getOverlays`/`initOverlays`), draw participation (`beforeDraw`/`afterDraw`/`refreshAll`/`refresh`/`prepareHeaderBorders`/`applyToDOM`/`refreshColumnHeaderHeights`), `destroy`, and the thin delegates/accessors above.

**C3 for `table/baseTable.ts` — ✅ ALL DONE** (three mixins, `cellAccess`/`domScaffold` template; `baseTable.ts` 946 -> 412):
1. **sizeGetters ✅** → `axisSizing/sizeGetters.ts` — getRowHeight/getColumnHeaderHeight/getColumnWidth/getWidth/getHeight/getTotalWidth/getTotalHeight/hasDefinedSize/isVisible (cache + geometry-read delegates).
2. **viewportPredicates ✅** → `table/rangeQuery/viewportPredicates.ts` — the 13 rendered-range / viewport predicates (is*Rendered / is*Before/AfterRendered / is*Viewport / isLast*FullyVisible / all*InViewport); `boolean|null` return types of the filter-guarded ones preserved exactly.
3. **oversizedRows ✅** → `axisSizing/oversizedRows.ts` — markOversizedRows/resetOversizedRows/adjustColumnHeaderHeights/syncOversizedColumnHeadersWithFrozenOverlays (kept by design). Gated with core e2e (colHeader #12198/#12632, nestedHeaders, autoRowSize, mergeCells, getRowHeight, renderSizeProbe 837/0).
- All three are declaration-merge mixins on `Table` (`mixin(Table, x)` + `interface Table extends X`), so the methods stay on the `Table` type and every external caller (core, plugins, overlays, drawCycle) is unaffected. `#deps` reads route through the existing `get deps()` getter. No subclass overrides existed. Per-region adapter composition unchanged.

**Per-extraction gate (commit only when all green):** `npm --prefix handsontable run test:types` (the reliable broken-import checklist — trust it over lagging editor diagnostics) + `test:walkontable` (749 specs, 0 failures) + `eslint` (exit 0); targeted core `test:e2e --testPathPattern=<area>` for behavior-risky cuts. grep BOTH `src/` and `test/` for importers on every move.

## Executable scope for this effort

Groups **A → B → D** (deferring C). Net: pure `git mv` + import-path fixes + the `settings.ts` barrel split, each step gated by `test:walkontable` + `eslint`. Group A1 also touches the two ESLint couplings (`.eslintrc.js` glob + `no-direct-dom-geometry-read.js` default) → `pnpm install`.
