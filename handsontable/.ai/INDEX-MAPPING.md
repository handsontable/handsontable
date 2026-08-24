# Index-mapping subsystem

Deep reference for `handsontable/src/translations/`. This subsystem translates row and column indexes between three index spaces. It is the single source of truth for index order, visibility, and per-index values. Read this when you work with `IndexMapper`, write a plugin that hides, trims, sorts, or moves rows or columns, or debug a bug where rows or columns appear in the wrong place.

For the lean landmines, see `handsontable/src/translations/AGENTS.md`. For the broader system context, see `handsontable/.ai/ARCHITECTURE.md` ("Index Translation Layer").

## The three index spaces

Handsontable uses three distinct index spaces for each axis. Every row API and column API operates in exactly one of them. Mixing them is the most common index bug.

| Space | Where it lives | Range | Changed by |
|---|---|---|---|
| **Physical** | Position in the source data array (`dataSource`) | `0` to `N` | Row or column insertion and removal |
| **Visual** | Position in the `DataMap` (after trimming) | `0` to `N` | Sorting, manual move |
| **Renderable** | Position in the DOM (after hiding) | `0` to `M`, `M <= N` | Hiding, pagination |

- **Physical** indexes are stable. The `DataMap` uses them to read values from `dataSource`. Use physical indexes for data access and persistence.
- **Visual** indexes are what the user sees. Most public API methods, such as `getDataAtCell`, take visual indexes. Use visual indexes for user-facing display logic.
- **Renderable** indexes count only rows or columns that can be rendered. Use renderable indexes for DOM operations.

### The translation chain

Two map types govern the two boundaries between spaces:

- **Trimming maps** govern the physical ↔ visual boundary. A trimmed index is removed from the `DataMap` entirely. It has no visual index.
- **Hiding maps** govern the visual ↔ renderable boundary. A hidden index stays in the `DataMap` and keeps its visual index, but it is not rendered.

```
 physical space            visual space             renderable space
 (dataSource)              (DataMap)                (DOM)
 [0..N]                    [0..N]                   [0..M], M <= N
   │                         │                        │
   │  ── Trimming maps ──►    │  ── Hiding maps ──►     │
   │     (drop from DataMap)  │     (keep, do not render)
```

## IndexMapper

`IndexMapper` (`handsontable/src/translations/indexMapper.ts`) stores, registers, and manages indexes from the calculations of its subsidiary maps. It owns a built-in cache that rebuilds only when the data or structure changes.

Each Handsontable instance holds two independent `IndexMapper` instances:

- `hot.rowIndexMapper` — row indexes.
- `hot.columnIndexMapper` — column indexes.

Internally, `IndexMapper` holds:

- `indexesSequence` — one `IndexesSequence` map that stores the order of physical indexes (changed by sorting and moving).
- `trimmingMapsCollection` — an `AggregatedCollection` of trimming maps. If any map marks an index trimmed, the index is excluded from the `DataMap` and not rendered.
- `hidingMapsCollection` — an `AggregatedCollection` of hiding maps. If any map marks an index hidden, the index stays in the `DataMap` but is not rendered.
- `variousMapsCollection` — a `MapCollection` of value maps (physical-index-to-value).

### Verified public translation methods

All translation methods return `number | null`. They read from the cache.

| Method | Takes | Returns |
|---|---|---|
| `getPhysicalFromVisualIndex(visualIndex)` | visual | physical, or `null` |
| `getVisualFromPhysicalIndex(physicalIndex)` | physical | visual, or `null` |
| `getRenderableFromVisualIndex(visualIndex)` | visual | renderable, or `null` |
| `getVisualFromRenderableIndex(renderableIndex)` | renderable | visual, or `null` |
| `getPhysicalFromRenderableIndex(renderableIndex)` | renderable | physical, or `null` |
| `getNearestNotHiddenIndex(fromVisualIndex, searchDirection, searchAlsoOtherWayAround?)` | visual | visual of nearest not-hidden index, or `null` |

There is no direct physical-to-renderable method. Compose the ones above — for example `getRenderableFromVisualIndex(getVisualFromPhysicalIndex(physicalIndex))`.

### Verified list and length getters

| Method | Returns |
|---|---|
| `getIndexesSequence()` | physical indexes in current order |
| `setIndexesSequence(indexes)` | sets a new physical order |
| `getNotTrimmedIndexes(readFromCache = true)` | physical indexes that are not trimmed; array index is the visual index |
| `getNotTrimmedIndexesLength()` | count of not-trimmed indexes |
| `getNotHiddenIndexes(readFromCache = true)` | physical indexes that are not hidden; array index is **not** a visual index |
| `getNotHiddenIndexesLength()` | count of not-hidden indexes |
| `getRenderableIndexes(readFromCache = true)` | physical indexes that may be rendered; array index is the renderable index |
| `getRenderableIndexesLength()` | count of renderable indexes |
| `getNumberOfIndexes()` | total number of indexes |
| `isTrimmed(physicalIndex)` | `true` if any trimming map marks the index trimmed |
| `isHidden(physicalIndex)` | `true` if any hiding map marks the index hidden |
| `moveIndexes(movedIndexes, finalIndex)` | moves one or more visual indexes to a visual start position |

### Coordinate conversion flow

A read such as `getDataAtCell(visualRow, visualCol)` resolves to physical coordinates before touching the data:

```
getDataAtCell(visualRow, visualCol)
        │
        ├─ rowIndexMapper.getPhysicalFromVisualIndex(visualRow)    ──► physicalRow
        └─ columnIndexMapper.getPhysicalFromVisualIndex(visualCol) ──► physicalCol
                                                                          │
                                                                          ▼
                                              DataMap reads dataSource[physicalRow][physicalCol]
```

The renderer goes the other way. It maps each visible visual index to a renderable index to decide which cells exist in the DOM:

```
visual index ──► getRenderableFromVisualIndex(visual) ──► renderable index ──► DOM cell
(returns null when the index is hidden, so no DOM cell is created)
```

## Map types

All maps extend `IndexMap` (`handsontable/src/translations/maps/indexMap.ts`). `IndexMap` stores an `indexedValues` array, exposes `getValues`, `getValueAtIndex`, `setValues`, `setValueAtIndex`, `clear`, `getLength`, `init`, `insert`, `remove`, and `destroy`, and fires two local hooks: `init` and `change`.

| Class | Extends | Purpose | Reindexes on insert/remove |
|---|---|---|---|
| `IndexesSequence` | `IndexMap` | Stores the order of physical indexes. Reorganizes the stored indexes on insert and remove. | Yes (updates the index values themselves) |
| `TrimmingMap` | `PhysicalIndexToValueMap` | Boolean per physical index. `true` removes the index from the `DataMap` and from rendering. `getTrimmedIndexes()` lists trimmed physical indexes. | Adds or removes entries; values are not recomputed |
| `HidingMap` | `PhysicalIndexToValueMap` | Boolean per physical index. `true` keeps the index in the `DataMap` but excludes it from rendering. `getHiddenIndexes()` lists hidden physical indexes. | Adds or removes entries; values are not recomputed |
| `PhysicalIndexToValueMap` | `IndexMap` | Maps a physical index to an arbitrary value. Does not recompute stored values on row or column add and remove; it shifts entries to keep them aligned with their physical index. | Shifts entries |
| `LinkedPhysicalIndexToValueMap` | `IndexMap` | Maps a physical index to a value, with entries stored in a defined order. Exposes `setValueAtIndex(index, value, position?)`, `clearValue`, `getEntries`, and an ordered `getValues`. | Shifts entries and updates the order |

### HidingMap vs TrimmingMap — the data-presence difference

This distinction is load-bearing. Choose the wrong one and either the data leaks into APIs that should not see it, or it disappears from APIs that should.

| | TrimmingMap | HidingMap |
|---|---|---|
| Present in `DataMap`? | **No** — removed entirely | **Yes** — kept |
| Has a visual index? | No | Yes |
| Rendered in DOM? | No | No |
| Governs which boundary? | physical ↔ visual | visual ↔ renderable |
| Used by | `Filters`, `TrimRows` | `HiddenRows`, `HiddenColumns`, `Pagination` |

Note on DeepWiki: the DeepWiki page groups "Filtering" under the renderable tier alongside hiding and pagination. The repository contradicts this. `Filters` registers a `TrimmingMap` (`handsontable/src/plugins/filters/filters.ts`), so filtering affects the **visual** tier and removes indexes from the `DataMap`. Pagination registers a hiding map (`createAndRegisterIndexMap(name, 'hiding', false)` in `handsontable/src/plugins/pagination/pagination.ts`) and affects the renderable tier. The repository is authoritative.

## Map collections and aggregation

`handsontable/src/translations/mapCollections/`:

- `MapCollection` — a named collection of `IndexMap` instances. It enforces unique names, forwards `change` hooks, and runs bulk operations: `register`, `unregister`, `unregisterAll`, `initEvery`, `insertToEvery`, and `removeFromEvery`. It tracks a module-level `registeredMaps` counter for leak detection, read with `getRegisteredMapsCounter()`.
- `AggregatedCollection` — extends `MapCollection`. It aggregates maps that share a value type into a single result per index, using an aggregation function and a fallback value. `IndexMapper` builds both its trimming and hiding collections with the function `valuesForIndex => valuesForIndex.some(value => value === true)`. So an index is trimmed or hidden if **any** registered map marks it so. `getMergedValues`, `getMergedValueAtIndex`, and `updateCache` produce and cache the merged result.

## Cache

`IndexMapper` keeps these caches and rebuilds them in `updateCache()`:

- `notTrimmedIndexesCache` — physical indexes that are not trimmed, in sequence order.
- `notHiddenIndexesCache` — physical indexes that are not hidden, in sequence order.
- `renderablePhysicalIndexesCache` — physical indexes that may be rendered.
- `fromPhysicalToVisualIndexesCache` — `Map` from physical to visual.
- `fromVisualToRenderableIndexesCache` — `Map` from visual to renderable.

`updateCache()` rebuilds only when a relevant change flag is set (`indexesSequenceChanged`, `trimmedIndexesChanged`, or `hiddenIndexesChanged`) and batching is off, or when called with `force = true`. After a rebuild it clears the flags and fires the `cacheUpdated` local hook.

### Batching to avoid cache thrash

Each map change triggers a cache rebuild by default. Rebuilds are costly on large datasets. Batch multiple changes:

- `suspendOperations()` — sets `isBatched`, so map changes no longer rebuild the cache.
- `resumeOperations()` — clears `isBatched`, rebuilds the cache once, and flushes batched observer notifications.

`IndexMapper` itself wraps `initToLength`, `insertIndexes`, and `removeIndexes` in suspend and resume. Wrap your own bulk map updates the same way.

## changesObservable

`handsontable/src/translations/changesObservable/` lets a developer subscribe to index changes that occur while Handsontable runs.

- `createChangesObserver(indexMapType)` on `IndexMapper` returns a `ChangesObserver`. Only the `'hiding'` map type is supported; any other value throws. It is driven by the internal `hidingChangesObservable`, which emits the merged hiding values during each cache update where the hidden indexes changed.
- `ChangesObservable.emit(indexesState)` compares the last saved state with the new state and sends an array of change objects to every observer. Each change has `op` (`'replace'`, `'insert'`, or `'remove'`), `index`, `oldValue`, and `newValue`.
- A newly created observer immediately receives the current set of changes, so it starts with full state.

`observeMapChange(map, callback)` is a separate mechanism. It observes a value map in the various-maps collection and coalesces notifications during a batch (fires once on `resumeOperations`, or immediately when not batched). It explicitly **rejects** trimming and hiding maps and throws if you pass one. Do not confuse `createChangesObserver('hiding')` with `observeMapChange`.

## Registration lifecycle

Plugins own their maps. A plugin registers a map when it is enabled and unregisters the map when it is disabled or destroyed. Skipping the unregister leaves stale maps in the collection and leaks memory.

- `registerMap(uniqueName, indexMap)` — registers a map. The map type routes it to the correct collection: a `TrimmingMap` goes to the trimming collection, a `HidingMap` goes to the hiding collection, and every other map goes to the various-maps collection. The name **must be unique** across all three collections; a duplicate name throws. If the dataset already has indexes, the map is initialized to the current length on registration.
- `createAndRegisterIndexMap(indexName, mapType, initValueOrFn?)` — a factory that builds a map by type string (`'hiding'`, `'trimming'`, `'index'`, `'physicalIndexToValue'`, or `'linkedPhysicalIndexToValue'`) and registers it. An unknown type throws.
- `unregisterMap(name)` — removes a map by name from whichever collection holds it and destroys it.
- `unregisterAll()` — removes and destroys every registered map. `IndexMapper.destroy()` calls it.

Typical plugin pattern:

```js
// enablePlugin()
this.myMap = this.hot.rowIndexMapper.registerMap(this.pluginName, new HidingMap());

// disablePlugin() / destroy()
this.hot.rowIndexMapper.unregisterMap(this.pluginName);
```

## Cross-references

- Skill: `coordinate-systems` — task workflow for translating between physical, visual, and renderable indexes.
- `handsontable/.ai/ARCHITECTURE.md` — "Index Translation Layer" and "Coordinate Translation Flow" sections place this subsystem in the wider system.
- `handsontable/AGENTS.md` — "Three Coordinate Systems" section.
