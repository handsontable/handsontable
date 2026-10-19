# AsyncValues plugin – per-cell async values with a pending and error state

The `asyncValues` plugin fills a cell from a promise and shows a pending and an error state per cell.
Read this before touching `asyncValues.ts`, `types.ts`, or `src/styles/components/plugins/_async-values.scss`.

## What it owns and what it does not

- It owns the **in-flight requests and the errors they leave**, in a `physicalIndexToValue` map registered on
  `rowIndexMapper` under the registry name (`'AsyncValues'`), one `Map<prop, entry>` per row. The index mapper
  shifts the values on a row insert and removal; sorting, filtering and moving rows do not touch physical
  indexes, which is what lands a result on the record it was started for.
- It does **not** own the value. A resolved value is written to the data like any other write; while a request
  is pending, or after it fails, the cell keeps whatever it held, so "the previous value is kept" needs no code.
- It does **not** re-run a request. A cancelled request stays cancelled; `afterAsyncValueCancel` (with its
  reason) is the application's cue to start a new one.
- The state is reported in cell meta (`asyncState`, `asyncError`) by `afterGetCellMeta`, **never** written with
  `setCellMeta`.

## The traps

- **The state must never reach undo.** A `setCellMeta` write would join the user's undo step, be replayed after
  `updateSettings`, and come back on undo of a row removal. So the map is listed in `DERIVED_INDEX_MAP_NAMES`
  (`translations/indexMapperSnapshot.ts`) and is never captured, and the resolved write runs under
  `operationScope.suppress()`. Without the derived entry an undo of a row removal restores the row's map value,
  a `Map` holding an entry nothing will ever settle, and the cell spins forever. Pinned by "should not bring a
  cancelled request back when the row removal is undone" and the `isDerivedIndexMap` case in
  `translations/__tests__/indexMapperSnapshot.unit.js`. The name is case-sensitive (`'AsyncValues'`, not the
  settings key).
- **Undo of an earlier step can overwrite an async value.** The resolved write is not recorded, so undoing an
  earlier edit of the same cell restores the value that step recorded, over the async one. That is the defined
  behavior, documented in the guide; recording the write instead would put one undo step per resolved cell on
  the stack (an AI column fills hundreds).
- **Two hooks see every write, and both are needed.** `afterChange` covers the visual API (editor, paste,
  autofill, `populateFromArray`, `setDataAtCell`) and UndoRedo's repeat of the visible restored cells.
  `afterSetSourceDataAtCell` (physical rows) covers `setSourceDataAtCell`, which fires no `afterChange`, and the
  undo of a filtered-out row. The plugin's own write needs no source filter: the entry is deleted before the
  write, so the write cancels only the requests that depend on the written cell, which is intended (a value
  computed from another async value is stale once its input lands).
- **A resolved value takes one of two write paths.** A row with a visual index goes through
  `setDataAtRowProp`, so `beforeChange`, validators, `afterChange`, ColumnSummary and Formulas see it. A row
  trimmed out of the grid (Filters, TrimRows, a NestedRows collapse) has no visual index and goes through
  `setSourceDataAtCell`: no validator runs and no `afterChange` fires. Do not route everything through the
  source path to "simplify" it: ColumnSummary listens to `afterChange` only.
- **Settled requests are flushed in one microtask.** Every result that settles in the same task is written in
  one `setDataAtRowProp` call and painted by one render, under `suspendRender()`/`resumeRender()` in a
  `finally` (not `batch()`, because validators and `beforeChange` listeners are host code). Without it a range
  of 1000 cells renders 1000 times.
- **A result is applied only when its entry is still in `#entries`.** The entry object is the generation
  counter: a restart, an edit or a removal deletes it, so a source that ignores its `AbortSignal` and resolves
  late is still dropped. The check runs twice, when the promise settles and again at the flush, because an edit
  can land between the two.
- **A row removal is split across two hooks.** `beforeRemoveRow` stashes the entries of the rows being
  removed and `afterRemoveRow` aborts them, so a removal another listener vetoes cancels nothing. The index map
  has already dropped those rows by `afterRemoveRow`, so the abort works from the stash and the `#entries` set.
- **Every entry carries its physical row, and it goes stale on a row insert or removal.** The map shifts the
  values, not the entries, so `#syncPhysicalRows()` re-reads them from the map after `afterCreateRow` and
  `afterRemoveRow` (one pass over the rows, only while an entry exists).
- **Columns of array data are indexes.** An insert or removal of a column shifts them, so the entries keyed
  by a number are cancelled (`'columnRemoved'`); string props are stable and stay.
- **The decoration is plugin state, so `renderMode: 'onChange'` cannot see it.** Every state flip calls
  `markCellChanged()` for the visual cell before the render. A cell edit renders BEFORE `afterChange`
  (`beforeChangeRender` → `render()` → `afterChange`), so a cancellation from `afterChange` renders once more.
- **Taking the decoration off a recycled cell element.** Walkontable resets `className` and every `aria-*`
  attribute before each paint, but not the indicator span or `title`. The `data-ht-async` attribute marks a
  decorated element and holds the `title` the plugin wrote, so a `title` a renderer wrote in the same paint is
  left alone. `disablePlugin()` clears every entry and paints once while `afterRenderer` is still registered,
  or the spinners would outlive the plugin.
- **The indicator is a real element, not a pseudo-element.** `td::after` is taken by the Comments indicator
  and `td.area::before` by the selection fill; a cell can be commented, selected and pending at once.

## Where to look next

- Plugin contract, lifecycle and the priority table (340): `../base/AGENTS.md`.
- The undo journal and the derived maps: `../undoRedo/AGENTS.md`.
- A plugin that keeps per-row state in a `physicalIndexToValue` map: `../rowSelection/AGENTS.md`.
- Abort handling for a grid-level request: `../dataProvider/AGENTS.md`.
- Workflow: the `handsontable-plugin-dev` skill.

## Testing

- Unit: `npm run test:unit --prefix handsontable -- --testPathPattern=asyncValues` (jsdom grids, with
  UndoRedo, ColumnSorting and TrimRows). Results settle through the returned promise; a late result needs a
  macrotask (`setTimeout(0)`) to prove it was dropped, because the flush is a microtask.
- E2E: `cd tests && npx playwright test e2e/async-values.spec.ts` (fixture `tests/fixtures/demo/async-values.html`,
  page object `AsyncValuesPage`). It checks the painted indicator and the error colors on every theme, so
  rebuild the full package first (see `tests/AGENTS.md`).
