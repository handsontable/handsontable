---
type: explanation
title: Understanding data and indexes
metaTitle: Understanding data and indexes - JavaScript Data Grid | Handsontable
description: Learn how Handsontable separates your source data from the visual dataset, and how physical and visual indexes address each one.
permalink: /understanding-data-and-indexes
canonicalUrl: /understanding-data-and-indexes
tags:
  - source data
  - visual data
  - physical index
  - visual index
  - index mapper
react:
  metaTitle: Understanding data and indexes - React Data Grid | Handsontable
angular:
  metaTitle: Understanding data and indexes - Angular Data Grid | Handsontable
vue:
  metaTitle: Understanding data and indexes - Vue Data Grid | Handsontable
searchCategory: Guides
category: Data management
menuTag: new
---
Handsontable keeps two views of your data -- the source data you provided and the visual dataset the user currently sees -- and addresses each one with its own kind of index. Read this to understand which API methods operate on which view, and how features such as sorting, moving, hiding, and trimming affect them.

[[toc]]

## Background

When you pass a dataset to Handsontable, the grid doesn't just display it -- it keeps two related views of it:

- The **source data** is the dataset you provided, in the order you provided it. It's what you get back from `getSourceData()` and related methods, and it's what you should persist.
- The **visual dataset** is what the user currently sees, after any sorting, moving, hiding, or trimming has been applied. It's what you get back from `getData()` and related methods.

Most of the time, these two views show the same rows in the same order, so the distinction doesn't matter. It starts to matter as soon as a feature reorders or removes rows or columns for display purposes only, because at that point `getData()` and `getSourceData()` start to disagree.

## How it works

### Source data vs. visual data

Take a 4-row source dataset and sort it by the first column. The source array itself doesn't change -- Handsontable stores the new order separately -- so reading the two views gives different results:

```js
// source data, as provided
[
  ['Ford', 2018],
  ['Audi', 2020],
  ['BMW', 2019],
  ['Toyota', 2021],
]

hot.getSourceData();
// -> the original 4 rows, in the original order

hot.getData();
// -> the 4 rows sorted by year: Ford, BMW, Audi, Toyota
```

Use `getSourceData()` when you need the dataset as you provided it. Use `getData()` when you need what the user is currently looking at. The same split applies to the single-cell variants: `getDataAtCell()`/`setDataAtCell()` operate on the visual dataset, while `getSourceDataAtCell()`/`setSourceDataAtCell()` operate on the source data. For the full method list, see [Binding to data: Related API reference](@/guides/getting-started/binding-to-data/binding-to-data.md#related-api-reference).

### Physical vs. visual indexes

Handsontable addresses these two views with two different kinds of row/column index:

- A **physical** index is a position in the source data array. It doesn't change when you sort, move, hide, or trim -- only when you insert or remove a row or column.
- A **visual** index is a position in what the user sees. It changes whenever sorting, moving, hiding, or trimming changes the display order.

| | Takes | Use for |
|---|---|---|
| `setDataAtCell()`, `getDataAtCell()`, `getDataAtRow()`, `getDataAtRowProp()` | Visual indexes | Reading or writing what the user sees |
| `setSourceDataAtCell()`, `getSourceDataAtCell()`, `getSourceDataAtRow()` | Physical indexes | Reading or writing the underlying source data |
| The `cells` configuration function | Physical row and column | Per-cell settings keyed to the source data |
| The `cell` configuration array | Visual row and column | Per-cell settings keyed to the displayed position |

To translate between the two, use `toPhysicalRow()`, `toVisualRow()`, `toPhysicalColumn()`, and `toVisualColumn()`. For example, after moving the row at visual position 0 to visual position 2:

| Visual position | Physical row |
|---|---|
| 0 | 1 |
| 1 | 2 |
| 2 | 0 |

```js
hot.toPhysicalRow(0); // -> 1, the row now shown first was originally row 1
hot.toVisualRow(0);   // -> 2, the row originally first is now shown third
```

See [Row moving: Set a pre-defined row order](@/guides/rows/row-moving/row-moving.md#set-a-pre-defined-row-order) and [Column moving: Set a pre-defined column order](@/guides/columns/column-moving/column-moving.md#set-a-pre-defined-column-order) for worked examples of this mapping. Internally, Handsontable also tracks a third, renderable index for DOM rendering, but public API methods don't take renderable indexes.

### How features affect the two datasets

Different features remove or reorder rows and columns at different points between the source data and the DOM. This determines whether `getData()` still includes them:

| | Hidden rows/columns | Trimmed rows |
|---|---|---|
| In `getSourceData()` | Yes | Yes |
| In `getData()` (visual dataset) | Yes | No |
| Shifts other rows'/columns' visual indexes | No | Yes |
| Rendered in the DOM | No | No |

Hiding removes a row or column only from rendering -- it stays in the visual dataset and keeps its visual index. Trimming removes it from the visual dataset entirely, so every row or column after it shifts to a lower visual index. See [Row hiding](@/guides/rows/row-hiding/row-hiding.md) and [Row trimming](@/guides/rows/row-trimming/row-trimming.md) for the plugin-level details.

Every accepted data change -- even a single cell -- makes Handsontable re-render all visible cells. When you apply many changes at once, wrap them in [`batch()`](@/guides/optimization/batch-operations/batch-operations.md) so the grid renders only once.

## Trade-offs

Operate on the source data when you're persisting to a backend, exporting, or otherwise working with the dataset independent of how it's currently displayed. Operate on the visual dataset when you're reacting to what the user sees or clicked, such as inside a selection or change hook.

Handsontable binds to your source data by reference rather than copying it, so it's possible to read or write that array directly instead of going through the API. Avoid this: direct writes bypass hooks, validators, and index mapping, so the grid's visual dataset can drift out of sync with the array. See [Binding to data: Understand binding as a reference](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference) for the recommended alternative.

## Related

- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md) -- load data into the grid and choose between data structures.
- [Saving data](@/guides/getting-started/saving-data/saving-data.md) -- persist changes back to a backend.
- [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md) -- react to data changes, including the `source` argument.
- [Row hiding](@/guides/rows/row-hiding/row-hiding.md) and [Row trimming](@/guides/rows/row-trimming/row-trimming.md) -- feature-level details for each.
- [Row moving](@/guides/rows/row-moving/row-moving.md) and [Column moving](@/guides/columns/column-moving/column-moving.md) -- reorder the visual dataset without touching the source array.
- [`getData()`](@/api/core.md#getdata), [`getSourceData()`](@/api/core.md#getsourcedata), [`toPhysicalRow()`](@/api/core.md#tophysicalrow), [`toVisualRow()`](@/api/core.md#tovisualrow) API reference.
