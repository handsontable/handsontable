---
type: how-to
title: Row identity
metaTitle: Row identity | Handsontable DataGrid for JavaScript
description: Give each row of Handsontable DataGrid an id that stays with its record when you sort, filter, move, insert, or remove rows, and find rows by their ids.
permalink: /row-identity
canonicalUrl: /row-identity
tags:
  - row id
  - rowId
  - row identity
  - record id
react:
  metaTitle: Row identity | Handsontable DataGrid for React
angular:
  metaTitle: Row identity | Handsontable DataGrid for Angular
vue:
  metaTitle: Row identity | Handsontable DataGrid for Vue
searchCategory: Guides
category: Rows
menuTag: new
---
Give each row of Handsontable DataGrid an id that stays with the row's record, and find rows by their ids.

[[toc]]

## Overview

Handsontable addresses rows by index. A visual index changes when you sort, filter, or move rows, and a physical index changes when you insert or remove rows. Neither identifies a record over time.

A row id does. It stays with the row's record when you:

- Sort rows.
- Filter rows.
- Move rows.
- Trim rows.
- Insert or remove other rows.
- Undo or redo any of those actions.

Use row ids when you save edits to a backend keyed by record, apply the result of an asynchronous request to the record it was made for, or keep any state that must follow a record rather than a position.

## Enable row ids

Set the [`rowId`](@/api/options.md#rowid) option at the grid level. It accepts one of the following:

| Setting    | Description                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------ |
| A string   | The property that holds the id in each row object. Dot notation reads a nested property (`'meta.id'`). For arrays of arrays, the index of the value as a string (`'0'`). |
| A function | A function that receives the source row and returns its id.                                       |
| `true`     | Handsontable generates the ids: a number for each row, never reused within the instance.          |
| `false`    | No row ids. This is the default behavior.                                                         |

::: only-for javascript

```js
const hot = new Handsontable(container, {
  data: [
    { sku: 'SKU-4821', product: 'Wireless Mouse', price: 25 },
    { sku: 'SKU-0093', product: 'Stainless Steel Water Bottle', price: 18 },
  ],
  rowId: 'sku',
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

:::

::: only-for react

```jsx
<HotTable
  data={[
    { sku: 'SKU-4821', product: 'Wireless Mouse', price: 25 },
    { sku: 'SKU-0093', product: 'Stainless Steel Water Bottle', price: 18 },
  ]}
  rowId="sku"
  columnSorting={true}
  licenseKey="non-commercial-and-evaluation"
/>
```

:::

::: only-for angular

```ts
gridSettings: GridSettings = {
  data: [
    { sku: 'SKU-4821', product: 'Wireless Mouse', price: 25 },
    { sku: 'SKU-0093', product: 'Stainless Steel Water Bottle', price: 18 },
  ],
  rowId: 'sku',
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation',
};
```

:::

::: only-for vue

```vue
<HotTable :settings="{
  data: [
    { sku: 'SKU-4821', product: 'Wireless Mouse', price: 25 },
    { sku: 'SKU-0093', product: 'Stainless Steel Water Bottle', price: 18 },
  ],
  rowId: 'sku',
  columnSorting: true,
  licenseKey: 'non-commercial-and-evaluation',
}" />
```

:::

To build an id from several values, use a function. Return `null` while a row lacks the values, so empty rows (for example, the rows [`minSpareRows`](@/api/options.md#minsparerows) adds) do not all share one id:

```js
rowId: (row) => (row.country == null || row.code == null ? null : `${row.country}-${row.code}`),
```

When your data has no id field, let Handsontable generate the ids:

```js
rowId: true,
```

Keep the ids unique. If two rows share an id, the lookups return the row with the lower physical index, and Handsontable logs a console warning.

The lookups compare ids by identity (`===`), so use strings or numbers. An object id matches only the same object.

## Choose between generated and keyed ids

| Your case                                                             | Use                               |
| --------------------------------------------------------------------- | --------------------------------- |
| The ids only need to last while the grid is open                      | `rowId: true`                     |
| You replace or reorder the data (`loadData()`, `updateData()`)        | A row key (a property or a function) |
| You send changes to a server, or store the ids anywhere               | A row key                         |
| You use [nested rows](@/guides/rows/row-parent-child/row-parent-child.md) | A row key                     |

Generated ids belong to the grid, not to the data:

- [`loadData()`](@/api/core.md#loaddata) gives every row a new id.
- [`updateData()`](@/api/core.md#updatedata) keeps the ids by position. If the new data lists the records in another order, the ids move to other records.
- A settings update keeps the ids, including one that changes [`columns`](@/api/options.md#columns).

A row key reads the id from each record, so it survives any data change.

## Read and look up row ids

| Method                                                                  | Returns                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`getRowId(row)`](@/api/core.md#getrowid)                               | The id of the row at a visual index.                             |
| [`getRowIdAtPhysicalRow(physicalRow)`](@/api/core.md#getrowidatphysicalrow) | The id of the row at a physical index.                       |
| [`getRowIds(rows)`](@/api/core.md#getrowids)                            | The ids of several visual rows, or of every row.                 |
| [`getVisualRowById(id)`](@/api/core.md#getvisualrowbyid)                | The visual index of the row that has the id.                     |
| [`getVisualRowsByIds(ids)`](@/api/core.md#getvisualrowsbyids)           | The visual indexes of the rows that have the ids.                |
| [`getPhysicalRowById(id)`](@/api/core.md#getphysicalrowbyid)            | The physical index of the row that has the id.                   |
| [`getPhysicalRowsByIds(ids)`](@/api/core.md#getphysicalrowsbyids)       | The physical indexes of the rows that have the ids.              |

```js
const id = hot.getRowId(0); // 'SKU-4821'

hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

hot.getVisualRowById(id); // 1 - the Wireless Mouse row moved down
hot.getRowId(1); // 'SKU-4821'
```

The methods return `null` when they find nothing:

- `getRowId()` and `getRowIdAtPhysicalRow()` return `null` for a row index out of range, for a row without an id, and when no row ids are configured.
- The lookups return `null` for an id that no row has, for example the id of a removed row.
- `getVisualRowById()` returns `null` for a row that is trimmed or filtered out, because such a row has no visual index, and for a row past [`maxRows`](@/api/options.md#maxrows). `getPhysicalRowById()` still finds it.
- A hidden row keeps its visual index, so `getVisualRowById()` finds it.

Hooks such as [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow) pass physical row indexes. Read their ids with `getRowIdAtPhysicalRow()`, which also works for trimmed and filtered-out rows.

## Write to a row by its id

[`setDataAtRowIdProp()`](@/api/core.md#setdataatrowidprop) writes a value to the row that has an id, wherever the row is now. It returns `false` and does nothing when no row has the id.

For example, to apply the result of an asynchronous request to the record it was made for:

```js
const id = hot.getRowId(selectedRow);
const price = await fetchPrice(id);

// The user may have sorted the rows or removed the record in the meantime.
hot.setDataAtRowIdProp(id, 'price', price, 'priceService');
```

For a visible row (hidden rows included), the method works like [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop). For a row that is trimmed or filtered out, it writes to the source data, so the value is not validated and [`afterChange`](@/api/hooks.md#afterchange) does not fire for it.

## Cancel pending work when a row is removed

The [`afterRowIdsRemoved`](@/api/hooks.md#afterrowidsremoved) hook passes the ids of rows that stopped existing. It fires after a row removal (an undo or a redo included), and after `loadData()` or `updateData()` replaced the data with data that no longer holds those ids.

- The hook fires in a microtask, once the call that removed the rows has finished, with every id that call removed. Rows a call takes away and puts back, such as a nested rows detach or move, are not reported.
- A trimmed or filtered-out row still exists, so the hook does not report it.
- With a [data provider](@/api/options.md#dataprovider), loading a page, a sort, or a filter does not count as a removal, because the rows still exist on the server. A removal the server confirms is reported, with the `'dataProvider'` source.

The [`afterRowIdsReset`](@/api/hooks.md#afterrowidsreset) hook fires when a settings update changes how rows get their ids. Every id read before it may now name another row, so cancel everything.

```js
const pendingRequests = new Map(); // row id -> AbortController

hot.addHook('afterRowIdsRemoved', (rowIds) => {
  rowIds.forEach((id) => {
    pendingRequests.get(id)?.abort();
    pendingRequests.delete(id);
  });
});

hot.addHook('afterRowIdsReset', () => {
  pendingRequests.forEach(controller => controller.abort());
  pendingRequests.clear();
});
```

When you pass a function as `rowId`, pass the same function on every settings update. A new function counts as a change, and `afterRowIdsReset` fires each time.

::: only-for react

An inline arrow function in the `rowId` prop is a new function on every render, so `afterRowIdsReset` would fire on every re-render. Define the function outside the component, or wrap it in `useCallback`:

```jsx
const getRowId = (row) => row.sku;

function InventoryGrid({ data }) {
  return <HotTable data={data} rowId={getRowId} licenseKey="non-commercial-and-evaluation" />;
}
```

:::

::: only-for vue

Define the `rowId` function once, outside the template expression, so every settings update passes the same function.

:::

::: only-for angular

Define the `rowId` function once, as a class field, so every settings update passes the same function.

:::

## Row ids with a data provider

When the [`dataProvider`](@/api/options.md#dataprovider) option sets its own `rowId`, Handsontable reads row ids with `dataProvider.rowId`, and the row id methods use it too. A `rowId` option with a different value is ignored, with a console warning.

## Known limitations

- A row key is read from the data every time. Change ids through the API (for example, [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)), so the lookups find a new id right away. A new id written directly into the source data may not be found until Handsontable tracks another change to the data.

- With [nested rows](@/guides/rows/row-parent-child/row-parent-child.md), use a row key. Generated ids stay with row positions when a row is moved or detached between parents, so they no longer match the moved records. Handsontable logs a console warning for this combination.

- A string key walks dot notation (`'meta.id'`) even when [`dataDotNotation`](@/api/options.md#datadotnotation) is `false`, the same way `dataProvider.rowId` does.

## Related API reference

- Configuration options:
  - [`rowId`](@/api/options.md#rowid)
  - [`dataProvider`](@/api/options.md#dataprovider)
- Core methods:
  - [`getRowId()`](@/api/core.md#getrowid)
  - [`getRowIdAtPhysicalRow()`](@/api/core.md#getrowidatphysicalrow)
  - [`getRowIds()`](@/api/core.md#getrowids)
  - [`getVisualRowById()`](@/api/core.md#getvisualrowbyid)
  - [`getVisualRowsByIds()`](@/api/core.md#getvisualrowsbyids)
  - [`getPhysicalRowById()`](@/api/core.md#getphysicalrowbyid)
  - [`getPhysicalRowsByIds()`](@/api/core.md#getphysicalrowsbyids)
  - [`setDataAtRowIdProp()`](@/api/core.md#setdataatrowidprop)
  - [`toPhysicalRow()`](@/api/core.md#tophysicalrow)
  - [`toVisualRow()`](@/api/core.md#tovisualrow)
- Hooks:
  - [`afterRowIdsRemoved`](@/api/hooks.md#afterrowidsremoved)
  - [`afterRowIdsReset`](@/api/hooks.md#afterrowidsreset)
