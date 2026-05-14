# Plan: Remove `handsontable/src/common.ts`

## Context

`src/common.ts` has grown into a 1228-line dumping ground that 208 source files import from. Steps 1–3 of the ongoing TypeScript-rewrite branch already extracted plugin-registry types, border types, and Walkontable-internal types (10 interfaces removed, 27 exports remain). This plan finishes the job: empty the file, then delete it.

The driving insight: most of the remaining "Instance" interfaces are **hand-written duplicates of TypeScript classes that already exist** (e.g. `MetaManagerInstance` mirrors the `MetaManager` class). Since those source classes are TypeScript, the class itself is already the authoritative type — the hand-written interface is dead weight. Where a class is not available (`Core` is still a function constructor, not a class), we keep a hand-written interface but move it next to its owner.

End state: `common.ts` deleted; types live next to the code that owns them.

## Decisions confirmed with the user

- **Class-mirror interfaces** → delete; use `import type { ClassName }` from the class file.
- **`HotInstance`** → keep hand-written, move to `src/core/types.ts` (Core is a function constructor, no class type available).
- **`GridSettings` + `Events`** → move to `src/core/settings.ts`.
- **Coord types** → `CellCoords`/`CellRange` already exist as classes in `src/3rdparty/walkontable/src/cell/` — use those via `import type`. `OverlayType` joins `walkontable/src/types.ts`. `RangeType` (plain `{row, col}` object, no class) goes to `src/core/types.ts`.
- **DAO types** (`DataAccessObject`, `ScrollDao`) → next to `tableView.ts` (which constructs them). `SelectionTableProps` → `selection/` module.
- **Circular-import risk** → trust `import type` (erased at compile time, no runtime cycle); verify with `npm run build:types`.
- **Migration scope** → single PR, mass-update all 208 import paths.
- **Verification** → `build:types` + `test:types` + `npm run build` + `npm run lint`.

## Inventory of the 27 remaining exports and their destinations

### A. Delete — interface duplicates an existing TS class

Replace every importer with `import type { Class } from '<path>'`.

| Interface (line) | Replace with | Class location |
|---|---|---|
| `MetaManagerInstance` (1206) | `MetaManager` | `src/dataMap/metaManager/index.ts` |
| `DataMapInstance` (1137) | `DataMap` | `src/dataMap/dataMap.ts` |
| `DataSourceInstance` (1166) | `DataSource` | `src/dataMap/dataSource.ts` |
| `EditorManagerInstance` (1117) | `EditorManager` | `src/editorManager.ts` |
| `BaseEditorInstance` (781) | `BaseEditor` | `src/editors/baseEditor/baseEditor.ts` |
| `SelectionManager` (622) | `Selection` | `src/selection/selection.ts` |
| `HighlightInstance` (570) | `Highlight` | `src/selection/highlight/highlight.ts` |
| `StylesHandler` (767) | `StylesHandler` (the class) | `src/utils/stylesHandler.ts` |
| `ShortcutManager` (752) | `ShortcutManager` (the class) | `src/shortcuts/manager.ts` |
| `ViewInstance` (666) | `TableView` | `src/tableView.ts` |
| `FocusManagerInstance` (1089) | `FocusManager` | locate class, use class type |
| `FocusScopeManagerInstance` (1105) | `FocusScopeManager` | locate class, use class type |
| `ShortcutContext` (739) | the existing `Context` class in `src/shortcuts/context.ts` | check & confirm during execution |
| `HighlightSelection` (588) | `VisualSelection` | `src/selection/highlight/visualSelection.ts` |
| `SelectionRangeContainer` (604) | candidate class in `src/selection/` | locate during execution |

For each: grep usage sites, swap the import, drop the interface from `common.ts`. If `import type` triggers a build-time cycle, fall back to a co-located narrow interface (escape hatch — not expected based on `import type` erasure semantics).

### B. Move (still hand-written) — no class to derive from

| Type (line) | New home |
|---|---|
| `GridSettings` (25) | `src/core/settings.ts` |
| `Events` (475) | `src/core/settings.ts` (derived from `GridSettings`) |
| `HotInstance` (804) | `src/core/types.ts` |
| `RangeType` (480) | `src/core/types.ts` |
| `OverlayType` (490) | append to `src/3rdparty/walkontable/src/types.ts` (created in Step 3) |
| `DataAccessObject` (1044) | `src/tableView.ts` (export from there) |
| `ScrollDao` (1070) | `src/tableView.ts` |
| `SelectionTableProps` (1011) | `src/selection/types.ts` (new) or co-locate with the producer |
| `GridHelperInstance` (1185) | `src/core/types.ts` (helpers internal to Core) |
| `ViewportScrollerInstance` (1195) | `src/core/types.ts` |
| `CellCoords` (496) | replace with class type from `src/3rdparty/walkontable/src/cell/coords.ts` |
| `CellRange` (517) | replace with class type from `src/3rdparty/walkontable/src/cell/range.ts` |

## Critical files to create / modify

**Create:**
- `src/core/types.ts` — home for `HotInstance`, `RangeType`, `GridHelperInstance`, `ViewportScrollerInstance`
- `src/core/settings.ts` — home for `GridSettings`, `Events`
- `src/selection/types.ts` — home for `SelectionTableProps` (if not better co-located)

**Modify:**
- `src/common.ts` — emptied, then deleted at end of the step
- `src/3rdparty/walkontable/src/types.ts` — append `OverlayType`
- `src/tableView.ts` — export `DataAccessObject`, `ScrollDao` from here
- ~208 importer files — rewrite `from '../common'` / `from './common'` paths
- `src/core/hooks/index.ts` — no change to hook registration, but verify `Events` import path is updated
- `tsconfig.json` / `tsconfig.build-types.json` — no changes expected; verify after the move
- `src/index.ts`, `src/base.ts` — may re-export public types; check and redirect

## Execution order (single PR, ordered to keep compile green between commits)

1. **Create `src/core/types.ts`** with `HotInstance`, `RangeType`, `GridHelperInstance`, `ViewportScrollerInstance`. Add a temporary re-export in `common.ts` for backwards compat *within this PR only*.
2. **Create `src/core/settings.ts`** with `GridSettings`, `Events`. Same temporary re-export.
3. **Append `OverlayType` to `src/3rdparty/walkontable/src/types.ts`**. Same temporary re-export.
4. **Move `DataAccessObject` / `ScrollDao` exports to `src/tableView.ts`** and `SelectionTableProps` to `src/selection/`.
5. **Delete each class-mirror interface** from `common.ts` one by one. For each: run `grep -rE "\b<InterfaceName>\b" src --include="*.ts"`, replace each import with `import type { Class } from '<class-path>'`. Verify with `npm run build:types` after each interface.
6. **Replace `CellCoords` / `CellRange` interface imports** with class-type imports from walkontable.
7. **Bulk-rewrite the 208 importer paths** to point at the new homes (mechanical sed/codemod or manual). Confirm with `grep -rE "from ['\"].*common['\"]" src --include="*.ts"` returning zero matches.
8. **Delete `src/common.ts`**.
9. **Run verification suite** (below).

## Verification

```
cd handsontable
npm run build:types        # tsc -p tsconfig.build-types.json (must emit 0 errors)
npm run test:types         # type tests against tmp/ declarations
npm run build              # full bundle build (handsontable.js + handsontable.full.js)
npm run lint               # ESLint + Stylelint
```

Spot-check after build:
- `grep -rE "from ['\"].*common['\"]" handsontable/src --include="*.ts" | wc -l` → must be `0`.
- `ls handsontable/src/common.ts` → must fail (file deleted).
- `grep -E "^export " handsontable/tmp/core/types.d.ts` → confirms `HotInstance`, `RangeType` re-emit correctly.
- IDE check: open a sample plugin (`src/plugins/pagination/pagination.ts`), confirm `this.hot.getPlugin('myPlugin')` still autocompletes and types-check via the `PluginTypeMap` overload from Step 1.

## Risks & escape hatches

- **Circular imports surfacing at build time** — fallback: keep a co-located narrow `*Public.ts` interface for the offending class. Not expected because `import type` is erased.
- **Diff size** — single PR touching 208+ files. Reviewable because each change is mechanical (`import { X } from '../common'` → `import type { X } from '<new>'`). Recommend a codemod script committed alongside for traceability.
- **`Core` being a function-not-class** — out of scope; `HotInstance` remains hand-written. Flagged for future work (would need a rewrite of `core.ts` as a class).
- **Hidden re-exports** — some public entry points (`src/index.ts`, `src/base.ts`) may re-export types from `common.ts`. Step 7 must check these and redirect external consumers.

## Out of scope (deferred)

- Rewriting `core.ts` as a class.
- Splitting `GridSettings` into per-plugin option contracts (cascading-config model says they belong together).
- Documentation regeneration — JSDoc/Typedoc paths may need updates after files move; handle as a follow-up if `docs/` build flags missing symbols.
