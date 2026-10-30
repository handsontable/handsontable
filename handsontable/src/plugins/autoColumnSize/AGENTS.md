# AutoColumnSize plugin — measuring the widest cell per column

The `autoColumnSize` plugin sizes columns from their content. Read this before touching
`autoColumnSize.ts`.

Two facts to get right before anything else:

- **It is enabled by default, but `colWidths` switches it off.** `isEnabled()` is
  `getSettings()[PLUGIN_KEY] !== false && !getSettings().colWidths` — so `autoColumnSize: undefined`
  behaves like `true` (the opposite of `autoRowSize`, which is off by default), **and any `colWidths`
  setting silently disables the plugin.** Check `isEnabled()` first when a grid "is not measuring": on a
  grid that declares `colWidths` there is nothing to find in the sampler or the ghost table.
- **`PLUGIN_PRIORITY = 10` is the lowest of all plugins, so it enables first — but that is not what puts
  its `modifyColWidth` listener at the head of the hook.** The listener is registered with an explicit
  **order index of `-10`**. Priority orders `enablePlugin()`, not hook callbacks (`../base/AGENTS.md`). The
  indexes on that hook are: this plugin `-10`, `nestedHeaders` unindexed, `manualColumnResize` `+1`,
  `hiddenColumns` `+2`, `stretchColumns` `+10`. **Drop the `-10` and any negative-index listener silently
  outranks the measured width.**

## The measurement pipeline

`SamplesGenerator` collects sample values per column (bucketed by string length), `GhostTable` renders them
off-DOM with the real renderers, and the widest result is written to the `autoColumnSize` index map.

Rules that hold this together:

- **Sample with `getCellMetaTransient`, never `getCellMeta`.** The sampler sweeps the whole row range per
  column; the eager read permanently materializes one meta object per visited cell, which is O(rows × columns)
  retention on init. The transient read still resolves the full dynamic meta — hooks plus the `cells`
  function — so MergeCells' `hidden`/`spanned` flags work.
- **Format the value through `formatCellValue()`**, so the measured string is what the renderer will
  actually produce (cell-level `valueFormatter`, then the renderer's static). See the `renderCell.ts`
  bullet in `../../../AGENTS.md`.
- Cells covered by a merged cell carry `null` and are skipped — they contribute no sample. The merge's
  own top-left cell is sampled only when the merge spans one column; see "Merged cells" below.
- **List-cell columns (autocomplete, dropdown, handsontable) include the reserved arrow
  slot (DEV-348).** The real renderer adds `td.htAutocomplete`; the product CSS reserves the
  arrow as `padding-inline-end`. GhostTable therefore measures value plus arrow, and an
  autosized column grows on upgrade (a breaking change). A column `width` skips measurement
  for that column only. `colWidths` still disables this plugin for the whole grid. Do not
  strip the arrow from the sample — that reopens the wrap onto a second line.
- **The ghost table must be restored even when a custom renderer throws.** A throwing renderer that leaves
  headers disabled, or the probe's columns still attached, corrupts every later full-scan measurement.
- **The ghost container's width must never follow the root's.** `GhostTable#createContainer()` copies the
  root's class names onto the container, `ht-wrapper` included, and `.handsontable.ht-wrapper` is
  `width: 100%`. The container is absolutely positioned, so that resolved against a collapsed or narrow root:
  every column measured at its wrapped min-content width (51px for a 75px column in a 0px root), and the
  render that follows the root's return measures cache misses only, so columns past the ones rendered while
  it was narrow kept the wrapped width for good. `_base.scss` therefore sets `width: auto` on
  `.handsontable.htGhostTable.htAutoSize`, a compound selector so it wins on specificity (0,3,0 against the 0,2,0 of
  `.handsontable.ht-wrapper`, so source order does not decide). A column wider than its root now measures
  at its content width, as it did before 16.2.0, where #11919's `ht-wrapper` stretch had capped it at the root
  width as a side effect. A test of this must restore the root through the grid's own ResizeObserver render:
  `render()` and `refreshDimensions()` both re-measure every column and hide the defect
  (`tests/e2e/auto-column-size-collapsed-root.spec.ts`).

## Merged cells

The content of a merge used to size no column at all: the sampler skipped every `spanned` cell, so a long
text in a merge wrapped into a 50px column. Two rules replace that skip, split by the merge's shape.

- **A merge that spans one column (rowspan only) is sampled like any cell.** Its text belongs to that
  column alone, so the sample cache and the width-determiner probe need nothing extra.
- **A merge that spans several columns stays out of the samples** and is fitted by `MergedCellsWidths`
  (`mergedCellsWidths.ts`). Sampled as an ordinary value it made its first column as wide as the whole text
  on its own (the 2015 symptom of GitHub issue #2667). The demand is the text width minus the widths of the
  other spanned columns, and it lands on the first column of the span that is not hidden, the one MergeCells
  draws the merge from (`mergeCells/renderer.ts`, `getNearestNotHiddenIndex`). `getColumnWidth()` returns the
  larger of that demand and the measured width.

Eight rules hold this together.

1. **The demand lives apart from `columnWidthsMap`.** The probe compares new widths against the cached
   width, and a demand written into it would never shrink back when a spanned column grows or the merge goes
   away. It is a plain `Map` keyed by physical column, not a registered index map, so UndoRedo needs no
   `DERIVED_INDEX_MAP_NAMES` entry for it.
2. **The other spanned columns count at their width before the stretch, and a hidden one counts as 0.** The
   host reads `getColWidth(column, 'StretchColumns')`, the source the StretchColumns calculator reads its base
   widths with. Read with the stretch, a fit that followed a stretched render subtracted the stretched widths,
   and once the wider first column turned the stretch off, the merge ended short of its text. A column is
   skipped when `columnIndexMapper.isHidden()` says so, not when its width is 0: CollapsibleColumns hides
   through its own hiding map and its columns keep their width. A settings `width` and a manual size count.
3. **Demands are resolved from the rightmost drawing column leftwards, each written before the next is
   read.** A demand reads only the columns to the right of its drawing column, so a merge that starts inside
   another one's span is sized first. Merges with the same lead column and span are resolved once.
4. **A fit runs only when an input changed, never on every render.** `forceFullRender` re-measures every
   visible column on every `render()`, and a fit there read every merge on every edit. Each input below is
   pinned by a case in `tests/e2e/auto-column-size-merged-cells.spec.ts`, and the ones marked (control) also
   went red with the trigger removed:
   - a stored width that changed (`#updateColumnWidthsMapBasedOnGhostTable` compares before it writes);
   - any width map of the column axis changing (the column mapper's `change` local hook): a drag, the
     ManualColumnResize API, the stretch, this plugin's own map (control: the API case);
   - the text or meta of a merge's first cell (`#invalidateMergedCellText`): an edit through
     `#onBeforeChange` (before its "already queued" early return), an undo through `afterSetSourceDataAtCell`
     (control), and `afterSetCellMeta` (control). The Formulas value updates reach the same method, and no
     case pins them;
   - a merge added or removed: `beforeMergeCells`/`beforeUnmergeCells` mark the layout dirty, because
     MergeCells renders inside the call (clearing the covered cells) before its `after*` hook, and that
     render's fit must read the merges; `afterMergeCells`/`afterUnmergeCells` queue the rescans;
   - an undo or redo, which can restore merges with no merge hook (rule 8, control);
   - a style change: a column re-measured from its cached samples to another width
     (`#replayedColumns`) makes every group measure again from its kept texts (control). A style change
     that moves no visible plain column goes unseen until another input arrives. The first full render
     after a sweep has no samples to replay (the sweep drops them), so while `#rewalkAfterSweepPending` is
     set, a width that changed on a column that re-walk measured from scratch (`#rescannedColumns`) counts as
     a style change too: the re-walk cannot tell one from a data change. The flag clears after that re-walk,
     which fills the cache again. The grid draws once at init and the first re-walk can follow a style
     change ("fits a merge again when the styles change before a render", control). Do not keep the sweep's
     samples instead: a replay cannot see a value written into the data array with no hook, and the first
     `render()` after init then keeps the old width (`textEditor.spec.js`, "textarea should have cell
     dimensions (after render)");
   - a settings update (`updatePlugin()`), which can restyle a merge's text (control);
   - rows hidden, shown, or trimmed (control for shown), the rows sorted, a column inserted, moved, removed,
     or hidden (control for hidden), `loadData()` and `updateData()` (control), and `enablePlugin()`
     (control).
5. **Each merge's text is kept, and only what changed is read again.** `MergedCellsWidths` keeps the
   formatted text of every merge's first cell by physical row and column, and the width of each group of
   merges (same lead column and span) by a signature of its physical rows and the column's text version. An
   edit forgets one text. Hiding, showing, or trimming rows only changes which merges a group holds, so the
   group is measured again from the kept texts without reading a cell, and a style change does the same
   (`markStylesChanged()`). `markStale()` forgets every text: a settings update, an overwrite sweep, and
   `enablePlugin()`. `markRenumbered()` also drops a waiting merge snapshot (rule 8), for anything that can
   renumber the physical rows or columns: a changed row or column sequence (a sort included, since the
   cacheUpdated state cannot tell a sort from a remove and insert), `loadData()`, and `updateData()`.
   **A fit after a width change alone reads no merge.** `markWidthsChanged()` is the only mark that keeps
   `#layoutDirty` off, and such a fit resolves the demands again from the groups the last full fit kept
   (`#resolved`): the widths are the only input that moved. Every other mark sets `#layoutDirty`, and a new
   input that can change the drawn merges, their rows, or their texts must too, or the fast path keeps
   the previous groups.
6. **The "may have merges" flag gates the per-change reads, never the structural marks.**
   `mayHaveMultiColumnMerges()` counts every multi-column merge MergeCells reports, hidden rows included, and
   gates the meta reads of `#onBeforeChange`, `afterSetSourceDataAtCell`, `afterSetCellMeta`, and the column
   `change` hook, so a paste into a grid without such merges reads no meta. The index-mapper handlers ask
   whether MergeCells is enabled instead: `getVisibleMergedAreas()` leaves out a merge whose rows are all
   trimmed, so after a filter the flag reads `false`, and clearing the filter must still refit.
7. **The fit runs after the ghost table is cleaned, once per sweep, and merges queue as little as they
   need.** The fit measures through the ghost table too, so `#updateColumnWidthsMapBasedOnGhostTable()`
   cleans it first. An idle chunk of the asynchronous sweep leaves the fit pending (`#deferMergedCellsFit`),
   and the sweep fits once when it ends. A merge made by the user rescans every column it spans; a merge
   applied from the settings (`auto`) rescans only its first column, whose text the init sweep measured
   before the merge existed, since the grid never drew its covered values. A queued rescan is skipped for a
   column already scanned in the same `beforeRender` (`#scannedColumns`) or by an asynchronous chunk that
   started after the merge (`#mergeRescanQueuedAt`).

8. **An undo or redo compares the merges before and after.** MergeCells restores merges with no hook in
   `restoreState()`, and the plugin would otherwise keep samples taken under the old merges: an undone
   unmerge left the first column at the whole text's width. `beforeUndo`/`beforeRedo` take a snapshot of
   the merges (`snapshotMerges()`), keyed by their physical first cell and span; the undo renders before its
   `after*` hook fires, so a snapshot taken there would miss that render. The fit of that render reports
   every merge that appeared or went away, and every column it spans is dropped from the samples cache and
   queued for a full rescan, which `#onBeforeRender` runs in the same render. Only that fit compares: a
   comparison on every fit cost 4 to 6 ms per fit at 10k merges. A renumbering drops a waiting snapshot.
   `clearCollections()` (a settings rebuild, a disable) is the other hook-less path; the settings update
   reads every text again and the full render re-walks the visible columns, and a lingering demand never
   exceeds the unmerged cell's own text.

Known limit: a merge removed with no unmerge hook (`updateSettings({ mergeCells: false })`) keeps its demand
until the next fit; the unmerged first cell is sampled again then, and its own text is never narrower than
the demand. Unit cases for the class: `__tests__/mergedCellsWidths.unit.ts`.

## `syncLimit`, and what "sync" guarantees

`syncLimit` (a column count, or a percentage string) splits the work: those columns are measured *exactly*,
over the whole row range, **before the first paint**. Everything past the limit runs asynchronously in
idle-task chunks (`requestIdleTask`). Do not move work out of the synchronous half to speed up init — the
`syncLimit` contract is that the first paint is correct for those columns.

The async loop must cancel its frame when the instance was destroyed mid-calculation.

## The sampling settings are re-read in `updatePlugin()`, and only a real change re-measures

`samplingRatio`, `allowSampleDuplicates` and `useHeaders` are applied in `#applySamplingSettings()`, called
from **both** `enablePlugin()` and `updatePlugin()`. Reading them in `enablePlugin()` alone is not enough:
that method returns early on an already-enabled plugin, and `BasePlugin` only re-runs the enable/disable pair
when the plugin's enabled state itself changed — so a plain settings change never reaches it. All three were
silently ignored when they arrived through `updateSettings()` (DEV-2850). Four rules ride along:

- **Restore the stored settings first when the payload omits this plugin's key.** `SETTING_KEYS` is `true`,
  so an update that never mentions `autoColumnSize` still reaches `updatePlugin()` — and `onUpdateSettings`
  has already fed `updatePluginSettings()` that missing key as `undefined`, which **wipes** the stored
  settings (this plugin declares no `SETTINGS_VALIDATORS`, so the assignment falls straight through). Read
  them in that state and you get the *defaults*, so re-applying would reset the user's `samplingRatio`, flip
  `useHeaders` back to `true`, and re-measure every column on an unrelated `updateSettings({ readOnly: true })`.
  Restore from `hot.getSettings()[PLUGIN_KEY]`, which is untouched — the same repair `manualColumnResize`
  makes for the same base-class reason (`../../utils/manualResize/AGENTS.md`). **This is the common path:** the Vue
  wrapper omits every settings key whose value is unchanged (`wrappers/vue3/src/helpers.ts`, `simpleEqual`),
  so a Vue app sends a payload *without* `autoColumnSize` on virtually every prop change.
- **Re-measure with `recalculateAllColumnsWidth()`, not `clearCache()`.** A bare clear empties every measured
  width, but the only render-time measurement is `calculateVisibleColumnsWidth()` — so every column outside
  the viewport would keep the default width until it is scrolled into view, shrinking the table width and the
  horizontal scroll extent. `#onAfterLoadData` is the model for "everything is stale". `AutoRowSize` can use
  its own `clearCache()` only because that method sets `#fullRecalculationScheduled`, which its
  `#onBeforeRender` honors; this plugin has no equivalent flag. The trade is that
  `recalculateAllColumnsWidth()` is a no-op on a grid that is not visible, which leaves the previous widths
  in place — the same limitation `#onAfterLoadData` already has, and a smaller wrong than a grid of default
  widths. It also clears `#columnWidthsToRefresh`, so the header-change entries queued earlier in
  `updatePlugin()` are not measured a second time in the same render.
- **A sampling change in the call that turns the plugin on again is measured too.** `BasePlugin` refreshes
  the plugin settings before `enablePlugin()`, so `enablePlugin()` applies the new sampling settings and the
  `updatePlugin()` of the same call sees no change. `enablePlugin()` therefore records a change it applied to
  a plugin that measured before (`#samplingChangedOnEnable`), and `updatePlugin()` re-measures for it once.
  The widths map survives a disable, so without it the widths measured under the old settings stayed.
- **Re-measure only on a real change.** `updatePlugin()` runs on *every* `updateSettings()` call, and the
  React and Angular wrappers re-send unchanged settings on every update (React on every commit). An
  unconditional re-measure would walk every column on each of them — which the `skipUnchangedWrites` rule
  below exists to avoid in the first place.
- **`useHeaders` is compared against `#appliedUseHeaders`, never against `ghostTable.getSetting()`.** The
  ghost table's copy is render-time scratch state that `#measureCellsWidth()` deliberately flips to `false`
  and restores in a `finally`. Reading it here would tie the change detection to that restore being perfect,
  and a future path that flipped it without restoring would report a phantom change and re-measure the whole
  grid on the next `updateSettings()`.

`samplingRatio` is resolved by `SamplesGenerator.resolveSampleCount()` rather than by each plugin, so all
three sampling plugins agree on what the option means — this plugin used to `parseInt` it while `AutoRowSize`
stored it raw. Anything that is not a whole number above zero resolves to `null` (the default). That guard is
not cosmetic: `parseInt` turned `true` and `[]` into `NaN`, and because `NaN !== NaN` the change check
reported a change on *every* `updateSettings()` call and never converged.

**`applySamplingOptions()` is the only way into those two options — do not add a per-option setter back.**
`SamplesGenerator` used to carry `setSampleCount()` and `setAllowDuplicates()`, and both were removed once
all three plugins moved to the shared method, because they wrote `customSampleCount` **raw**: a caller
passing `-1`, `2.5` or `'6'` could reach a state the plugins can no longer produce, which is exactly the
disagreement `resolveSampleCount()` exists to end. Removing them was safe rather than breaking because the
class is exported from no public entry point and the two plugins that expose the instance mark it
`@private` (`AutoRowHeaderSize` keeps it in a `#` field), so it is not in the published API surface.

`AutoRowSize` follows the same shape; its own `AGENTS.md` carries the note about the
`updateSettings`-does-not-recalculate contract this sits under.

## The refresh queue avoids full rescans (DEV-2097)

An edit does not automatically rescan its column. Changed cells are queued as width probes, and a full
rescan runs only when: it was asked for explicitly, there is no cached width to compare a probe against, or
so many cells changed that probing costs about as much as the rescan.

Three consequences:

- **An overgrown sample bucket is dropped whole, never trimmed.** The width determiner — the string that
  decides the column's width — can sit anywhere in a bucket, so trimming risks evicting it and rendering
  the column narrower than its content. Dropping the entry costs one full scan on the next re-measure.
- **A settings change invalidates the samples cache**, because settings can remap the data feeding it (a new
  `columns` definition, for instance).
- **The synchronous sweep's samples are dropped on purpose.** It runs inside the `init` / `afterLoadData`
  hook cascade, *before* other plugins re-apply their cell meta (MergeCells' `spanned`/`hidden`), so what it
  collected cannot be trusted for later re-measures.

## The `afterLoadData` sweep relies on the Formulas plugin running first (DEV-2905)

This plugin has the lowest `PLUGIN_PRIORITY`, so at the default order its `afterLoadData` listener ran
before every other plugin's — including the Formulas listener that feeds the new data to the engine. The
sweep then measured formula columns against the *previous* dataset's results, and the engine's
`valuesUpdated` batch queued every changed cell, which `#refreshQueuedColumnsWidth` turned into a second
synchronous full rescan on the resume render: three measurements per column per `loadData()`. The Formulas
plugin now registers that listener at `orderIndex` -1 (its own `AGENTS.md` says why it moved rather than
this one), so the sweep sees fresh values and `recalculateAllColumnsWidth()` discards the queue.
`tests/e2e/sheet-switch-autosize.spec.ts` pins the count at `countCols() * 2` (the load sweep plus the
visible-columns walk). Keep this listener at the default order: AutoRowSize measures row heights against
this plugin's widths in its own default-order `afterLoadData` listener, and host `afterLoadData` callbacks
read `getColWidth()` — both expect the sweep to have run, which is what the plugin enable order gives them.

## The index map is `skipUnchangedWrites`

The `autoColumnSize` map holds numbers only, so re-writing an unchanged width must be a no-op — otherwise
it invalidates the column-width position cache, and every render re-measures the visible columns.

## Listeners stay bound while disabled — deliberately

`disablePlugin()` leaves the width-recalculation listener active, because ManualColumnResize's
double-click-to-autofit needs it even with `autoColumnSize: false`. Do not "clean that up".

Also: widths are kept unchanged when every row is deleted or trimmed, rather than collapsing to the header
width.

## Known concerns

- This plugin no longer asks the view to resize the overlays. It used to, beside `autoRowSize` and
  `hiddenColumns`, each with a `@TODO Should call once per render cycle` on it. Walkontable decides for
  itself now — see "The engine decides for itself when the overlays need resizing" in
  `../../3rdparty/walkontable/AGENTS.md`, and do not add the call back.
- `requestAnimationFrame` batching in the codebase is thin, and this is one of the few files using it.
- **`colWidths: null` names no width, on both sides.** `isEnabled()` reads it as unset (`!colWidths`), and
  `_getColWidthFromSettings()` returns `undefined` for a `null` width, so `getColumnWidth()` takes the measured
  size. It used to return the `null`, which `getColWidth()` passed through as a width and every column drew at
  the default 50px while the plugin reported itself enabled. The sheets bar writes `null` for a key only some
  sheets declare (its `undefined` baseline), so every sheet after one declaring `colWidths` was fixed at 50px,
  and an xlsx export from it wrote one-character columns. Pinned by
  `../sheetsBar/__tests__/settingsBaseline.unit.js`.
- **`hot._getColWidthFromSettings()` takes a VISUAL index.** It translates the index to the physical one itself for the `colWidths` array and function (`colWidths` is addressed by physical index), and it reads `getCellMeta(0, col)`, which also takes a visual index. Pass the visual column at every call site; passing the physical one translates twice and reads another column's width once columns are moved.

## Notes for docs

`scrollViewportTo()` computes scroll positions from column widths, so a grid with custom renderers or
styles that produce non-standard widths needs this plugin enabled or it scrolls to the wrong place. That
caveat is in the class JSDoc — keep it there.

## One sweep at a time, and never over replaced data

The columns past `syncLimit` are measured in idle tasks (`requestIdleTask`), and each sweep keeps its row range and
last column in its own closure. The plugin keeps the pending task in `#sweepTask`, and `#cancelSweep()` cancels it
when a new sweep starts, on `beforeLoadData`, and on a real disable or destroy (`updatePlugin()`
does not disable, so a wrapper re-render keeps the sweep). Before that, a sweep left running when the data was
replaced (a sheets bar switch away from a wide sheet) sampled cells the new data does not have, the ghost table kept a
column it never built, and every later render threw `Cannot read properties of undefined (reading
'getBoundingClientRect')`. Not on `updateData()`: the React wrapper sends `data` on every re-render, and nothing restarts the sweep after an `updateData()`. A re-render can still shrink the data between two idle tasks, so each chunk clamps the sweep's row and column bounds to `countRows()` and `countCols()` (`processChunk`); without it the sweep sampled columns the grid no longer had and broke the ghost table the same way. Pinned by `tests/e2e/sheets-bar-in-flight-work.spec.ts` ("leaves a wide sheet...", "...when an update shrinks the data").

## The first full measure stays on the `init` hook, on purpose

Every other plugin that parked init work on `init` or `afterInit` moved it to the ready step
(`onGridReady()`, `../base/AGENTS.md`). This one keeps its `init` listener. The steps run in
`PLUGIN_PRIORITY` order, so a step of this plugin would run at 10, before the plugins that build what it
measures: NestedHeaders (280) builds the header labels, MergeCells (150) the merges, and Pagination (900)
the page. Measured from a step, the columns would come out of empty labels again, the defect PR #14080
fixed. Every ready step now runs before the `init` hook, so `init` is the point where the other plugins'
state is in place and the first render has not run yet. AutoRowSize keeps its listener for the same reason.

## Where to look next

- Row counterpart: `../autoRowSize/AGENTS.md`. Row *header* widths: `../autoRowHeaderSize/AGENTS.md`.
- Storing user-dragged sizes instead of computing them: `../../utils/manualResize/AGENTS.md`.
- `GhostTable` / off-DOM measurement rules (the probe must mimic the real grid DOM exactly):
  `../../../AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.


## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoColumnSize'`
