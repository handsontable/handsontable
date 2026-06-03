# Index translations — landmines

This directory holds `IndexMapper` and the index maps that translate row and column indexes between physical, visual, and renderable spaces. Full reference: `handsontable/.ai/INDEX-MAPPING.md`.

- **Pick the correct index space for each API and never mix them.** Physical for data access, visual for user-facing APIs (such as `getDataAtCell`), renderable for DOM. Translate with `hot.rowIndexMapper` / `hot.columnIndexMapper`. The recurring bug appears with `manualColumnMove` plus filters: `Filters` `conditionCollection` stores physical indexes, `getDataAtCol()` takes visual. Convert before you compare.
- **HidingMap vs TrimmingMap differ in data presence.** A `TrimmingMap` removes the index from the `DataMap` (no visual index, no DOM). A `HidingMap` keeps it in the `DataMap` (keeps its visual index) but does not render it. Choose by whether the data must stay reachable.
- **Register each map under a unique name and ALWAYS unregister it.** Register in `enablePlugin()` with `registerMap(uniqueName, map)`; a duplicate name throws. Unregister in `disablePlugin()` and `destroy()` with `unregisterMap(name)`. Skipping the unregister leaves stale maps and leaks memory.
- **Batch bulk index changes.** Each map change rebuilds the cache. Wrap multiple changes in `suspendOperations()` / `resumeOperations()` so the cache rebuilds once. This matters on large datasets.
- **Do not read indexes before the maps are initialized.** Maps initialize after data loads (`getNumberOfIndexes() > 0`). Translations return `null` against an uninitialized or out-of-range index.

Pointers:
- Deep reference: `handsontable/.ai/INDEX-MAPPING.md`
- Skill: `coordinate-systems`
- `handsontable/AGENTS.md` — "Three Coordinate Systems"
