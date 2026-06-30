# Index translations — landmines

This directory holds `IndexMapper` and the index maps that translate row and column indexes between physical, visual, and renderable spaces. Full reference: `handsontable/.ai/INDEX-MAPPING.md`.

- **Pick the correct index space for each API and never mix them.** Physical for data access, visual for user-facing APIs (such as `getDataAtCell`), renderable for DOM. Translate with `hot.rowIndexMapper` / `hot.columnIndexMapper`. The recurring bug appears with `manualColumnMove` plus filters: `Filters` `conditionCollection` stores physical indexes, `getDataAtCol()` takes visual. Convert before you compare.
- **HidingMap vs TrimmingMap differ in data presence.** A `TrimmingMap` removes the index from the `DataMap` (no visual index, no DOM). A `HidingMap` keeps it in the `DataMap` (keeps its visual index) but does not render it. Choose by whether the data must stay reachable.
- **Register each map under a unique name and ALWAYS unregister it.** Register in `enablePlugin()` with `registerMap(uniqueName, map)`; a duplicate name throws. Unregister in `disablePlugin()` and `destroy()` with `unregisterMap(name)`. Skipping the unregister leaves stale maps and leaks memory.
- **Batch bulk index changes.** Each map change rebuilds the cache. Wrap multiple changes in `suspendOperations()` / `resumeOperations()` so the cache rebuilds once. This matters on large datasets.
- **Do not read indexes before the maps are initialized.** Maps initialize after data loads (`getNumberOfIndexes() > 0`). Translations return `null` against an uninitialized or out-of-range index.

## Performance & representation landmines

These reflect the index-layer perf work (DEV-1961). Get them wrong and you either reintroduce O(n) churn or break the public contract.

- **Maps use a lazy/compact representation — don't assume `indexedValues` holds a full array.** `IndexesSequence` stores just a `length` while the sequence is the identity (`0..n-1`, i.e. any unsorted/unmoved grid); `HidingMap`/`TrimmingMap` (via `BooleanMap`) store just a `length` while every flag is the default (nothing hidden/trimmed). In that state insert/remove are O(1)/O(k) (length change only) and **no array is retained**. A real reorder/hide/trim materializes the array lazily. Always go through `getValues()` / `getValueAtIndex()` / `getLength()`; never read the backing field directly.
- **`getValues()` must keep returning a plain `number[]` / `boolean[]` — never a typed array.** Returning `Int32Array`/`Uint8Array` breaks the contract every way that matters: `Array.isArray`, `JSON.stringify` (typed arrays serialize as objects), `.push`/`.splice`/spread, the `value === true` merge predicate, and the TS return type. It also forces `IndexMap` to become generic (`IndexMap<TValues>`), which ripples to ~10 files (`filters`, `undoRedo`, `nestedHeaders`, `formulas/axisSyncer`, the map registry, `MapCollection`) + ~45 test assertions. A typed store for the sequence ("F2") **and** for the boolean maps were both prototyped, measured (~18–22% / 8× memory), and **rejected** — the real win is the *lazy representation* (don't materialize what's implicit), not the element type. The lazy path beat the typed path on speed anyway.
- **`updateCache` calls every map's `getValues()` once per operation — keep it cheap.** `AggregatedCollection.getMergedValues` rebuilds on every sort/trim/hide/move/insert/remove. A `getValues()` that allocates a fresh array per call (e.g. converting a typed store to `boolean[]`) regresses trim/hide ~2× even when the reindex got faster. Materialized maps return their stored array **by reference**; the compact state builds a throwaway array only when actually read.
- **Removal reindex is O(n + k), not O(n × k).** `getListWithRemovedItems` / `getDecreasedIndexes` (in `maps/utils/`) switch to a `Set` lookup above a 16-element threshold and a sort-once + binary-search count-below. Keep the small-`k` linear `includes` branch — building a `Set` for a single-row removal is a measurable regression on large datasets.
- **Measure before claiming a perf win.** A code-level work reduction is a hypothesis until the wall-clock moves — several "obvious" wins here measured null. Use the in-repo `performance-tests/` harness (Playwright + CDP; see the `performance-testing` skill) or an ad-hoc grid timed via the chrome-devtools MCP. Note the index layer is a *minority* of an end-to-end `hot.alter()` (the data-array splice + re-render dominate), so optimize against the layer you actually changed.

Pointers:
- Deep reference: `handsontable/.ai/INDEX-MAPPING.md`
- Skill: `coordinate-systems`
- `handsontable/AGENTS.md` — "Three Coordinate Systems"
