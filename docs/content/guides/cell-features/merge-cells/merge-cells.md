---
type: how-to
title: Merge cells
metaTitle: Merge cells - JavaScript Data Grid | Handsontable
description: Merge adjacent cells, using the "Ctrl + M" shortcut or the context menu. Control merged cells, using Handsontable's API.
permalink: /merge-cells
canonicalUrl: /merge-cells
react:
  metaTitle: Merge cells - React Data Grid | Handsontable
angular:
  metaTitle: Merge cells - Angular Data Grid | Handsontable
vue:
  metaTitle: Merge cells - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Merge adjacent cells, using the <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> shortcut or the context menu. Control merged cells, using Handsontable's API.

[[toc]]

## Overview

By merging, you can combine two or more adjacent cells into a single cell that spans several rows or columns.

Handsontable merges cells in the same way as Microsoft Excel: keeps only the upper-left value of the selected range and clears other values. This clearing happens in the underlying data, not just on screen -- see [Effect on the underlying data](#effect-on-the-underlying-data).

## How to merge cells

To enable the merge cells feature, set the [`mergeCells`](@/api/options.md#mergecells) option to  `true` or to an array.

To initialize Handsontable with predefined merged cells, provide merged cells details in form of an array:

The `row` and `col` properties use visual indexes. They refer to positions as displayed in the grid, in the same coordinate space as `selectCell()` and `getCellMeta()`.

::: only-for javascript

```js
mergeCells: [
  { row: 1, col: 1, rowspan: 3, colspan: 3 },
  { row: 3, col: 4, rowspan: 2, colspan: 2 },
  { row: 5, col: 6, rowspan: 3, colspan: 3 },
]
```

:::

::: only-for react

```jsx
mergeCells={[
  { row: 1, col: 1, rowspan: 3, colspan: 3 },
  { row: 3, col: 4, rowspan: 2, colspan: 2 },
  { row: 5, col: 6, rowspan: 3, colspan: 3 },
]}
```

:::

::: only-for angular

```ts
settings = {
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
    { row: 5, col: 6, rowspan: 3, colspan: 3 },
  ],
};
```

:::

::: only-for vue

```js
const hotSettings = {
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
    { row: 5, col: 6, rowspan: 3, colspan: 3 },
  ],
};
```

:::

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/merge-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/react/example1.jsx)
@[code](@/content/guides/cell-features/merge-cells/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/merge-cells/angular/example1.ts)
@[code](@/content/guides/cell-features/merge-cells/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/merge-cells/vue/example1.vue)

:::

:::

## Optimizing rendering of the wide/tall merged cells

When cells span thousands of rows or columns, scrolling may feel slower compared to unmerged cells. To improve performance, consider enabling the dedicated virtualization feature for merged cells, which is disabled by default.

To enable the merged cells virtualization mode, enable the `virtualized` option:

::: only-for javascript

```js
mergeCells: {
  virtualized: true,
  cells: [{ row: 1, col: 1, rowspan: 200, colspan: 2 }]
}
```

:::

::: only-for react

```jsx
mergeCells={{
  virtualized: true,
  cells: [{ row: 1, col: 1, rowspan: 200, colspan: 2 }]
}}
```

:::

::: only-for angular

```ts
settings = {
  mergeCells: {
    virtualized: true,
    cells: [{ row: 1, col: 1, rowspan: 200, colspan: 2 }],
  },
};
```

:::

::: only-for vue

```js
const hotSettings = {
  mergeCells: {
    virtualized: true,
    cells: [{ row: 1, col: 1, rowspan: 200, colspan: 2 }],
  },
};
```

:::

The example below uses virtualized merged cells. It's also recommended to increase the buffer of rendered rows/columns to minimize the flickering effects.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/javascript/example2.js)
@[code](@/content/guides/cell-features/merge-cells/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/react/example2.jsx)
@[code](@/content/guides/cell-features/merge-cells/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/merge-cells/angular/example2.ts)
@[code](@/content/guides/cell-features/merge-cells/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/merge-cells/vue/example2.vue)

:::

:::

## React to merge and unmerge events

To run your own logic when cells merge or unmerge, use the [`beforeMergeCells`](@/api/hooks.md#beforemergecells), [`afterMergeCells`](@/api/hooks.md#aftermergecells), [`beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells), and [`afterUnmergeCells`](@/api/hooks.md#afterunmergecells) hooks. Each hook receives the affected `cellRange`, and `afterMergeCells` also receives the resulting `mergeParent` object (`row`, `col`, `rowspan`, `colspan`).

The example below logs a message every time you merge or unmerge cells, using the context menu or the <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> shortcut.

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/merge-cells/javascript/example3.html)
@[code](@/content/guides/cell-features/merge-cells/javascript/example3.js)
@[code](@/content/guides/cell-features/merge-cells/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/react/example3.jsx)
@[code](@/content/guides/cell-features/merge-cells/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/merge-cells/angular/example3.ts)
@[code](@/content/guides/cell-features/merge-cells/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-features/merge-cells/vue/example3.vue)

:::

:::

## Merge and unmerge cells programmatically

To merge or unmerge a range without a user action, call the [`MergeCells`](@/api/mergeCells.md) plugin's `merge()` and `unmerge()` methods. Both methods take a visual `startRow`, `startColumn`, `endRow`, and `endColumn`, the same coordinate space as `selectCell()`.

```js
hot.getPlugin('mergeCells').merge(startRow, startColumn, endRow, endColumn);
hot.getPlugin('mergeCells').unmerge(startRow, startColumn, endRow, endColumn);
```

This clears the underlying data the same way as merging through the UI or the [`mergeCells`](@/api/options.md#mergecells) configuration option. See [Effect on the underlying data](#effect-on-the-underlying-data).

The example below merges and unmerges a footnote row that spans every column, using buttons instead of a manual selection.

::: only-for javascript

::: example #example4 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/merge-cells/javascript/example4.html)
@[code](@/content/guides/cell-features/merge-cells/javascript/example4.js)
@[code](@/content/guides/cell-features/merge-cells/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/merge-cells/react/example4.jsx)
@[code](@/content/guides/cell-features/merge-cells/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/merge-cells/angular/example4.ts)
@[code](@/content/guides/cell-features/merge-cells/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-features/merge-cells/vue/example4.vue)

:::

:::

## Effect on the underlying data

Merging doesn't only hide the covered cells visually -- it clears their values in the underlying data too, whether you merge through the UI, the [`mergeCells`](@/api/options.md#mergecells) configuration option, or the `merge()` method. Only the top-left cell of the range keeps its value; every other cell covered by the merge is set to `null`.

For a range merged at `(0, 0)` with `rowspan: 2` and `colspan: 2`:

```js
hot.getData();
// -> [['Top-left value', null], [null, null]]

hot.getSourceData();
// -> [['Top-left value', null], [null, null]] (the same)
```

Both [`getData()`](@/api/core.md#getdata) and [`getSourceData()`](@/api/core.md#getsourcedata) return `null` for the covered cells, because the clearing runs through the normal change pipeline: it fires [`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange) with `source === 'MergeCells'` (see [Events and hooks: Definition for `source` argument](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument)).

Unmerging does not restore the cleared values. If you need the original values back, keep a copy before merging, or restore them yourself in a [`beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells) or [`afterUnmergeCells`](@/api/hooks.md#afterunmergecells) handler.

### Re-applying the same configuration

Re-applying a `mergeCells` value through [`updateSettings()`](@/api/core.md#updatesettings) clears only the cells that still hold a value. A range whose cells are already empty changes no data, so it fires no [`beforeChange`](@/api/hooks.md#beforechange) or [`afterChange`](@/api/hooks.md#afterchange) event.

This depends on the clearing write reaching the data. If you cancel it -- by returning `false` from `beforeChange`, or with a validator that rejects `null` while [`allowInvalid`](@/api/options.md#allowinvalid) is `false` -- the covered cells keep their values, and every re-apply tries to clear them again.

This matters when a framework wrapper resends every option on each render. React and Angular do. Without it, an app that writes those events back into a store keeps receiving changes for values that never changed, and the two can keep triggering each other.

Nothing else about the clearing changes. A range still clears its covered cells the first time you apply it, even where those cells are already empty. And if new values arrive in a covered range -- because you passed new `data`, or because sorting, filtering, or a row move brought other rows under the range -- the next re-apply clears them, then stays quiet:

```js
hot.updateSettings({
  data: [['A1', 'B1'], ['A2', 'B2']],
  mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }], // unchanged
});

hot.getDataAtCell(0, 1); // -> null, cleared as usual
```

## Effect on viewport getter methods

With merged cells, the rendered range extends to fit any merged cell that crosses the viewport edge. This is the same expansion that the `virtualized` option turns off. As a result, the rendered-range getters can return indexes beyond what you see on the screen:

- [`getFirstRenderedVisibleRow()`](@/api/core.md#getfirstrenderedvisiblerow), [`getLastRenderedVisibleRow()`](@/api/core.md#getlastrenderedvisiblerow), [`getFirstRenderedVisibleColumn()`](@/api/core.md#getfirstrenderedvisiblecolumn), and [`getLastRenderedVisibleColumn()`](@/api/core.md#getlastrenderedvisiblecolumn).
- [`AutoRowSize.getFirstVisibleRow()`](@/api/autoRowSize.md#getfirstvisiblerow) and [`AutoRowSize.getLastVisibleRow()`](@/api/autoRowSize.md#getlastvisiblerow), which delegate to the rendered-row getters.
- [`AutoColumnSize.getFirstVisibleColumn()`](@/api/autoColumnSize.md#getfirstvisiblecolumn) and [`AutoColumnSize.getLastVisibleColumn()`](@/api/autoColumnSize.md#getlastvisiblecolumn), which delegate to the rendered-column getters.

For example, a merged cell that spans columns 0 to 100 makes `getLastVisibleColumn()` return an index near 100, even when the viewport shows far fewer columns.

To read the actual visible viewport, use the fully-visible or partially-visible getters, which ignore the merge-cell expansion:

- [`getFirstFullyVisibleRow()`](@/api/core.md#getfirstfullyvisiblerow), [`getLastFullyVisibleRow()`](@/api/core.md#getlastfullyvisiblerow), [`getFirstFullyVisibleColumn()`](@/api/core.md#getfirstfullyvisiblecolumn), and [`getLastFullyVisibleColumn()`](@/api/core.md#getlastfullyvisiblecolumn).
- [`getFirstPartiallyVisibleRow()`](@/api/core.md#getfirstpartiallyvisiblerow), [`getLastPartiallyVisibleRow()`](@/api/core.md#getlastpartiallyvisiblerow), [`getFirstPartiallyVisibleColumn()`](@/api/core.md#getfirstpartiallyvisiblecolumn), and [`getLastPartiallyVisibleColumn()`](@/api/core.md#getlastpartiallyvisiblecolumn).

Setting `virtualized` to `true` also removes the range expansion, but it is a performance option -- the rendered-range getters still include buffered rows and columns outside the viewport.

## Behavior during row/column reorder and column freeze

When a merged cell's underlying rows or columns are reordered (through [`manualColumnMove`](@/api/options.md#manualcolumnmove), [`manualRowMove`](@/api/options.md#manualrowmove), or [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)), Handsontable follows the merge to the new visual position. Two side effects can occur:

- **Auto-split**: if the move bisects a merge so the underlying cells are no longer contiguous in the new visual order, the merge is split into separate merges, one per contiguous run. The cross-axis span (`rowspan` for column moves, `colspan` for row moves) is preserved on every fragment.
- **Silent drop of single-cell fragments**: any resulting fragment that ends up as a single cell (`rowspan === 1 && colspan === 1`) is removed, because a single cell is no longer a merge. The [`afterMergeCells`](@/api/hooks.md#aftermergecells) hook is not fired for the dropped fragment.

[`undo`](@/api/options.md#undo) and [`redo`](@/api/options.md#redo) restore the pre-move state, including any merges that were split or dropped by the reorder.

## Result

Cells at the configured positions are now merged. Users see a single cell spanning multiple rows or columns.

## Related keyboard shortcuts

| Windows                                | macOS                                  | Action                              |  Excel  | Sheets  |
| -------------------------------------- | -------------------------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | <kbd>⌃</kbd>+<kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

## Related API reference

**Configuration options**

<div class="boxes-list">

- [mergeCells](@/api/options.md#mergecells)
- [viewportColumnRenderingThreshold](@/api/options.md#viewportcolumnrenderingthreshold)
- [viewportRowRenderingThreshold](@/api/options.md#viewportrowrenderingthreshold)
- [viewportColumnRenderingOffset](@/api/options.md#viewportcolumnrenderingoffset)
- [viewportRowRenderingOffset](@/api/options.md#viewportrowrenderingoffset)

</div>

**Hooks**

<div class="boxes-list">

- [afterMergeCells](@/api/hooks.md#aftermergecells)
- [afterUnmergeCells](@/api/hooks.md#afterunmergecells)
- [beforeMergeCells](@/api/hooks.md#beforemergecells)
- [beforeUnmergeCells](@/api/hooks.md#beforeunmergecells)

</div>

**Plugins**

<div class="boxes-list">

- [MergeCells](@/api/mergeCells.md)

</div>
