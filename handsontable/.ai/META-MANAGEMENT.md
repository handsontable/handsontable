# Metadata-management subsystem

Deep reference for `handsontable/src/dataMap/metaManager/`. This subsystem resolves the configuration of every grid element through a cascade of meta layers. It answers one question: "what are the effective settings for this cell, column, table, or the grid as a whole?" Read this when you add a configuration option, work with `getCellMeta`/`setCellMeta`, write a plugin that reads or writes meta, or debug a bug where a setting does not apply at the level you expect.

For the lean landmines, see `handsontable/src/dataMap/metaManager/AGENTS.md`. For the broader system context, see `handsontable/.ai/ARCHITECTURE.md` ("Metadata Layer (MetaManager)").

## The four meta layers

Handsontable stores configuration in four layers. Each layer is a class in `metaLayers/`.

| Layer | Class | File | Holds |
|---|---|---|---|
| Global | `GlobalMeta` | `metaLayers/globalMeta.ts` | All built-in defaults from `metaSchema`, plus runtime instance settings. |
| Table | `TableMeta` | `metaLayers/tableMeta.ts` | Instance-level settings snapshot. Returned by `getSettings()`. |
| Column | `ColumnMeta` | `metaLayers/columnMeta.ts` | Per-physical-column settings. |
| Cell | `CellMeta` | `metaLayers/cellMeta.ts` | Per-physical-cell settings. |

`MetaManager` (`index.ts`) owns one instance of each layer and exposes the public API over them.

## How the cascade works — the prototype chain

The cascade is a JavaScript prototype chain, not a runtime merge. The mechanism, verified from the code:

1. `GlobalMeta` builds an internal empty class through `metaCtor = createTableMetaEmptyClass()`. It then sets `this.meta = this.metaCtor.prototype` and copies every default into it with `extend(this.meta, metaSchemaFactory())`. So the global defaults live on the **prototype** of an internal constructor.
2. `TableMeta` constructs `new MetaCtor()`, where `MetaCtor` comes from `globalMeta.getMetaConstructor()`. So `TableMeta.meta` is a direct instance whose prototype is the global meta object.
3. `ColumnMeta` builds its constructor through `columnFactory(globalMeta.getMetaConstructor(), ['data', 'width'])`. `columnFactory` calls `inherit(ColumnMeta, GlobalMeta's constructor)`, so each column meta object's prototype chains to the global meta object. Each physical column gets its own column meta object, created on demand by a `LazyFactoryMap`.
4. `CellMeta` constructs each cell meta object as `new ColumnMeta()`, where `ColumnMeta` is the constructor of the relevant column meta object (`this.columnMeta.getMetaConstructor(physicalColumn)`). So a cell meta object's prototype is its column meta object, whose prototype is the global meta object.

The resulting chain for a cell read:

```
CellMeta instance ──proto──► ColumnMeta object ──proto──► GlobalMeta object (schema defaults + instance settings)
```

A property read on a cell meta object walks this chain. The first layer that has the property wins. So a cell-level value overrides a column-level value, which overrides the global value.

```
+-------------+
│ GlobalMeta  │  prototype root: metaSchema defaults + instance settings
│ (prototype) │
+-------------+
   │      \
   │       \  (each branch inherits the global prototype)
   ▼        ▼
+-----------+   +-------------+
│ TableMeta │   │ ColumnMeta  │  one object per physical column (LazyFactoryMap)
│ (instance)│   │ (prototype) │
+-----------+   +-------------+
   sibling           │
   snapshot          ▼
                +-------------+
                │  CellMeta   │  one object per physical cell (grid of LazyFactoryMaps)
                │ (instance)  │
                +-------------+
```

(This diagram reproduces the ASCII diagram embedded in the `metaLayers/` source files.)

### Where TableMeta sits — and why instance settings still reach cells

`TableMeta` is a **sibling** of the column branch, not a link in the cell prototype chain. A cell read never consults `TableMeta`. This raises a fair question: how do settings passed to the Handsontable constructor reach a cell?

The answer is that instance-level settings are written onto `GlobalMeta`, which is the prototype root of the cell chain.

- At construction, `MetaManager`'s constructor runs `this.globalMeta.updateMeta(customSettings)` (`index.ts`). The constructor settings merge into the global meta object.
- At runtime, `core.ts` `updateSettings` writes each changed option directly onto the global meta object (`globalMeta[i] = settings[i]`). It does not call `updateTableMeta`. Hook functions are the exception — those are written onto `tableMeta`.

So instance settings cascade to cells **through GlobalMeta**, not through TableMeta. `getTableMeta()` / `getSettings()` returns the `TableMeta` snapshot for read access; it is not a cascade link.

The loose phrase "cell overrides column overrides table overrides global" (used in some summaries) is imprecise. The precise cell cascade is **cell → column → global**. Table is a parallel snapshot.

## `metaSchema.ts` — the single declaration point

`metaSchema.ts` exports a factory (`export default (): Record<string, unknown> => ({ ... })`) that returns an object with every built-in option set to its default value, each documented with a Typedoc block. `GlobalMeta` copies this object into the prototype root.

Rules for this file:

- **Add a new built-in option here.** Give it a default value and a Typedoc comment (the public Options API reference is generated from these comments). An option that is not in the schema has no default and does not appear in the prototype chain.
- **Never change an existing default.** Changing a default is a forbidden breaking change (see `handsontable/AGENTS.md`, "Breaking changes policy").
- The schema is also the declaration of the `Options` Typedoc class.

## `MetaManager` public API

All `MetaManager` methods take **physical** coordinates. The class JSDoc states it directly: "All coordinates used to fetch, updating, removing, or creating rows or columns have to be passed as physical values." The visual-to-physical conversion happens one level up, in `core.ts` (see "Indexing landmine" below). Do not confuse `MetaManager.getCellMeta` with `Core`'s `hot.getCellMeta`.

Verified method names and signatures (`index.ts`):

| Method | Signature | Returns |
|---|---|---|
| `getGlobalMeta()` | — | The global meta object (defaults plus instance settings). |
| `updateGlobalMeta(settings)` | `(Record<string, unknown>)` | void. Merges `settings` into the global layer. |
| `getTableMeta()` | — | The `TableMeta` instance (the `getSettings()` object). |
| `updateTableMeta(settings)` | `(Record<string, unknown>)` | void. Merges into the table layer only. |
| `getColumnMeta(physicalColumn)` | `(number)` | The column meta object for that physical column. |
| `updateColumnMeta(physicalColumn, settings)` | `(number, Record<string, unknown>)` | void. |
| `getCellMeta(physicalRow, physicalColumn, options)` | `(number, number, { visualRow, visualColumn, skipMetaExtension? })` | The cell meta object, with `row`, `col`, `visualRow`, and `visualCol` stamped on it. Fires the `afterGetCellMeta` local hook unless `skipMetaExtension` is `true`. |
| `getCellMetaKeyValue(physicalRow, physicalColumn, key)` | `(number, number, string)` | The value of one key from the cell meta object. Throws if `key` is not a string. |
| `setCellMeta(physicalRow, physicalColumn, key, value)` | `(number, number, string, unknown)` | void. Writes `key` onto the cell meta object and removes `key` from its `_automaticallyAssignedMetaProps` set. |
| `updateCellMeta(physicalRow, physicalColumn, settings)` | `(number, number, Record<string, unknown>)` | void. Merges `settings` into the cell meta object. |
| `removeCellMeta(physicalRow, physicalColumn, key)` | `(number, number, string)` | void. `delete`s the key from the cell meta object. |
| `getCellsMeta()` | — | Array of every cell meta object created so far (lazy — see storage). |
| `getCellsMetaAtRow(physicalRow)` | `(number)` | Array of cell meta objects for one physical row. |
| `createRow(physicalRow, amount = 1)` | `(number, number)` | void. Inserts row slots into the cell-meta storage. |
| `removeRow(physicalRow, amount = 1)` | `(number, number)` | void. |
| `createColumn(physicalColumn, amount = 1)` | `(number, number)` | void. Inserts into both cell-meta and column-meta storage. |
| `removeColumn(physicalColumn, amount = 1)` | `(number, number)` | void. Removes from both cell-meta and column-meta storage. |
| `clearCellsCache()` | — | void. Drops all cell meta objects. Keeps column, table, and global meta. |
| `clearCache()` | — | void. Drops all cell and column meta objects. |

`MetaManager` mixes in `localHooks` (`mixin(MetaManager, localHooks)`), so it exposes `addLocalHook`, `removeLocalHook`, `runLocalHooks`, and `clearLocalHooks`. The dynamic-meta modifier uses these.

## Dynamic meta — the `cells` and `columns` config functions and mods

Built-in defaults and explicit per-cell writes are static. On top of them sit two dynamic mechanisms, both applied by modifiers in `mods/`. `core.ts` registers two mods on construction (`new MetaManager(instance, settings, [DynamicCellMetaMod, ExtendMetaPropertiesMod])`).

### Mods

A mod is a class constructed with the `MetaManager` instance. `MetaManager`'s constructor runs `metaMods.forEach(ModifierClass => new ModifierClass(this))`. A mod extends behavior by registering local hooks or by defining property watchers on the meta layers.

| Mod | File | Role |
|---|---|---|
| `DynamicCellMetaMod` | `mods/dynamicCellMeta.ts` | Extends each cell meta object with the result of the `cells` function and the `beforeGetCellMeta`/`afterGetCellMeta` hooks. |
| `ExtendMetaPropertiesMod` | `mods/extendMetaProperties.ts` | Installs property watchers on global meta for aliased, init-only, and deprecated options (for example `fixedColumnsLeft` → `fixedColumnsStart`, and deprecation warnings for `correctFormat` and `datePickerConfig`). |

### The `cells` function

`cells` is a grid-level function `cells(physicalRow, physicalColumn, prop)` that returns an overrides object for one cell. `DynamicCellMetaMod.extendCellMeta` calls it and, if it returns settings, runs `updateCellMeta(physicalRow, physicalColumn, cellSettings)`. It also runs the `beforeGetCellMeta` and `afterGetCellMeta` hooks and resolves the column property (`prop`) for the cell. So `cells` layers on top of the static cascade — its result is merged into the cell meta object.

### The `columns` config

`columns` is a grid-level array or function of per-column settings. It is applied through `updateColumnMeta` (called from `core.ts`), so it lands on the column layer of the cascade. It sits between global and cell.

### Performance — memoization, not per-call recompute

`DynamicCellMetaMod` does not run the `cells` function and the meta hooks on every `getCellMeta` call. It memoizes through `metaSyncMemo`, a `Map` of physical row to a `Set` of physical columns. `extendCellMeta` returns early when the cell is already in the memo. The memo is cleared on the `beforeRender` hook when `forceFullRender` is truthy. So the dynamic extension runs **once per cell per full (slow) render cycle**, not once per call.

Implication: keep the `cells` function and the `columns` function cheap. They run for many cells during a full render, and heavy work there scales with the visible grid.

## Indexing landmine — cell meta is keyed by physical index

Cell metadata is tied to the **physical** index. The class JSDoc on `MetaManager` says "All coordinates … have to be passed as physical values." `CellMeta` stores objects in a grid of `LazyFactoryMap`s keyed by physical row, then physical column. So a cell's meta follows that physical row and column through moves and sorts — it is bound to the data, not to the screen position.

The public `Core` method `hot.getCellMeta(visualRow, visualColumn)` takes **visual** coordinates. `core.ts` converts them to physical (`toPhysicalRow` / `toPhysicalColumn`) before calling `MetaManager.getCellMeta(physicalRow, physicalColumn, { visualRow, visualColumn })`. The visual indexes are passed only so the dynamic mod can resolve `prop` and run the hooks; they are not used to key storage.

Consequences:

- Never store or look up cell meta by visual index. Convert to physical first, or call the `Core` API and let it convert.
- Two `getCellMeta` methods exist with different coordinate spaces. `MetaManager.getCellMeta` = physical plus an options bag. `Core.getCellMeta` = visual. This doc describes the `MetaManager` one.

## Storage internals — `LazyFactoryMap`

`lazyFactoryMap.ts` defines `LazyFactoryMap`, the storage used by `ColumnMeta` and `CellMeta`. Meta objects are created lazily: the map only builds an object when `obtain(key)` is first called for that key. Keys are zero-based physical indexes.

- `ColumnMeta` holds one `LazyFactoryMap` of column meta objects, keyed by physical column.
- `CellMeta` holds a `LazyFactoryMap` of rows, where each row is itself a `LazyFactoryMap` of cell meta objects keyed by physical column. So storage is a grid of maps.

The map keeps three internal structures: `data` (the objects), `index` (key-to-storage-slot), and `holes` (freed slots ready for reuse). The key under which an item was created is volatile — `insert` and `remove` shift it.

### Lifecycle on row and column insert/remove

| Operation | Cell-meta storage | Column-meta storage |
|---|---|---|
| `createRow(physicalRow, amount)` | `cellMeta.createRow` → `metas.insert(physicalRow, amount)` inserts empty row slots. | unchanged |
| `removeRow(physicalRow, amount)` | `cellMeta.removeRow` → `metas.remove(physicalRow, amount)` (soft remove into `holes`). | unchanged |
| `createColumn(physicalColumn, amount)` | `cellMeta.createColumn` inserts a column slot into every existing row map. | `columnMeta.createColumn` → `metas.insert(physicalColumn, amount)`. |
| `removeColumn(physicalColumn, amount)` | `cellMeta.removeColumn` removes the column slot from every row map. | `columnMeta.removeColumn` → `metas.remove(physicalColumn, amount)`. |

Because keys are physical and the maps shift on insert and remove, meta stays aligned with the data through structural changes. This is the same reason cell meta survives moves and sorts: those reorder index translations, not the physical-keyed storage.

## Type expansion — `extendByMetaType` and `_automaticallyAssignedMetaProps`

`utils.ts` `extendByMetaType` implements the `type` option. Setting `type: 'numeric'` expands to the `renderer`, `editor`, and `validator` (and other) properties of that registered cell type. The function records which properties it set automatically in the meta object's `_automaticallyAssignedMetaProps` `Set`. A property in that set can be overwritten later by an explicit user value or by a different `type`. An explicit user write through `setCellMeta` removes the key from that set, marking the value as user-owned.

This is why direct mutation of a returned meta object is unsafe: it bypasses the `_automaticallyAssignedMetaProps` bookkeeping. A value written by direct mutation can be overwritten by dynamic re-extension (the `cells` function or `type` expansion) on the next render. Use `setCellMeta` (or `updateCellMeta`) so the bookkeeping stays correct.

## Cross-references

- `handsontable/.ai/ARCHITECTURE.md` — "Metadata Layer (MetaManager)" places this subsystem in the wider system and confirms the prototype-chain mechanism.
- `handsontable/.ai/INDEX-MAPPING.md` — physical, visual, and renderable coordinate spaces, and the `IndexMapper` that converts between them.
- Skill: `coordinate-systems` — translating between physical, visual, and renderable indexes.
- `handsontable/AGENTS.md` — "Breaking changes policy" (never change a default in `metaSchema.ts`).
