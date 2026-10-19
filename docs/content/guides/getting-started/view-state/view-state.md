---
type: how-to
title: Save and restore the view state
metaTitle: Save and restore the view state | Handsontable DataGrid for JavaScript
description: Capture how Handsontable DataGrid looks (sorting, filters, hidden and resized columns, selection, scroll position) as JSON, and restore it later.
permalink: /view-state
canonicalUrl: /view-state
tags:
  - view state
  - save view
  - restore view
  - persist
  - getViewState
  - setViewState
react:
  metaTitle: Save and restore the view state | Handsontable DataGrid for React
angular:
  metaTitle: Save and restore the view state | Handsontable DataGrid for Angular
vue:
  metaTitle: Save and restore the view state | Handsontable DataGrid for Vue
searchCategory: Guides
category: Data management
menuTag: new
addedIn: "19.0.0"
---

Capture how Handsontable DataGrid looks as a plain JSON object, and apply it again later. The view state covers sorting, filters, hidden and resized columns, frozen panes, the selection, and the scroll position. It never covers your data.

[[toc]]

## Overview

The view state is everything a user sets up to look at the data their own way. Use it to:

- Keep a user's layout across page reloads.
- Offer saved views, such as "Overdue orders" or "My columns".
- Share a layout between users or devices.

The [`ViewState`](@/api/viewState.md) plugin does the work. It has no setting: it is on as soon as its module is registered, which `registerAllModules()` does. It has three methods, and you reach them through `hot.getPlugin('viewState')`:

- [`getViewState()`](@/api/viewState.md#getviewstate) returns the current view as a JSON-serializable object.
- [`setViewState()`](@/api/viewState.md#setviewstate) applies such an object to the grid.
- [`validateViewState()`](@/api/viewState.md#validateviewstate) checks such an object against the grid without applying it.

To load only this module, register the plugin yourself:

```js
import { registerPlugin, ViewState } from 'handsontable/plugins';

registerPlugin(ViewState);
```

The object holds no functions, class instances, or references to the grid, so you can pass it through `JSON.stringify()` and store the result anywhere.

## Save a view

Call `getViewState()` to capture the view, and `setViewState()` to restore it.

In the example below, sort a column, filter it from the column menu, hide a column from the context menu, or drag a column border. Click **Save view**, change the view again, and click **Restore view**.

::: only-for javascript

::: example #example1 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/getting-started/view-state/javascript/example1.html)
@[code](@/content/guides/getting-started/view-state/javascript/example1.css)
@[code](@/content/guides/getting-started/view-state/javascript/example1.js)
@[code](@/content/guides/getting-started/view-state/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --css 1 --tsx 2 --jsx 3

@[code](@/content/guides/getting-started/view-state/react/example1.css)
@[code](@/content/guides/getting-started/view-state/react/example1.tsx)
@[code](@/content/guides/getting-started/view-state/react/example1.jsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/view-state/angular/example1.ts)
@[code](@/content/guides/getting-started/view-state/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/getting-started/view-state/vue/example1.vue)

:::

:::

To keep the view across page reloads, write the JSON to [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or send it to your server.

```js
// Save
localStorage.setItem('gridView', JSON.stringify(hot.getPlugin('viewState').getViewState()));

// Restore, for example right after you create the grid
const stored = localStorage.getItem('gridView');

// Nothing is stored on a first visit, and `setViewState()` applies nothing for a value that is not an object
if (stored !== null) {
  hot.getPlugin('viewState').setViewState(JSON.parse(stored));
}
```

The view state does not depend on your data, but it does depend on its shape. Restore a view onto the same kind of data it was captured from: the same columns in the same order in the source data. A stored row or column order applies only while its length matches the number of rows or columns in the grid.

## What the view state contains

`getViewState()` returns an object with `version: 1` and one property per part. Every part except `version` is optional.

```js
{
  version: 1,
  columnOrder: [0, 1, 2, 3, 4],
  sort: { columns: [{ column: 2, sortOrder: 'desc' }] },
  hiddenColumns: [4],
  columnWidths: [[0, 220]],
  frozen: { rowsTop: 0, rowsBottom: 0, columnsStart: 1, columnsEnd: 0 },
  selection: { /* ... */ },
  scroll: { row: 0, col: 0 },
  // ...
}
```

| Part | What it holds | Coordinates | Needs the plugin |
|---|---|---|---|
| `columnOrder` | Physical column indexes in their visual order | Physical | None |
| `rowOrder` | Physical row indexes in their visual order | Physical | None |
| `sort` | `columns`: a list of `{ column, sortOrder }`, where `sortOrder` is `'asc'` or `'desc'`. More than one column needs `MultiColumnSorting` | Physical, or a column property | [`ColumnSorting`](@/api/columnSorting.md) or [`MultiColumnSorting`](@/api/multiColumnSorting.md) |
| `filters` | The filter conditions, in the shape that [`exportConditions()`](@/api/filters.md#exportconditions) returns | Physical columns, or column properties | [`Filters`](@/api/filters.md) |
| `hiddenRows` | Hidden row indexes | Physical | [`HiddenRows`](@/api/hiddenRows.md) |
| `hiddenColumns` | Hidden column indexes | Physical, or column properties | [`HiddenColumns`](@/api/hiddenColumns.md) |
| `trimmedRows` | Trimmed row indexes | Physical | [`TrimRows`](@/api/trimRows.md) |
| `collapsedRows` | The collapsed parent rows, each as its path in the row tree | Tree paths | [`NestedRows`](@/api/nestedRows.md) |
| `columnWidths` | Manual column widths, as `[physicalColumn, width]` pairs | Physical, or column properties | [`ManualColumnResize`](@/api/manualColumnResize.md) |
| `rowHeights` | Manual row heights, as `[physicalRow, height]` pairs | Physical | [`ManualRowResize`](@/api/manualRowResize.md) |
| `frozen` | `rowsTop`, `rowsBottom`, `columnsStart`, and `columnsEnd` | Counts | None |
| `pagination` | `page` and `pageSize` | Page number | [`Pagination`](@/api/pagination.md) |
| `selection` | The selected ranges, as `[row, column]` pairs, or `null` when nothing is selected | Visual | None |
| `scroll` | `row` and `col`: the first fully visible row and column | Visual | None |

Keep these rules in mind:

- **An index that names a row or a column is physical.** A sorted column, a hidden row, a filter, or a manual width stays attached to the same data, however the user sorts or moves things afterward, so every part of one state addresses the same columns. The sort is physical too, unlike [`getSortConfig()`](@/api/columnSorting.md#getsortconfig), which reports visual columns: to pass its result to `setViewState()`, convert each column with [`toPhysicalColumn()`](@/api/core.md#tophysicalcolumn). Visual coordinates, such as the selection and the scroll position, describe what the user sees.
- **A part that needs a plugin is only included while that plugin is enabled.** If you do not enable `HiddenColumns`, the result has no `hiddenColumns` property.
- **Sizes are sparse.** `columnWidths` and `rowHeights` list only the sizes a user set by hand. Sizes that come from the `colWidths` and `rowHeights` options, or from auto-sizing, are not included.
- **With a [`dataProvider`](@/api/options.md#dataprovider), the server owns the page.** The result leaves out `sort`, `filters`, and `pagination`, which would fetch from the server. It also leaves out `rowOrder`, `hiddenRows`, `trimmedRows`, `collapsedRows`, `rowHeights`, and `selection`, because they address rows by their position in the loaded page, and a state saved on page 3 would land on other records on page 1. `setViewState()` skips all of them. For details, see [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md).

## Restore part of a view

`setViewState()` applies only the parts the object carries. Every other part stays as it is. A partial object is therefore a valid input.

To sort the grid by the column at physical index 2 (the third column before any move) in descending order and leave everything else alone, pass only `sort`:

```js
hot.getPlugin('viewState').setViewState({
  version: 1,
  sort: { columns: [{ column: 2, sortOrder: 'desc' }] },
});
```

### Name a column by its property

In `sort`, `filters`, `hiddenColumns`, and `columnWidths`, you can also name a column by the property its data is bound to: a [`columns.data`](@/api/options.md#columns) string, or a key of your row objects. This helps when the state comes from outside the grid, such as a URL or a language model, which knows your columns by name but not by position:

```js
hot.getPlugin('viewState').setViewState({
  version: 1,
  sort: { columns: [{ column: 'amount', sortOrder: 'desc' }] },
  hiddenColumns: ['address.city'],
});
```

A property that no column has is reported as `invalid`, with the path to it, and a property of a column the grid does not show as `outOfRange`. If two columns share a property, it names the last of them. `getViewState()` always reports physical indexes.

You can also build a view by hand, or merge parts from different sources:

```js
const saved = JSON.parse(localStorage.getItem('gridView'));

// Restore the layout, but not the selection and the scroll position
const { selection, scroll, ...layout } = saved;

hot.getPlugin('viewState').setViewState(layout);
```

The restore changes the view, not the data. It does not overwrite cell values.

## Check a state before you apply it

[`validateViewState()`](@/api/viewState.md#validateviewstate) runs the same checks as `setViewState()` and changes nothing. Use it on a state you did not build yourself, such as one a user pasted or a model generated:

```js
const { valid, applicable, skipped } = hot.getPlugin('viewState').validateViewState(generatedState);

if (!valid) {
  // `skipped` says what to correct. Send it back to the author of the state and ask again.
  console.log(skipped);
}
```

`valid` is `true` when `setViewState()` with `atomic: true` would apply the whole state. `applicable` lists the parts it would apply, and `skipped` lists the ones it would not.

## Handle skipped parts

`setViewState()` checks every part against the grid before it changes anything. A part it cannot apply is skipped, never thrown on, and the rest is applied. The returned object has these properties:

| Property | Meaning |
|---|---|
| `applied` | The parts that were restored. |
| `skipped` | The parts that were not, each as `{ part, reason, path, message }`. |
| `previous` | The view the restored parts had before, in the same shape as the state. Left out when nothing was applied. |
| `error` | Set when the whole state was rejected. See the table below. |

```js
const { applied, skipped, previous } = hot.getPlugin('viewState').setViewState(savedView);

console.log(skipped);
// [{
//   part: 'filters',
//   reason: 'invalid',
//   path: 'filters[2].conditions[0].args',
//   message: 'filters[2].conditions[0].args by_value cannot take these arguments, check their number and type'
// }]
```

`path` points into the state, and `message` says what to change, so you can correct the state and try again. Each entry has one of these reasons:

| Reason | Meaning |
|---|---|
| `pluginDisabled` | The part needs a plugin that is not enabled on this grid. |
| `pluginConflict` | The part would break a plugin that is on. Frozen rows would run next to [`Pagination`](@/api/pagination.md), which cannot work with them. |
| `externalDataSource` | The grid uses a `dataProvider`, which owns the page and what depends on it: the sort, the filters, the pagination, the row order, the hidden, trimmed, and collapsed rows, the row heights, and the selection. |
| `sizeMismatch` | The stored row or column order has a different length than the grid has rows or columns now. |
| `outOfRange` | The stored selection does not fit the grid, or a hidden or trimmed index, a sort column, a size, or the scroll position lies past the end of its axis. |
| `invalid` | The part does not have the expected shape, or names something this grid does not have: a row order that does not list every row exactly once, a column property that no column has, a filter condition that is not registered on the page or cannot take its arguments, or a key that is not a part of the view state at all (a misspelled `hiddenColumn`, say). |
| `unsupportedVersion` | The object has a `version` this build does not read. Every part is skipped with this reason, next to the `error`. |

The filter conditions are checked before the Filters plugin sees them. The plugin clears its current conditions before it imports new ones and throws on one it cannot take, so a bad condition would otherwise leave the grid with no filters. A bad condition is skipped instead, and the current filters stay.

Sometimes the whole state is rejected, and the result has an `error`:

| `error.reason` | Meaning |
|---|---|
| `notAnObject` | The value is not an object, such as the `null` that `JSON.parse()` gives for a missing `localStorage` item. |
| `unsupportedVersion` | The object has another `version`. |
| `atomicRejected` | The `atomic` option is on, and a part was rejected. |

Handsontable applies nothing in these cases, `applied` is empty, and a console warning explains why (except for `atomicRejected`, where `skipped` lists the parts).

### Apply everything or nothing

By default a rejected part does not stop the others. To apply nothing when any part is rejected, pass `atomic: true`. It covers the checks made before the restore starts, which are every check `validateViewState()` makes:

```js
const result = hot.getPlugin('viewState').setViewState(generatedState, { atomic: true });

if (result.error?.reason === 'atomicRejected') {
  console.log(result.skipped);
}
```

Three things are only found while the restore runs: a listener that vetoes a step (a [`beforeFilter`](@/api/hooks.md#beforefilter) that returns `false`, say), a selection the grid cannot show, and a selection or scroll position in a state that also changes the number of rows (`filters`, `trimmedRows`, or `collapsedRows`). The last one is measured against the rows the state leaves, so a view saved on the full grid restores over a filtered one. Those are reported after the other parts were applied.

## Undo a restore

By default `setViewState()` is not recorded by [`UndoRedo`](@/api/undoRedo.md). The undo steps from before the restore stay available, so an undo after a restore reverts an earlier action on top of the restored view.

To make the restore one undo step, pass `undo: 'record'`. One undo then reverts every restored part, and one redo applies them again. Nothing is recorded while the `UndoRedo` plugin is disabled:

```js
hot.getPlugin('viewState').setViewState(generatedState, { undo: 'record' });

hot.getPlugin('undoRedo').undo(); // the view before the restore
```

Without UndoRedo, use `previous`. It holds the view the restored parts had, in the same shape as the state, so passing it back reverts them. A `rowOrder` without a `sort` clears the current sort, so `previous` carries that sort too:

```js
const { previous } = hot.getPlugin('viewState').setViewState(generatedState);

// Later, to go back
hot.getPlugin('viewState').setViewState(previous);
```

## Limitations

- **The restore is not an undo step by default.** See [Undo a restore](#undo-a-restore) for `undo: 'record'` and `previous`.
- **Filters and the page can move the selection.** Restoring the filters moves a selected cell to the first row of its column, as any filtering does. Restoring the page clears a selection the new page does not show. To control the selection, include `selection` in the state.
- **Content is not part of the view.** The view state excludes your data, [merged cells](@/guides/cell-features/merge-cells/merge-cells.md), custom borders, and cell meta. To persist them, save them with their own APIs. For data, see [Saving data](@/guides/getting-started/saving-data/saving-data.md).
- **Server-side data.** With a `dataProvider`, the view state leaves out the sort, the filters, the pagination, and every part that addresses rows by their position in the loaded page.
- **Version.** The object carries `version: 1`. A stored object from a future version is skipped as a whole.

To store a separate view per sheet, the [sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md#per-sheet-view-state) does it for you.

## Related API reference

**Plugin**

<div class="boxes-list">

- [`ViewState`](@/api/viewState.md)
- [`getViewState()`](@/api/viewState.md#getviewstate)
- [`setViewState()`](@/api/viewState.md#setviewstate)
- [`validateViewState()`](@/api/viewState.md#validateviewstate)

</div>

**Related guides**

<div class="boxes-list">

- [Sheets bar](@/guides/accessories-and-menus/sheets-bar/sheets-bar.md#per-sheet-view-state)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)

</div>
