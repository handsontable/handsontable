# manualResize — the drag gesture and helpers shared by the two manual resize plugins

This is **not a plugin**, which is why it sits under `src/utils/` and not under `src/plugins/`. It has no
`index.ts`, no `PLUGIN_KEY`, no `PLUGIN_PRIORITY` and no lifecycle, nothing registers it, and the packaging
allowlist (`./plugins/*/index.*` in `package.json`) cannot reach it. `src/utils/ghostTable.ts` is the same
shape: a class several plugins build and own. **Do not move it back into `src/plugins/`.** It holds what
`../../plugins/manualRowResize/` and `../../plugins/manualColumnResize/` share:

- `resizeGesture.ts` — `ResizeGesture`: the resize handle, the guide, the drag and double-click state, and
  the resize hooks a drag fires.
- `axis.ts` — `ROW_RESIZE_AXIS` and `COLUMN_RESIZE_AXIS`, which tell the gesture which axis it resizes.
- `utils.ts` — the size-option rules and the pointer math.

Read this before touching either resize plugin. The two plugins used to carry the whole gesture twice, with a
note in each file to keep them in sync by hand; there is now one copy, here.

## What the gesture owns, and what the plugins own

`ResizeGesture` owns everything about the drag: attaching and detaching the handle and guide, the press,
double-click and autoresize state, the pointer math, the #6926 detached-`event.target` workaround, the
`mouseover` that fires right after `contextmenu`, and firing `before*Resize` / `after*Resize`.

Each plugin owns its sizes: the index map, every public size accessor, `SETTING_KEYS` and the
`updatePlugin()` rules below, the `#onMapInit` replay, and its `modifyRowHeight` / `modifyColWidth` hook. The
row plugin also keeps `getLastDesiredRowHeight()`, and the column plugin keeps its stretching hooks.

**The seam runs both ways.** Facts flow in through the axis descriptor. Calls flow out through the owner the
plugin passes in: `isActive()` and `setManualSize()`. That second one is the plugin's **public**
`setManualSize` on purpose - the gesture never writes a size map itself, so the clamping rules (the 20px
column floor, the theme's default row height) stay in one place.

## One gesture for both axes: along and across

The two plugins were never a vocabulary swap of each other. Their CSS geometry is a complete swap:

| | Row (resized vertically) | Column (resized horizontally) |
|---|---|---|
| moves with the pointer | `style.top` | the inline start edge |
| stays put | the inline start edge | `style.top` |
| extent across | `style.width` | `style.height` |
| pointer coordinate | `pageY` | `pageX`, times `getDirectionFactor()` |

So the gesture is written once in *along* / *across* terms, and `ResizeAxis#orientation` alone decides the
geometry.

**The inline start edge is resolved when it is written, never at construction.** It is `left`, or `right`
under RTL, and RTL can change through `updateSettings()`. It is *across* for a row and *along* for a column,
so capturing it once would move the wrong edge on either axis after an RTL switch. `resizeGesture.unit.js`
pins this.

## Multi-index resize: one drag can resize the whole selection

A drag on a header **inside the current selection resizes every selected row or column**. A drag on a header
**outside the selection, or with no selection at all, resizes only that one**. The rule is identical on both
axes and the gesture owns it: `#collectSelectedIndexes()` decides the list, and `#onMouseUp()` then fires the
before- and after-resize hooks once per index in it.

Three parts of it are easy to break, and none of them is visible from a single read of the happy path:

- **A selection only counts when it selects whole rows or columns.** The gate is
  `selection.isSelected() && (selection.isSelectedByCorner() || axis.isSelectedByHeader(hot))`, so the corner
  ("select all") or a header click. A plain cell range is a selection too, and it must not turn a resize into
  a multi-index one.
- **The dragged index wins over the selection.** After collecting, `#setupHandlePosition()` checks
  `!selectedIndexes.includes(currentIndex)` and replaces the whole list with `[currentIndex]`. Remove that
  and a drag started outside the selection resizes the selected headers while leaving the header actually
  under the pointer untouched.
- **Overlapping ranges are de-duplicated.** `getSelectedRange()` can return several ranges that overlap, so
  the collector keeps a `Set` of indexes it has already added. Without it an overlapped index gets
  `setManualSize()` called twice and its resize hooks fired twice.

Both branches are pinned in `__tests__/resizeGesture.unit.js`: "should resize every index of a header
selection the drag starts in" and "should resize only the dragged index when the drag starts outside the
selection".

## What genuinely differs per axis: `axis.ts`

Most descriptor entries are naming. Four hold real logic, and each is easy to get wrong:

- **`getHeaderPosition` - the frozen bands.** Rows test `fixedRowsTop` **and** `fixedRowsBottom`, and a row
  in the bottom band resolves against `bottomInlineStartCornerOverlay`; columns test `fixedColumnsStart`
  only. Both read the counts through Walkontable, not the settings, because `TableView` reduces them by the
  number of hidden rows or columns. When the header is not inside a corner overlay, the fallback is the
  inline-start overlay for rows and the top overlay for columns - that is where the rest of the headers live.
- **`canResizeHeader`.** The column axis refuses a header spanning more than one column (nested headers):
  there is no single column to resize. The row axis resizes every header.
- **`getHookSize` - rows can only grow.** A declared row height is a minimum, not a target
  (`../../plugins/autoRowSize/AGENTS.md`), so the row axis reports `max(dragged, rendered)` to the hooks. The column axis
  reports the stored width unchanged. The row side's standing TODO lives here too: it measures through
  `wtTable.getRowHeight()` because `hot.getRowHeight()` is not yet trustworthy - do not swap them without
  verifying that.
- **`isHeaderElement`.** Rows look for a `TBODY` in three overlays and read `clone?.`; columns look for a
  `THEAD` in two and read `clone!.`. The null-policy difference predates the shared module and was kept as it
  was.

Two differences looked real while the plugins were copies and were not. **Do not re-add them.** The row
plugin read `getBottomStartCorner()` where the column read `getBottomEndCorner()`: both corners take
`Math.max(from.row, to.row)`, so one corner serves both axes. And "rows can only grow" is not a separate
flag - it is `getHookSize` above.

## The teardown traps (DEV-2719)

The handle and guide are created with the gesture and attached lazily - the handle on `mouseover` over a
header, the guide on `mousedown` over the handle. Four traps come with that, and all of them now live in
`ResizeGesture`:

- **Hiding does not detach.** `#hideHandleAndGuide()` only strips the `active` class. `detach()` is the
  teardown, and each plugin calls it from `disablePlugin()` and `destroy()`; the context menu handler calls it
  too.
- **An orphaned handle swallows the click on the header underneath it.** It is `opacity: 0` at rest, so
  nothing looks broken, but it keeps `z-index: 210`, `pointer-events: auto` and a resize cursor, and the core
  resolves a cell from `event.target` - so a click on the band hits the orphan and selects nothing. The guide
  is inert by comparison (`display: none` without `active`).
- **Do not move the detach into `#hideHandleAndGuide()`.** `#onMouseUp` calls it and then positions the
  handle again, which early-returns when `shouldSkipResizeHandlePositioning()` sees a click count above one -
  exactly the second `mouseup` of a double-click. The handle would then be gone for the 500ms until
  `afterMouseDownTimeout()` restores it: a flicker on every double-click autosize. For the same reason a
  completed drag deliberately leaves both elements attached.
- **`detach()` must not reset the drag.** `updatePlugin()` runs `disablePlugin(); enablePlugin();` on any
  `updateSettings()` carrying the plugin's own key, which a framework wrapper sends on every re-render.
  Resetting the pressed flag in the teardown made the `mouseup` ending an in-flight drag take the idle branch:
  the drag was dropped with no after-resize hook and the size never confirmed. The reset lives in the context
  menu handler only, where aborting the drag is the point. Known cost, pre-existing: on a *real* disable the
  `mouseup` never arrives, so the flag latches true and a later re-enable reads plain pointer movement as a
  drag. An `event.buttons === 0` check in `#onMouseMove` would close it, but the frozen Jasmine helpers
  simulate `mousemove` without `buttons`, so it reds 41 of the 147 specs across the two plugin suites - it
  needs a sweep of those helpers, not a drive-by.
- **Build the gesture in the plugin constructor, never in `enablePlugin()`.** The rule above only holds
  because a single `ResizeGesture` spans the whole `disablePlugin(); enablePlugin();` cycle, carrying
  `#pressed`, `#startSize`, `#startOffset` and `#selectedIndexes` across it. Moving the `new ResizeGesture()`
  into `enablePlugin()` reads as a lifecycle tidy-up and satisfies every sentence above, yet it hands the
  `mouseup` that ends the drag a gesture whose `#pressed` is `false`. That is the idle branch again, and the
  fourth trap is back. The spec that would catch it is
  `../../../../tests/e2e/manual-resize-drag-interruption.spec.ts`, which drives that cycle mid-drag. The unit
  suite does not: it builds the gesture directly and never goes through a plugin.

**`afterMouseDownTimeout()` can outlive the plugin.** `#onMouseDown` arms it through `hot._registerTimeout`,
which only `Core#destroy()` clears - `disablePlugin()` does not. So a disable inside the 500ms window leaves
the callback pending on a plugin that is already off, where it would run the resize hooks, write into a size
map that was already unregistered, and re-append the handle into the container the teardown just cleaned. It
therefore opens with a bail on `owner.isActive()` that still resets the timeout and the click count, because
`#onMouseDown` only arms a fresh timer while no timer is pending.

**A held double-click must hide the guide when autosize runs (DEV-1038).** `#onMouseDown` shows the guide
and `#onMouseUp` is what used to hide it. Autosize is not mouseup: it is this 500ms timer, so a second
press that is held left the guide `active` (`display: block`) until the button came up. The timer hides
it when `#dblclick >= 2`. It still must not detach – that is the flicker trap above. A first press that
is held is a drag, so the same timer must leave the guide alone when the count is below two.

**Do not clear `#pressed` on every dblclick timeout.** `#newSize` is reset to `#startSize` on each press
and written on mousemove. They still matching is a still hold: clear `#pressed` so a later mousemove
cannot overwrite the autosize and mouseup takes the idle branch (no second round of drag-end hooks).
They differing means the second press already started a drag: keep `#pressed`. The `#setupHandlePosition`
that follows then resets `#startSize`, so later mousemove/mouseup keep following the pointer – the
develop path a blanket `#pressed = false` dropped. Pinned in `__tests__/resizeGesture.unit.js` ("should
hide the guide as soon as a held double-click autosizes", "should keep a drag that starts on the second
press alive after the autosize timer"). The still-hold hide is also in
`../../../../tests/e2e/manual-resize-dblclick-hold-guide.spec.ts`.

## `afterMouseDownTimeout()` stays on both plugins

Every other gesture method left the plugins. This one is kept as a one-line forward, because the frozen
`../../plugins/autoRowSize/__tests__/autoRowSize.spec.js` calls `manualColumnResizePlugin.afterMouseDownTimeout()`
directly to close a double-click window between simulated clicks. The row plugin keeps the same forward for
parity. Do not remove either without migrating that spec.

## The size options each plugin answers to

```
ROW_SIZE_OPTIONS    = ['rowHeights', 'minRowHeights']
COLUMN_SIZE_OPTIONS = ['colWidths']
```

`minRowHeights` is a documented alias of `rowHeights` — `Core#_getRowHeightFromSettings` reads
`rowHeights ?? minRowHeights`, so both state the row heights equally. There is **no** `minColWidths` alias,
which is why the column list has one entry and the row list two. Do not "symmetrize" them.

## Listing a foreign option in `SETTING_KEYS` changes three things

Both plugins put their size option in `SETTING_KEYS` next to their own key, so that
`updateSettings({ rowHeights })` reaches them at all (issue [#4371](https://github.com/handsontable/handsontable/issues/4371)).
Each consequence below has already shipped as a bug:

1. **The stored setting gets wiped.** `BasePlugin#onUpdateSettings` feeds `updatePluginSettings()` with
   `newSettings[PLUGIN_KEY]`, and a `{ rowHeights }` call does not carry that key — it is `undefined`.
   Restore it from the merged settings, or `getSetting()` starts lying for the rest of the session.
2. **Do not run the usual `disablePlugin(); enablePlugin();` cycle on such an update.** `#onMapInit` replays
   the declared `manualRowResize` array, so a grid configured with an array reverts a row the user had since
   dragged — to neither the dragged height nor the requested one. Re-initialize only when the plugin's own
   key is present.
3. **A clear that must survive the cycle has to run *after* `enablePlugin()`.** `disablePlugin()` snapshots
   the live map into `#config`, and `#onMapInit` replays it.

Also: `Array.isArray(setting)` is `true` for `[]`, which means "enabled, no presets" — never "the array
states the sizes".

## `redeclaresManualSizes()` — when a config discards dragged sizes

A config object that re-declares the size option is taken as "the option takes effect again", so the sizes
the user dragged are cleared. Three deliberate exceptions:

- **A non-empty plugin array wins.** `pluginSetting` is read from the *merged* settings, not from the config
  object, so a grid configured with a non-empty array keeps what the plugin replays on the map's `init` hook.
  Clearing there would leave the stored sizes and the option disagreeing until the next replay put them back.
- **An empty array presets nothing**, so it does not suppress the clear.
- **A function states no fixed size.** It is called again on every render, and a framework wrapper rebuilds
  an inline one on every render too, so treating it as a re-declaration would discard the stored sizes on
  every render. Clear those with `clearManualSizes()` instead.

The final relevance test is `sizeOption !== undefined` — matching how `BasePlugin` itself tests a config key.
Keep the two in step.

## Scale-aware pointer math

A resize drag reads pointer deltas in *visual* pixels, so a CSS-transformed host page would make the drag
short. `getElementScaleFactor(element, axis)` divides `getBoundingClientRect()` by `offsetWidth`/`offsetHeight`,
and `normalizeVisualDelta(visualDelta, scaleFactor)` converts back.

**The one-pixel tolerance is load-bearing.** Table headers and `border-collapse` can make
`getBoundingClientRect()` one CSS pixel wider or taller than the offset size with no CSS transform at all,
so a difference of `<= 1` is reported as unscaled (factor `1`). Without it, `normalizeVisualDelta` rounds
every resize one layout pixel short. Both helpers also fail safe to `1` on a non-finite or non-positive
measurement, which is what a grid built inside a `display: none` container measures.

## Where to look next

- Row plugin: `../../plugins/manualRowResize/AGENTS.md`. Column plugin: `../../plugins/manualColumnResize/AGENTS.md`.
- Auto-sizing counterparts, which compute rather than store sizes: `../../plugins/autoRowSize/`, `../../plugins/autoColumnSize/`.
- `SETTING_KEYS` semantics in general: `../../plugins/base/AGENTS.md`.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern='manualResize'`
- `npm run test:e2e --prefix handsontable -- --testPathPattern='manualRowResize|manualColumnResize|autoRowSize'`
- `cd tests && npx playwright test --project=e2e-main e2e/manual-resize-teardown.spec.ts e2e/manual-resize-drag-interruption.spec.ts e2e/manual-resize-dblclick-hold-guide.spec.ts`

`__tests__/resizeGesture.unit.js` drives the gesture through its constructor, with a small grid, axis and owner
passed in - no module is mocked. Each of its tests was checked against a deliberate regression of the
behavior it names: resetting the drag in `detach()`, capturing the inline edge at construction, dropping the
disabled-owner bail, not aborting on a context menu, and dropping the RTL direction factor each turn exactly
one test red. The browser half of the traps is pinned by `tests/e2e/manual-resize-teardown.spec.ts` (hiding,
the swallowed click, the double-click flicker, the pending timeout) and
`tests/e2e/manual-resize-drag-interruption.spec.ts` (the drag surviving the update cycle, and a
held second press whose 500ms window is interrupted by the same re-init).
DEV-1038 is pinned by `__tests__/resizeGesture.unit.js` (the held double-click hides the guide, a held
single press does not, a second press that already moved keeps the drag). The still-hold hide is also
in `tests/e2e/manual-resize-dblclick-hold-guide.spec.ts`.
