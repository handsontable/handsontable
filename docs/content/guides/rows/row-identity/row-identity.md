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

To build an id from several values, use a function:

```js
rowId: (row) => `${row.country}-${row.code}`,
```

When your data has no id field, let Handsontable generate the ids:

```js
rowId: true,
```

Keep the ids unique. If two rows share an id, the lookups return the row with the lower physical index.

The lookups compare ids by identity (`===`), so use strings or numbers. An object id matches only the same object.

## Read and look up row ids

Three methods work with row ids:

| Method                                                       | Returns                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| [`getRowId(row)`](@/api/core.md#getrowid)                    | The id of the row at a visual index.                      |
| [`getVisualRowById(id)`](@/api/core.md#getvisualrowbyid)     | The visual index of the row that has the id.              |
| [`getPhysicalRowById(id)`](@/api/core.md#getphysicalrowbyid) | The physical index of the row that has the id.            |

```js
const id = hot.getRowId(0); // 'SKU-4821'

hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'asc' });

hot.getVisualRowById(id); // 1 - the Wireless Mouse row moved down
hot.getRowId(1); // 'SKU-4821'
```

Each method returns `null` when it finds nothing:

- `getRowId()` returns `null` for a row index out of range, for a row without an id, and when no row ids are configured.
- Both lookups return `null` for an id that no row has, for example the id of a removed row.
- `getVisualRowById()` returns `null` for a row that is trimmed or filtered out, because such a row has no visual index, and for a row past [`maxRows`](@/api/options.md#maxrows). `getPhysicalRowById()` still finds it.
- A hidden row keeps its visual index, so `getVisualRowById()` finds it.

For example, to apply the result of an asynchronous request to the record it was made for:

```js
const id = hot.getRowId(selectedRow);
const price = await fetchPrice(id);
const row = hot.getVisualRowById(id);

// The user may have sorted the rows or removed the record in the meantime.
if (row !== null) {
  hot.setDataAtRowProp(row, 'price', price);
}
```

## Generated ids and data loads

Generated ids follow the physical rows:

- [`loadData()`](@/api/core.md#loaddata) gives every row a new id.
- [`updateData()`](@/api/core.md#updatedata) keeps the ids of the rows that stay, by position.
- A settings update keeps the ids, including one that changes [`columns`](@/api/options.md#columns).

To keep ids across data loads, store the ids in your data and set `rowId` to a property or a function.

## Row ids with a data provider

When the [`dataProvider`](@/api/options.md#dataprovider) option sets its own `rowId`, Handsontable reads row ids with `dataProvider.rowId`, and the three methods use it too. A `rowId` option with a different value is ignored, with a console warning.

## Known limitations

- A row key is read from the data every time. Change ids through the API (for example, [`setDataAtRowProp()`](@/api/core.md#setdataatrowprop)), so the lookups find a new id right away. A new id written directly into the source data may not be found until Handsontable tracks another change to the data.

- A string key walks dot notation (`'meta.id'`) even when [`dataDotNotation`](@/api/options.md#datadotnotation) is `false`, the same way `dataProvider.rowId` does.

## Related API reference

- Configuration options:
  - [`rowId`](@/api/options.md#rowid)
  - [`dataProvider`](@/api/options.md#dataprovider)
- Core methods:
  - [`getRowId()`](@/api/core.md#getrowid)
  - [`getVisualRowById()`](@/api/core.md#getvisualrowbyid)
  - [`getPhysicalRowById()`](@/api/core.md#getphysicalrowbyid)
  - [`toPhysicalRow()`](@/api/core.md#tophysicalrow)
  - [`toVisualRow()`](@/api/core.md#tovisualrow)
