---
type: how-to
title: Server-side row selection
metaTitle: Server-side row selection - JavaScript Data Grid | Handsontable
description: Select rows across pages of server-side data, including a "select all" that covers rows the server never sent, and send the selection to your API.
permalink: /server-side-data-row-selection
canonicalUrl: /server-side-data-row-selection
tags:
  - data provider
  - server-side
  - row selection
  - select all
react:
  metaTitle: Server-side row selection - React Data Grid | Handsontable
angular:
  metaTitle: Server-side row selection - Angular Data Grid | Handsontable
vue:
  metaTitle: Server-side row selection - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
menuTag: new
addedIn: "18.2.0"
---
Select rows across pages of server-side data, and send the selection to your server, even when it covers rows the grid never loaded.

[[toc]]

## Overview

With the [`DataProvider`](@/api/dataProvider.md) plugin, the grid holds one page of rows at a time. Every page change replaces the data. The [`RowSelection`](@/api/rowSelection.md) plugin handles this in two ways:

- It keeps the selection by row id, which comes from the `dataProvider.rowId` option. A row you select on page 1 is still selected when you come back from page 3.
- A "select all" doesn't load every row. It records "every row matching the current query", and keeps the rows you deselect afterward as exceptions.

For row selection on a grid with local data, see [Row selection](@/guides/rows/row-selection/row-selection.md).

## Enable server-side row selection

Enable the [`rowSelection`](@/api/options.md#rowselection) option on a grid that uses the `dataProvider` option. No extra configuration is needed: the `rowId` option that `dataProvider` already requires identifies the rows.

In the following example:

- Select a few orders, move to another page, and come back. The selection stays.
- Click the "select all" checkbox. Every order is selected, including the orders on pages you haven't opened.
- Cancelled orders can't be selected.
- The line under the grid shows the selection the way you send it to your server.

::: only-for javascript

::: example #example1 --js 2 --ts 3 --html 1

@[code](@/content/guides/getting-started/server-side-data-row-selection/javascript/example1.html)
@[code](@/content/guides/getting-started/server-side-data-row-selection/javascript/example1.js)
@[code](@/content/guides/getting-started/server-side-data-row-selection/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/server-side-data-row-selection/react/example1.jsx)
@[code](@/content/guides/getting-started/server-side-data-row-selection/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/getting-started/server-side-data-row-selection/angular/example1.ts)
@[code](@/content/guides/getting-started/server-side-data-row-selection/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/getting-started/server-side-data-row-selection/vue/example1.vue)

:::

:::

## Send the selection to your server

The grid can't list rows it never loaded, so [`getSelectedRowsData()`](@/api/rowSelection.md#getselectedrowsdata) returns only the loaded rows. To act on the whole selection, call [`getServerSelection()`](@/api/rowSelection.md#getserverselection) and send its result to your server:

```js
const rowSelection = hot.getPlugin('rowSelection');

const selection = rowSelection.getServerSelection();
// { selectAll: false, toggledRowIds: [1003, 1007] }
// or, after "select all" and two deselected rows:
// { selectAll: true, toggledRowIds: [1012, 1031] }

await fetch('/api/orders/bulk-archive', {
  method: 'POST',
  body: JSON.stringify({
    selection,
    // the query the user saw, so "every row" means the same rows on the server
    query: hot.getPlugin('dataProvider').getQueryParameters(),
  }),
});
```

Your server resolves the rows like this:

| `selectAll` | Rows to act on |
| --- | --- |
| `false` | The rows whose ids are in `toggledRowIds`. |
| `true` | Every row matching the query, except the rows whose ids are in `toggledRowIds`. |

To restore a saved selection, pass it to [`setServerSelection()`](@/api/rowSelection.md#setserverselection).

## Count the selected rows

[`getSelectedCount()`](@/api/rowSelection.md#getselectedcount) returns the number of selected rows, including the rows on other pages. After a "select all", the count is the server's `totalRows` minus the deselected rows.

The "select all" checkbox shows the same numbers in its accessible label, for example "Select all rows (24 of 40 selected)".

## Choose what "select all" selects

The server already filters the rows, so the `'all'` and `'filtered'` scopes of the [`selectAll`](@/guides/rows/row-selection/row-selection.md#choose-what-select-all-selects) option work the same way: they select every row that matches the current query.

To select only the rows on the current page, set `selectAll` to `'currentPage'`:

```js
rowSelection: {
  selectAll: 'currentPage',
},
```

The selection then lists each row id explicitly, and [`getServerSelection()`](@/api/rowSelection.md#getserverselection) always returns `selectAll: false`.

## Known limitations

- A "select all" means "every row matching the current query". When the user changes the filters afterward, the selection follows the new query. Send the query with the selection, as in the example above.
- The grid evaluates `isRowSelectable` only for the rows it loaded. After a "select all", apply the same rule on your server.
- After a "select all", the count assumes every deselected row still matches the query.
- The `beforeRowSelectionChange` and `afterRowSelectionChange` hooks list only the loaded rows whose state changes. Rows on other pages have no index to report.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [dataProvider](@/api/options.md#dataprovider)
- [rowSelection](@/api/options.md#rowselection)

</div>

**Hooks**

<div class="boxes-list">

- [afterRowSelectionChange](@/api/hooks.md#afterrowselectionchange)
- [beforeRowSelectionChange](@/api/hooks.md#beforerowselectionchange)

</div>

**Plugins**

<div class="boxes-list">

- [DataProvider](@/api/dataProvider.md)
- [RowSelection](@/api/rowSelection.md)

</div>
