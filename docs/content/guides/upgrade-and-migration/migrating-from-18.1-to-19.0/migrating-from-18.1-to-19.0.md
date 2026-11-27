---
type: how-to
title: Migrating from 18.1 to 19.0
metaTitle: Migrating from 18.1 to 19.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.1 to Handsontable 19.0.
permalink: /migration-from-18.1-to-19.0
canonicalUrl: /migration-from-18.1-to-19.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.1 to 19.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.1 to 19.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.1 to 19.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.1 to Handsontable 19.0.

The changes are grouped by how many apps they reach, from the ones that stop a grid from working to the ones that
affect a few setups. Read [Before you upgrade](#before-you-upgrade) in full. For every other group, scan its table and
open only the changes that match your setup. Each change lists who it affects and what to do. Edge cases sit in a
collapsed **Details** block.

For a full list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

## Before you upgrade

Most of these changes stop the grid from working: it shows a lock screen, throws an error, or runs in a browser
19.0 no longer supports. The rest fail at compile time or drop an option with a console warning. Check each one before
you upgrade.

| Change | Affects | Do |
| --- | --- | --- |
| [`non-commercial-and-evaluation` key no longer works](#the-non-commercial-and-evaluation-license-key-no-longer-works) | Apps that pass this key, or the Angular `NON_COMMERCIAL_LICENSE` constant | Get a trial, sponsored, or commercial key before you upgrade |
| [Higher minimum browser versions](#the-minimum-browser-versions-are-higher) | Apps that support Chrome or Edge older than 130, Firefox older than 132, or Safari older than 18.2 | Raise your browser targets, or stay on 18.1 |
| [Stricter license key check](#license-keys-are-checked-more-strictly) | Entitlement keys passed in a shortened or edited form | Pass the key exactly as you received it |
| [Removed deprecated APIs](#removed-deprecated-apis) | Calls to APIs deprecated in 17.1 and 18.0 | Switch to the replacements |
| [`Loading` needs `Dialog`](#the-loading-plugin-needs-the-dialog-plugin-registered) | Apps that register modules one by one | Register `Dialog` next to `Loading` |
| [`beforeInit` in settings runs](#a-beforeinit-callback-in-your-settings-now-runs) | Settings that declare a `beforeInit` callback | Move code that reads the grid to `afterInit` |

### 1. The `non-commercial-and-evaluation` license key no longer works

Handsontable 19.0 no longer recognizes the `'non-commercial-and-evaluation'` key or the
`'ht68e-1f2b7-47158-70b05-0842f'` key. Both read as invalid: a lock screen covers the grid, and the console shows
"The license key for Handsontable is invalid." Handsontable 18.1 and older still accept both.

**Affects:** You pass either key (in any letter case) as the [`licenseKey`](@/api/options.md#licensekey) option, or you
import `NON_COMMERCIAL_LICENSE` from `@handsontable/angular-wrapper`.

**Do:** Before you upgrade, get a license key and pass it instead. See
[Get a license key](@/guides/getting-started/license-key/license-key.md#get-a-license-key).

- To evaluate Handsontable, get a trial key at [handsontable.com/pricing](https://handsontable.com/pricing/).
- For non-commercial use (education, research, study, and personal projects), apply for a sponsored license: a regular
  key that Handsontable issues free of charge, at its discretion.
- For commercial use, buy a commercial license.

Before:

```javascript
const hot = new Handsontable(container, {
  data,
  licenseKey: 'non-commercial-and-evaluation',
});
```

After:

```javascript
const hot = new Handsontable(container, {
  data,
  licenseKey: 'your-license-key',
});
```

In the Angular wrapper, stop using `NON_COMMERCIAL_LICENSE` and pass your key in `HOT_GLOBAL_CONFIG`:

Before:

```typescript
import { HOT_GLOBAL_CONFIG, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: NON_COMMERCIAL_LICENSE } }];
```

After:

```typescript
import { HOT_GLOBAL_CONFIG } from '@handsontable/angular-wrapper';

providers: [{ provide: HOT_GLOBAL_CONFIG, useValue: { license: 'your-license-key' } }];
```

::: details Details: The non-commercial-and-evaluation license key no longer works
- `NON_COMMERCIAL_LICENSE` holds the removed key. It is deprecated, and 20.0.0 removes it. Importing it still
  compiles, but a grid configured with it shows the lock screen.

:::

### 2. The minimum browser versions are higher

Handsontable 19.0 runs on Chrome and Edge 130, Firefox 132, and Safari 18.2 on macOS and iOS. Handsontable 18.1 ran on
Chrome 110, Firefox 110, and Safari 14.1. In an older browser, the grid can throw errors or render without parts of its
theme.

**Affects:** Your app must run in a browser older than the 19.0 minimum, on desktop or on an iPhone or iPad.
Handsontable 19.0 isn't tested in those versions.

**Do:** Before you upgrade, check which browser versions your users run. Raise the browsers you declare (for example in
a Browserslist config) to at least the 19.0 minimum. If you must keep supporting older browsers, stay on Handsontable
18.1 until you can drop them.

```text
# Before
Chrome >= 110
Firefox >= 110
Safari >= 14.1

# After
Chrome >= 130
Edge >= 130
Firefox >= 132
Safari >= 18.2
iOS >= 18.2
```

::: details Details: The minimum browser versions are higher
- The theme stylesheets use CSS nesting, logical properties, and the `light-dark()` color function. The 18.1 build
  rewrote them into older CSS, which dropped some theme icons and, in right-to-left grids, drew rounded corners on the
  wrong cells. The 19.0 build no longer rewrites them.
- The JavaScript targets the same browsers, so Handsontable 19.0 can use built-in methods up to ES2024
  ([#13232](https://github.com/handsontable/handsontable/pull/13232)).
- Polyfills do not cover the theme stylesheets. Rewriting them for older browsers yourself brings back the bugs.
- For the minimum versions of both releases, see
  [Supported browsers](@/guides/technical-specification/supported-browsers/supported-browsers.md#minimum-versions).

:::

### 3. License keys are checked more strictly

Handsontable 19.0 checks an entitlement license key more strictly than 18.1. A key that 18.1 accepts in a shortened or
changed form can read as invalid in 19.0, and an invalid key shows the lock screen over the grid.

**Affects:** You use an
[entitlement license key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys) (plain-English
text followed by a bracketed block) and pass it in another form than you received it: only the bracketed block, changed
text, or anything after the block, such as an email signature or a closing quote.

**Do:** Before you upgrade, check the [`licenseKey`](@/api/options.md#licensekey) value. Pass the whole key exactly as
you received it: the text and the bracketed block, with nothing after the block. For where to keep the key, see
[License key](@/guides/getting-started/license-key/license-key.md#entitlement-license-keys).

::: details Details: License keys are checked more strictly
- Spaces and line breaks in an entitlement key are ignored, so a key that an email client wrapped across lines keeps
  working.
- A key in the 25-character format is not read that way: only spaces and line breaks around the whole key are trimmed,
  and a space between its groups makes it invalid. The stricter check does not affect these keys, except
  `'ht68e-1f2b7-47158-70b05-0842f'`. That key and `'non-commercial-and-evaluation'` are invalid for another reason: see
  [The `non-commercial-and-evaluation` license key no longer works](#the-non-commercial-and-evaluation-license-key-no-longer-works).

:::

### 4. Removed deprecated APIs

Handsontable 19.0 removes the APIs that 17.1 and 18.0 deprecated. A removed method throws
`TypeError: ... is not a function`, a removed type alias is a TypeScript error, and `columnHeaders` is ignored with a
one-time console warning that names `colHeaders`.

**Affects:** Your code uses any API in the list below.

**Do:** Replace each removed API:

- `saveManualColumnWidths()` and `loadManualColumnWidths()` ([`ManualColumnResize`](@/api/manualColumnResize.md)), and
  `saveManualRowHeights()` and `loadManualRowHeights()` ([`ManualRowResize`](@/api/manualRowResize.md)), deprecated in
  18.0: save and restore the sizes with the `columnWidths` and `rowHeights` parts of the
  [view state](@/guides/getting-started/view-state/view-state.md), as in the example below, or with
  `getManualSizes()` and `setManualSizes()` of [`ManualColumnResize`](@/api/manualColumnResize.md#getmanualsizes)
  and [`ManualRowResize`](@/api/manualRowResize.md#getmanualsizes).
- `Handsontable.helper.sanitize()`, deprecated in 18.0: remove the call and use its argument directly. To sanitize the
  HTML the grid renders, set the [`sanitizer`](@/api/options.md#sanitizer) option.
- The `columnHeaders` export option of the [`ExportFile`](@/api/exportFile.md) plugin, deprecated in 17.1: rename it to
  `colHeaders`. The value keeps its meaning. For example,
  `hot.getPlugin('exportFile').downloadFile('csv', { colHeaders: true })`.
- The `Settings` type (`handsontable/plugins/exportFile`), deprecated in 18.0: import `ExportFileSettings`.
- The `DataProviderOptions` type (`handsontable/plugins/dataProvider`), deprecated in 18.0: import
  `DataProviderFetchOptions`.

```ts
// Before
import type { Settings } from 'handsontable/plugins/exportFile';
import type { DataProviderOptions } from 'handsontable/plugins/dataProvider';

// After
import type { ExportFileSettings } from 'handsontable/plugins/exportFile';
import type { DataProviderFetchOptions } from 'handsontable/plugins/dataProvider';
```

To persist sizes, save them with [`getViewState()`](@/api/viewState.md#getviewstate) and restore them with
[`setViewState()`](@/api/viewState.md#setviewstate). Both parts hold `[physicalIndex, size]` pairs, so a size goes
back to its row or column after a sort, a filter, or a move:

```js
const viewState = hot.getPlugin('viewState');

// Save
const { columnWidths, rowHeights } = viewState.getViewState();

localStorage.setItem('gridSizes', JSON.stringify({ columnWidths, rowHeights }));

// Restore, for example right after you create the grid
const stored = localStorage.getItem('gridSizes');

// Nothing is stored on a first visit
if (stored !== null) {
  viewState.setViewState({ version: 1, ...JSON.parse(stored) });
}
```

::: details Details: Removed deprecated APIs
- In 18.x, the resize-state methods did nothing and logged a deprecation warning. See
  [Migrate from 17.1 to 18.0: Resize-state methods](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md#stop-calling-deprecated-resize-state-methods).
- `Handsontable.helper.sanitize()` has returned its input unchanged since 18.0, so removing it does not change the
  output.
- `columnHeaders` applies to [`exportAsString()`](@/api/exportFile.md#exportasstring),
  [`exportAsBlob()`](@/api/exportFile.md#exportasblob), [`downloadFile()`](@/api/exportFile.md#downloadfile), their
  asynchronous forms, and a `sheets` entry of an XLSX export. An export that still passes it writes no header row.
- The methods and `columnHeaders` printed a one-time warning in 18.x. The type aliases only showed as deprecated in your
  editor.

:::

### 5. The `Loading` plugin needs the `Dialog` plugin registered

The [`Loading`](@/api/loading.md) plugin shows its overlay through the [`Dialog`](@/api/dialog.md) plugin. In 18.1,
registering `Loading` without `Dialog` made [`show()`](@/api/loading.md#show) do nothing, with no error. In 19.0,
`new Handsontable()` throws:

```text
The Loading plugin requires the following modules:
 - Dialog (plugin)

You have to import and register them manually.
```

**Affects:** You register modules one by one with `registerPlugin()` and register `Loading` without `Dialog`. The full
`handsontable` package and `registerAllModules()` register both.

**Do:** Register the `Dialog` plugin next to the `Loading` plugin:

```js
import Handsontable from 'handsontable/base';
import { registerPlugin, Dialog, Loading } from 'handsontable/plugins';

registerPlugin(Dialog);
registerPlugin(Loading);
```

### 6. A `beforeInit` callback in your settings now runs

A [`beforeInit`](@/api/hooks.md#beforeinit) callback in the settings object never ran in 18.1. That was a bug. It now
runs, so a callback that reads the data throws and the grid never finishes building.

**Affects:** Your settings object declares `beforeInit`. Hooks added with `Handsontable.hooks.add('beforeInit', ...)` or
[`addHook()`](@/api/core.md#addhook) are unchanged.

**Do:** If the callback touches the grid, move that part to [`afterInit`](@/api/hooks.md#afterinit).

Before:

```js
const hot = new Handsontable(container, {
  data,
  beforeInit() {
    this.rowCount = this.countRows(); // Throws, the data is not loaded yet.
  },
});
```

After:

```js
const hot = new Handsontable(container, {
  data,
  afterInit() {
    this.rowCount = this.countRows();
  },
});
```

::: details Details: A beforeInit callback in your settings now runs
- Nothing catches the error. In the wrappers, it comes out of the component's mount.
- `beforeInit` fires before the data loads and the table renders. [`getSettings()`](@/api/core.md#getsettings) works,
  but [`countRows()`](@/api/core.md#countrows), [`getData()`](@/api/core.md#getdata), and any method on `hot.view` do
  not.
- [`construct`](@/api/hooks.md#construct) and [`afterPluginsInitialized`](@/api/hooks.md#afterpluginsinitialized) run
  before Handsontable reads the callbacks from your settings, so declaring either as an option still does nothing.
  Register them globally:

  ```js
  Handsontable.hooks.add('construct', () => {
    // your code
  });
  ```

:::

## Changes in every grid

These changes apply under the default settings or common options. Most need no code change, but the grid behaves
differently.

| Change | Affects | Do |
| --- | --- | --- |
| [Undo and redo restore a recorded state](#undo-and-redo-restore-a-recorded-state) | Every grid with undo, and apps that call `undo()` with `undo: false` | Keep `undo: true` for your own buttons; clear the history after setup |
| [Unchanged editor confirm writes nothing](#confirming-an-editor-without-typing-writes-nothing) | Code that counts `afterChange` calls or vetoes the confirm in `beforeChange` | Use `afterBeginEditing` to detect an opened editor |
| [Wrappers pass only changed settings](#the-react-and-angular-wrappers-pass-only-the-settings-that-changed) | React and Angular apps that rely on a render to reset sort, filter, or page | Reset through the plugin API |
| [Auto-sized columns are not capped](#an-auto-sized-column-is-no-longer-capped-at-the-width-of-the-grid) | Grids with `autoColumnSize` and text wider than the grid | Cap the width in `modifyColWidth`, or set `width` |
| [`height: 'auto'` no longer clips](#height-auto-no-longer-clips-the-grid) | Grids with `height: 'auto'`, a CSS keyword as `width` or `height`, or a `var()` or container-query `width` | Set a numeric `height` to keep an inner scrollbar |
| [`rowHeights` is an exact height](#rowheights-sets-an-exact-row-height) | Grids with `rowHeights` and taller content, without `autoRowSize` | Rename `rowHeights` to `minRowHeights` to keep the minimum |
| [<kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click moves the highlight](#cmdctrl--click-on-a-selected-cell-moves-the-highlight) | Grids with the default `selectionMode` | Nothing, unless your code expects one click to deselect |
| [A `null` hook is removed](#a-hook-set-to-null-through-updatesettings-is-removed) | Wrapper hook props set to `null` or dropped, and `updateSettings()` calls with `null` | Keep passing the callback |
| [`editor: false` reaches typed columns](#editor-false-is-honored-by-typed-and-checkbox-columns) | Typed or checkbox columns under an `editor: false` | Set `editor: true` on the column |
| [List cells default to one line](#the-list-cell-types-default-to-a-single-line) | `autocomplete`, `dropdown`, and `handsontable` columns | Set `textEllipsis: false` to wrap |
| [Wider auto-sized list columns](#autocolumnsize-includes-the-list-cell-arrow-in-the-column-width) | Auto-sized `autocomplete`, `dropdown`, and `handsontable` columns | Set a column `width` to keep the old size |
| [List editors overflow the grid](#dropdown-editor-lists-are-no-longer-confined-to-the-grid) | Every grid with list editors, most visibly a short grid or a clipped container | Size the containing area, not the grid |

### 1. Undo and redo restore a recorded state

The [`UndoRedo`](@/api/undoRedo.md) plugin used to undo an action by running a reverse action, which could send a value
to the wrong row after a row move, a trim, or a sort. In 19.0, it stores the grid state before and after each action,
plus the values and cell metadata the action changed. An undo puts back the state from before the action, and a redo
puts back the state from after it. With `undo: false`, nothing is recorded, so the plugin's
[`undo()`](@/api/undoRedo.md#undo) and [`redo()`](@/api/undoRedo.md#redo) do nothing.

**Affects:** Everyone who uses the `UndoRedo` plugin, and everyone who sets [`undo: false`](@/api/options.md#undo) but
calls the plugin's `undo()` or `redo()`.

**Do:**

1. **Undo from your own buttons:** keep `undo: true` and remove the shortcuts you do not want (code below).

   ```js
   const gridContext = hot.getShortcutManager().getContext('grid');

   gridContext.removeShortcutsByKeys(['control/meta', 'z']);
   gridContext.removeShortcutsByKeys(['control/meta', 'y']);
   gridContext.removeShortcutsByKeys(['control/meta', 'shift', 'z']);
   ```

2. **Setup calls:** call `hot.getPlugin('undoRedo').clear()` after the setup code, or move the setup into the settings.
3. **Blocking or changing an undo** with `beforeChange`, a `valueSetter`, or an action hook: use `beforeUndo` and
   `beforeRedo` (they receive the step with its `actionType`, and `false` cancels it). To react to restored values, use
   `afterChange` with the `UndoRedo.undo` and `UndoRedo.redo` sources.
4. **Separate steps inside `batch()` or `batchExecution()`:** move those calls out of the batch.
5. **Custom actions:** remove the [`done()`](@/api/undoRedo.md#done) calls that record a change to the grid, such as a
   `setCellMeta()` call. UndoRedo records it already, so each change otherwise takes two undo steps.
6. **HyperFormula:** remove your calls to its `undo()` and `redo()`, and use the grid's undo and redo.
7. **Code that reads steps:** update code that reads a step's properties or calls `cellRange`, `range`, or `ranges`
   methods. Steps are plain objects (see the details).

::: details Details: Undo and redo restore a recorded state
- **`undo: false`.** In 18.1, the plugin still recorded changes, and only its shortcuts were off, so an app could call
  `undo()` from its own buttons.
- **Recorded from the start.** API changes are recorded from the moment the grid exists, including setup: a
  [`setCellMeta()`](@/api/core.md#setcellmeta) call, hidden rows, a page, or a column width set after
  `new Handsontable()`. The first undo reverts your setup.
- **More undoable actions.** Hiding, showing, and trimming rows and columns, resizing, freezing, collapsing nested rows
  and column headers, custom borders, comments, the pagination page and page size, and `setCellMeta()` writes. The full
  list is in [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md#what-undoredo-tracks).
- **Batches.** Every call inside [`batch()`](@/api/core.md#batch) or [`batchExecution()`](@/api/core.md#batchexecution)
  is one undo step, with the `'batch'` action type. The new [`runOperation()`](@/api/core.md#runoperation) method
  groups calls the same way.
- **Hooks during an undo or redo.** Values go straight to the source data. [`beforeChange`](@/api/hooks.md#beforechange)
  and the cell's `valueSetter` do not run. [`afterChange`](@/api/hooks.md#afterchange) runs once, with the
  `UndoRedo.undo` or `UndoRedo.redo` source. Restored visible cells are validated again, and only their `valid` state
  changes.
- **The action's own hooks do not run**, so they cannot cancel an undo or redo: for example
  [`beforeColumnSort`](@/api/hooks.md#beforecolumnsort), [`beforeFilter`](@/api/hooks.md#beforefilter),
  [`beforeRowMove`](@/api/hooks.md#beforerowmove), and [`beforeMoveCells`](@/api/hooks.md#beforemovecells). Returning
  `false` from `beforeMoveCells` no longer blocks the redo of a cell move.
- **`beforeMoveCells`.** A listener that returns anything other than `undefined` or the range it received cancels the
  move, whether or not UndoRedo is on (this applies with `undo: false` too). In 18.1, with the default `undo: true`,
  UndoRedo's own listener canceled such a move. With `undo: false`, only `false` did.
- **`beforeUndo` and `beforeRedo`.** Returning `false` from [`beforeUndo`](@/api/hooks.md#beforeundo) keeps the step on
  the undo stack, as [`beforeRedo`](@/api/hooks.md#beforeredo) does on the redo stack. In 18.1, a canceled undo removed
  the step for good. Stack hooks such as [`afterUndoStackChange`](@/api/hooks.md#afterundostackchange) no longer fire
  for a canceled undo. Both hooks fire before the stack hooks, so in `beforeUndo` the plugin's `doneActions` still
  holds the step (in 18.1, it was already taken off).
- **A hook that cancels an undo.** A row or column hook that returns `false` during an undo, such as
  [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow), cancels the whole undo. The grid is put back, and the step stays
  on its stack. `beforeUndo` has fired, and [`afterUndo`](@/api/hooks.md#afterundo) does not. The exception is a
  replayed removal that removes a different number of rows or columns than it recorded (for example, a listener removes
  more rows along with them): the undo stops there, and the rows that removal took are not put back.
- **The step object.** Code that reads a step in the undo, redo, or stack hooks, or reads `doneActions` or
  `undoneActions`, must follow this. The undo hooks receive the stored step, not a copy, so changing it changes the
  stored step. Treat it as read-only. Use `actionType`, `source`, and the properties in
  [Hooks and stack lifecycle](@/guides/accessories-and-menus/undo-redo/undo-redo.md#hooks-and-stack-lifecycle). Do not
  call `undo()` or `redo()` on a step: call the plugin's. To read the stack after the step left it, listen to
  `afterUndoStackChange`.
- **Step properties.** A step is a plain object with no `undo()` or `redo()` methods, and the internal properties are
  gone:
  - `'change'`: `countCols`, `countRows`, `countSourceRows`, `mergedCells`, `physicalRows`, and `props`.
  - `'remove_row'`: `fixedRowsTop`, `fixedRowsBottom`, `removedCellMetas`, `removedMergedCells`, `removedHiddenRows`,
    `rowIndexesSequence`, and the `nested...` properties.
  - `'remove_col'`: `columnPositions`, `rowPositions`, `fixedColumnsStart`, `removedCellMetas`, and
    `removedMergedCells`.
  - `'move_cells'`: `data`, `meta`, `fromRow`, `fromCol`, `toRow`, `toCol`, `sourceSnapshot`, and `targetSnapshot`. It
    has `sourceRange` and `targetRange` instead.
  - `'nested_rows_detach'`: `amount`, `rowPath`, `detachedRowPath`, `formulasUndoRedoSteps`, and `removeAction`.

  Every recorded step now has `source`, `operations`, and `sources`.
- **Ranges.** A `cellRange`, `range`, or `ranges` field holds plain objects with the same coordinates, not
  [`CellRange`](@/api/cellRange.md) instances, so it has no methods. Read the coordinates directly, for example
  `step.cellRange.from.row` and `step.cellRange.to.col`.
- **Custom actions.** Keep `done()` for state outside the grid.
- **HyperFormula.** With the [`Formulas`](@/api/formulas.md) plugin, the grid no longer calls HyperFormula's `undo()`
  and `redo()`. The grid restores the formulas itself and updates the engine. When several grids share one engine, an undo also puts back the formulas that the step changed in the other
  grids' sheets and in named expressions. A formula edited since the step keeps its new text, and the grid logs a
  warning.
- **A long session.** To cap the history's memory, set `undo: { maxHistory: <number> }`. By default, the stack has no
  size limit, as before.
- **Asynchronous validators.**
  - An edit that waits for one is recorded when the validation finishes. Overlapping edits sit on the stack in the
    order they finished.
  - An action that changed the grid before it started to wait, such as a `batch()` that removes a row and then edits a
    validated cell, keeps the grid until the validation finishes. Anything changed meanwhile is part of its step, so
    one undo reverts both. A validator that throws ends the wait, and the step keeps what the action did before the
    error.
  - While such an action waits, [`isUndoAvailable()`](@/api/undoRedo.md#isundoavailable) and
    [`isRedoAvailable()`](@/api/undoRedo.md#isredoavailable) return `false`, and `undo()` and `redo()` do nothing. An
    edit on its own does not block them.
  - What a validator or an [`afterValidate`](@/api/hooks.md#aftervalidate) listener changes during validation (a
    corrected value, or cell metadata) is part of that edit's step. In 18.1, each such change was its own step.
- **`updateData()`.** [`updateData()`](@/api/core.md#updatedata) clears both stacks when it brings other data, as
  [`loadData()`](@/api/core.md#loaddata) always did. It keeps them when the new data is what the grid shows: the same
  array, a copy of it (`rows.slice()`), or rows that hold the same values, such as an immutable row update gives. A
  wrapper passes `data` on every render, so a render with the same rows keeps the history, as in 18.1.
  - Rows added or removed in the array in place still clear it. Reordering or replacing rows in the array in place
    clears it too, even when you pass a copy of it.
  - Cells are compared with `===`, so a copied nested object counts as a different value.
  - With [`NestedRows`](@/api/nestedRows.md), a copy of the array clears the history too.
  - Up to 1000 rows may be new objects with the same values. If more are, the data counts as other data.
  - A value you change in place in a row, outside the grid, is not seen: the history stays, and an undo writes the old
    value back over it. Change values through the grid, or pass other data.
  - Turning a plugin that keeps its own index map on or off at runtime clears both stacks too:
    [`HiddenRows`](@/api/hiddenRows.md), [`HiddenColumns`](@/api/hiddenColumns.md), [`TrimRows`](@/api/trimRows.md),
    the sorting plugins, and [`Filters`](@/api/filters.md). The move plugins do not. The stack hooks announce each
    drop.
- **`columns`.** A [`columns`](@/api/options.md#columns) update keeps the history. It drops a step that changed
  something on a column whose field changed or is gone (a cell's metadata, a hidden or frozen column, a merge, or a
  filter), with every step that can only be undone or redone after it. Once `columns` is set, it also drops a step that
  inserted or removed columns. An edit is recorded by field, so a `columns` update drops it only together with such a
  step. A column whose `data` is a function created on every render (an inline function in React) reads as a new field
  each time, so each render drops the steps that changed something on that column. The stack hooks announce the drop.
- **`colWidths`, `rowHeights`, and `minRowHeights`.** Switching [`colWidths`](@/api/options.md#colwidths),
  [`rowHeights`](@/api/options.md#rowheights), or [`minRowHeights`](@/api/options.md#minrowheights) to or from an
  array, or passing a new array of any of them to [`updateSettings()`](@/api/core.md#updatesettings), clears both
  stacks, as enabling a plugin does: earlier steps hold the columns or rows of the previous array. The same array keeps
  them. A framework wrapper forwards the prop only when it changed.

:::

### 2. Confirming an editor without typing writes nothing

Opening a cell editor and pressing <kbd>**Enter**</kbd> without typing used to write the editor's string back over the
cell: `null` and `undefined` became `''`, `true` became `'true'`, and a number in a
[`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) column became a string. Each write also fired
[`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange). In 19.0, such a confirm
writes nothing, and neither hook fires. That includes an editor whose `getValue()` returns the cell value it was opened
with, as [a custom editor's `setValue()` receives the cell value](#a-custom-editors-setvalue-receives-the-cell-value)
describes.

**Affects:** Apps that count `afterChange` events to drive a dirty flag, an autosave, or a change tracker (the events you
lose reported an edit the user did not make), and apps that return `false` from `beforeChange` and rely on that closing
the editor.

**Do:** Nothing in most cases. To know that the user opened and closed an editor, use
[`afterBeginEditing`](@/api/hooks.md#afterbeginediting). `afterChange` was never the right signal for that.

::: details Details: Confirming an editor without typing writes nothing
- **Validation is unchanged.** A cell with a [`validator`](@/api/options.md#validator) is still validated on that
  confirm, against the value the cell already holds (the value it would have been handed before).
  [`allowInvalid: false`](@/api/options.md#allowinvalid) still holds the editor open on a value the validator rejects.
- **`beforeChange` closing the editor.** Returning `false` from `beforeChange` still closes the editor on a real edit.
  A confirm that changed nothing has no change to cancel, so the hook does not run and the validator decides. With no
  validator, or a value that passes, the editor closes as before. If the validator rejects the value and `allowInvalid`
  is `false`, the editor stays open, the same as when `beforeChange` returned `true`. <kbd>**Escape**</kbd> closes the
  editor and leaves the value alone.
- To choose what an emptied cell stores, see the [`emptyValue`](@/api/options.md#emptyvalue) option under
  [Also new in 19.0](#also-new-in-190). It is opt-in and the default is unchanged. See
  [Empty cell values](@/guides/getting-started/binding-to-data/binding-to-data.md#empty-cell-values).

:::

### 3. The React and Angular wrappers pass only the settings that changed

In 18.1, the React wrapper passed every prop to [`updateSettings()`](@/api/core.md#updatesettings) on each render, and
the Angular wrapper passed every key of the `settings` input whenever it changed. A setting passed again re-applied the
plugin it names, which could reset state the user gave that plugin, such as the filter conditions or the page. In 19.0,
both wrappers leave out a setting whose value is the same as the value they passed last time.

**Affects:** Apps that use `@handsontable/react-wrapper` or `@handsontable/angular-wrapper` and rely on a render or a
`settings` change to reset a sort, filter, or page that the grid's settings did not change, or that change a setting
through `hot.updateSettings()` and rely on the next render to put the prop's unchanged value back.

**Do:** Reset the state through the plugin, for example `hot.getPlugin('columnSorting').clearSort()`, or pass a setting
with another value. To put a prop's value back after a change made through the instance, call `hot.updateSettings()`
with that value.

::: details Details: The React and Angular wrappers pass only the settings that changed
- Objects and arrays are compared by content with a copy of the value passed last time, so an object or array you
  change in place is still passed. Functions are compared by reference, and so is `sheetsBar`.
- `data` is passed every time, as before: React's `data` prop, a `data` key in Angular's `settings` input, and Angular's
  `data` input, which still calls `updateData()` when it changes. A render that passes the same rows, or rows with the
  same values, keeps the undo and redo history. A render that passes other values replaces the dataset and clears it.

:::

### 4. An auto-sized column is no longer capped at the width of the grid

In 18.1, the width of the grid's root element limited the width of an auto-sized column. A column whose widest value was
longer than the grid stopped at the grid's width, its text wrapped, and its rows grew taller. In 19.0, a column is
measured at the width of its widest value, whatever the size of the grid. The text stays on one line, the rows keep
their default height, and the grid scrolls horizontally.

**Affects:** Grids that leave [`autoColumnSize`](@/api/autoColumnSize.md) on (the default) and have a column with text
wider than the grid.

**Do:** To keep a column from growing past a limit, cap it in the [`modifyColWidth`](@/api/hooks.md#modifycolwidth)
hook, or set its `width` in the [`columns`](@/api/options.md#columns) option. For an example, see
[Set a dynamic maximum column width](@/guides/columns/column-width/column-width.md#set-a-dynamic-maximum-column-width).

::: details Details: An auto-sized column is no longer capped at the width of the grid
- The 18.1 measurement also followed the size of the root at the moment of measuring, so a grid whose container
  collapsed to a few pixels and came back kept narrow, wrapped columns.
- 19.0 restores the behavior Handsontable had before 16.2.0.

:::

### 5. `height: 'auto'` no longer clips the grid

Setting the [`height`](@/api/options.md#height) option to `'auto'` used to write `height: auto; overflow: clip;` on the
grid's root element, so the grid scrolled inside that root, rendered every row at once, and cut off a dropdown editor on
the last row. It now writes `height: auto` and nothing else. The grid behaves like a plain block element: it grows to
fit its rows, the nearest scrolling ancestor or the page scrolls it, and off-screen rows stay virtualized.

**Affects:** Anyone using `height: 'auto'`, passing a CSS keyword or an unreadable value as
[`width`](@/api/options.md#width) or `height`, or passing a `var()` or container-query-unit `width` with `height` unset
or `'auto'`.

**Do:** Nothing for the common case. To keep an internal vertical scrollbar, set a numeric `height`, or place the grid
in a parent with a fixed height and `overflow: auto`. If you passed an unsupported CSS keyword as `width` or `height`,
use `'auto'` or a length instead (see the details).

To keep an internal vertical scrollbar:

```js
// Before
height: 'auto',

// After
height: 500,
```

::: details Details: height: 'auto' no longer clips the grid
- **A fixed-height parent.** In a parent with a fixed height and `overflow: auto`, a `height: 'auto'` grid fills the
  parent and scrolls inside it:

  ```html
  <div style="height: 500px; overflow: auto;">
    <div id="grid"></div>
  </div>
  ```

  ```js
  new Handsontable(document.querySelector('#grid'), {
    height: 'auto',
    // ...
  });
  ```

- **Fixed `width`.** With `height: 'auto'`, a fixed `width` clips the horizontal axis only: the grid scrolls its columns
  inside that width, and the page scrolls its rows.
- **Other effects.** The [`EmptyDataState`](@/api/emptyDataState.md) and [`StretchColumns`](@/api/stretchColumns.md)
  plugins read where the grid scrolls, so they are affected too. `hot.view.isVerticallyScrollableByWindow()` now
  returns `true` for `height: 'auto'`.
- **Unreadable sizes.** A `width` or `height` the browser cannot read as a size (`'abc'`, `-100`, `true`) is ignored
  with a one-time console warning. It used to be written to the root element as it was. These CSS keywords are ignored
  too:
  - `'inherit'`, `'initial'`, `'unset'`, `'revert'`, `'revert-layer'`, `'none'`, and `'normal'` do not set a size.
  - `'min-content'`, `'max-content'`, `'fit-content'`, and `fit-content()` size the grid to its full content, so it
    cannot scroll inside its box and renders every row or column.
  - `'stretch'`, `'-webkit-fill-available'`, and `'-moz-available'` fill the container but read as a fixed size, so the
    grid would clip the columns past the container with no scrollbar.

  For a grid that fills its container, use `'100%'` or `'auto'`.
- **External widths.** With a free height (`'auto'` or unset), a `width` that resolves against something outside the
  grid, such as `'var(--grid-width)'` or `'50cqw'`, is no longer clipped with `overflow-x: clip` like a fixed width.
  The page now scrolls the columns, as with `'100%'`. To keep the grid scrolling its own columns, give it a fixed
  width, such as a number or a `px` or `em` length. A sized `height` still clips both axes, whatever the width.
- **`width: null`** clears the inline width, as `height: null` clears the height. It used to write `width: nullpx`.
  Each reset restores its own property only, so `height: null` no longer removes a `width` set through the option.

:::

### 6. `rowHeights` sets an exact row height

The [`rowHeights`](@/api/options.md#rowheights) option now sets the exact height of a row. Before, it set a minimum:
a value below the default row height was raised to the default, and a row grew to fit taller content. Now a row renders
at the height you set and clips content that doesn't fit, as in Excel, so rows can be as thin as you want.
[`getRowHeight()`](@/api/core.md#getrowheight) returns the height you set, too.
[`minRowHeights`](@/api/options.md#minrowheights) is no longer an alias of `rowHeights`: it keeps the old minimum
behavior.

**Affects:** Grids that set `rowHeights`, leave [`autoRowSize`](@/api/options.md#autorowsize) off, and have a row with
content taller than that height (multiline text, a
[custom renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md), or custom cell styles): those rows now clip.

**Do:** To keep rows that grow to fit their content, rename the option to `minRowHeights`, or enable
[`autoRowSize`](@/api/autoRowSize.md), where `rowHeights` stays a minimum. To keep the clipping, raise the height to fit
your content, or shorten the content.

Before:

```js
rowHeights: 50,
```

After:

```js
minRowHeights: 50,
```

::: details Details: rowHeights sets an exact row height
| Setting                                           | Before                           | Now                                                   |
| ------------------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| `rowHeights` below the default row height         | The row has the default height   | The row has the height you set                        |
| `rowHeights` below the content's height           | The row grows to fit the content | The row keeps its height and clips the content        |
| `rowHeights` of `0` or `undefined`                | The row has the default height   | The same, or the `minRowHeights` height if you set it |
| `rowHeights` with `autoRowSize` enabled           | A minimum, the row grows to fit  | The same                                              |
| [`minRowHeights`](@/api/options.md#minrowheights) | A minimum, the row grows to fit  | The same                                              |

- Not affected: grids that use `minRowHeights`, enable `autoRowSize`, or have rows that already fit.
- You can set both options: `rowHeights` sets the rows it gives a height, and `minRowHeights` applies to the others.
- A `rowHeights` equal to the default row height is affected too: the first row of a grid without column headers draws
  its top border inside the height you set. It was 1 px taller than the other rows before.
- Clipped content stays in the DOM, and screen readers still read it. Larger text or overridden text spacing no longer
  makes your rows taller, so test with larger text if you set `rowHeights` below your content's height.
- [`ImportFile`](@/api/importFile.md) applies an imported workbook's row heights through `minRowHeights`, so an
  imported row keeps the default row height when the workbook's height is smaller, as before.
- [`ExportFile`](@/api/exportFile.md) writes the heights `getRowHeight()` returns, so a row you set below the default
  exports at that height. It writes a hidden row's height from `rowHeights` or `minRowHeights`, whichever you set.
- [`ManualRowResize`](@/api/manualRowResize.md) is not part of this change. Dragging a row border, or calling
  [`setManualSize()`](@/api/manualRowResize.md#setmanualsize), still doesn't make a row shorter than the default row
  height. With [`manualRowResize`](@/api/options.md#manualrowresize) enabled, a row that a `rowHeights` height covers
  stays at the height the user drags it to and clips its content. A row without a `rowHeights` height grows to fit its
  content, as before.

:::

### 7. <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click on a selected cell moves the highlight

In a grid with the default [`selectionMode`](@/api/options.md#selectionmode) of `multiple`, a
<kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click on a selected cell now depends on where the highlight is. If the cell does
not hold the highlight, the highlight moves to it and every selected cell stays selected. If the cell already holds the
highlight, the cell is deselected (clicking the last remaining cell still clears the selection). Since 16.0.0, the click
always deselected the cell, so the highlight appeared to jump to a cell you clicked earlier.

**Affects:** Apps that rely on one <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + click removing a cell from the selection,
or that count [`afterDeselect`](@/api/hooks.md#afterdeselect) events or read
[`getSelected()`](@/api/core.md#getselected) after such a click.

**Do:** Nothing in most cases. If your own code removed a selection layer in response to such a click, drop that
workaround: the grid no longer removes the layer for you.

::: details Details: Cmd/Ctrl + click on a selected cell moves the highlight
- A click that moves the highlight keeps the layer instead of dropping it, and no longer clears the selection.
- Two clicks on the same cell still deselect it: the first moves the highlight there, the second removes it. Click speed
  makes no difference, so a <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + double-click moves the highlight onto the cell and
  then removes it.
- A grid with `selectionMode` set to `single` or `range` is unaffected, because neither supports more than one selection
  layer.

:::

### 8. A hook set to `null` through `updateSettings()` is removed

In 18.1, a hook you passed in the settings could not be removed: [`updateSettings()`](@/api/core.md#updatesettings)
with the hook set to `null` did nothing, the callback kept running, and [`getSettings()`](@/api/core.md#getsettings)
still returned it. In 19.0, `null` removes every callback that settings passed for that hook, including the callbacks of
an array passed earlier, and `getSettings()` returns `null` for it.

**Affects:** Apps that pass `null` for a hook in `updateSettings()` and expect the earlier callback to keep running, and
apps that use a framework wrapper and set a hook prop to `null` or `undefined`, or stop passing it, for example
`afterChange={isTracking ? logChange : null}` in React.

**Do:** To keep the callback, leave the hook out of the `updateSettings()` call, or pass the callback again. In a
framework wrapper, keep passing the callback in the prop.

```js
const hot = new Handsontable(container, {
  afterChange: logChange,
});

// 18.1: `logChange` keeps running
// 19.0: `logChange` is removed
hot.updateSettings({ afterChange: null });
```

::: details Details: A hook set to null through updateSettings() is removed
- **Angular.** The change applies to a hook that a new `settings` object sets to `null` or `undefined`, or leaves out.
  Keep passing the callback in the `settings` object.
- A listener you added with [`addHook()`](@/api/core.md#addhook) is never removed this way, even when it is the same
  function. `undefined` still leaves the hook as it is.
- In TypeScript, the settings object of `updateSettings()` accepts `null` for every hook. The React `HotTable`
  component's hook props also accept `null`, so code that reads a hook prop back must handle `null`.

:::

### 9. `editor: false` is honored by typed and checkbox columns

Two cases where [`editor: false`](@/api/options.md#editor) had no effect are fixed, so a cell you could edit in 18.1 is
non-editable in 19.0. A column [`type`](@/api/options.md#type) no longer re-enables editing: it still applies its
[`renderer`](@/api/options.md#renderer) and [`validator`](@/api/options.md#validator), but not its
[`editor`](@/api/options.md#editor). A [`checkbox`](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell
with `editor: false` or `editor: null` renders a disabled checkbox that a click or <kbd>**Space**</kbd> cannot toggle
(you can still select the cell).

**Affects:** Grids that set `editor: false` on the grid, on a column, or through [`cells`](@/api/options.md#cells) while
a lower configuration level sets a `type` on the same cells, and grids with a `checkbox` column that users toggle and
`editor: false` or `editor: null` on that column or the grid (typically a non-editable grid with a checkbox column for
selecting rows).

**Do:** To keep a typed column editable under `editor: false`, give the column its own `editor` at the same configuration
level as its `type`: `editor: true` keeps the editor the `type` provides, or name an editor. To keep a checkbox column
toggleable, remove `editor: false` from it, or set `editor: true` or `editor: 'checkbox'` on the column (under a
grid-level `editor: false`, this is the only option).

```js
editor: false,
columns: [
  { type: 'text' },
  // 18.1: editable. 19.0: non-editable, still rendered and validated as numeric.
  { type: 'numeric' },
  // Editable again:
  { type: 'numeric', editor: true },
  { type: 'numeric', editor: 'numeric' },
  // 18.1: toggleable. 19.0: a disabled checkbox. Add editor: true to toggle.
  { data: 'selected', type: 'checkbox' }
]
```

::: details Details: editor: false is honored by typed and checkbox columns
- In 18.1, a `type` set on a column replaced an `editor: false` from a higher configuration level, so the column stayed
  editable, and `editor: false` didn't stop a click or <kbd>**Space**</kbd> from toggling a checkbox.
- The two changes combine: a grid-level `editor: false` now reaches a `checkbox` column, because the column's `type` no
  longer supplies the checkbox editor.
- A custom cell type that declares `editor: false` isn't affected: that is the type's default, so a column with a
  `type` of its own still replaces it, as in 18.1.
- To make a checkbox non-toggleable, prefer [`readOnly`](@/api/options.md#readonly), which also announces the cell as
  read-only to screen readers.

:::

### 10. The list cell types default to a single line

The [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md),
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), and
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cell types, which render a
dropdown arrow, now default [`textEllipsis`](@/api/options.md#textellipsis) to `true`. A value stays on a single line
and truncates with an ellipsis, clear of the arrow (the arrow's space is reserved, see
[the column width change](#autocolumnsize-includes-the-list-cell-arrow-in-the-column-width)). Before, a value in a
narrow column wrapped onto several lines and tangled with the arrow.

**Affects:** Columns with `type: 'autocomplete'`, `'dropdown'`, or `'handsontable'` that relied on the value wrapping
onto multiple lines.

**Do:** To turn wrapping back on, set [`textEllipsis`](@/api/options.md#textellipsis) to `false` on the column, in
[`cells`](@/api/options.md#cells), or with [`setCellMeta()`](@/api/core.md#setcellmeta): the layer that declares the
`type`, or one below it.

Before:

```js
columns: [
  { type: 'autocomplete', source: countries },
],
```

After:

```js
columns: [
  { type: 'autocomplete', source: countries, textEllipsis: false },
],
```

::: details Details: The list cell types default to a single line
- It is a default, not a fixed rule: [`textEllipsis`](@/api/options.md#textellipsis) and
  [`wordWrap`](@/api/options.md#wordwrap) still work.
- A grid-level `textEllipsis: false` does not reach a column that declares the type, because the type's own value
  shadows it.
- The default comes from the cell **type**. A column that only sets `renderer: 'autocomplete'` without the type keeps its
  previous wrapping.
- A value with its own line breaks (a `<br>` or block-level HTML in an [`allowHtml`](@/api/options.md#allowhtml) cell)
  can still render on more than one line.
- [`autoRowSize`](@/api/options.md#autorowsize) measures each row by rendering the real cell. On such a column a long
  value used to wrap and grow the row. It now stays on one line, so those rows size to a single line.

:::

### 11. AutoColumnSize includes the list-cell arrow in the column width

The arrow of an [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md),
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), or
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) cell is now out of flow, and its
width is reserved as trailing padding on the cell. [`AutoColumnSize`](@/api/autoColumnSize.md) renders the real cell
renderer off-DOM, so that padding is part of the measured width and the column grows by the reserved arrow slot. Before,
it measured the text alone, so a long value wrapped the arrow onto a second line.

**Affects:** Grids that leave `autoColumnSize` on (the default) for those columns without pinning them with a column
[`width`](@/api/options.md#width) or [`colWidths`](@/api/options.md#colwidths). Those columns become wider on upgrade.

**Do:** Nothing, if the extra width is acceptable. To keep the previous size on one column, set that column's `width`. To
pin every column, set `colWidths`, which disables AutoColumnSize for the whole grid.

Before:

```js
columns: [
  { type: 'autocomplete', source: countries },
  { type: 'text' },
],
```

After:

```js
columns: [
  { type: 'autocomplete', source: countries, width: 120 },
  { type: 'text' },
],
```

::: details Details: AutoColumnSize includes the list-cell arrow in the column width
- A column you pin with `width` or `colWidths` keeps the width you set.

:::

### 12. Dropdown editor lists are no longer confined to the grid

The lists of the [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md),
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md),
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md), and
[`multiselect`](@/guides/cell-types/multiselect-cell-type/multiselect-cell-type.md) cell types are now positioned against
the viewport instead of inside the grid's root element. With a set `height`, that root used to clip a list opened near
the bottom row, and the editor trimmed it to the rows that fit inside the grid (on a short grid, as few as two
choices). Now every choice that fits on screen is shown.

**Affects:** Every grid with these editors, in particular grids with a set `height` whose last rows carry one of them,
grids inside a parent with a fixed height and `overflow: auto` or `overflow: hidden`, and code or tests that read the
list's position or assert that it opens above the edited cell when the grid has no room below.

**Do:** Nothing for the common case. If the list has to stay inside a specific area, size that area rather than the
grid. Give a transformed container room if you want the whole list visible (see the details).

::: details Details: Dropdown editor lists are no longer confined to the grid
- The list can now paint outside the grid's box. It still belongs to the grid's stacking context, so a host page that
  puts the grid inside its own layer keeps its own chrome on top.
- **Transformed ancestors.** An ancestor with any of these properties becomes the box the list is laid out in, instead
  of the browser window (the grid reads it for you):
  - `transform`, `translate`, `rotate`, or `scale`
  - `perspective`
  - `filter` or `backdrop-filter`
  - `contain` set to `paint`, `layout`, `strict`, or `content`
  - `will-change` naming any of the above

  A centered modal with `transform: translate(-50%, -50%)` is the common case, but `scale: 0.9` and `contain: content`
  do it too. The list is placed and bounded against that element: it cannot leave it, and a taller list is trimmed to
  fit and scrolls. A `container-type` does not do this, so a grid in a container-query layout places its list against
  the browser window.
- **Above or below.** The space left in the **viewport**, not inside the grid, decides whether the list opens above or
  below the cell. A list that used to flip above the cell to fit a short grid now opens downwards and overhangs the
  grid. Sideways placement is unchanged: the grid's own width decides it.
- The list can render more choices than before, since it is no longer trimmed to the space inside the grid.
  [`visibleRows`](@/api/options.md#visiblerows) still caps it.

:::

## Changes in specific features

These changes apply only if you use the feature, option, or API the change names.

| Change | Affects | Do |
| --- | --- | --- |
| [Icons are `<i>` elements](#icons-are-rendered-as-i-elements) | Custom icon CSS, custom themes, and DOM tests | Target `.ht-icon-<name>`, or override `--ht-icon-<name>` |
| [`colToProp()` and `propToCol()` return `null`](#coltoprop-and-proptocol-return-null-for-an-unknown-column) | Code that uses the result as an index without a check | Check the result for `null` |
| [`setValue()` receives the cell value](#a-custom-editors-setvalue-receives-the-cell-value) | Custom editors, and React and Angular editor components | Convert the value to a string yourself |
| [Vue 3 `handsontable` and `getValue` props reach the grid](#the-vue-3-wrapper-props-are-type-checked) | Vue 3 apps that pass `handsontable` or `getValue` to `HotTable` or `HotColumn` | Check the applied value, or remove the prop |
| [Sizes follow their column or row](#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index) | Array or function `colWidths`, `rowHeights`, or `minRowHeights` with moved, sorted, filtered, trimmed, collapsed, inserted, or removed columns or rows | List sizes in data order; remove sync workarounds |
| [Plugin settings apply before the first render](#plugins-apply-their-settings-before-the-first-render) | Hooks such as `afterColumnSort` that read the drawn grid while it builds | Read the grid in `afterInit` |
| [A validated change stays on its record](#a-change-that-waits-for-its-validator-stays-on-its-record) | Validated cells whose rows move while the validator runs; typed `afterChange` listeners | Handle a `null` row; use `AppliedCellChange` |
| [`loadData()` drops a pending change](#loaddata-drops-a-change-that-waits-for-its-validator) | `loadData()` during an edit or right after `setDataAtCell()`, on validated cells | Load after `afterChange`, or use `updateData()` |
| [XLSX export without ExcelJS](#xlsx-export-no-longer-needs-exceljs) | Apps that set `exportFile` or export to XLSX | Nothing to keep exporting; check the file changes |
| [`updateSettings()` keeps server-backed rows](#updatesettings-keeps-the-rows-of-a-server-backed-grid) | `dataProvider` grids | Reload with `fetchData()` |
| [`rowId` reads dotted property names](#a-string-dataproviderrowid-reads-a-property-with-a-dot-in-its-name) | `dataProvider` rows with dots in property names | Use a function `rowId` |
| [Key/value `source` cells store objects](#a-plain-value-written-into-a-keyvalue-source-cell-resolves-to-the-matching-object) | `autocomplete` and `dropdown` columns with a `{ key, value }` `source` | Read `.value` when the value matches an option |
| [`dropdown` with `strict: false` validates](#a-dropdown-column-with-strict-false-validates-strictly) | `dropdown` columns with `strict: false` | Switch to `autocomplete` with `strict: false` |
| [`date` cells in formulas](#date-cells-reach-the-formula-engine-the-same-way-on-every-data-path) | `Formulas` with `date` columns holding non-ISO values, or a `cells()` function or meta hook with side effects | Use `numeric` columns for numbers; make `cells()` and the meta hooks free of side effects |
| [`afterRender` engine writes loop](#an-afterrender-hook-that-writes-to-the-engine-loops) | `Formulas` apps that write to the engine from `afterRender` | Write only when the value differs |
| [`SHEET()` keeps a sheet's number](#sheet-keeps-a-sheets-number-after-an-earlier-sheet-is-removed) | `Formulas` apps that remove sheets and read `SHEET()` as a position | Count positions yourself |
| [Frozen columns can be dragged](#frozen-columns-can-be-dragged-and-the-unfreeze-hooks-get-a-target) | `manualColumnFreeze` with `manualColumnMove`, and freeze hook listeners | Guard the move in `beforeColumnMove` |
| [Theme-based minimum column width](#the-narrowest-column-width-depends-on-the-theme) | `dropdownMenu` with column resizing | Update expected minimum widths |
| [Menu borders use a theme color](#a-border-added-from-the-context-menu-takes-its-color-from-the-theme) | `customBorders` with the context menu | Read `color` as a CSS value |
| [`maxLength` is built in](#maxlength-is-a-built-in-cell-option) | Cell settings with your own `maxLength` key | Rename your key, or use the built-in option |
| [Removing a parent removes all descendants](#removing-a-parent-row-removes-every-row-below-it) | `NestedRows` with three or more levels | Read the rows from the hook argument |
| [<kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + arrows on row headers](#cmdctrl--arrow-keys-on-a-row-header-expand-and-collapse-row-groups) | `NestedRows` with `navigableHeaders` | Update your shortcut docs |
| [Arrow off a merged cell lands on its top row](#leaving-a-merged-cell-with-a-left-or-right-arrow-lands-on-its-top-row) | `mergeCells` with keyboard navigation | Nothing, unless your code compensates |
| [Dragged rows land after hidden rows](#a-row-dragged-into-a-gap-with-hidden-rows-lands-after-them) | `manualRowMove` with `hiddenRows` | Check `orderChanged` in move hooks |
| [`numeric` cells align by type](#a-numeric-cell-aligns-itself-by-its-type-not-by-its-value) | `numeric` cells that can hold non-numbers | Check the value, not the class name |
| [`loading: false` turns `Dialog` off](#turning-loading-off-turns-the-dialog-plugin-off) | `Dialog` used after `loading` is turned off, without `dialog: true` | Set `dialog: true` |
| [Changing `dataSchema` resets state](#changing-dataschema-resets-the-grids-index-state) | `updateSettings()` that changes `dataSchema` without `columns` | Save the state and apply it again |
| [Non-`null` `dataSchema` values create columns](#a-dataschema-with-non-null-values-creates-a-column-for-each-value) | `dataSchema` with non-`null` values and no `columns` | Set `columns`, or use `null` values |
| [`colWidths: null` acts like `undefined`](#colwidths-null-sizes-columns-like-undefined) | `colWidths` or `width` set to `null` | Set `colWidths: 50` for the old width |
| [Row elements move on scroll](#row-elements-move-with-their-rows-on-a-vertical-scroll) | Code that holds `tr` or `td` references or observes `tbody` | Read rows through `getCell()` |
| [`getCopyableData()` returns a string](#getcopyabledata-returns-a-string) | Code that reads the stored value from it | Use `getDataAtCell()` |
| [Clipboard shortcuts in the `grid` context](#the-copy-cut-and-paste-shortcuts-are-registered-in-the-grid-context) | Code that reads or removes the copy, cut, or paste shortcut | Remove your shortcut by group |
| [`checked` is reserved in menu items](#checked-is-a-reserved-context-menu-item-property) | Custom menu items with a `checked` property, and themes without icons (`-no-icons` bundles) | Rename your property; give the mark icons a mask on a theme without icons |
| [HTML output and the sanitizer](#html-output-changes-for-trustedhtml-paste-tohtml-headers-and-character-references) | `TrustedHTML` sanitizers, `toHTML()` header markup, and named character references | Check `TrustedHTML` paste, `toHTML()` header markup, and named character references |
| [`removeCellMeta()` accepts any index](#removecellmeta-accepts-an-index-past-the-grids-range) | Code that relies on the out-of-range error | Guard the index yourself |
| [`AutoRowSize` settings drop `useHeaders`](#the-autorowsize-plugins-settings-no-longer-include-useheaders) | Code that reads `useHeaders` from the `AutoRowSize` settings | Remove the read |

### 1. Icons are rendered as `<i>` elements

Every built-in icon used to be a CSS `::before` or `::after` pseudo-element, generated from an `iconsMap` stylesheet.
In 19.0, it is a real DOM element, `<i class="ht-icon ht-icon-<name>" aria-hidden="true"></i>`, inserted into the cell,
header, or menu item it belongs to. The glyph still comes from a `--ht-icon-<name>` CSS variable, applied by an
unscoped `.ht-icon-<name>` rule.

**Affects:** Apps that style a built-in icon through a `::before` or `::after` selector (such as `.changeType::before`
or `.ht-page-next::before`), tests that assert the DOM structure of a cell, header, or menu item that holds an icon,
and stylesheets or scripts with a bare `i` selector. Three cases fail silently:

- A `-no-icons` theme bundle draws `checkbox` cells and the Filters value list with no tick.
- A Theme API icon path with no file extension (such as `icons/check`) paints nothing.
- An `afterGetColHeader` or `afterGetRowHeader` hook that rewrites `TH.innerHTML` removes the hidden-column and
  hidden-row carets.

**Do:**

1. Replace each pseudo-element selector with the matching `.ht-icon-<name>` class (see the table in the details), or
   override `--ht-icon-<name>` to change only the glyph. Both are documented in
   [Icons](@/guides/styling/themes/themes.md#icons) in the Themes guide.
2. Use the selector form that matches where the icon sits: a descendant selector for a child of the old element (as in
   `.changeType .ht-icon-menu`), `~` for the sort arrow (`.columnSorting.sortAction ~ .ht-icon`), and `+` for the
   checkbox, radio, and multi-select editor ticks (`.htCheckboxRendererInput + .ht-icon`). An input can't hold children,
   so `.htCheckboxRendererInput .ht-icon` never matches.
3. Scope your own bare `i` selectors, such as `td i` or `td.querySelector('i')`, and your `:first-child` or
   index-based child selectors. Icons are inserted into cells and headers, in some renderers **before** the existing
   content, so these can now resolve to a Handsontable icon. Exclude icons with `:not(.ht-icon)`.

Before:

```css
.changeType::before { background-color: blue; }
td i { color: red; }
```

After, target the icon element, and exclude icons from your own `i` rules:

```css
.changeType .ht-icon-menu { background-color: blue; }
td i:not(.ht-icon) { color: red; }
```

To change only the glyph and keep the built-in color and mask behavior, override the variable:

```css
.ht-theme-main .changeType .ht-icon-menu { --ht-icon-menu: url("/icons/menu.svg"); }
```

::: details Details: Icons are rendered as &lt;i&gt; elements
- **Selector mapping.** The table lists every selector the old `iconsMap` stylesheet generated. A `[dir="rtl"]`-prefixed
  selector used to point at a different, mirrored icon. The single new class mirrors itself when the grid's
  `layoutDirection` is RTL.

  | Old selector | New selector |
  | --- | --- |
  | `.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after`, `.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after`, `.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after` | `.ht-icon-arrow-right` |
  | `.ht-page-size-section__select-wrapper::after` | `.ht-icon-arrow-down` |
  | `.changeType::before` | `.ht-icon-menu` |
  | `.htUISelectCaption::after`, `.htAutocompleteArrow::after` | `.ht-icon-select-arrow` |
  | `.columnSorting.sortAction.ascending::before` | `.ht-icon-arrow-narrow-up` |
  | `.columnSorting.sortAction.descending::before` | `.ht-icon-arrow-narrow-down` |
  | `.ht-page-navigation-section .ht-page-first::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-left-with-bar` |
  | `.ht-page-navigation-section .ht-page-prev::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-left` |
  | `.ht-page-navigation-section .ht-page-next::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-right` |
  | `.ht-page-navigation-section .ht-page-last::before` (and its `[dir="rtl"]` pair) | `.ht-icon-arrow-right-with-bar` |
  | `.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after`, `.htContextMenu table tbody tr td .htItemWrapper span.selected::after`, `.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after` | `.ht-icon-check` |
  | `.htCheckboxRendererInput::after` | `.ht-icon-checkbox` |
  | `th.beforeHiddenColumn::after` | `.ht-icon-caret-hidden-left` |
  | `th.afterHiddenColumn::before` | `.ht-icon-caret-hidden-right` |
  | `th.beforeHiddenRow::after` | `.ht-icon-caret-hidden-up` |
  | `th.afterHiddenRow::before` | `.ht-icon-caret-hidden-down` |
  | `.collapsibleIndicator::before`, `.ht_nestingButton::before` | `.ht-icon-collapse-off` |
  | `.collapsibleIndicator.collapsed::before`, `.ht_nestingButton.ht_nestingExpand::before` | `.ht-icon-collapse-on` |
  | `.htUIRadio > input[type="radio"]::after` | `.ht-icon-radio` |
  | `.ht-multi-select-chip-remove::before` | `.ht-icon-chip-close` |
  | `.ht-notification__close::before` | `.ht-icon-chip-close` |
  | `.ht-multi-select-editor-item-selected input::after` | `.ht-icon-checkbox` |
  | `.ht-multi-select-editor-search-icon` (a class on the search icon's own element, not a pseudo-element; kept on the new element as a legacy class) | `.ht-icon-search` |

  The sheets bar and the mixed-state menu mark are new in 19.0, so no 18.1 selector exists for them. Their icons use
  `.ht-icon-plus` (add sheet), `.ht-icon-menu-list` (all sheets), `.ht-icon-select-arrow` (tab chevron),
  `.ht-icon-arrow-left` and `.ht-icon-arrow-right` (tab paging), `.ht-icon-check` (the selected sheet), and
  `.ht-icon-collapse-off` (a mixed-state menu item).
- **Multi-select editor search icon.** In 18.1, `.ht-multi-select-editor-search-icon` was a `<div>`. It is now an
  `<i class="ht-icon ht-icon-search">` that keeps the class as a legacy hook, so a selector that names `div` no longer
  matches. Override `--ht-icon-search` to change the glyph.
- **Hand-built markup that reuses `htUIRadio` or `htCheckboxRendererInput`.** These inputs got their glyph from a
  pseudo-element. Now Handsontable's own components insert a sibling `<i class="ht-icon ht-icon-<name>">`. A custom
  renderer that copies the classes renders the input with no glyph, with no error or warning. Add the icon element
  immediately after the input.
- **`checkbox` cell structure.** `span.htCheckboxRendererBox > input.htCheckboxRendererInput + i.ht-icon.ht-icon-checkbox`.
  The wrapper takes the place of the bare input, so the cell has the same number of children as in 18.1, and
  `td.querySelector('input')` and `input + .ht-icon` selectors still match. Use `querySelector('input')` instead of the
  first child. If a custom renderer hides the input, hide the wrapper too (or the icon, through
  `.htCheckboxRendererInput + .ht-icon`), or the tick stays visible.
- **Multi-select editor option list.** The gap between a checkbox and its label is now one `--ht-gap-size` on the
  label's inline-start side, in both LTR and RTL. In 18.1, the list set a physical left padding, so an RTL list had no
  gap. This matters when you compare screenshots.
- **Filters condition dropdown caption.** `.htUISelectCaption` used to hold its text directly. It now holds a
  `<span class="htUISelectCaptionLabel">` with the text, then the caret icon element. Read `.htUISelectCaptionLabel` to
  get the label alone. Code that assumes the caption has no child elements, or reads its first text node, must target
  `.htUISelectCaptionLabel` instead. `textContent` still returns only the text for a built-in mask glyph. An icon mapped
  to a ligature font, or a renderer callback that writes text, adds its characters.
- **Theme API `icons` string values.** In 18.1, every string was a glyph, wrapped in `url(...)`. In 19.0, a string can
  also be a class list for an icon font. Markup, `data:`, `http(s):`, and `blob:` URLs, absolute and `./` or `../`
  paths, `url(...)`, and a file name with an image extension (a query string or fragment included, such as
  `icons/check.svg?v=2`) are still glyphs. A relative path with no file extension, such as `icons/check`, is now a
  class list and paints nothing. Start it with `./` or wrap it in `url(...)`. See
  [How a string value is read](@/guides/styling/themes/themes.md#how-a-string-value-is-read).
- **`iconsMap` is deprecated**, and 20.0.0 removes it. The pseudo-element selectors it generated no longer
  exist. Until removal, importing it from `handsontable/themes/static/variables/helpers/iconsMap` logs a one-time
  warning and returns the `iconStyles()` output: the `--ht-icon-*` variables and the `.ht-icon-<name>` rules. Switch to
  `iconStyles(icons, scopeSelector)` from `handsontable/themes/static/variables/helpers/iconStyles`. It takes a full
  scope selector (such as `.ht-theme-main`) instead of a theme class prefix.
- **RTL.** Mirrored icons (pagination and sheets bar arrows, the submenu arrow) now follow the grid's own
  `layoutDirection`. Before, the pagination arrows followed any `dir="rtl"` ancestor through the `[dir="rtl"]` prefix,
  so an LTR grid on an RTL page mirrored them (a defect). The RTL submenu arrow used to flip with `rotate(180deg)`,
  which also flipped it vertically. It now mirrors with `scaleX(-1)`, so it sits about 0.5px higher. The RTL pagination
  arrows used to swap to the opposite glyph. They now mirror the same glyph with `scaleX(-1)`, which can move them by a
  fraction of a pixel. No Filters arrow is mirrored. The hidden-column carets still turn with `rotate(180deg)`.
- **Header hooks that rewrite `TH.innerHTML`.** The hidden-column and hidden-row carets are now children of the header
  cell, and an `afterGetColHeader` or `afterGetRowHeader` hook runs after the plugin's, so rewriting the whole cell
  removes the carets. The `beforeHiddenColumn`/`afterHiddenColumn` (and `beforeHiddenRow`/`afterHiddenRow`) classes stay
  on the cell. Write into the header's `.colHeader` label to keep the carets.
- **`-no-icons` theme bundles.**
  - `checkbox` cells used to fall back to a native checkbox. They now render the theme's styled box with no tick,
    because `appearance: none` moved into the base stylesheet. The Filters "Filter by value" list changes the same way.
    Load the matching icon file to get the tick back: `ht-icons-main.css` for the main and classic themes,
    `ht-icons-horizon.css` for horizon.
  - Pagination and sheets bar buttons now hold an empty `.ht-icon` element, which the base `.ht-icon` rule in
    `handsontable.css` sizes to `--ht-icon-size` (16px by default). An icon-less button keeps its size with icons,
    instead of collapsing to its padding, as the pagination buttons did in 18.1.
- **TypeScript (type-level breaking change).** A value in `getThemeConfig().icons` is now typed `string | IconRenderer`
  (a renderer callback is a valid value), so code that passes it where a `string` is expected stops compiling. Narrow
  it with `typeof value === 'string'` first. `IconKey` also gained `chipClose`, `search`, `plus`, and `menuList`, so an
  exhaustive `switch` over `IconKey` needs four more cases.

:::

### 2. `colToProp()` and `propToCol()` return `null` for an unknown column

[`colToProp()`](@/api/core.md#coltoprop) and [`propToCol()`](@/api/core.md#proptocol) used to hand your argument
straight back when it named no column. They now return `null`, matching
[`toVisualColumn()`](@/api/core.md#tovisualcolumn) and the other index translators. The old result could not be told
apart from a real answer, so code that used it as an index read or wrote the wrong cell, with nothing to signal it.

**Affects:** Apps that call either method and use the result without checking it. You are not affected if you only pass
indexes you know are in range.

**Do:** Check the result before using it. Use `Number.isInteger()` for `propToCol()`, not a comparison against
[`countCols()`](@/api/core.md#countcols): `null` compares as `0`, so a `column < countCols()` test lets it through as if
it were the first column. Give a [`modifyData`](@/api/hooks.md#modifydata) callback a `null` check too: its second
argument is now `null` instead of the index when a numeric property names no column.

```js
// Before
hot.colToProp(999); // 999
hot.propToCol(999); // 999

// 19.0 and later
hot.colToProp(999); // null
hot.propToCol(999); // null
```

Check the result of `propToCol()` before you use it:

```js
const column = hot.propToCol(prop);

if (Number.isInteger(column)) {
  hot.selectCell(0, column);
}
```

Check the result of `colToProp()` before you use it:

```js
const prop = hot.colToProp(column);

if (prop !== null) {
  hot.setDataAtRowProp(0, prop, 'new value');
}
```

::: details Details: colToProp() and propToCol() return null for an unknown column
- **What returns `null`.** An index past the last column or a negative index (the argument came back before), and
  `propToCol()` for a trimmed column (the physical index came back). A property name your data does not use is still
  handed back unchanged, because only indexes resolve. The old result was ambiguous: on an array-of-arrays grid,
  `propToCol(3)` returning `3` might mean "column 3" or "no such column", and where the visual and physical column order
  had diverged, it named a different column than you asked about.
- **TypeScript.** Both declarations widened, so under `strictNullChecks`, `const col: number = hot.propToCol(prop)`
  stops compiling. Narrow it once with `if (column !== null)`.

  ```ts
  // Before
  propToCol(prop: string | number): number;
  colToProp(column: number): string | number;

  // 19.0 and later
  propToCol(prop: string | number): number | null;
  colToProp(column: number): string | number | null;
  ```

- **`getDataAtProp()`.** [`getDataAtProp()`](@/api/core.md#getdataatprop) built a column range from the resolved
  property. When a numeric property named no column, the range collapsed to column `0`: `hot.getDataAtProp(99)` on a
  grid with three columns and 100 rows returned 100 `null` entries. It now returns `[]`. A property name your data does
  not use is unaffected.
- **`modifyData`.** A property name your data does not use still arrives unchanged. Handle `null` in the callback. The
  TypeScript declaration widened, so a callback that annotates `column` as `number` stops compiling.

  ```js
  modifyData(row, column, valueHolder, ioMode) {
    if (column === null) {
      return; // no such column
    }
  }
  ```

  ```ts
  // Before
  modifyData?: (row: number, column: number, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;

  // 19.0 and later
  modifyData?: (row: number, column: number | null, valueHolder: { value: CellValue }, ioMode: 'get' | 'set') => void;
  ```

- **Unchanged.**
  - `afterSelectionByProp` and `afterSelectionEndByProp` still report `-1` for a selection that starts in the headers
    (a row selection, a column selection, or select-all): it is a selection sentinel.
  - `beforeChange` and `afterChange` still report an index that names no column in the changes array.
  - `beforeValidate`, `afterValidate`, `postAfterValidate`, and the `prop` on the cell properties every cell function
    receives still report the index for a cell whose column does not exist yet, because auto column growth resolves the
    meta before it creates the column.
  - [`setDataAtCell()`](@/api/core.md#setdataatcell) past the last column still creates the missing columns when your
    data is an array of arrays with no `columns` setting. [`getDataAtCell()`](@/api/core.md#getdataatcell) and the
    copyable-data getters read an out-of-range index as before. Undo and redo still replay a change that created a
    column.

:::

### 3. A custom editor's `setValue()` receives the cell value

In 18.1, [`beginEditing()`](@/guides/cell-functions/cell-editor/cell-editor.md#common-methods) turned the cell value
into a string before it called `setValue()`. An array such as `[[1, 2], [3, 4]]` arrived as `"1,2,3,4"`, an object
arrived as `"[object Object]"`, and a number arrived as a string of digits. In 19.0, `setValue()` receives the cell
value after the value getter.

**Affects:** Editors whose `setValue()` treats its argument as a string: editors that extend `BaseEditor` directly, are
built with `editorFactory`, or extend `TextEditor` and override `setValue()` without calling `super.setValue()` (which
stringifies for you). React editors built with `useHotEditor` or `EditorComponent`, and Angular editors that extend
`HotCellEditorComponent`, get the raw value (a number, an object, or `null`) even without your own `setValue()`.

**Do:** Turn the value into a string yourself when the editor needs one. A factory editor does the same inside the
`setValue` function you pass to `editorFactory`. See the
[cell editor guide](@/guides/cell-functions/cell-editor/cell-editor.md).

```js
import Handsontable from 'handsontable/base';

class MyEditor extends Handsontable.editors.BaseEditor {
  setValue(value) {
    // 18.1: this.input.value = value;
    this.input.value = value == null ? '' : String(value);
  }

  getValue() {
    return this.input.value;
  }
}
```

::: details Details: A custom editor's setValue() receives the cell value
- **React.** `<input value={value}>` warns on an empty cell, because `value` is `null`. Pass
  `value == null ? '' : String(value)` to the input.
- The built-in text editors still show a string. `TextEditor` and the editors that extend it stringify inside
  `setValue()`: `autocomplete`, `dropdown`, `numeric`, `date`, `time`, `password`, `handsontable`, and the intl date,
  time, and datetime editors. [`SelectEditor`](@/guides/cell-functions/cell-editor/cell-editor.md) still converts its
  argument to a string. The checkbox editor and the multiselect editor ignore the value passed to `setValue()`.
- A factory editor that does not define `setValue` stores the cell value and returns it from `getValue()`. The rating
  recipe is one. Confirming that editor without a change writes nothing, as
  [Confirming an editor without typing writes nothing](#confirming-an-editor-without-typing-writes-nothing) describes
  for every grid.
- `handsontable/base` leaves `Handsontable.helper` empty, so `Handsontable.helper.stringify` throws there.
  `value == null ? '' : String(value)` works in that build and in a script-tag project.

:::

### 4. `colWidths`, `rowHeights`, and `minRowHeights` address columns and rows by physical index

The array and function forms of [`colWidths`](@/api/options.md#colwidths), [`rowHeights`](@/api/options.md#rowheights),
and [`minRowHeights`](@/api/options.md#minrowheights) now use the physical index. In 18.1, they used the visual index,
so a size stayed at its screen position: when the user moved a column, or when a row was collapsed, filtered, trimmed,
sorted, or moved, the size went to whichever column or row took that position. In 19.0, a size moves with its column or
row.

**Affects:** Apps that set one of these options to an array or a function and also move, sort, filter, trim,
collapse, insert, or remove columns or rows. A number or a string value applies one size to everything, so it is not
affected. If nothing is moved, sorted, filtered, trimmed, collapsed, inserted, or removed, nothing changes, because the
visual and physical indexes match.

**Do:**

1. List the sizes in the order of the columns or rows in your `data` (or [`columns`](@/api/options.md#columns)), not
   the order you expect on the screen.
2. Remove code that works around the old behavior, because it now applies the order twice: a hook that rebuilds the
   array, or code that keeps the array in step with [`alter()`](@/api/core.md#alter) yourself. To declare the sizes
   again, pass a new array instead.
3. Check function forms. They now receive a physical index, so a function that reads it as a screen position, or looks
   the column or row up through a visual-index API such as `hot.getColHeader(index)` or `hot.getDataAtRow(index)`, sizes
   another column or row, with no error. Use [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) to read a row
   by its physical index.
4. To keep the 18.1 behavior, where a size belongs to a screen position, translate the physical index to the visual one
   in the function:

   ```js
   const widthsByPosition = [100, 120, 60];
   // the physical index of the column at each visual position, for example a saved column order
   const initialOrder = [0, 1, 2];
   let hot;

   hot = new Handsontable(container, {
     manualColumnMove: initialOrder,
     colWidths(physicalColumnIndex) {
       // while the constructor runs, `hot` isn't assigned yet and the columns are in their initial order
       const visualColumnIndex = hot ?
         hot.toVisualColumn(physicalColumnIndex) : initialOrder.indexOf(physicalColumnIndex);

       return widthsByPosition[visualColumnIndex];
     },
   });
   ```

For rows, see the details.

::: details Details: colWidths, rowHeights, and minRowHeights address columns and rows by physical index
- **Rows, keep the 18.1 behavior:**

  ```js
  const heightsByPosition = [100, 50, 50, 70];
  // the physical index of the row at each visual position, for example a saved row order
  const initialOrder = [0, 1, 2, 3];
  let hot;

  hot = new Handsontable(container, {
    manualRowMove: initialOrder,
    rowHeights(physicalRowIndex) {
      // while the constructor runs, `hot` isn't assigned yet and the rows are in their initial order
      const visualRowIndex = hot ?
        hot.toVisualRow(physicalRowIndex) : initialOrder.indexOf(physicalRowIndex);

      return heightsByPosition[visualRowIndex];
    },
  });
  ```

- **Workarounds to remove.** Hooks that rebuild the array: [`afterColumnMove`](@/api/hooks.md#aftercolumnmove) for
  `colWidths`; [`afterColumnSort`](@/api/hooks.md#aftercolumnsort), [`afterFilter`](@/api/hooks.md#afterfilter),
  [`afterRowMove`](@/api/hooks.md#afterrowmove), or [`afterRowCollapse`](@/api/hooks.md#afterrowcollapse) for the row
  options. Code that splices the array after an insert, such as `colWidths.splice(1, 0, 80)` or
  `rowHeights.splice(1, 0, 40)`, then passes the same array to `updateSettings()`.
- **Columns, example.** With `data: [['Ted', 'Right', 31]]`, `colHeaders: ['First name', 'Last name', 'Age']`,
  `manualColumnMove: true`, and `colWidths: [100, 120, 60]`, the user moves `Age` to the first position. In 18.1, `Age`
  is 100px wide, because the first position keeps the first width. In 19.0, it is 60px wide, because the width belongs
  to the `Age` column.
- **Rows, example.** With `nestedRows: true`, the data `[{ name: 'Engineering', __children: [{ name: 'Ana García' },
  { name: 'Li Wei' }] }, { name: 'Marketing' }]`, and `rowHeights: [100, 50, 50, 70]`, the user collapses
  `Engineering`. In 18.1, `Marketing` is 50px tall, because the second position keeps the second height. In 19.0, it is
  70px tall, because the height belongs to the `Marketing` row.
- **Function form.** Handsontable calls it with the physical index, for example
  `colWidths(physicalColumnIndex) { return physicalColumnIndex * 10; }` or
  `rowHeights(physicalRowIndex) { return physicalRowIndex * 10; }`.
- **Physical indexes.** The physical index of a column doesn't change when the user moves or hides columns. The
  physical index of a row doesn't change when rows are moved with [`ManualRowMove`](@/api/manualRowMove.md), sorted,
  filtered, trimmed, or collapsed. A row that [`NestedRows`](@/api/nestedRows.md) moves by dragging or detaching takes
  a new physical index: an array entry follows the row, but a function is called with the new index.
- **The array is never changed.** Handsontable never changes the array you pass.
  [`getSettings()`](@/api/core.md#getsettings) returns the `colWidths` array you passed, and
  [`updateSettings()`](@/api/core.md#updatesettings) applies a new `colWidths` array to the columns as they are.
  Handsontable tracks which entry belongs to which column or row, so an entry you change in your own array applies to
  the column or row it belongs to.
- **Insert and remove.** When you insert or remove columns or rows with [`alter()`](@/api/core.md#alter) (or with the
  `NestedRows` plugin, for rows), each size stays with its column or row. A column or row inserted between others takes
  the default size. One added after the last takes the next entry of the array. A column inserted after a column the
  user moved to the end takes the default too. In 18.1, an inserted column or row took the size listed for its position
  and every size after it moved one over. Undo and redo put the sizes back, the size of a removed column or row
  included.
- **Undo history.** Switching one of these options to or from an array, or passing a new array, clears the undo
  history, the way enabling a plugin does, because the earlier steps hold the columns or rows of the previous array.
- **`loadData()` and `updateData()`.**
  - [`loadData()`](@/api/core.md#loaddata) with data the grid hasn't shown, a copy of the current data included,
    declares the array again, so it applies from the first column or row.
  - `loadData()` with the array the grid already shows, and [`updateData()`](@/api/core.md#updatedata) (which a new
    `data` passed to `updateSettings()` also uses), keep each size on its column or row. A column they add after the
    last one takes the next `colWidths` entry.
  - A data array the grid showed earlier, with as many columns or rows, gets back the alignment it had when the grid
    left it, so the sizes stay on columns or rows you inserted or removed there. The sheets bar relies on this when it
    shows a sheet again. Only the last array you replaced while the same data was shown is kept.
  - If you change the columns or rows of such an array while the grid shows other data, pass a new `colWidths`,
    `rowHeights`, or `minRowHeights` array before you load it, so the sizes apply from the first column or row. To
    declare the sizes again after loading data with more rows, pass a new array to `updateSettings()`.
- **Hooks and methods keep visual indexes.** The [`modifyColWidth`](@/api/hooks.md#modifycolwidth) hook,
  [`getColWidth()`](@/api/core.md#getcolwidth), the [`modifyRowHeight`](@/api/hooks.md#modifyrowheight) hook, and
  [`getRowHeight()`](@/api/core.md#getrowheight) still take visual indexes.
- **Columns: related features.** The widths now follow the columns when you enable
  [`manualColumnMove`](@/api/options.md#manualcolumnmove), call [`moveColumn()`](@/api/columnMoving.md#movecolumn),
  load a saved column order, or move a column with [`freezeColumn()`](@/api/manualColumnFreeze.md#freezecolumn) or
  [`unfreezeColumn()`](@/api/manualColumnFreeze.md#unfreezecolumn). The [`exportFile`](@/api/exportFile.md) plugin and
  [`autoColumnSize`](@/api/autoColumnSize.md) read `colWidths` the same way. To fix the width of a single column
  regardless of order, you can also set `width` in the `columns` option.
- **Rows: related features.** The heights now follow the rows when you collapse rows with
  [`NestedRows`](@/api/nestedRows.md), filter with [`Filters`](@/api/filters.md), trim with
  [`TrimRows`](@/api/trimRows.md), sort with [`ColumnSorting`](@/api/columnSorting.md) or
  [`MultiColumnSorting`](@/api/multiColumnSorting.md), move rows with [`ManualRowMove`](@/api/manualRowMove.md), or
  load a saved row order.
- **User resizing is unaffected.** [`ManualColumnResize`](@/api/manualColumnResize.md) and
  [`ManualRowResize`](@/api/manualRowResize.md) already store sizes by physical index.
- **Wrappers.** In the React, Angular, and Vue wrappers, get the instance from the component instead of a variable:
  `hotRef.current?.hotInstance` in React, the `hotInstance` property of the `HotTableComponent` in Angular, and
  `hotTable.value?.hotInstance` in Vue. The callback gets no `this`.

:::

### 5. Plugins apply their settings before the first render

In 18.1, several plugins applied the settings the grid was built with after its first render, then rendered the grid
again. In 19.0, they apply them before the [`init`](@/api/hooks.md#init) hook and before the first render. The first
render already shows the result, and the grid renders once (twice when [`customBorders`](@/api/options.md#customborders)
declares borders). The hooks this work fires run earlier too, so they run before the grid is drawn:
[`getCell()`](@/api/core.md#getcell) returns `null` inside them, and the merges' and summaries' `afterChange` calls come
before the `afterChange` call of the initial data load.

**Affects:** Apps with a listener on one of these hooks (`afterColumnSort` for an `initialConfig` sort,
`afterMergeCells`, `afterChange` for the merges and the summaries, `afterEmptyDataStateShow`, and
`beforeDataProviderFetch`) that reads the rendered grid when the grid is built (for example with `getCell()`), that
relies on these hooks running after `init` or on the order of the `afterChange` calls,
that calls `enablePlugin()` on a drawn grid without expecting the plugin's settings to apply, or that reads the
summaries in an `afterUpdateSettings` listener of the same call that writes them.

**Do:** Read the rendered grid in [`afterInit`](@/api/hooks.md#afterinit), which runs after the first render, and skip
the work in the hook when `getCell()` returns `null`. Read new summaries after `updateSettings()` returns, or in an
[`afterRender`](@/api/hooks.md#afterrender) hook.

Before:

```js
const hot = new Handsontable(container, {
  columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
  afterColumnSort() {
    markFirstRow(this.getCell(0, 0));
  },
});
```

After:

```js
const hot = new Handsontable(container, {
  columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } },
  afterColumnSort() {
    const cell = this.getCell(0, 0);

    if (cell) {
      markFirstRow(cell);
    }
  },
  afterInit() {
    markFirstRow(this.getCell(0, 0));
  },
});
```

::: details Details: Plugins apply their settings before the first render
- **Hooks that run earlier:**
  - [`afterColumnSort`](@/api/hooks.md#aftercolumnsort), for the `initialConfig` sort of
    [`columnSorting`](@/api/options.md#columnsorting) or `multiColumnSorting`.
  - [`afterMergeCells`](@/api/hooks.md#aftermergecells) and the merges' `afterChange` call, for
    [`mergeCells`](@/api/options.md#mergecells).
  - The summaries' `afterChange` call, for [`columnSummary`](@/api/options.md#columnsummary).
  - [`afterEmptyDataStateShow`](@/api/hooks.md#afteremptydatastateshow), for
    [`emptyDataState`](@/api/options.md#emptydatastate).
  - [`beforeDataProviderFetch`](@/api/hooks.md#beforedataproviderfetch) and the first `fetchRows` call, for
    [`dataProvider`](@/api/options.md#dataprovider).
- `enablePlugin()` of one of these plugins, called on a grid that is already drawn, now applies the plugin's settings.
  For `dataProvider`, it fetches the data from the server.
- An `updateSettings()` call that changes `columnSummary` writes the summaries after its
  [`afterUpdateSettings`](@/api/hooks.md#afterupdatesettings) listeners. A listener there reads the previous summaries
  and, when the call also passes `columns`, a summary cell that is not read-only yet. The grid draws the new summaries.

:::

### 6. A change that waits for its validator stays on its record

A change to a cell with a [`validator`](@/api/options.md#validator) is written into the data only after the validator
answers, and validators always answer after the call that made the change returns (see
[`loadData()` drops a change that waits for its validator](#loaddata-drops-a-change-that-waits-for-its-validator)).
In 18.1, the change was written at the visual row it was made at. A sort, a row move, a filter, a trim, or a row insert
or removal in that window put the value into another record, while the cell's `valid` flag stayed on the record you
edited. In 19.0, the change is written into the record it was made on, and it stays on its column too.

**Affects:** Apps with validators that also sort, move, filter, trim, collapse, or insert or remove rows or columns
while an edit waits, callbacks that read the row of `afterChange` or `beforeChangeRender` as the row the user edited, and
callbacks that use the row or column of a change as a number. That row or column can now be
`null`. In TypeScript, typed grid settings and `Events`-typed listeners with a `CellChange[]` or `number` annotation on
these hooks no longer compile. An `addHook()` listener with the old annotations still compiles, so the compiler does
not flag it, and it can still get `row === null` at run time.

**Do:**

1. Check the row of a change before you use it as a number. When it is `null`, pass the change to
   [`getPhysicalRowOfChange()`](@/api/core.md#getphysicalrowofchange) inside the hook. It returns the physical row the
   change was written to. Read the record with [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow), which takes
   a physical row, or its ID with [`getRowIdAtPhysicalRow()`](@/api/core.md#getrowidatphysicalrow). Call the method
   while the hook runs: after `afterChange`, it no longer follows the record.
2. In TypeScript, type the parameter with `AppliedCellChange`. Do this for `addHook()` listeners too, because the
   compiler does not ask for it there.
3. If you call [`updateData()`](@/api/core.md#updatedata) with copies of the rows in a new order while an edit waits,
   set a [`rowId`](@/api/options.md#rowid), so the edit follows its record.

Before:

```ts
import type { CellChange, ChangeSource } from 'handsontable';

hot.addHook('afterChange', (changes: CellChange[] | null, source: ChangeSource) => {
  changes?.forEach(([row]) => {
    saveRow(hot.getSourceDataAtRow(hot.toPhysicalRow(row)));
  });
});
```

After:

```ts
import type { AppliedCellChange, ChangeSource } from 'handsontable';

hot.addHook('afterChange', (changes: AppliedCellChange[] | null, source: ChangeSource) => {
  changes?.forEach((change) => {
    const physicalRow = hot.getPhysicalRowOfChange(change);

    if (physicalRow !== null) {
      saveRow(hot.getSourceDataAtRow(physicalRow));
    }
  });
});
```

::: details Details: A change that waits for its validator stays on its record
- **Reported rows.** [`afterChange`](@/api/hooks.md#afterchange) and
  [`beforeChangeRender`](@/api/hooks.md#beforechangerender) report the visual row the record has when the value lands,
  not the row it was made at. A change without a validator, or one that nothing moved while it waited, reports the same
  row as before.
- **Record out of the visual space.** When a filter, [`trimRows`](@/api/options.md#trimrows), or a collapse in
  [`NestedRows`](@/api/nestedRows.md) took the record out of the visual space meanwhile, the value is still written and
  the row in those two hooks is `null`. The same write calls [`modifyData`](@/api/hooks.md#modifydata) with a `null`
  row.
- **Removed record.** The change is dropped: it isn't written, and `afterChange` doesn't report it.
- **Validator rows.** In the validator, `this.visualRow` and `this.row` name the row the record has when the validator
  answers, and so does the row of [`afterValidate`](@/api/hooks.md#aftervalidate). `this.visualRow` and the
  `afterValidate` row are `null` when a filter or `trimRows` took the record out of the visual space, or the record was
  removed.
- **Validator corrections.** A validator that corrects the value with
  `this.instance.setDataAtCell(this.visualRow, this.visualCol, value, 'myValidator')` writes the correction into the
  edited record, also when `this.visualRow` is `null`. Handsontable drops the correction when:
  - a column removal took the edited column (`this.visualCol` is `null`, and the change itself is dropped);
  - the correction is written after the validator called back, because the entered value has already landed;
  - it is written from outside the validator call, for example from a timer, and another record out of the visual
    space has already answered for the same column.

  When Handsontable can't tell which record the correction is for (two records out of the visual space wait for the
  same column, and the validator corrects after it returns), it drops the correction and writes the entered value.
- **`updateData()` with row copies.** Without a `rowId`, the change goes to the row at the record's position: the
  copies are new objects, and the cell meta stays with the physical row.
- **`allowInvalid: false`.** With [`allowInvalid: false`](@/api/options.md#allowinvalid), a value the validator rejects
  reopens the editor on the row the record has now, with the typed text. When a sort or a move took the record to
  another [`Pagination`](@/api/pagination.md) page, that page is shown first. When you changed the page yourself while
  the validator ran, the page stays and the editor closes without saving. The editor also closes without saving when
  the record is gone, filtered out, or hidden with [`hiddenRows`](@/api/options.md#hiddenrows).
- **Columns.** An array data source without a [`columns`](@/api/options.md#columns) option addresses a column by its
  physical index. A column inserted or removed before the edited one no longer sends the saved value to a neighbor
  column. A column move, insert, or removal no longer sends the correction made through `this.visualCol`, or the
  reopened editor, to a neighbor column. A column move never changed where the
  saved value landed, because it doesn't change physical indexes. The `prop` that `afterChange` reports is the column's
  physical index when the value lands. Object data and `columns[].data` already name the column by a property, so they
  are unchanged. A numeric `prop` under a `columns` option isn't followed, and keeps the earlier behavior.
- **Validator columns.** In the validator, `this.col`, `this.visualCol`, and `this.prop` name the column the edit holds
  when the validator answers. When the column was removed meanwhile, the change is dropped, all three are `null`,
  Handsontable drops a validator correction written through them, and the editor closes without saving. When
  `hiddenColumns` hid the column, the value is still written and the editor closes without saving.
- **TypeScript types.** The `changes` of `afterChange` and `beforeChangeRender` are `AppliedCellChange[]`, whose row is
  `number | null`, and the `row` of `modifyData` and `afterValidate` is `number | null`. `CellChange` is unchanged, so
  [`beforeChange`](@/api/hooks.md#beforechange) and the `afterSetDataAtCell` hooks keep it. A listener you pass to
  [`addHook()`](@/api/core.md#addhook) with the old annotations still compiles, because `addHook()` accepts any
  annotated callback, but its `row` can still be `null` at runtime. Settings and listeners typed through the `Events`
  type with the old annotations no longer compile.
- **Who must check for `null`.** You, if any of these holds:
  - Your callback reads the row of `afterChange` or `beforeChangeRender` as the row the user edited (for example to
    compare it with the selection). For a change that waited for a validator, it is now the record's row when the value
    lands.
  - Your `afterChange`, `beforeChangeRender`, or `modifyData` callback uses the row as a number, and you use filters,
    `trimRows`, or `NestedRows`.
  - Your validator uses `this.visualRow` as a number other than to pass it to `setDataAtCell()`, or your
    `afterValidate` callback uses the row as a number, and you use filters or `trimRows`.
  - Your validator uses `this.col`, `this.visualCol`, or `this.prop` as a number, you use an array data source
    without `columns`, and columns can be removed while an edit waits.

:::

### 7. `loadData()` drops a change that waits for its validator

A change to a cell with a [`validator`](@/api/options.md#validator) is written into the data only after the validator
answers. Validators always answer after the call that made the change returns, also synchronous ones and the built-in
validators of `numeric`, `date`, and [`maxLength`](@/api/options.md#maxlength) cells. In 18.1, when
[`loadData()`](@/api/core.md#loaddata) replaced the data in that window, the change was written into the new data at the
same row and column, usually a different record. Now Handsontable drops it.

**Affects:** Apps with validators that call `loadData()` right after [`setDataAtCell()`](@/api/core.md#setdataatcell),
in the same function or while the user confirms an edit (for example to reset the grid's states over the array it
already holds), and apps that mark data as unsaved in `beforeChange` and saved in `afterChange`, because `afterChange`
never comes for a dropped change.

**Do:** Call `loadData()` after the validator answered, for example from [`afterChange`](@/api/hooks.md#afterchange), or
use [`updateData()`](@/api/core.md#updatedata), which keeps the change and the grid's states.

Before, the change reached the loaded data:

```js
hot.setDataAtCell(0, 0, 42);
hot.loadData(rows);
```

After, write the value into the array you load:

```js
rows[0][0] = 42;
hot.loadData(rows);
```

Or keep the states and the change:

```js
hot.setDataAtCell(0, 0, 42);
hot.updateData(rows);
```

::: details Details: loadData() drops a change that waits for its validator
- The change isn't written into the new data, also when the new data holds the same records.
- [`beforeChange`](@/api/hooks.md#beforechange) and [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell) still
  fire for it, and [`afterChange`](@/api/hooks.md#afterchange) doesn't.
- A correction that the validator writes for the change is dropped too.
- An open editor that waits for the validator closes without saving.
- [`updateData()`](@/api/core.md#updatedata) drops nothing.
- The [`DataProvider`](@/api/dataProvider.md) plugin is the exception for its own refetch after a save. It writes such an
  edit again into the record that has the same row ID, so the edit is validated and saved as usual.

:::

### 8. XLSX export no longer needs ExcelJS

Handsontable 19.0 ships its own XLSX engine, so the [`ExportFile`](@/api/exportFile.md) plugin writes XLSX with no engine
configured. In 18.1, you passed ExcelJS as `exportFile: { engines: { xlsx: ExcelJS } }`, and without it the plugin
refused the format. This is not a breaking change: every configuration that exported XLSX in 18.1 still does, and
`engines: { xlsx: ExcelJS }` keeps ExcelJS. Three behaviors changed, and several bug fixes change the exported file.

**Affects:** Apps that set the [`exportFile`](@/api/options.md#exportfile) option (the context menu change reaches grids
that never export XLSX), call `supportsExportFormat('xlsx')`, or export to XLSX, with or without that option.

**Do:** Check these three changes.

1. [`supportsExportFormat('xlsx')`](@/api/exportFile.md#supportsexportformat) returns `true` when `engines.xlsx` is
   absent, `null`, or a supported engine module. It returns `false` for any format other than `'csv'` and `'xlsx'`, and
   when `engines.xlsx` is not a supported engine module, such as `{}`, `'exceljs'`, or `true`. To ask "is ExcelJS
   configured", read the setting:

   ```js
   const usesExcelJs = Boolean(hot.getSettings().exportFile?.engines?.xlsx);
   ```

2. The "To Excel" item (`export_file:xlsx`, a sub-item of the export context menu item) now shows next to "To CSV"
   whenever `exportFile` is set, with no engine configured (18.1 showed "To CSV" alone). It is hidden only when
   `engines.xlsx` is not a supported engine module (18.1 showed it then). To keep it out of the menu, remove it in the
   [`beforeContextMenuSetItems`](@/api/hooks.md#beforecontextmenusetitems) hook. The **Export** item and "To CSV" stay:

   ```js
   beforeContextMenuSetItems(menuItems) {
     const exportItem = menuItems.find(({ key }) => key === 'export_file');

     if (exportItem) {
       exportItem.submenu.items = exportItem.submenu.items
         .filter(({ key }) => key !== 'export_file:xlsx');
     }
   },
   ```

3. [`downloadFileAsync('xlsx')`](@/api/exportFile.md#downloadfileasync) and its siblings no longer reject when no engine
   is configured. They write the file through the built-in engine. A value that is not a supported engine module still
   rejects, now with `Invalid xlsx engine module.` instead of `Missing or invalid ExcelJS engine`. To detect a failed
   export, match on the current message or read `error.cause`. Don't read the rejection as "no engine configured".

::: details Details: XLSX export no longer needs ExcelJS
- For an unsupported `engines.xlsx` value, 18.1 answered `true` from `supportsExportFormat('xlsx')`, because it only
  checked that the value was truthy, although every XLSX export then rejected.
- The built-in engine needs the
  [Compression Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API), which every
  browser Handsontable supports provides. See
  [XLSX engines: Compare the engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md#compare-the-engines) for
  what each engine writes.
- The bug fixes in the table in **Changes to the exported file** are not breaking changes. Check them if another tool
  reads the file or if you compare files byte by byte. They apply to both engines unless a row names one.

:::

::: details Changes to the exported file

| In the exported file | To get the 18.1 output, or if you depend on it |
| --- | --- |
| An empty `checkbox` cell (`null`, `undefined`, or `''`) exports empty, not `FALSE`. A value matching `checkedTemplate` exports `TRUE`, one matching `uncheckedTemplate` exports `FALSE`. Matching ignores letter case, as in the grid: with `uncheckedTemplate: ''`, an empty value is unchecked and exports `FALSE`. | If a consumer expects `TRUE` or `FALSE` in every checkbox cell, fill empty cells with your `uncheckedTemplate` value (`false` by default) before you export. If your data stores an unchecked box as `''`, set `uncheckedTemplate: ''` on the column. |
| The frozen pane counts only the frozen rows and columns the file contains. 18.1 used [`fixedRowsTop`](@/api/options.md#fixedrowstop) and [`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart) as they were, so a skipped hidden row or column inside the frozen band, or a `range` that started inside it, froze more in the file than in the grid. | Export hidden rows and columns with `exportHiddenRows: true` and `exportHiddenColumns: true`, and start `range` at the first row and column. |
| A `numeric` cell holding `NaN`, `Infinity`, or `-Infinity` exports as a text cell with the text the grid shows, also for a [`ColumnSummary`](@/api/columnSummary.md) cached result (such as a `sum` over `Infinity`). 18.1 wrote a number cell such as `<v>NaN</v>`, which Excel repaired with a dialog. | If a consumer expects a number in every `numeric` cell, replace non-finite values in your data, for example with `null`. |
| A `numeric` cell holding `''` or a whitespace-only string exports empty, like `null`. 18.1 exported `0` (the editor stores `''` on clear), so `AVERAGE` and `COUNT` counted it. | If a consumer expects `0`, write `0` into those cells. |
| `exportFormulas: true`: functions added after Excel 2007 carry Excel's stored prefix. `=IFS(…)`, `=STDEV.S(…)`, `=CONCAT(…)`, `=TEXTJOIN(…)`, and `=XLOOKUP(…)` go out as `<f>_xlfn.IFS(…)</f>`. In 18.1, Excel showed `#NAME?` until you re-entered the cell. `NETWORKDAYS.INTL`, `WORKDAY.INTL`, `ISO.CEILING`, and `ECMA.CEILING` keep no prefix, as in 18.1. `LET` and `LAMBDA` parameter names get `_xlpm.`, such as `<f>_xlfn.LET(_xlpm.x,1,_xlpm.x+1)</f>`. | Nothing, unless a tool reads the raw `<f>` text. It sees the prefix now. |
| `exportFormulas: true`: each cell gets the formula of the row it shows. 18.1 wrote another row's formula next to this row's cached value when rows were sorted, moved, trimmed, or filtered, so Excel and LibreOffice showed wrong numbers with no warning. With the Formulas plugin on and rows trimmed or filtered out, references below them point at the rows they name in the file, as for hidden rows left out. | Nothing. |
| `exportFormulas: true`, `exportHiddenColumns: false`, and columns moved with `manualColumnMove`: a formula's references point at the columns they name in the file. 18.1 left out the wrong column when it moved references past the hidden ones, so the formula was one column off. | Nothing. |
| `exportFormulas: true`: a formula whose result is an error (`#DIV/0!`, `#N/A`, `#NAME?`, `#NUM!`, `#REF!`, `#VALUE!`) is an Excel error cell. 18.1 wrote text, which readers that don't recalculate (Apache POI, openpyxl, SheetJS) read as a string. The error uses Excel's English code even when a HyperFormula `language` translates the grid: with `plPL` the grid shows `#DZIEL/0!` and the file stores `#DIV/0!` (18.1 stored the translated text). A formula returning the text `"#N/A"` stays text. A HyperFormula error Excel has no code for (`#CYCLE!`, `#ERROR!`, `#LIC!`, `#SPILL!`) is still the text the grid shows. With the Formulas plugin on, a cell whose value is an error (a typed `#N/A`, or a formula exported as its value) is an error cell too, with or without `exportFormulas` (18.1 stored both as text). Without the plugin, an error is text, as in 18.1. | Nothing, unless a tool reads cached results or values as text. It now gets an error value. |
| Formulas plugin on: a number or `TRUE`/`FALSE` the plugin computed is a number or boolean, even in a `text` column and without `exportFormulas`. This covers cells an array formula spills (below `=SEQUENCE(3)`) and a formula exported as its value. 18.1 wrote text there, which Apple Numbers left out of `SUM()`. A value you typed into a `text` column stays text. | Nothing, unless a tool expects text in those cells. |
| `exportFormulas: true`: a formula whose result spills (`=SEQUENCE(3)`) and a formula that is one `ARRAYFORMULA` call (`=ARRAYFORMULA(A1:A2*2)`) are array formulas over the result cells. The built-in engine writes a spilling formula as a dynamic array that Excel spills and resizes. ExcelJS writes both as legacy arrays: Excel shows braces and the range stays fixed. 18.1 wrote plain formulas, which Excel opened with an `@` (`=@SEQUENCE(3)`) and showed as one value. | Nothing with the built-in engine. With ExcelJS, re-enter the formula in Excel to make it a dynamic array, or export with the built-in engine. |
| `exportFormulas: true` and HyperFormula's `useArrayArithmetic` on (the Formulas plugin default): a formula that applies an operator to a range (`=SUM(A1:A2*B1:B2)`) or is one call to a function that can return an array (`=SEQUENCE(1)`) is a one-cell array: dynamic in the built-in engine, legacy in ExcelJS. 18.1 wrote plain formulas, which Excel opened with an `@`, so `=SUM(@A1:A2*@B1:B2)` computed one row instead of the range. Excel computes the same value from both. | Nothing. |
| `exportFormulas: true` and a HyperFormula `decimalSeparator` of `,`: a number's decimal separator in a formula is written as `.`. A formula typed as `=SUM(A1;1,5)` goes out as `SUM(A1,1.5)`. 18.1 changed only the argument separator, so the file held `SUM(A1,1,5)`, read as three arguments (`7` instead of `2.5` when A1 holds 1). | Nothing. |
| `exportFormulas: true`: the Formulas plugin's named expressions are written as defined names. A name the engine can't write is left out, and a formula over it is written as its value. With ExcelJS that is every name that is not one workbook-scoped range, such as a constant: `=TaxRate*100` over `TaxRate = 0.07` goes out as the value `7`. 18.1 wrote no name, so Excel and LibreOffice showed `#NAME?`. | Nothing, unless the formula must stay live. Export with the built-in engine, which writes constants, sheet-scoped names, and names over several ranges. |
| Values past Excel's limits are written at Excel's maximum: 260 units for a column wider than Excel stores, 409.5 points for a taller row, and 32,767 characters for a longer text (cut). 18.1 ExcelJS wrote them as they were, and Excel repaired or truncated them on open. Each clamp is listed in the console warning about dropped features (`columnWidth:clamped`, `rowHeight:clamped`, `cellText:truncated`), which the ExcelJS engine now logs too. | Nothing. To keep a long text whole, split it across cells before you export. |
| Characters Excel forbids in a sheet name (such as `:` and `/`) and control characters (such as a tab) are removed, on both engines. 18.1 rejected a forbidden character with ExcelJS's own error. A sheet that becomes a duplicate is numbered, as before: `sheets: [{ instance: a, name: 'Q1\tSales' }, { instance: b, name: 'Q1Sales' }]` writes `Q1Sales` and `Q1Sales1` (18.1 wrote `Q1<tab>Sales` as it was, and the second sheet kept its name). | Pass sheet names without control characters if a consumer looks a sheet up by name. |
| Cells a merge covers are written with formatting, so a merged block's border and fill reach every edge. A covered cell with no formatting takes the master cell's. One with its own formatting keeps its number format, lock, and own border sides, and takes the master's fill and border sides on top. 18.1 ExcelJS replaced the covered cell's style with the master's, so LibreOffice drew a boxed merge without its right edge. The ExcelJS engine also no longer writes a single-cell merge as a `<mergeCell>`, and gives a merge's first cell, when it holds no value and no formatting, a style index of its own (an `s` attribute and one more `cellXfs` entry), so Apple Numbers and Quick Look place later cells in the right columns. | Nothing, unless a tool compares the raw XML. |
| A `numeric` column whose `numericFormat` shows a currency symbol longer than one character (`USD`, `CHF`, `zł`) gets the symbol in quotes: `"USD"#,##0.00` or `#,##0.00"zł"` (18.1: `#,##0.00USD`, which Excel for the web repaired and other applications dropped). A one-character symbol other than `$` (`€`, `£`) is quoted too (`#,##0.00"€"`), because Apple Numbers and Quick Look misread it bare. A lone `$` is unchanged. A symbol several currencies share (`kr`, `¥`, `￥`) becomes an Excel locale token for the home locale, such as `#,##0.00[$kr-41D]` (Swedish krona) or `[$¥-411]#,##0.00` (yen). A file 18.1 wrote for a Norwegian krone column imports as the Swedish krona. A non-US dollar that shows as `$` (Australian, Canadian, New Zealand, Mexican peso) gets its home-locale token, such as `[$$-C09]#,##0.00` for the Australian dollar (18.1: a bare `$`, imported as the US dollar). A symbol that would import as another currency or none (`₪` for the Israeli new shekel, `R` for the South African rand) becomes the quoted ISO 4217 code, such as `#,##0.00"ILS"`. `minimumIntegerDigits` is written as that many zeros, such as `00000` (18.1 dropped it and lost the zeros). | Nothing, unless a tool reads the raw number format. It sees the quotes. |
| A `date` cell before 1900, which an Excel date serial can't hold, or a date that doesn't exist (`2023-02-29`, `2024-04-31`), is a text cell with the value the cell holds. 18.1 wrote a wrong date serial, so the file showed another date. | Nothing, unless a consumer expects a date serial in every `date` cell. Correct the values in your data before you export. |
| The helper sheet `_HotValidation`, which holds the lists of `dropdown` and `autocomplete` columns, is hidden instead of very hidden (18.1: very hidden, and Apple Numbers dropped every dropdown pointing at it). Excel lists the sheet under **Unhide**. | Nothing. Don't delete `_HotValidation` in the file, or the dropdowns lose their lists. |
| A grid that renders right to left because its page does (the default `layoutDirection: 'inherit'` on a page with `dir="rtl"`) exports a right-to-left sheet. 18.1 did so only for `layoutDirection: 'rtl'`. | Nothing. |
| A `conditionalFormatting` rule that is not a rule object, an `expression` rule with no `formulae`, or a `colorScale`, `dataBar`, or `iconSet` rule with no `cfvo` thresholds (or a `colorScale` with no `color`) is skipped on both engines and listed in the console warning about dropped features, and the rest of the file is written. 18.1 ExcelJS rejected the export with a `TypeError`. | Nothing. To keep the rule, fix its shape. |
| The built-in engine stores a carriage return (`\r`) in a text cell as `_x000D_`, the escape Excel writes, so the character survives. 18.1 ExcelJS wrote the raw character, which an XML parser turns into a line feed (`\n`), so `\r\n` came back as `\n`. Excel and Handsontable's import, on either engine, read `_x000D_` back as a carriage return. openpyxl, and pandas with its default `openpyxl` engine, show the literal `_x000D_`. | For a Python tool, use `pandas.read_excel(..., engine='calamine')`, or replace the escape after reading with `.str.replace('_x000D_', '\r')`. To keep the 18.1 output, replace `\r\n` and `\r` with `\n` in your data before you export, or keep ExcelJS as the engine. |

:::

### 9. `updateSettings()` keeps the rows of a server-backed grid

In 19.0, [`updateSettings()`](@/api/core.md#updatesettings) no longer empties a grid that uses the
[`dataProvider`](@/api/options.md#dataprovider) option, and no longer reloads it on every render. In 18.1, a payload
with `data` emptied a server-backed grid and nothing fetched the rows again. Passing the same `dataProvider` object again
also emptied the grid and fetched anew, so a React app did that on every render.

**Affects:** Apps that set `dataProvider` and clear the grid with `updateSettings({ data: [] })`, change a member of the
`dataProvider` object and pass the same object to `updateSettings()` to load again (or to retry a failed fetch), or call
`updateSettings()` with `pagination`, `columnSorting`, `filters`, or `columns` and expect no request.

**Do:** To load the rows again, call [`fetchData()`](@/api/dataProvider.md#fetchdata):
`hot.getPlugin('dataProvider').fetchData()`. To leave server-backed loading, set `dataProvider` to `null`.

```js
// 18.1: the grid is empty until something else fetches
// 19.0: the rows stay
hot.updateSettings({ data: [] });

dataProvider.fetchRows = fetchFromNewEndpoint;

// 18.1: the rows are fetched again with `fetchFromNewEndpoint`
// 19.0: nothing is fetched; the next request uses `fetchFromNewEndpoint`
hot.updateSettings({ dataProvider });
```

::: details Details: updateSettings() keeps the rows of a server-backed grid
- `data` is ignored with the console warning Handsontable already printed, and the grid keeps its rows.
- The same `dataProvider` object passed again keeps the rows and sends no request, even when you changed a member inside
  it or the last fetch failed.
- Passing another `dataProvider` object still reloads the rows, and so does a call that also passes `pagination`,
  `columnSorting`, `filters`, or `columns`.
- A call that passes `pagination`, `columnSorting`, `filters`, or `columns` without `dataProvider` now fetches the rows
  again too. In 18.1 it sent no request, so the pager, sort, or filters it reset no longer matched the rows on screen.
- A new `columns` value clears the sort, as it does on a grid without `dataProvider`.

:::

### 10. A string `dataProvider.rowId` reads a property with a dot in its name

In 19.0, a string `rowId` in the [`dataProvider`](@/api/options.md#dataprovider) option reads the property named
exactly as the string, dots included, so the row id matches the value the cell shows. In 18.1 it always split on dots
and read a nested property: `'meta.id'` read `row.meta.id`, even when the row had its own `'meta.id'` key
(which a column with `data: 'meta.id'` shows). See [Row identity](@/guides/rows/row-identity/row-identity.md).

**Affects:** Apps whose rows have a key with a dot in its name that matches `dataProvider.rowId`, next to a nested
object at the same path. Apps with a function `rowId` that reads a nested object while the rows keep that value under
a dotted key break at run time: the function now gets the raw source row, where the nested object does not exist. The
throw counts as a missing id, Handsontable reverts the edit and reports it through `afterRowsMutationError`, and
removing the row raises the missing row id error. Apps with a `modifySourceData` hook that changes the value `rowId`
reads, and TypeScript code that reads `rowId` back as a string, are affected too (see the details).

**Do:** To keep reading the nested value, pass a function. Guard the nested object, so a row without it, such as a new
row, has no id instead of throwing. A function that reads a dotted key reads it by name.

Before (18.1), a string key read the nested value even when the row also had the dotted key:

```js
// row: { 'meta.id': 'SKU-4821', meta: { id: 'legacy-17' } }
dataProvider: {
  rowId: 'meta.id', // 18.1: 'legacy-17'; 19.0: 'SKU-4821'
  // ...
},
```

After (19.0), keep reading the nested value:

```js
dataProvider: {
  rowId: (row) => row.meta?.id ?? null,
  // ...
},
```

Or read the dotted key by name:

```js
dataProvider: {
  rowId: (row) => row['meta.id'] ?? null,
  // ...
},
```

::: details Details: A string dataProvider.rowId reads a property with a dot in its name
- **Dotted key.** `{ 'meta.id': 'SKU-4821' }` has the id `'SKU-4821'`. A row without such a property still reads the
  nested one, whatever [`dataDotNotation`](@/api/options.md#datadotnotation) is set to.
- **Function `rowId` that reads a nested object**, when the rows keep that value under a dotted key. In 18.1, the
  function received a copy in which `dataDotNotation` had turned the dotted key into a nested object. It now receives
  the source row itself, where the nested object doesn't exist, and a `modifySourceData` hook no longer changes the id.
  A function that throws there is read as a missing id: an edit is reverted and reported through
  `afterRowsMutationError`, and removing the row raises the missing row id error.
- **[`modifySourceData`](@/api/hooks.md#modifysourcedata) hook** that changes the value `dataProvider.rowId` reads.
  Handsontable now reads the id from the source row, not from a copy, so the id is the stored value.
- **TypeScript.** Code that reads `dataProvider.rowId` back as a string, for example
  `const key: string = hot.getSettings().dataProvider.rowId`, no longer compiles: the type in `DataProviderConfig` was
  `string` and is now a string or a function, which the plugin already accepted. Narrow it first. Code that sets
  `rowId` is not affected.

  ```ts
  const rowId = hot.getSettings().dataProvider?.rowId;

  if (typeof rowId === 'string') {
    // Use the string key.
  }
  ```

- The new [`rowId`](@/api/options.md#rowid) option reads ids the same way.

:::

### 11. A plain value written into a key/value `source` cell resolves to the matching object

In [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) and
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) columns whose
[`source`](@/api/options.md#source) is an array of `{ key, value }` objects, every way of writing a label into a cell now
stores the matching source object, as the cell editor always did. Before, writing `'BMW'` for `{ key: '1', value: 'BMW' }`
stored `'BMW'` in an empty cell, or `{ key: 'BMW', value: 'BMW' }` in a cell that held an object.

**Affects:** Apps with a `strict` column (such as `dropdown`), apps that read `getSourceData()` after a paste or write
on a non-strict `autocomplete` column, and apps that repair these cells themselves.

**Do:** Nothing in most cases. Drop any workaround that turns a stored string back into a source object or rebuilds the
`key` from the label. If you read these cells with [`getSourceData()`](@/api/core.md#getsourcedata) and branched on
whether the value was a string, that branch is now dead for values that match an option: read `value` for those. A
value that matches no option is still stored as written.

::: details Details: A plain value written into a key/value source cell resolves to the matching object
- Resolving paths: pasting text (from another application too, and as plain text with
  <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**V**</kbd>),
  [`setDataAtCell()`](@/api/core.md#setdataatcell), [`populateFromArray()`](@/api/core.md#populatefromarray), and
  autofill.
- A value that matches no source object is stored as written, so a [`strict`](@/api/options.md#strict) column still
  marks it invalid. A valid label pasted into a `strict` column used to be marked invalid, and is now accepted.
- Not affected: the `handsontable` cell type, a `source` of plain strings, and a `source` function. Loading data
  ([`data`](@/api/options.md#data), [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata))
  resolves nothing, so plain labels stay until a write.
- Clearing a cell now stores the empty value. Before, it stored `{ key: null, value: null }`, so `getSourceData()`
  returned an object and [`emptyValue`](@/api/options.md#emptyvalue) never applied.
- Undo and redo restore exactly what the cell held. Before, undoing to a plain label stored
  `{ key: <label>, value: <label> }` when the cell held an object, so a `strict` column marked it invalid.

:::

### 12. A `dropdown` column with `strict: false` validates strictly

A [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) column that sets
[`strict`](@/api/options.md#strict) to `false` now marks a value outside its [`source`](@/api/options.md#source) list as
invalid on every path, as the dropdown cell type always documented. Before, a cell validated strictly only after its
editor had been opened, and only until the next `updateSettings()` with `columns`, `cells`, or `cell`. A value that
arrived by paste, API, or autofill in any other cell passed.

**Affects:** Apps with a `dropdown` column with `strict: false` that receives values outside its `source` by paste,
autofill, or an API call, or that count invalid cells after [`validateCells()`](@/api/core.md#validatecells).

**Do:** Pick one:

1. To accept values outside the list, use an
   [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md) column with `strict: false`.
   Its editor filters the list as you type, while a dropdown column sets [`filter`](@/api/options.md#filter) to `false`
   and always shows the whole list.
2. To keep the dropdown and still store values outside the list, leave [`allowInvalid`](@/api/options.md#allowinvalid) at
   its default of `true`. The value is stored and the cell is marked invalid.

::: details Details: A dropdown column with strict: false validates strictly
- Paths that used to skip strict validation: pasting text, [`setDataAtCell()`](@/api/core.md#setdataatcell),
  [`populateFromArray()`](@/api/core.md#populatefromarray), autofill, and `validateCells()`.
- Cause: opening a cell's editor made that cell strict, and an [`updateSettings()`](@/api/core.md#updatesettings) call
  with [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) made
  it lenient again (the React wrapper does that on every render of a grid with `HotColumn` children).
- With `allowInvalid: false`, the write is now rejected, as it already was for a typed value.

:::

### 13. `date` cells reach the formula engine the same way on every data path

The [`Formulas`](@/api/formulas.md) plugin always protected a
[`date`](@/guides/cell-types/date-cell-type/date-cell-type.md) cell's value from the engine's own parsing when you typed
into the cell, but not when the value arrived through [`loadData()`](@/api/core.md#loaddata),
[`updateData()`](@/api/core.md#updatedata), [`updateSettings()`](@/api/core.md#updatesettings), or
[`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell). In 19.0, all of those paths match the initial data load,
which can change what your formulas return.

**Affects:** Apps that use `Formulas` and either:

- have a `date` column holding non-ISO 8601 values that a formula reads, or
- have a `cells()` function, or a [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta) or
  [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta) listener, with side effects. No `date` column is needed: a
  `cells()` function or a `beforeGetCellMeta` listener alone makes the plugin read the meta of every text cell.

If you declare a cell's `type` only through a `cells()` function, you need no change beyond the fix.

**Do:**

1. Check formulas that read non-ISO values in a `date` column as numbers (see the table in the details). Better, keep
   non-date values out of `date` columns: plain numbers belong in a
   [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) column. Otherwise, convert them where you
   read them.

   ```js
   // Before: counts the cell as a number
   '=SUM(A1:A10)'

   // After: converts text to numbers
   '=SUMPRODUCT(VALUE(A1:A10))'
   ```

2. Make `cells()` and the meta hooks free of side effects, so they are safe to call during a data load. A listener
   that calls `setDataAtCell()` or `updateSettings()` now has a path back into the grid it did not have before.

   Before, `cells()` writes to the grid:

   ```js
   cells(row, column) {
     this.setDataAtCell(row, column, computeSomething(row));

     return { type: 'date' };
   },
   ```

   After, `cells()` computes the value without writing:

   ```js
   cells(row, column) {
     return {
       type: 'date',
       valueGetter: value => value ?? computeSomething(row),
     };
   },
   ```

::: details Details: date cells reach the formula engine the same way on every data path
- A `date` column holds strings in your [`dateFormat`](@/api/options.md#dateformat). A non-ISO value used to reach the
  engine as whatever the engine made of it (`'123'` became the number 123, `'12:30'` a time fraction, `'TRUE'` a
  boolean). It now reaches the engine as text. Arithmetic and concatenation are unaffected, because the engine coerces a
  numeric string, but functions that tell a number from text change. With `'123'` in a `date` cell `A1`:

  | Formula         | Before | After   |
  | --------------- | ------ | ------- |
  | `=A1+1`         | `124`  | `124`   |
  | `=A1&"x"`       | `123x` | `123x`  |
  | `=SUM(A1:A1)`   | `123`  | `0`     |
  | `=COUNT(A1:A1)` | `1`    | `0`     |
  | `=ISNUMBER(A1)` | `true` | `false` |

- A `type` set only through `cells()` now applies on those paths, as a `type` set on the grid, a column, or the `cell`
  array already did. That needs no change.
- To honor that type, the plugin reads each cell's meta through the usual pipeline on those paths, so your `cells()`
  function and meta hooks run once per non-formula text cell. The previous read ran none of them. Check
  `updateSettings()` first, because it runs on every call.
- **When the pass runs.** The plugin reads cell meta only when a configuration layer can mark a cell for escaping.
  That is any of: a `date` type or [`preserveTextValue: true`](@/api/options.md#preservetextvalue) in the grid
  settings, a column, the `cell` array, or a cell's stored meta; a `cells()` function; a `columns` function; or a
  `beforeGetCellMeta` listener. A grid with none of these skips the pass. An `afterGetCellMeta` listener does not
  open the pass by itself (merged cells and hidden rows register one anyway), but it runs for every cell once
  another layer does.

:::

### 14. An `afterRender` hook that writes to the engine loops

In 18.1, the [`Formulas`](@/api/formulas.md) plugin did not repaint the grid when something other than the grid changed
the HyperFormula engine (for example `setCellContents()` on an external or shared engine). In 19.0, every such write
repaints the grids that use the engine. An [`afterRender`](@/api/hooks.md#afterrender) hook that writes to the engine on
every call now triggers a repaint that calls the hook again, until the call stack overflows. `Formulas` logs a warning
that the grid failed to repaint.

**Affects:** Apps whose `afterRender` hook calls `setCellContents()` or another engine write without checking whether
the value changed.

**Do:** Write only when the value differs. Wrapping the write in `engine.batch()` does not stop the loop.

Before:

```js
afterRender() {
  engine.setCellContents({ sheet: 0, row: 0, col: 1 }, total);
}
```

After:

```js
afterRender() {
  const address = { sheet: 0, row: 0, col: 1 };

  if (engine.getCellValue(address) !== total) {
    engine.setCellContents(address, total);
  }
}
```

::: details Details: An afterRender hook that writes to the engine loops
- Outside a hook, `engine.batch()` still makes several writes repaint the grid once instead of once per write.

:::

### 15. `SHEET()` keeps a sheet's number after an earlier sheet is removed

When the [`Formulas`](@/api/formulas.md) plugin creates the HyperFormula engine (you pass the `HyperFormula` class in the
`engine` option), `SHEET()` now returns the sheet's number in the engine. Before, removing a sheet renumbered the sheets
after it, so `SHEET()` returned the sheet's position. For sheets `S1`, `S2`, and `S3`, after you remove `S2`,
`=SHEET("S3")` returned `2` and now returns `3`.

**Affects:** Apps that use HyperFormula 3.1.1 or later, let the plugin create the engine, remove a sheet that is not the
last one, and use `SHEET()` as a position (for example as an index in `INDEX()` or `CHOOSE()`).

**Do:** Count the sheets before it yourself, or keep the sheets you remove at the end of the workbook. To keep the old
numbering, call `rebuildAndRecalculate()` on the engine after you remove a sheet. That also turns spilled arrays into
`#SPILL!`, as before.

```js
const engine = hot.getPlugin('formulas').engine;

engine.removeSheet(engine.getSheetId('S2'));
// Before: SHEET("S3") returns 2. Now: SHEET("S3") returns 3.
```

::: details Details: SHEET() keeps a sheet's number after an earlier sheet is removed
- Why: the plugin used to rebuild the whole engine whenever a sheet was added or removed, which turned every spilled
  array (such as `=SEQUENCE(3)`) into `#SPILL!`. With HyperFormula 3.1.1 or later it no longer rebuilds, so spilled
  arrays keep their values and sheets keep their numbers.
- `=SHEETS()` still returns `2` in that example.
- An engine instance that you create and pass to the plugin already numbered sheets this way.

:::

### 16. Frozen columns can be dragged, and the unfreeze hooks get a target

With [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze), the
[`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin no longer refuses to drop a column in front of the frozen
columns or to move a frozen column, like a grid configured with
[`fixedColumnsStart`](@/api/options.md#fixedcolumnsstart). Also,
[`beforeColumnUnfreeze`](@/api/hooks.md#beforecolumnunfreeze) and
[`afterColumnUnfreeze`](@/api/hooks.md#aftercolumnunfreeze) receive a third argument, `finalIndex`. The new
`restoreColumnPosition` option is under [Also new in 19.0](#also-new-in-190) (see the
[column freezing](@/guides/columns/column-freezing/column-freezing.md#restore-the-column-position-on-unfreeze) guide).

**Affects:** Apps that use `manualColumnFreeze` with [`manualColumnMove`](@/api/options.md#manualcolumnmove), listen to
the freeze and unfreeze hooks, or assert on the unfreeze hook arguments in tests.

**Do:**

1. To keep the old lock (for example to pin a key column), reject those moves in
   [`beforeColumnMove`](@/api/hooks.md#beforecolumnmove). Return `false` to reject and nothing otherwise, because any
   other value is passed on to the next handler.

   ```js
   beforeColumnMove: function(movedColumns, finalIndex) {
     const frozenCount = this.getSettings().fixedColumnsStart ?? 0;

     if (finalIndex < frozenCount || movedColumns.some((column) => column < frozenCount)) {
       return false;
     }
   },
   ```

2. If you track frozen columns through [`afterColumnFreeze`](@/api/hooks.md#aftercolumnfreeze) and
   `afterColumnUnfreeze`, also read them in [`afterColumnMove`](@/api/hooks.md#aftercolumnmove).
3. Update tests that assert the exact unfreeze arguments (such as `toHaveBeenCalledWith(column, performed)`) to include
   the third one.

::: details Details: Frozen columns can be dragged, and the unfreeze hooks get a target
- TypeScript calls to a stored unfreeze callback with two arguments (such as
  `getSettings().beforeColumnUnfreeze?.(column, true)`) fail with `TS2554`, because `finalIndex` is declared as
  required. A listener that declares two parameters keeps working.
- Freezing works by position, as with `fixedColumnsStart`: the first `fixedColumnsStart` columns are frozen, whichever
  columns they are, and their number stays the same. Dropping a column in front of a frozen column freezes the dropped
  column, and the last frozen column becomes scrollable. Dragging a frozen column out of the frozen area freezes the
  next column.
- A drag across the freeze line fires `beforeColumnMove` and `afterColumnMove`, not the freeze and unfreeze hooks. Read
  the number of frozen columns from `getSettings().fixedColumnsStart`, and the order from `getColHeader()` or the
  [column index mapper](@/guides/columns/column-moving/column-moving.md).
- `finalIndex` is the visual index the column moves to: the position right after the remaining frozen columns, or the
  restored position when you set `restoreColumnPosition`. When nothing is unfrozen, it equals the column index.

:::

### 17. The narrowest column width depends on the theme

A column resized by dragging or by [`setManualSize()`](@/api/manualColumnResize.md#setmanualsize) could be as narrow as
`20px`, which left no room for the header's menu button, label, and sort indicator. When the grid shows column headers
(with [`colHeaders`](@/api/options.md#colheaders) or [`nestedHeaders`](@/api/options.md#nestedheaders)) and
[`dropdownMenu`](@/api/options.md#dropdownmenu) is enabled, the narrowest width is now
`--ht-icon-size + 2 × --ht-cell-horizontal-padding`. Any other grid keeps the `20px` minimum.

| Theme   | Narrowest width before | Narrowest width now, with the menu button |
| ------- | ---------------------- | ----------------------------------------- |
| Main    | 20px                   | 32px                                      |
| Horizon | 20px                   | 40px                                      |
| Classic | 20px                   | 24px                                      |

**Affects:** Apps with the dropdown menu enabled that rely on `20px` columns, call `setManualSize()` or
[`setManualSizes()`](@/api/manualColumnResize.md#setmanualsizes) with a smaller width, or read `getManualSize()` or the
rendered header width and expect `20`.

**Do:** Update the expected width, and read the minimum from the theme instead of hard-coding it. Saved widths need no
migration: a width you restore through `setManualSizes()` is stored as the minimum when it is below it.

```js
const probe = document.createElement('div');

probe.style.width = 'calc(var(--ht-icon-size) + 2 * var(--ht-cell-horizontal-padding))';
hot.rootElement.appendChild(probe);

const minWidth = probe.offsetWidth;

probe.remove();
```

::: details Details: The narrowest column width depends on the theme
- The minimum applies to dragging, a double-click on the resize handle (fit to content), and `setManualSize()` and
  `setManualSizes()`, which store it for any smaller width. `setManualSize()` returns it.
- Not clamped: a width in the [`manualColumnResize`](@/api/options.md#manualcolumnresize) array, in
  [`colWidths`](@/api/options.md#colwidths), or in a column's `width`; a width that
  [`autoColumnSize`](@/api/autoColumnSize.md) or column stretching calculates; a width already stored. For a narrower
  column, turn the dropdown menu off or use one of these (the header cannot fit the menu button below the minimum). A
  double-click on the resize handle stores a manual width, so it cannot go below the minimum.
- The minimum is never below `20px`, which is also the result when the theme does not declare the two values or the
  grid is not rendered yet. A theme can declare them in any unit (`rem`, `em`, `calc()`, `px`).
- A narrow header gives things up in a fixed order: the label, then the sort indicator, then the menu button. The sort
  indicator is hidden below `2 × --ht-cell-horizontal-padding + 2 × --ht-icon-size + 6px` (54px in Main, 62px in
  Horizon, 42px in Classic), so a sorted column that narrow shows no arrow (and no sort order number with
  [`multiColumnSorting`](@/api/multiColumnSorting.md)). The label gives up room to the menu button as soon as the
  column can't hold both, and the menu button stays inside its own header at every width the user can reach. At the
  minimum the label is gone, so a click on the header
  text cannot sort the column. Use [`sort()`](@/api/columnSorting.md#sort), or <kbd>**Enter**</kbd> on the header when
  [`navigableHeaders`](@/api/options.md#navigableheaders) is enabled.
- CSS that targets `.colHeader.columnSorting.sortAction` or the `column-gap` of `.relative.has-header-button` is
  affected: the built-in rules now shrink both in a narrow header.
- Handsontable applies the minimum when it writes a width, not when it reads one, so a theme change never rewrites
  stored widths. The [`sheetsBar`](@/api/sheetsBar.md) plugin writes stored widths back through `setManualSizes()` when
  you switch sheets, so a width below the minimum from the `manualColumnResize` array comes back as the minimum.
- A grid without column headers or without the menu is not affected.

:::

### 18. A border added from the context menu takes its color from the theme

A border added from the context menu (**Borders** > **Top**, **Bottom**, **Left**, or **Right**) used to store
`color: '#000'`, which is invisible against dark cells in a dark color scheme. In 19.0 it stores
`color: 'var(--ht-custom-borders-default-color, #000)'`. The
[`--ht-custom-borders-default-color`](@/guides/styling/theme-customization/theme-customization.md#cell-border-variables)
theme variable is black in light color schemes and light gray in dark ones, in every built-in theme.

**Affects:** Apps whose code reads the `color` of a border added from the menu and expects `'#000'`, or that need those
borders to stay black in a dark color scheme.

**Do:**

1. Read the color as a CSS value, not a hex string. You can save it and pass it back in the
   [`customBorders`](@/api/options.md#customborders) option, and the border then follows the theme.
2. To keep these borders black in a dark color scheme, set the variable on the
   [theme class](@/guides/styling/theme-customization/theme-customization.md#target-the-theme-class-not-the-container)
   (this example uses the `main` theme; for `horizon` or `classic`, replace `main` in the three class names):

   ```css
   #my-grid .ht-theme-main,
   #my-grid .ht-theme-main-dark,
   #my-grid .ht-theme-main-dark-auto {
     --ht-custom-borders-default-color: #000;
   }
   ```

   With the [Theme API](@/guides/styling/theme-customization/theme-customization.md#configure-theme-parameters), set the
   `customBordersDefaultColor` token instead:

   ```js
   myTheme.params({
     tokens: {
       customBordersDefaultColor: 'colors.black',
     },
   });
   ```

::: details Details: A border added from the context menu takes its color from the theme
- Where your code needs a fixed color outside the page (for example on a server), use the `#000` fallback inside the
  `var()` value. The fallback applies when no theme is loaded or the theme does not define the variable, as in a theme
  you built before 19.0. Add the variable to that theme to make these borders visible in its dark color scheme.
- [`getBorders()`](@/api/customBorders.md#getborders) and the `borders` key of
  [`getCellMeta()`](@/api/core.md#getcellmeta) return the CSS value for such a border, not a hex string.
- A border saved in 18.1 with `color: '#000'` stays black in every color scheme.
- Borders you declare in `customBorders` or add with [`setBorders()`](@/api/customBorders.md#setborders) keep the color
  you give them. A side set to `true`, or given without a `color`, is still `#000`.
- The XLSX export of the [`ExportFile`](@/api/exportFile.md) plugin still writes these borders as black.

:::

### 19. `maxLength` is a built-in cell option

Handsontable now reads the [`maxLength`](@/api/options.md#maxlength) option. A cell with a finite `maxLength` stops the
user from typing or pasting more characters than the limit allows, and marks a longer value as invalid. Until now,
Handsontable ignored a `maxLength` key and kept it in the cell settings like any other custom key.

**Affects:** Apps that set `maxLength` on the grid, in [`columns`](@/api/options.md#columns),
[`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell), or with
[`setCellMeta()`](@/api/core.md#setcellmeta), and read it in their own validator, editor, or renderer.

**Do:** Pick one:

1. Rename your key to a name Handsontable does not read, such as `maxChars`, in your settings and in the code that reads
   it (`this.maxChars` in a validator, `cellProperties.maxChars` in an editor or renderer).
2. Use the built-in option: remove your own length validator and keep `maxLength`. Set
   [`allowInvalid`](@/api/options.md#allowinvalid) to `false` if the grid must reject a value that is too long.
3. Turn the built-in limit off for a cell: set `maxLength: Infinity` on that column or cell and keep your own limit
   under another key.

::: details Details: maxLength is a built-in cell option
- A rule of your own that counts UTF-16 units, or that trims the value first, can now reject a value it accepted before,
  because the built-in check runs first.
- The text editor, and any custom editor that extends it, stops typing and pasting at the limit. The `autocomplete`,
  `dropdown`, and `handsontable` editors cap what the user types the same way. The editors of the other cell types,
  such as numeric, date, and password, do not limit input.
- The cell validator marks a string value longer than the limit as invalid. It runs before your own
  [`validator`](@/api/options.md#validator), which is not called for a value that is too long.
- The limit counts the characters a reader sees (a flag or an emoji with a skin tone is one character), after
  [`trimWhitespace`](@/api/options.md#trimwhitespace) is applied.
- Every write to the cell is validated asynchronously: [`setDataAtCell()`](@/api/core.md#setdataatcell) applies the
  value after the validation finishes, and [`getDataAtCell()`](@/api/core.md#getdataatcell) returns the previous value
  until then.

:::

### 20. Removing a parent row removes every row below it

With the [`NestedRows`](@/api/nestedRows.md) plugin, removing a parent row now removes that row and all of its
descendants, as the documentation always described. Up to 18.1, it removed the parent and its direct children only. On a
tree three or more levels deep, everything below stayed on screen as blank rows with no data, and no further
**Remove row** could clear them.

**Affects:** Apps that read the row indexes or the `amount` from the row removal hooks, rely on the blank rows staying
behind (for example by writing values into them), or undo a removal.

**Do:** Nothing in most cases, because the rows that are now removed had no data behind them. If your code reacts to a
row removal, read the row list from the hook argument instead of assuming one parent plus its direct children.

::: details Details: Removing a parent row removes every row below it
- [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) and [`afterRemoveRow`](@/api/hooks.md#afterremoverow) now receive
  every descendant.
- To count the affected rows, read the number from `afterRemoveRow`, which reports the rows really removed. In
  `beforeRemoveRow`, `amount` is counted before the plugin adds the descendants and stays at the old value, so read the
  length of the row array that hook receives.
- Undo restores the parent and its descendants. Up to 18.1 it put back one row and left the rest on screen with no data.
- Example: in a four-level chain, removing row `0` removed 2 rows up to 18.1 (hooks got `[0, 1]`, 2 blank rows stayed)
  and removes 4 from 19.0 (hooks get `[0, 1, 2, 3]`).
- A tree two levels deep is unaffected.

:::

### 21. <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + arrow keys on a row header expand and collapse row groups

With the [`NestedRows`](@/api/nestedRows.md) plugin and [`navigableHeaders`](@/api/options.md#navigableheaders)
enabled, <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**←**</kbd> and <kbd>**→**</kbd> on a focused row header are now
the [row group keys](@/guides/rows/row-parent-child/row-parent-child.md#keyboard-shortcuts). In 18.1, they moved the
focus to the first or last cell of the row, as they do anywhere else in the grid.

**Affects:** Apps that use `NestedRows` with `navigableHeaders`, and users who relied on the old shortcut.

**Do:** Nothing in your code. To reach the last cell of a row from its row header, press <kbd>**→**</kbd> to move into
the row, then <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**→**</kbd>, or press <kbd>**End**</kbd>. Update any
keyboard shortcut documentation you give your users.

::: details Details: Cmd/Ctrl + arrow keys on a row header expand and collapse row groups
- <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**→**</kbd> expands a collapsed parent row.
  <kbd>**Cmd**</kbd>/<kbd>**Ctrl**</kbd> + <kbd>**←**</kbd> collapses an expanded parent row, or moves the focus to the
  header of the parent row. With nothing to expand, collapse, or move to, they do nothing. In a right-to-left layout,
  the two arrows swap.
- From a cell, both shortcuts still move to the first or last cell of the row.
- While an overlay covers the grid body (the loading overlay or the empty data state), the row group keys do nothing.
  That includes <kbd>**Enter**</kbd> on a row header, which before 19.0 expanded or collapsed the row group under the
  overlay.

:::

### 22. Leaving a merged cell with a left or right arrow lands on its top row

With [`mergeCells`](@/api/options.md#mergecells), a left or right arrow that leaves a merged cell now always lands on
the merged cell's top row (its topmost visible row when the top row is hidden), whichever way you entered. Before
19.0.0, the selection kept the row you entered on: entering a three-row merged cell from below (arrow up) and pressing
left landed one row lower than entering from above (arrow down).

**Affects:** Apps that read [`getSelected()`](@/api/core.md#getselected) or
[`getSelectedRangeLast()`](@/api/core.md#getselectedrangelast) after a left or right arrow leaves a merged cell entered
on a row other than its first.

**Do:** Nothing in most cases. If your code compensated for the old direction-dependent landing, drop that workaround.

::: details Details: Leaving a merged cell with a left or right arrow lands on its top row
- A merged cell is now addressed by its top-left corner.
- Vertical navigation still keeps the column you move along, and <kbd>**Tab**</kbd> and
  <kbd>**Shift**</kbd>+<kbd>**Tab**</kbd> keep the row they cycle along. A grid without merged cells is unaffected.

:::

### 23. A row dragged into a gap with hidden rows lands after them

A gap made by rows hidden with [`HiddenRows`](@/api/hiddenRows.md) or another hiding index map (such as the one
[`Pagination`](@/api/pagination.md) uses) has two drop targets: the lower half of the row above it and the upper half of
the row below it. In 18.1, the lower half put the moved row in front of the hidden rows. In 19.0, both halves put it
after them, right before the next visible row, as for trimmed rows and hidden columns.

**Affects:** Apps that combine [`manualRowMove`](@/api/options.md#manualrowmove) with
[`hiddenRows`](@/api/options.md#hiddenrows) where users drag rows next to hidden ones (after the hidden rows are shown
again, a moved row can sit on the other side of them than in 18.1), or that save or compare the row order after a user
drag, or read `dropIndex` or `finalIndex` in a row-move hook and expect the index of a hidden row.

**Do:** Nothing, unless you want the 18.1 placement. To put a row in front of the hidden rows, call
[`dragRows()`](@/api/manualRowMove.md#dragrows) with the visual index of the first hidden row.

```js
// Six rows, rows 2 and 3 hidden. Drag row 0 onto the lower half of row 1.
// 18.1: hot.rowIndexMapper.getIndexesSequence() returns [1, 0, 2, 3, 4, 5]
// 19.0: hot.rowIndexMapper.getIndexesSequence() returns [1, 2, 3, 0, 4, 5]
// A drop on the upper half of row 4 gives [1, 2, 3, 0, 4, 5] in both versions.
```

::: details Details: A row dragged into a gap with hidden rows lands after them
- If you don't hide rows, or you move rows only through the API, nothing changes.
- [`beforeRowMove`](@/api/hooks.md#beforerowmove) and [`afterRowMove`](@/api/hooks.md#afterrowmove) report the resolved
  drop: in the example, a lower-half drop reports `dropIndex` `4` (not `2`) and `finalIndex` `3` (not `1`).
- A drag that ends right before the moved row itself changes too. Drag row 4 to the lower half of row 1: 18.1 returned
  `[0, 1, 4, 2, 3, 5]` from `getIndexesSequence()` with `orderChanged` `true`. 19.0 reports `dropIndex` `4` and
  `orderChanged` `false`, and nothing moves. Check `orderChanged` in `afterRowMove`.
- A row dropped on its own lower half stays put, so a row right above the hidden rows does not jump over them. The upper
  half of the row below the hidden rows still moves it after them, as in 18.1.
- The drop index is unchanged when landing after the hidden rows would cross the edge of the fixed rows (top or bottom),
  would split a merged cell, or when [`NestedRows`](@/api/nestedRows.md) is enabled.
- [`moveRows()`](@/api/manualRowMove.md#moverows), [`moveRow()`](@/api/manualRowMove.md#moverow), `dragRows()`, and
  [`dragRow()`](@/api/manualRowMove.md#dragrow) use the index you pass: `dragRow(0, 2)` still lands in front of the
  hidden rows, `dragRow(0, 3)` between the two hidden rows.

:::

### 24. A `numeric` cell aligns itself by its type, not by its value

A [`numeric`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cell used to align and style itself as numeric
only while its value parsed as a number. A cell holding `null`, `undefined`, or text stayed left-aligned without the
`htRight` and `htNumeric` classes, although [`getCellMeta()`](@/api/core.md#getcellmeta) reported `type: 'numeric'`, and
a cell that picked up the classes while briefly numeric never lost them. In 19.0, a `numeric` cell carries `htRight`,
`htNumeric`, and `dir="ltr"` and aligns right, whatever it holds.

**Affects:** A `numeric` column or cell that can hold `null`, `undefined`, or text.

**Do:** Nothing in most cases. If you read the `className` meta or the DOM classes to tell whether a cell holds a
number, check the value instead, for example with
[`isNumeric()`](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md). Update a custom rule that assumed such
cells stay left-aligned.

::: details Details: A numeric cell aligns itself by its type, not by its value
- Such cells now also export right-aligned from [`ExportFile`](@/api/exportFile.md) in the XLSX format.

:::

### 25. Turning `loading` off turns the `Dialog` plugin off

The [`Loading`](@/api/loading.md) plugin shows its overlay through the [`Dialog`](@/api/dialog.md) plugin. In 18.1,
[`loading`](@/api/options.md#loading) set the [`dialog`](@/api/options.md#dialog) option to `true`, so the plugin stayed
enabled after `loading` went off. In 19.0, `loading` enables the plugin without changing `dialog`, and the plugin is
enabled while `dialog` is set or `loading` is on.

**Affects:** Apps that set `loading` without `dialog`, turn it off, and then use the `Dialog` plugin. Then
[`show()`](@/api/dialog.md#show), [`showAlert()`](@/api/dialog.md#showalert), and
[`showConfirm()`](@/api/dialog.md#showconfirm) show nothing, [`downloadFileAsync()`](@/api/exportFile.md#downloadfileasync)
downloads without its progress dialog, and `getSettings().dialog` no longer tells whether the plugin is enabled.

**Do:** Set `dialog: true` next to `loading`. To check the plugin state, read `hot.getPlugin('dialog').enabled`.

```js
const hot = new Handsontable(container, {
  loading: true,
  dialog: true,
});

hot.updateSettings({ loading: false });

// the Dialog plugin is still enabled
hot.getPlugin('dialog').showConfirm('Delete this row?');
```

::: details Details: Turning loading off turns the Dialog plugin off
| Settings | `Dialog` plugin in 18.1 | `Dialog` plugin in 19.0 |
| --- | --- | --- |
| `loading: true` | Enabled, `getSettings().dialog` is `true` | Enabled, `getSettings().dialog` is `false` |
| `loading: true`, then `loading: false` | Enabled | Disabled |
| `loading: true`, then `loading: false`, then `dialog: false` | Enabled | Disabled |
| `dialog: true` and `loading: true`, then `loading: false` | Enabled | Enabled |

:::

### 26. Changing `dataSchema` resets the grid's index state

Without [`columns`](@/api/options.md#columns), [`dataSchema`](@/api/options.md#dataschema) decides the column count and
each column's property. In 18.1, an [`updateSettings()`](@/api/core.md#updatesettings) call that changed `dataSchema`
without [`data`](@/api/options.md#data) or `columns` updated neither. In 19.0, such a call compares the columns the new
schema defines with the grid's. If the count or the property of any column differs, the grid re-creates the data map and
re-initializes the row and column index mappers, as a changed `columns` option does.

**Affects:** Apps that change the columns `dataSchema` defines after creation, set no `columns`, and rely on index state
surviving the change.

**Do:** Read the state before the update and apply it again after. For example, store
[`getSortConfig()`](@/api/columnSorting.md#getsortconfig) and pass it back to [`sort()`](@/api/columnSorting.md#sort)
once `updateSettings()` returns.

::: details Details: Changing dataSchema resets the grid's index state
- The reset clears everything stored per index: column and row order changed by users or the API
  ([`ManualColumnMove`](@/api/manualColumnMove.md), [`ManualRowMove`](@/api/manualRowMove.md)), sorting, filtering,
  rows and columns hidden or trimmed through the API or UI, and dragged row heights and column widths. Options in your
  settings, such as `hiddenColumns: { columns: [1] }`, apply again.
- A change is another column count, other property names, or the same names in another order (columns follow the key
  order of the schema). Not a change: a new default value (`status: 'new'` to `status: 'open'`), or a new function that
  returns the same columns (the function is called to read them).
- Setting `dataSchema` to `undefined` reads the columns from the data, a change when they differ.
- `dataSchema` together with `data` resets the same way when the columns changed. `data` alone keeps the state, as in
  18.1. `dataSchema` together with `columns`, or a grid with a `columns` option, behaves as before.

:::

### 27. A `dataSchema` with non-`null` values creates a column for each value

Without [`columns`](@/api/options.md#columns), [`dataSchema`](@/api/options.md#dataschema) decides which property each
column reads. In 18.1, only a `null` value created a column property. A column for another value (`0`, `'x'`, `false`)
had no property and rendered blank although the data held a value. In 19.0, every value except an array, a function,
and a non-plain object (such as a `Date` or a `Map`) creates a column property, whatever its default. Columns follow the
key order of the schema, so a schema that mixes `null` and non-`null` values gets a new column order.

**Affects:** Apps with a non-`null` `dataSchema` value, no `columns`, and a column addressed by index, for example
[`colHeaders`](@/api/options.md#colheaders) as an array, [`hiddenColumns`](@/api/options.md#hiddencolumns),
[`colWidths`](@/api/options.md#colwidths), [`cell`](@/api/options.md#cell), or
[`getDataAtCol()`](@/api/core.md#getdataatcol).

**Do:** Set `columns` and name each property in `data`, so the order no longer depends on the schema. Or use `null` for
each schema value, as the grid does when it reads the schema from your data.

Without `columns`, the schema decides:

```js
// 18.1: column 0 is `id`, column 1 is `name`, column 2 has no property and renders blank
// 19.0: column 0 is `isNew`, column 1 is `id`, column 2 is `name`
const hot = new Handsontable(container, {
  data: [{ isNew: true, id: 1, name: 'Ted' }],
  dataSchema: { isNew: true, id: null, name: null },
});
```

With `columns`, the order no longer depends on the schema:

```js
const hot = new Handsontable(container, {
  data: [{ isNew: true, id: 1, name: 'Ted' }],
  dataSchema: { isNew: true, id: null, name: null },
  columns: [{ data: 'id' }, { data: 'name' }],
});
```

### 28. `colWidths: null` sizes columns like `undefined`

In 18.1, [`colWidths: null`](@/api/options.md#colwidths) was passed on as a width:
[`getColWidth()`](@/api/core.md#getcolwidth) returned `null` and every column was 50px, although
[`AutoColumnSize`](@/api/autoColumnSize.md) reported itself enabled. In 19.0, `null` sets no width, like `undefined`,
and AutoColumnSize sizes the columns.

**Affects:** Apps that set `colWidths: null` and rely on 50px columns, check `width === null` in a
[`modifyColWidth`](@/api/hooks.md#modifycolwidth) callback, or expect `getColWidth()` to return `null`.

**Do:** For fixed 50px columns, set `colWidths: 50`. In `modifyColWidth`, check `width === undefined` (or `width == null`).

::: details Details: colWidths: null sizes columns like undefined
- A `null` entry in a `colWidths` array, or a `colWidths` function returning `null`, also sets no width:
  `getColWidth()` returns the default width and `modifyColWidth` receives `undefined`. AutoColumnSize stays off there
  (any other `colWidths` value turns it off), so those columns keep 50px.
- A column `width: null` behaves like `undefined` and falls back to `colWidths`.

:::

### 29. Row elements move with their rows on a vertical scroll

Since 18.0, every `tr` and `td` stayed at its DOM position during a scroll and received the row that scrolled into it.
In 19.0, a vertical scroll inside the grid's own scrollable area moves the `tr` elements: a row that stays rendered
keeps its element, and rows that scrolled out wrap to the other end of the `tbody` and take the rows that scrolled in.
DOM order still matches rendered order, and the column axis is unchanged. There is no option.

**Affects:** Apps that observe the `tbody` with a `MutationObserver`, keep references to a `tr` or `td`, render cells by
where the rendered area starts or ends, or run `:has()` selectors on the host page.

**Do:** Nothing for a renderer that writes the cell from the data it receives. Read a row through
[`getCell()`](@/api/core.md#getcell) or its position in the `tbody` instead of holding a `tr` or `td`. A renderer that
depends on where the rendered area starts or ends (for example
[`getFirstRenderedVisibleRow()`](@/api/core.md#getfirstrenderedvisiblerow)) needs a change only under
[`renderMode`](@/api/options.md#rendermode)`: 'onChange'`, where a scroll does not repaint such a cell: set
`renderMode: 'always'` on that column or cell, or call [`markCellChanged()`](@/api/core.md#markcellchanged) before you
render.

::: details Details: Row elements move with their rows on a vertical scroll
- It applies whether or not you set `renderMode`, when the grid scrolls inside its own container on both axes. A grid
  that scrolls with the page keeps elements in place.
- A `MutationObserver` on the `tbody` sees `childList` records on every scroll step (moved `tr` elements, removed and
  added in one move). Nothing is created or dropped while the rendered row count is unchanged.
- A kept `tr` or `td` reference holds the same row while it stays rendered, so a renderer that caches per element keeps
  its cache across a scroll.
- `:has()` selectors that reach the grid cost a style recalculation per DOM move, as with the 16.x re-insertion. On a
  page with 30,000 nodes and three `:has()` rules the cost stayed flat. If yours does not, open an issue.
- [`modifySinglePassLayout`](@/api/hooks.md#modifysinglepasslayout) no longer opts a grid out of this behavior. It still
  switches the layout model.

:::

### 30. `getCopyableData()` returns a string

[`getCopyableData()`](@/api/core.md#getcopyabledata) was documented and typed as returning a string, but returned the
value as stored (number, boolean, `null`, `undefined`, array, object). In 19.0, it returns a string: numbers and
booleans become their text form, `null` and `undefined` become an empty string, and any other value goes through
`toString()`. A cell with [`copyable`](@/api/options.md#copyable) `false` still returns an empty string.

**Affects:** Apps that compare the result with a non-string (`hot.getCopyableData(0, 0) === 1`), read a property or item
of it (`.name` on an object cell now reads from a string and gives `undefined` or a character, with no error), or use the
result of `getCopyableSourceData()` as a string in TypeScript without narrowing (it no longer compiles).

**Do:** To read the stored value, call [`getDataAtCell()`](@/api/core.md#getdataatcell). It ignores `copyable`, so check
that yourself if you rely on it. In TypeScript, narrow the result of
[`getCopyableSourceData()`](@/api/core.md#getcopyablesourcedata) first.

Before:

```js
if (hot.getCopyableData(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}
```

After:

```js
if (hot.getCellMeta(0, 0).copyable && hot.getDataAtCell(0, 0) === 1) {
  hot.setDataAtCell(0, 1, 'Approved');
}
```

```ts
const value = hot.getCopyableSourceData(0, 0);

if (typeof value === 'string') {
  hot.setDataAtCell(0, 1, value.trim());
}
```

::: details Details: getCopyableData() returns a string
- The result can differ from the clipboard text for an object with its own `valueOf()` (such as a date-library
  instance): the clipboard uses `valueOf()`, `getCopyableData()` uses `toString()`.
- Copy, cut, and autofill are unaffected. [`beforeCopy`](@/api/hooks.md#beforecopy),
  [`afterCopy`](@/api/hooks.md#aftercopy), [`beforeCut`](@/api/hooks.md#beforecut), [`afterCut`](@/api/hooks.md#aftercut),
  and [`beforeAutofill`](@/api/hooks.md#beforeautofill) still receive stored values.
- `getCopyableSourceData()` is unchanged at run time (stored value, nested objects included). Only its TypeScript return
  type changes, from `string` to `unknown`.

:::

### 31. The copy, cut, and paste shortcuts are registered in the `grid` context

In 18.1, the `grid`
[shortcut context](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts) had no entry
for <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**C**</kbd>, <kbd>**X**</kbd>, and <kbd>**V**</kbd>: the browser ran
them unlisted. In 19.0, the context registers all three as default shortcuts in the `gridClipboard` group. They do
nothing on their own, and the browser still runs the action. As real entries,
[`hasShortcut()`](@/api/shortcutContext.md#hasshortcut) returns `true` for them,
[`getShortcuts()`](@/api/shortcutContext.md#getshortcuts) returns the default entry, and
[`removeShortcutsByKeys()`](@/api/shortcutContext.md#removeshortcutsbykeys) removes it, after which the
[`CopyPaste`](@/api/copyPaste.md) plugin cancels the combination, so the key no longer copies, cuts, or pastes.

**Affects:** Apps that add their own shortcut on one of these keys and later call `removeShortcutsByKeys()` to restore
the native behavior (it now also removes the default entry), or that expect an empty list or `false` from
`getShortcuts()` or `hasShortcut()` for these keys.

**Do:** Remove your own entry by its `group` with
[`removeShortcutsByGroup()`](@/api/shortcutContext.md#removeshortcutsbygroup), which leaves the default entry. When you
read these keys, ignore the default entry by its group.

Before, remove your own entry by its keys:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcuts([{
  keys: [['control/meta', 'v']],
  callback: () => customPaste(),
  group: 'myPaste',
}]);

// Later, to get the native paste back
gridContext.removeShortcutsByKeys(['control/meta', 'v']);
```

After, remove it by its group:

```js
const gridContext = hot.getShortcutManager().getContext('grid');

gridContext.addShortcuts([{
  keys: [['control/meta', 'v']],
  callback: () => customPaste(),
  group: 'myPaste',
}]);

// Later, to get the native paste back
gridContext.removeShortcutsByGroup('myPaste');
```

Before, an empty list meant that nobody had registered the key:

```js
const gridContext = hot.getShortcutManager().getContext('grid');
const hasOwnCopy = gridContext.getShortcuts(['control/meta', 'c']).length > 0;
```

After, ignore the default entry by its group:

```js
const gridContext = hot.getShortcutManager().getContext('grid');
const hasOwnCopy = gridContext
  .getShortcuts(['control/meta', 'c'])
  .some(({ group }) => group !== 'gridClipboard');
```

::: details Details: The copy, cut, and paste shortcuts are registered in the grid context
- To turn off keyboard copy, cut, or paste on purpose, keep using `removeShortcutsByKeys()`. The context menu items and
  [`copy()`](@/api/copyPaste.md#copy), [`cut()`](@/api/copyPaste.md#cut), and [`paste()`](@/api/copyPaste.md#paste)
  keep working. Full behavior:
  [Remove the copy, cut, and paste shortcuts](@/guides/navigation/custom-shortcuts/custom-shortcuts.md#remove-the-copy-cut-and-paste-shortcuts).

:::

### 32. `checked` is a reserved context menu item property

Handsontable's own toggle items ("Read only", "Read-only comment", and the four border items) used to carry their check
mark as an HTML string in `name`, which a page enforcing `require-trusted-types-for 'script'` rejected. Each item now
declares its state in a `checked` option, and Handsontable builds the mark as a DOM node. So every item of a
[context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) or
[column menu](@/guides/accessories-and-menus/column-menu/column-menu.md) reads `checked`. Your own item with a `checked`
boolean, the string `'mixed'`, or a function returning either now draws a mark before its label (a check mark for
`true`, a dash for `'mixed'`) and is announced as a checkbox with a state. Any other value is ignored.

**Affects:** Apps with their own menu items that use a `checked` property, draw a mark inside `name`, or style the 18.1
mark with `span.selected::after`. Apps that load a theme without icons (`ht-theme-main-no-icons.css` and the other
`-no-icons` bundles) are affected with no custom item at all: the built-in "Read only" and border items now draw
`ht-icon-check`, so their mark is blank.

**Do:**

1. If `checked` was your own bookkeeping, rename it.
2. If you drew the mark inside `name`, use the option instead (both together give two marks).
3. On a theme without icons (such as `ht-theme-main-no-icons.css`), give both mark icons a mask. This also restores
   the mark of the built-in items.

   ```css
   .htItemWrapper .ht-icon-check,
   .htItemWrapper .ht-icon-collapse-off {
     mask-size: contain;
     mask-repeat: no-repeat;
     mask-position: center;
     background-color: currentColor;
   }

   .htItemWrapper .ht-icon-check { mask-image: url('/icons/check.svg'); }
   .htItemWrapper .ht-icon-collapse-off { mask-image: url('/icons/dash.svg'); }
   ```

Before:

```js
items: [
  { name: 'Sync', checked: isSyncing, callback() { /* ... */ } },
  { name: () => `<span class="selected">&#10003;</span>My toggle`, checked: myState },
],
```

After:

```js
items: [
  { name: 'Sync', syncing: isSyncing, callback() { /* ... */ } },
  { name: 'My toggle', checked: () => myState },
],
```

::: details Details: checked is a reserved context menu item property
- "Read only" and "Read-only comment" use `'mixed'` when only some selected cells are read-only, and show a dash where
  they showed a check mark.
- The check mark is `<i class="ht-icon ht-icon-check">` inside `span.selected`. The dash is
  `<i class="ht-icon ht-icon-collapse-off">` inside `span.htMixed`.
- A `span.selected::after` rule from 18.1 paints nothing: the span keeps `font-size: 0`, so the pseudo-element inherits
  it and renders no box. See [Icons are rendered as `<i>` elements](#icons-are-rendered-as-i-elements).
- The `checked` form needs no [`sanitizer`](@/api/options.md#sanitizer). A `name` with markup is written through
  `innerHTML`, so under Trusted Types it needs a policy-backed sanitizer. A plain label does not.

:::

### 33. HTML output changes for `TrustedHTML` paste, `toHTML()` headers, and character references

Three changes affect what a [`sanitizer`](@/api/options.md#sanitizer) sees and how Handsontable writes text. The third
applies with or without a `sanitizer`.

**Affects:** Apps whose `sanitizer` returns a `TrustedHTML` (any markup it permits inside a `<td>` now reaches the cell
value, not only markup it adds), apps that read `toHTML()` output, and apps that write HTML character references in
dialog, empty-state, button, or cell text.

**Do:**

1. A `sanitizer` that returns a `TrustedHTML` owns what lands in cells, because a `TrustedHTML` now skips paste
   normalization: check which markup it permits inside a `<td>`. If it adds markup (a linkify-style step), skip that
   step for pasted-HTML sources (`source` starts with `CopyPaste.paste`).

   ```js
   sanitizer: (content, source) => {
     if (source.startsWith('CopyPaste.paste')) {
       return policy.createHTML(DOMPurify.sanitize(content));
     }

     return policy.createHTML(linkify(DOMPurify.sanitize(content)));
   },
   ```

2. Nothing, unless you read header markup from `toHTML()` output: it now goes through your sanitizer. With
   `colHeaders: ['<b>ID</b>']` and a sanitizer that strips markup, the markup no longer survives.
3. Character references: write the character itself, a numeric reference, or the lower-case spelling.

::: details Details: HTML output changes for TrustedHTML paste, toHTML() headers, and character references
- **Paste normalization.** A string-returning sanitizer is unchanged: Handsontable hands it the clipboard payload as
  carried, then flattens each `<td>` to text, so cell values keep no markup except `<br>`. A
  [`TrustedHTML`](@/guides/security/security/security.md#trusted-types-and-csp) (required on a page enforcing
  `require-trusted-types-for 'script'`) reaches the parser unchanged, because concatenating, re-testing, or stringifying
  it strips the trust, so Handsontable skips the flattening (a string rewrite). Markup your sanitizer permits inside a
  `<td>` now arrives in the cell value, where the [`html`](@/guides/cell-types/cell-type/cell-type.md) cell type or a
  custom renderer interprets it.
- **`toHTML()`.** [`toHTML()`](@/api/core.md#tohtml) used to interpolate column and row headers unsanitized, while
  [`toTableElement()`](@/api/core.md#totableelement) sanitized them. Both now sanitize, and neither emits the
  missing-sanitizer console warning any more (both are read-only).
- **Character references**, with or without a `sanitizer`. Dialog titles and descriptions, empty-state copy, button
  labels, and the cell text from `toTableElement()` used to be HTML strings assigned to `innerHTML`, so the browser
  decoded character references. They now build DOM nodes, and Handsontable resolves references against a fixed set of
  names. Numeric references (`&#8212;`, `&#x2014;`) and the named ones in ordinary copy (`&amp;`, `&lt;`, `&gt;`,
  `&quot;`, `&apos;`, `&nbsp;`, the punctuation and currency names) work as before. Two kinds now render as written: a
  name outside the set (`a &hearts; b` displays as is, not `a ♥ b`) and an upper-case name (`&AMP;`, `&COPY;`, `&REG;`,
  valid HTML but left as written).

:::

### 34. `removeCellMeta()` accepts an index past the grid's range

This is a bug fix, not a breaking change. In 18.1, [`removeCellMeta()`](@/api/core.md#removecellmeta) threw
`Assertion failed: Expecting an unsigned number` for a row or column index outside the grid's range, while
[`setCellMeta()`](@/api/core.md#setcellmeta) accepted it. In 19.0, `removeCellMeta()` matches it: it takes the index as
the physical index and removes the key from the cell meta stored there.

**Affects:** Apps that call `removeCellMeta()` past the last row or column and catch the error, or that trim rows or
columns ([`trimRows`](@/api/options.md#trimrows), a filter) and call it past the visible range.

**Do:** Pass the visual index of a cell the grid shows. To skip an index outside the grid, check it against
[`countRows()`](@/api/core.md#countrows) and [`countCols()`](@/api/core.md#countcols).

```js
if (row < hot.countRows() && column < hot.countCols()) {
  hot.removeCellMeta(row, column, 'className');
}
```

::: details Details: removeCellMeta() accepts an index past the grid's range
- A coordinate captured before the data shrank (for example through [`updateData()`](@/api/core.md#updatedata), which
  keeps cell meta) still addresses the record you wrote it to.
- With trimmed rows, an index past the visible range names a physical record: a still-live trimmed record, or a row the
  grid shows at a different visual index (when trimmed rows sit above it). In 18.1 the call threw. Now it removes the key
  there without an error.

:::

### 35. The `AutoRowSize` plugin's settings no longer include `useHeaders`

In 18.1, the default settings of the [`AutoRowSize`](@/api/autoRowSize.md) plugin held a `useHeaders: true` key that
nothing read. 19.0 removes it. Row heights are measured exactly as before, but
`hot.getPlugin('autoRowSize').getSetting('useHeaders')` returns `undefined` instead of `true`, and the object
`getSetting()` returns has no `useHeaders` key.

**Affects:** Code that reads `useHeaders` from the `AutoRowSize` plugin's settings.

**Do:** Remove the read. `AutoRowSize` never used the value. To decide whether column headers count toward column
widths, set `useHeaders` in the [`autoColumnSize`](@/api/options.md#autocolumnsize) option, which still reads it.

## TypeScript-only changes

These changes affect type checking only. Your app runs the same, except for the two Vue 3 props the Vue 3 change
names. The table also links the type changes that come with changes in other groups.

| Change | Affects | Do |
| --- | --- | --- |
| [Ten options are type-checked](#ten-options-are-type-checked) | TypeScript apps that set or read one of ten options | Fix the reported types |
| [`filters` is type-checked](#the-filters-option-is-type-checked) | TypeScript apps that set `filters` to an object | Remove unknown keys |
| [Vue 3 props are type-checked](#the-vue-3-wrapper-props-are-type-checked) | Vue 3 apps, and apps that pass `handsontable` or `getValue` (runtime) | Fix prop types; move hooks to `HotTable` |
| [`HotColumn` hook props](#hotcolumn-no-longer-types-hook-props) | React TypeScript apps that pass a hook to `HotColumn` | Move the hook to `HotTable` |
| [`afterChange` changes are `AppliedCellChange[]`](#a-change-that-waits-for-its-validator-stays-on-its-record) | TypeScript apps that type `afterChange`, `beforeChangeRender`, `modifyData`, or `afterValidate` | Allow a `null` row |
| [`colToProp()` and `propToCol()` can return `null`](#coltoprop-and-proptocol-return-null-for-an-unknown-column) | TypeScript apps with `strictNullChecks` that store the result as a `number` | Check the result for `null` |
| [Unfreeze hooks take `finalIndex`](#frozen-columns-can-be-dragged-and-the-unfreeze-hooks-get-a-target) | TypeScript code that calls an unfreeze hook with two arguments | Pass the third argument |
| [`getThemeConfig().icons` and `IconKey`](#icons-are-rendered-as-i-elements) | TypeScript code that reads theme icons or switches over `IconKey` | Narrow with `typeof`; add the new keys |
| [`DataProviderConfig.rowId` can be a function](#a-string-dataproviderrowid-reads-a-property-with-a-dot-in-its-name) | TypeScript code that reads `rowId` back as a string | Narrow with `typeof rowId === 'string'` |
| [`getCopyableSourceData()` returns `unknown`](#getcopyabledata-returns-a-string) | TypeScript code that uses its result as a string | Narrow the result |
| [Hook settings and React hook props accept `null`](#a-hook-set-to-null-through-updatesettings-is-removed) | TypeScript code that reads a hook prop back | Handle `null` |
| [`Settings` and `DataProviderOptions` types removed](#removed-deprecated-apis) | TypeScript code that imports either alias | Import `ExportFileSettings` or `DataProviderFetchOptions` |

### 1. Ten options are type-checked

In 18.1, TypeScript typed ten documented options as `any`, so a wrong value compiled. Each option now has its real
type. Nothing changes at runtime.

**Affects:** You use TypeScript, and your code stops compiling in one of the cases below.

**Do:** Give the option a value of its type, and handle `undefined` when you read an option back. Each option is
optional.

Before, `getSettings().valueParser` was `any`:

```ts
const parsed = hot.getSettings().valueParser(value, cellProperties);
```

After:

```ts
const parsed = hot.getSettings().valueParser?.(value, cellProperties);
```

For `notification`, remove the keys the plugin does not read, such as `duration`. It reads only `stackLimit` and
`animation`, so set a toast's duration where you show the message. If a value comes from a source that TypeScript
cannot check, such as a configuration file, convert it where you read it:

```ts
import type { GridSettings } from 'handsontable';

const settings: GridSettings = {
  maxSelections: Number(config.maxSelections), // A string, such as '3', no longer compiles.
};
```

::: details Details: Ten options are type-checked
- The ten options fell into the `[key: string]: any` index signature of `GridSettings`. Their types:

  | Option | Type |
  | ------ | ---- |
  | [`enterCommits`](@/api/options.md#entercommits), [`filterSelectedItems`](@/api/options.md#filterselecteditems), [`searchInput`](@/api/options.md#searchinput), [`injectCoreCss`](@/api/options.md#injectcorecss), [`parsePastedValue`](@/api/options.md#parsepastedvalue) | `boolean` |
  | [`maxSelections`](@/api/options.md#maxselections) | `number` |
  | [`notification`](@/api/options.md#notification) | `boolean`, or an object with `stackLimit` and `animation` |
  | [`theme`](@/api/options.md#theme) | A theme name, a theme config object, or a `ThemeBuilder` |
  | [`valueParser`](@/api/options.md#valueparser) | A function that takes the editor value and the cell properties |
  | [`sourceSortFunction`](@/api/options.md#sourcesortfunction) | A function that takes an array of list entries and returns one |

- Compile errors appear when:
  - a `boolean` option holds another type, such as `0` or `'true'`, or `maxSelections` holds a numeric string;
  - the `notification` object has a key other than `stackLimit` or `animation`, or `theme` is neither a string nor an
    object;
  - an option holds `null`, as in `updateSettings({ notification: null })`. The grid treats `null` as unset, but the
    types do not. Pass `undefined`;
  - your code reads an option back from `getSettings()`, `getCellMeta()`, or a custom editor's `cellProperties` and
    uses it as a definite value, because it may now be `undefined`;
  - your code calls a `ThemeBuilder` method on `getSettings().theme`. The type is `string | object`, because `object`
    absorbs `ThemeBuilder`, so `typeof` narrows only to `object`. Use `instanceof ThemeBuilder` or cast;
  - you use `Required<GridSettings>` or a mapped type over its keys. All ten options become required, so an object
    typed that way is missing them (TS2740);
  - your code calls `valueParser` with one argument. It now declares both parameters.
- A callback you write for `valueParser` or `sourceSortFunction` still compiles, whether it annotates its parameters or
  leaves TypeScript to infer them.

:::

### 2. The `filters` option is type-checked

In 18.1, TypeScript typed the [`filters`](@/api/options.md#filters) option as `boolean | object`, so a misspelled key
or a wrong value compiled and was ignored at runtime. The option now has real types. Nothing changes at runtime.

**Affects:** You use TypeScript, and your code stops compiling in one of the cases below. For an unknown key, an
out-of-range `searchMode`, and an extra key in a column's `filters` object, the setting already had no effect, so
fixing the error does not change what your grid does. A valid `searchMode` that your code holds in a `string` variable
(or in a `Record<string, unknown>` object) also fails to compile, although it works.

**Do:** Correct or remove the key that the compiler rejects, or move a per-column object to the grid level. For a
valid value typed as `string`, add `as const`. Do not delete the key.

Before, this compiled, and the misspelled key did nothing:

```ts
filters: {
  searchmode: 'apply',
},
```

After:

```ts
filters: {
  searchMode: 'apply',
},
```

Before, this compiled, but the grid ignored the object and logged a warning:

```ts
columns: [
  { filters: { filterFixedRows: false } },
],
```

After:

```ts
filters: {
  filterFixedRows: false,
},
```

::: details Details: The filters option is type-checked
- At the grid level, the object accepts only `searchMode` (`'show'` or `'apply'`), `filterFixedRows` (a boolean), and
  `availableConditions`, which is new in 19.0. See
  [Choose the conditions the filter menu offers](@/guides/columns/column-filter/column-filter.md#choose-the-conditions-the-filter-menu-offers).
- Inside [`columns`](@/api/options.md#columns), `filters` is a boolean or an object that holds only
  `availableConditions`. Only `false` has ever had an effect there.
- Compile errors appear when the grid-level object has another key (ignored without a warning), when `searchMode` holds
  another value (ignored, with a warning), or when a column's `filters` object has a key other than
  `availableConditions` (ignored, with a warning).
- A valid setting stops compiling when its value has a wider type than the option accepts: `searchMode` from a
  variable typed `string`, or a `filters` object typed `Record<string, unknown>`. Narrow the type:

  Before, `searchMode` is a `string`, which 19.0 rejects:

  ```ts
  const config = { searchMode: 'apply' };
  ```

  After, `as const` keeps the literal type `'apply'`:

  ```ts
  const config = { searchMode: 'apply' } as const;
  ```

- To type a separate settings object, use the exported type:

  ```ts
  import Handsontable from 'handsontable';

  const filtersSettings: Handsontable.plugins.Filters.Settings = {
    searchMode: 'apply',
  };
  ```

:::

### 3. The Vue 3 wrapper props are type-checked

In 18.1, `HotTable` and `HotColumn` declared every prop as `any`. Each prop now has the type of the option it sets,
so a type check of your templates (`vue-tsc`) or `h()` calls (`tsc`) rejects wrong values. Two runtime changes come with
the new types: `handsontable` is now a prop of `HotTable` and `HotColumn`, and `getValue` is now a prop of `HotTable`.

**Affects:** You use `vue-tsc` on your templates or `tsc` on your `h()` calls. Or you pass `handsontable` or `getValue`
to these components and relied on it being ignored.

**Do:** Fix the value that the type check rejects, or cast it when the type is wrong for your case. If you passed
`handsontable` or `getValue` and relied on it being ignored, check that the value now applied to the grid settings is
the one you want, or remove the prop.

Before, the template compiled and failed at runtime:

```vue
<HotTable :sheetsBar="42" :readOnly="'yes'" />
```

After:

```vue
<HotTable :sheetsBar="{ sheets }" :readOnly="true" />
```

A value your own types cannot narrow:

```vue
<HotTable :readOnly="(isLocked as boolean)" />
```

::: details Details: The Vue 3 wrapper props are type-checked
- In 18.1, `<HotColumn :handsontable="...">` never reached the column settings, and `<HotTable :handsontable="...">` and
  `<HotTable :getValue="...">` fell through as attributes on the root `div`. They now reach the grid settings. A
  `getValue` on a `HotColumn` still has no effect.
- `HotTable` takes the types of [`updateSettings()`](@/api/core.md#updatesettings), so a hook prop may be `null`, which
  removes its callback. `HotColumn` takes the types of the column settings, where `data` is a property name or a getter
  instead of an array of rows. `HotColumn` has no hooks or `getValue`, because core reads both from the table settings
  only.
- Compile errors appear when:
  - a prop holds a value of another type, such as `:readOnly="'yes'"` or `:sheetsBar="42"`;
  - `HotTable` gets `:data="null"`, as in `:data="isLoaded ? rows : null"`. Pass `undefined` or an empty array;
  - `HotColumn` gets a hook, such as `:afterChange="onChange"`, or `:getValue`. Both type-check in a template only
    without `strictTemplates`, and fail in an `h()` call. Move the hook to `HotTable`, as it never ran on a column;
  - a `getter` column passes `:data="(row, value) => ..."` with a required second parameter. The type takes a function
    that also works with one argument, so write `(row, value?) => ...`;
  - you turned on `strictTemplates` in `vueCompilerOptions`, and a template passes a prop that is not an option, such
    as a custom cell meta key. Without `strictTemplates`, it still compiles. A `class`, a `style`, and an `aria-`
    attribute compile either way.
- A prop that you leave out is still optional.
- A bare attribute, such as `<HotTable readOnly>`, passes the type check but does not set the option to `true`: the
  grid gets an empty string, which is falsy, because the wrapper does not cast attributes to booleans. This was already
  the case in 18.1. Write the value:

  Before, the template compiles and does nothing:

  ```vue
  <HotTable readOnly rowHeaders />
  ```

  After:

  ```vue
  <HotTable :readOnly="true" :rowHeaders="true" />
  ```

:::

### 4. `HotColumn` no longer types hook props

In 18.1, the TypeScript props of the React `HotColumn` component listed every grid hook, such as
[`afterChange`](@/api/hooks.md#afterchange) and [`beforeKeyDown`](@/api/hooks.md#beforekeydown). Hooks run at the grid
level only, so a hook on `HotColumn` never ran. In 19.0, the `HotColumn` props leave the hooks out. Nothing changes at
runtime.

**Affects:** You pass a hook to `HotColumn` and compile with `noImplicitAny` (part of `strict`). The hook's parameters
are now implicitly `any`, which is error TS7006. Without `noImplicitAny`, your code still compiles.

**Do:** Move the hook to `HotTable`, where hooks run. Because the hook never ran, this does not change what your grid
does. See [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md).

Before, this compiled, but `afterChange` never ran:

```tsx
<HotTable data={data}>
  <HotColumn data="price" afterChange={(changes, source) => {}} />
</HotTable>
```

After:

```tsx
<HotTable
  data={data}
  afterChange={(changes, source) => {
    // Check `changes` to react to a specific column.
  }}
>
  <HotColumn data="price" />
</HotTable>
```

## Deprecated in 19.0

These APIs keep compiling in 19.x, and 20.0.0 removes them. Each method and option still works and logs a one-time
console warning. The `NON_COMMERCIAL_LICENSE` constant logs none, and its key no longer unlocks the grid. The table also
links the deprecations that come with changes in other groups.

| Change | Affects | Do |
| --- | --- | --- |
| [Writing past the last column](#writing-past-the-last-column-of-an-object-data-source-is-deprecated) | Writes and pastes past the last column of object data | Declare columns, or use `setDataAtRowProp()` |
| [`spliceCol()` and `spliceRow()`](#splicecol-and-splicerow-are-deprecated) | Calls to either method | Use `populateFromArray()` or `alter()` |
| [Formulas shortcut methods](#formulas-shortcut-methods) | Calls to `registerShortcuts()` or `unregisterShortcuts()` | Remove the calls |
| [Four `MergedCellsCollection` methods](#four-mergedcellscollection-methods-are-deprecated) | Calls to one of the four methods | Remove the calls |
| [The `sr-SP` language code](#the-sr-sp-language-code-is-deprecated) | Apps that set `language: 'sr-SP'` (loading `sr-SP.js` alone logs nothing) | Use `sr-Latn-RS` |
| [Angular `NON_COMMERCIAL_LICENSE` constant](#the-non-commercial-and-evaluation-license-key-no-longer-works) | Apps that import it from `@handsontable/angular-wrapper`; a grid configured with it shows the lock screen | Pass your key in `HOT_GLOBAL_CONFIG` |
| [`iconsMap` helper](#icons-are-rendered-as-i-elements) | Custom themes that import `iconsMap` | Use `iconStyles()` |

### 1. Writing past the last column of an object data source is deprecated

Writing to a column index the grid has no column for adds a property named after the index, which no column can
display. On an object data source, that write is deprecated since 19.0.0: it prints a one-time console warning and still
lands. From 20.0.0, the write is skipped, and no [`beforeChange`](@/api/hooks.md#beforechange) or
[`afterChange`](@/api/hooks.md#afterchange) entry is reported for it.

**Affects:** Your [`data`](@/api/options.md#data) is an array of objects, or your
[`dataSchema`](@/api/options.md#dataschema) is a function, and a [paste](@/guides/cell-features/clipboard/clipboard.md),
[`populateFromArray()`](@/api/core.md#populatefromarray), or [`setDataAtCell()`](@/api/core.md#setdataatcell) can write
to a column index with no column.

**Do:**

1. For a `setDataAtCell()` call of your own, address the field by name with
   [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop). For example, with two declared columns and three fields:

   ```js
   const hot = new Handsontable(container, {
     data: rows,
     dataSchema: { id: null, name: null, city: null },
     columns: [{ data: 'id' }, { data: 'name' }],
     // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
   });
   ```

   Before, the property is named after the column index:

   ```js
   hot.setDataAtCell(0, 2, 'Boston');
   hot.getSourceData()[0][2]; // 'Boston'
   ```

   After, name the field you mean:

   ```js
   hot.setDataAtRowProp(0, 'city', 'Boston');
   hot.getSourceData()[0].city; // 'Boston'
   ```

2. For a paste or a `populateFromArray()` call, declare a column for every field the content can reach, so the grid has
   a column for every field:

   ```js
   const hot = new Handsontable(container, {
     data: rows,
     dataSchema: { id: null, name: null, city: null },
     colHeaders: ['ID', 'Name', 'City'],
     // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
   });
   ```

::: details Details: Writing past the last column of an object data source is deprecated
- Other paths:
  - To drop the overflow of a paste today, set [`allowInsertColumn`](@/api/options.md#allowinsertcolumn) to `false`.
    The paste then stops at the last column, whatever the data source. It does not stop a direct `setDataAtCell()` call.
  - If the incoming width is not known up front, use an array-of-arrays [`data`](@/api/options.md#data) source, which
    grows on demand.
- With `setDataAtRowProp()`, the grid can keep showing no column for the field, and listing the field in
  [`dataSchema`](@/api/options.md#dataschema) is optional.
- The warning prints only for a write that lands. If a [`beforeChange`](@/api/hooks.md#beforechange) listener already
  drops the change, cancels the call, or points it at a named field, nothing is printed.
- From 20.0.0, the "Before" write above is skipped: `rows[0]` keeps only its declared fields. In 19.0, it also holds
  `2: 'Boston'`.
- A paste with the [`copyPaste`](@/api/options.md#copypaste) option's `pasteMode` set to `'shift_right'` also pushes
  existing values past the last column, and those are deprecated the same way.
- Why: an object source takes its column count from the first row or from [`dataSchema`](@/api/options.md#dataschema),
  so a write past it cannot create a column. The value lands on an undeclared property that no column renders.
  [`getSourceData()`](@/api/core.md#getsourcedata) still returns it, so it reaches anything that serializes the row (a
  save, a request payload, a schema validator). [`countSourceCols()`](@/api/core.md#countsourcecols) counts it too when
  the write lands on the first row.
- Unchanged: `setDataAtRowProp()`, which names the field and keeps writing fields with no column. Also unchanged: array
  data sources (the index names a real slot, so the write lands without a warning, and where the grid may grow, the
  column is created as before) and a grid with no declared columns.

:::

### 2. `spliceCol()` and `spliceRow()` are deprecated

[`spliceCol()`](@/api/core.md#splicecol) and [`spliceRow()`](@/api/core.md#splicerow) are deprecated since 19.0.0. Each
prints a one-time console warning and still works as before. 20.0.0 removes them.

**Affects:** Your code calls `hot.spliceCol(...)` or `hot.spliceRow(...)`.

**Do:** Change the data yourself and write it back with [`populateFromArray()`](@/api/core.md#populatefromarray), or use
[`alter()`](@/api/core.md#alter) to add or remove whole rows and columns. Read the column, run
`Array.prototype.splice()` on it, and write the shifted tail back from the same row.

Before:

```js
// Remove the cell in column 1 at row 1, shifting the cells below it up.
hot.spliceCol(1, 1, 1);
```

After:

```js
const column = hot.getDataAtCol(1);
const shifted = column.slice(2);
shifted.push(null);
hot.populateFromArray(1, 1, shifted.map(value => [value]));
```

`spliceRow()` is the same, along the row. Its `populateFromArray()` form takes a single inner array:

Before:

```js
// Remove the cell in row 1 at column 1, shifting the cells to its right left.
hot.spliceRow(1, 1, 1);
```

After:

```js
const row = hot.getSourceDataAtRow(1);
const shifted = row.slice(2);
shifted.push(null);
hot.populateFromArray(1, 1, [shifted]);
```

::: details Details: spliceCol() and spliceRow() are deprecated
- The `spliceCol` and `spliceRow` change sources that [`beforeChange`](@/api/hooks.md#beforechange) and
  [`afterChange`](@/api/hooks.md#afterchange) report are unaffected in 19.x. They go away with the methods in 20.0.0,
  so do not build new code on them.

:::

### 3. Formulas shortcut methods

[`registerShortcuts()`](@/api/formulas.md#registershortcuts) and
[`unregisterShortcuts()`](@/api/formulas.md#unregistershortcuts) of the [`Formulas`](@/api/formulas.md) plugin are
deprecated no-op methods since 19.0.0. Each prints a one-time console warning. 20.0.0 removes them. The
<kbd>**Alt**</kbd> + <kbd>**Enter**</kbd> shortcut that opens a cell's link is now a core grid shortcut, registered for
every grid, so the plugin has nothing left for them to do.

**Affects:** Your code calls `hot.getPlugin('formulas').registerShortcuts()` or `.unregisterShortcuts()`, for example to
re-register the shortcut after disabling and re-enabling the plugin.

**Do:** Remove the calls. Nothing replaces them: the shortcut works on every grid, with or without the `Formulas`
plugin.

```js
const formulas = hot.getPlugin('formulas');

formulas.disablePlugin();
formulas.enablePlugin();
formulas.registerShortcuts(); // Remove this line.
```

::: details Details: Formulas shortcut methods
- <kbd>**Alt**</kbd> + <kbd>**Enter**</kbd> still opens the link of the selected cell the same way it always did.

:::

### 4. Four `MergedCellsCollection` methods are deprecated

The `MergeCells` plugin keeps a [`MergedCellsCollection`](@/api/mergedCellsCollection.md)
(`hot.getPlugin('mergeCells').mergedCellsCollection`). Its `getStartMostColumnIndex()`, `getEndMostColumnIndex()`,
`getTopMostRowIndex()`, and `getBottomMostRowIndex()` methods are deprecated since 19.0.0. Each prints a one-time
console warning. 20.0.0 removes all four.

**Affects:** Your code calls one of the four methods.

**Do:** Remove the call. There is no replacement: selection now steps over merged cells by itself.

::: details Details: Four MergedCellsCollection methods are deprecated
- Handsontable no longer calls these methods. They still return what they did, except that a merged cell whose rows a
  filter or `trimRows` hides is left out, because its coordinates point at the rows that took its place.

:::

### 5. The `sr-SP` language code is deprecated

IANA deprecated the `SP` region subtag, so 19.0 deprecates the `sr-SP` language code (the `sr-SP.js` file and the
`srSP` dictionary) and adds `sr-Latn-RS` with the same phrases. `sr-SP` still works in 19.x. Loading or registering the
file logs nothing. A grid that uses the code, with `language: 'sr-SP'`, logs a one-time console warning: "The "sr-SP"
language code will be removed in 20.0.0. Use the "sr-Latn-RS" language code instead."

**Affects:** Apps that set the [`language`](@/api/options.md#language) option to `'sr-SP'`. Apps that only load the
`sr-SP` file or dictionary get no warning, but 20.0.0 removes it.

**Do:** Load `sr-Latn-RS.js` (the `srLatnRS` dictionary) instead, and set `language: 'sr-Latn-RS'`. See
[Language](@/guides/internationalization/language/language.md).

## Also new in 19.0

These additions need no migration. The changes above point to them, and the
[Changelog](@/guides/upgrade-and-migration/changelog/changelog.md) lists the rest.

- The [`ImportFile`](@/api/importFile.md) plugin reads `.xlsx` files with the built-in XLSX engine. See
  [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md).
- The built-in XLSX engine makes ExcelJS optional for an XLSX export. See
  [XLSX export no longer needs ExcelJS](#xlsx-export-no-longer-needs-exceljs).
- The [`emptyValue`](@/api/options.md#emptyvalue) option picks what an emptied cell stores. In 18.1,
  <kbd>**Delete**</kbd>, [`setDataAtCell()`](@/api/core.md#setdataatcell), and a fill stored `null`, while clearing the
  editor or pasting a blank cell stored `''`. The option is opt-in, and the default is unchanged. See
  [Empty cell values](@/guides/getting-started/binding-to-data/binding-to-data.md#empty-cell-values).
- `undo: { maxHistory: <number> }` caps the memory the undo history uses. By default, the history has no size limit, as
  before.
- [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze) accepts an object. Set `restoreColumnPosition` to `true`
  to move an unfrozen column back to its place in the data source order. The default placement, right after the frozen
  columns, is unchanged. See
  [column freezing](@/guides/columns/column-freezing/column-freezing.md#restore-the-column-position-on-unfreeze).

---

::: tip Trademark notice
Microsoft® and Excel® are registered trademarks of Microsoft Corporation.
:::
