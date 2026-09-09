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
- Cells covered by a merged cell carry `null` and are skipped — they contribute no sample.
- **The ghost table must be restored even when a custom renderer throws.** A throwing renderer that leaves
  headers disabled, or the probe's columns still attached, corrupts every later full-scan measurement.

## `syncLimit`, and what "sync" guarantees

`syncLimit` (a column count, or a percentage string) splits the work: those columns are measured *exactly*,
over the whole row range, **before the first paint**. Everything past the limit runs asynchronously in
`requestAnimationFrame` chunks. Do not move work out of the synchronous half to speed up init — the
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
  makes for the same base-class reason (`../manualResize/AGENTS.md`). **This is the common path:** the Vue
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

## The index map is `skipUnchangedWrites`

The `autoColumnSize` map holds numbers only, so re-writing an unchanged width must be a no-op — otherwise
it invalidates the column-width position cache, and every render re-measures the visible columns.

## Listeners stay bound while disabled — deliberately

`disablePlugin()` leaves the width-recalculation listener active, because ManualColumnResize's
double-click-to-autofit needs it even with `autoColumnSize: false`. Do not "clean that up".

Also: widths are kept unchanged when every row is deleted or trimmed, rather than collapsing to the header
width.

## Known concerns

- `@TODO Should call once per render cycle, currently fired separately in different plugins` — this plugin,
  `autoRowSize` and `hiddenColumns` each trigger the same per-render work. Catalogued in
  `../../../.ai/CONCERNS.md`.
- `requestAnimationFrame` batching in the codebase is thin, and this is one of the few files using it.

## Notes for docs

`scrollViewportTo()` computes scroll positions from column widths, so a grid with custom renderers or
styles that produce non-standard widths needs this plugin enabled or it scrolls to the wrong place. That
caveat is in the class JSDoc — keep it there.

## Where to look next

- Row counterpart: `../autoRowSize/AGENTS.md`. Row *header* widths: `../autoRowHeaderSize/AGENTS.md`.
- Storing user-dragged sizes instead of computing them: `../manualResize/AGENTS.md`.
- `GhostTable` / off-DOM measurement rules (the probe must mimic the real grid DOM exactly):
  `../../../AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='autoColumnSize'`
