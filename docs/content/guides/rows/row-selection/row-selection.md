---
type: how-to
title: Row selection
metaTitle: Row selection - JavaScript Data Grid | Handsontable
description: Let users select rows with checkboxes, and select or clear every row at once with a "select all" checkbox that follows filters and pagination.
permalink: /row-selection
canonicalUrl: /row-selection
tags:
  - row selection
  - select all
  - checkbox selection
  - RowSelection
react:
  metaTitle: Row selection - React Data Grid | Handsontable
angular:
  metaTitle: Row selection - Angular Data Grid | Handsontable
vue:
  metaTitle: Row selection - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: new
addedIn: "18.2.0"
---
Let users select rows with checkboxes, and select or clear every row at once with a "select all" checkbox.

[[toc]]

## Overview

The [`RowSelection`](@/api/rowSelection.md) plugin adds a checkbox to every row and a "select all" checkbox above them.

The row selection is separate from the [cell selection](@/guides/cell-features/selection/selection.md):

- Selecting a row doesn't select its cells, and selecting cells doesn't select rows.
- By default, the plugin doesn't write anything into your data. To keep the selection in your data, see [In a checkbox column of your data](#in-a-checkbox-column-of-your-data).
- The selection follows its rows when you sort, filter, move, add, or remove rows. Loading new data clears it.

## Enable row selection

To enable row selection, set the [`rowSelection`](@/api/options.md#rowselection) option to `true`, or to an object with your configuration.

In the following example:

- Discontinued products can't be selected, so their checkboxes are disabled.
- The "select all" checkbox acts on the rows that pass the filters. Filter the **Category** column, and then select all rows.
- The line under the grid lists the selected products.

::: only-for javascript

::: example #example1 --js 2 --ts 3 --html 1

@[code](@/content/guides/rows/row-selection/javascript/example1.html)
@[code](@/content/guides/rows/row-selection/javascript/example1.js)
@[code](@/content/guides/rows/row-selection/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/react/example1.jsx)
@[code](@/content/guides/rows/row-selection/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-selection/angular/example1.ts)
@[code](@/content/guides/rows/row-selection/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-selection/vue/example1.vue)

:::

:::

## Choose where the checkboxes go

The [`checkboxLocation`](#configuration-options) option, together with the [`rowHeaders`](@/api/options.md#rowheaders) option, gives you four layouts:

| Layout | `checkboxLocation` | `rowHeaders` | Where the "select all" checkbox goes |
| --- | --- | --- | --- |
| [Next to the row numbers](#next-to-the-row-numbers) | `'rowHeader'` (default) | `true` | The corner above the checkboxes |
| [Without row numbers](#without-row-numbers) | `'rowHeader'` (default) | `false` | The corner above the checkboxes |
| [In the first column](#in-the-first-column) | `'firstColumn'` | `false` | The first column's header |
| [In a checkbox column of your data](#in-a-checkbox-column-of-your-data) | `{ column }` | any | That column's header |

The first three layouts keep the selection apart from your data. The last one stores it in your data.

### Next to the row numbers

This is the default. The checkboxes get a narrow row header column of their own, between the row numbers and the data. The [example at the top of this page](#enable-row-selection) uses this layout.

### Without row numbers

Set `rowHeaders` to `false`. The checkbox column stays, and it's the only row header column.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/javascript/example2.js)
@[code](@/content/guides/rows/row-selection/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/react/example2.jsx)
@[code](@/content/guides/rows/row-selection/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-selection/angular/example2.ts)
@[code](@/content/guides/rows/row-selection/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/rows/row-selection/vue/example2.vue)

:::

:::

### In the first column

Set `checkboxLocation` to `'firstColumn'` to render each checkbox inside the first visible column, before the cell's value. The "select all" checkbox goes into that column's header, before its label. The checkboxes follow the column when you move or hide columns.

To give the checkboxes a column of their own, as in the following example, make the first column an empty column with no label and `editor: false`. It doesn't need a field in your data, and the checkbox is centered in it.

This layout fits a grid without row headers. With `rowHeaders: true` it works as well, and the row numbers stay.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/javascript/example3.js)
@[code](@/content/guides/rows/row-selection/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/react/example3.jsx)
@[code](@/content/guides/rows/row-selection/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-selection/angular/example3.ts)
@[code](@/content/guides/rows/row-selection/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/rows/row-selection/vue/example3.vue)

:::

:::

### In a checkbox column of your data

To keep the selection in your data, point `checkboxLocation` at a [checkbox](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) column. Use the column's `data` property, or its index:

```js
rowSelection: {
  checkboxLocation: { column: 'selected' },
},
```

The column's values are then the selection:

- Checking a cell selects its row, and selecting a row checks its cell. Each row keeps a single checkbox.
- The "select all" checkbox sits in that column's header.
- Every change is a data change. It goes through [`afterChange`](@/api/hooks.md#afterchange) and [undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md), and a server-backed grid saves it.
- Changes that come from edits, such as a paste, also reach the [`beforeRowSelectionChange`](@/api/hooks.md#beforerowselectionchange) hook. Return `false` to cancel them.
- A read-only cell can't be selected.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/javascript/example4.js)
@[code](@/content/guides/rows/row-selection/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/react/example4.jsx)
@[code](@/content/guides/rows/row-selection/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-selection/angular/example4.ts)
@[code](@/content/guides/rows/row-selection/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/rows/row-selection/vue/example4.vue)

:::

:::

## Configuration options

| Option | Possible settings | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'multiRow'` \| `'singleRow'` | `'multiRow'` | `'singleRow'` keeps at most one row selected and hides the "select all" checkbox. |
| `checkboxes` | `true` \| `false` \| a function | `true` | Shows the row checkboxes. A function `(rowData, physicalRow) => boolean` decides per row. |
| `headerCheckbox` | `true` \| `false` | `true` | Shows the "select all" checkbox. |
| `selectAll` | `'all'` \| `'filtered'` \| `'currentPage'` | `'all'` | The rows the "select all" checkbox acts on. See [Choose what "select all" selects](#choose-what-select-all-selects). |
| `enableClickSelection` | `false` \| `true` \| `'enableSelection'` \| `'enableDeselection'` | `false` | Lets a click on a cell select its row. |
| `isRowSelectable` | A function | - | `(rowData, physicalRow) => boolean`. A row that returns `false` can't be selected. |
| `hideDisabledCheckboxes` | `true` \| `false` | `false` | Hides the checkboxes of rows that can't be selected, instead of disabling them. |
| `checkboxLocation` | `'rowHeader'` \| `'firstColumn'` \| `{ column }` | `'rowHeader'` | Renders the checkboxes in an extra row header column or in the first visible column, or uses a checkbox column as the selection. See [Choose where the checkboxes go](#choose-where-the-checkboxes-go). |
| `groupSelects` | `'descendants'` \| `'self'` \| `'topLevel'` | `'descendants'` | How the rows of a [nested rows](@/guides/rows/row-parent-child/row-parent-child.md) tree are selected. See [Select rows with nested rows](#select-rows-with-nested-rows). |

## Choose what "select all" selects

The "select all" checkbox always describes the rows that a click on it acts on:

- When none of these rows is selected, the checkbox is unchecked.
- When all of them are selected, the checkbox is checked.
- When only some are selected, the checkbox shows a mixed state, and a click selects all of them.

The `selectAll` option sets which rows count:

| Setting | Rows in scope |
| --- | --- |
| `'all'` (default) | Every row of the dataset, including the rows that the [filters](@/guides/columns/column-filter/column-filter.md) hide. |
| `'filtered'` | The rows that pass the filters, on every page. |
| `'currentPage'` | The rows on the current [page](@/guides/rows/rows-pagination/rows-pagination.md). |

Rows hidden with the [`HiddenRows`](@/api/hiddenRows.md) plugin and rows trimmed with the [`TrimRows`](@/api/trimRows.md) plugin are never in scope. With the [`NestedRows`](@/api/nestedRows.md) plugin, see [Select rows with nested rows](#select-rows-with-nested-rows) for which rows count.

## Select rows with nested rows

With the [`NestedRows`](@/api/nestedRows.md) plugin, every level of the tree gets a checkbox. Selecting a parent row selects every row under it, at every depth. A parent shows a mixed state while only some of the rows under it are selected, so you can see on each level where the selected rows are. In the following example, the selected Wireless Mouse puts its subcategory and its category in the mixed state, and the Desk Lamp, the only product in Lighting, checks Lighting as well.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/javascript/example5.js)
@[code](@/content/guides/rows/row-selection/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-selection/react/example5.jsx)
@[code](@/content/guides/rows/row-selection/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-selection/angular/example5.ts)
@[code](@/content/guides/rows/row-selection/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/rows/row-selection/vue/example5.vue)

:::

:::

The selection lives on the rows with no children (the leaves). A parent row only shows the state of the leaves under it:

- A click on an unchecked or mixed parent selects every leaf under it. A click on a checked parent clears them.
- The "select all" checkbox counts the leaves, including the leaves of collapsed parents.
- The [`afterRowSelectionChange`](@/api/hooks.md#afterrowselectionchange) hook lists the leaves that change. `getSelectedRows()` also lists the parents whose leaves are all selected. `getSelectedCount()` counts the leaves only.
- When `isRowSelectable` returns `false` for a parent row, the rows under it can't be selected either.

To change these rules, set the `groupSelects` option:

| Setting | Behavior |
| --- | --- |
| `'descendants'` (default) | A parent row selects the rows under it and shows their state, as described above. |
| `'self'` | Every row, at any level, is selected on its own. A parent doesn't change the rows under it. |
| `'topLevel'` | Only the top-level rows can be selected, for example whole orders rather than their line items. |

```js
rowSelection: {
  groupSelects: 'topLevel',
},
```

The `'singleRow'` mode and a [checkbox column of your data](#in-a-checkbox-column-of-your-data) use `'self'` in place of `'descendants'`, because a single row or a checkbox cell can't show a mixed state.

If you know AG Grid's row grouping: `'self'` matches AG Grid's default, and `'descendants'` matches its `groupSelects: 'descendants'` setting.

## Read the selection

Use the plugin's methods to read and change the selection:

```js
const rowSelection = hot.getPlugin('rowSelection');

// visual indexes of the selected rows that are not filtered out
rowSelection.getSelectedRows();

// source data of every selected row, including the filtered-out ones
rowSelection.getSelectedRowsData();

// select rows by their visual indexes
rowSelection.selectRows([0, 2]);

// select every row in scope, or clear the whole selection
rowSelection.selectAll();
rowSelection.deselectAll();
```

To react to changes, use the [`afterRowSelectionChange`](@/api/hooks.md#afterrowselectionchange) hook. To stop a change, return `false` from the [`beforeRowSelectionChange`](@/api/hooks.md#beforerowselectionchange) hook. Both hooks receive the physical indexes of the rows that change, and the source of the change (`'checkbox'`, `'headerCheckbox'`, `'click'`, `'keyboard'`, or `'api'`).

## Keyboard shortcuts

| Windows | macOS | Action |
| --- | --- | --- |
| <kbd>**Space**</kbd> | <kbd>**Space**</kbd> | On a data cell: toggle the cell's row. With a range of cells selected: select every row of the range, or deselect them when all are already selected. |
| <kbd>**Space**</kbd> | <kbd>**Space**</kbd> | On a row checkbox: toggle the row. On the "select all" checkbox: toggle every row in scope. |
| <kbd>**Shift**</kbd>+click | <kbd>**Shift**</kbd>+click | Select every row from the last toggled row to the clicked row. |

To reach the checkboxes with the arrow keys, enable the [`navigableHeaders`](@/api/options.md#navigableheaders) option, as the examples on this page do. Without it, use <kbd>**Space**</kbd> on a data cell.

<kbd>**Space**</kbd> on a [checkbox](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md) cell keeps checking the cell. <kbd>**Shift**</kbd>+<kbd>**Space**</kbd> and <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd> keep selecting a row and a column of cells. With row selection enabled, <kbd>**Space**</kbd> doesn't start editing a cell -- use <kbd>**Enter**</kbd> or <kbd>**F2**</kbd>.

Each change made with the mouse or the keyboard is announced to screen readers, for example "Row 3 selected" or "12 of 40 rows selected".

## Known limitations

- Loading new data with `loadData()` clears the selection. With the [`DataProvider`](@/api/dataProvider.md) plugin, the selection survives page changes -- see [Server-side row selection](@/guides/getting-started/server-side-data-row-selection/server-side-data-row-selection.md).
- With `checkboxLocation: 'firstColumn'`, the plugin widens the first column for the checkbox only when the [`AutoColumnSize`](@/api/autoColumnSize.md) plugin sets its width.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [rowSelection](@/api/options.md#rowselection)

</div>

**Hooks**

<div class="boxes-list">

- [afterRowSelectionChange](@/api/hooks.md#afterrowselectionchange)
- [beforeRowSelectionChange](@/api/hooks.md#beforerowselectionchange)

</div>

**Plugins**

<div class="boxes-list">

- [RowSelection](@/api/rowSelection.md)

</div>
