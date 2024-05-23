---
id: k5920uow
title: Merge cells
metaTitle: Merge cells - JavaScript Data Grid | Handsontable
description: Merge adjacent cells, using the "Ctrl + M" shortcut or the context menu. Control merged cells, using Handsontable's API.
permalink: /merge-cells
canonicalUrl: /merge-cells
react:
  id: ulndkavi
  metaTitle: Merge cells - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Merge cells

Merge adjacent cells, using the <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> shortcut or the context menu. Control merged cells, using Handsontable's API.

[[toc]]

## Overview

By merging, you can combine two or more adjacent cells into a single cell that spans several rows or columns.

Handsontable merges cells in the same way as Microsoft Excel: keeps only the upper-left value of the selected range and clears other values.

Cell merging happens on Handsontable's visual layer and doesn't affect your source data structure.

## How to merge cells

To enable the merge cells feature, set the [`mergeCells`](@/api/options.md#mergecells) option to  `true` or to an array.

To initialize Handsontable with predefined merged cells, provide merged cells details in form of an array:

::: only-for javascript

`mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }]`

:::

::: only-for react

`mergeCells={[{ row: 1, col: 1, rowspan: 2, colspan: 2 }]}`

:::

::: only-for javascript

::: example #example1

@[code](@/content/guides/cell-features/merge-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/merge-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react

@[code](@/content/guides/cell-features/merge-cells/react/example1.jsx)

:::

:::

## Related keyboard shortcuts

| Windows                                | macOS                                  | Action                              |  Excel  | Sheets  |
| -------------------------------------- | -------------------------------------- | ----------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | <kbd>**Ctrl**</kbd>+<kbd>**M**</kbd> | Merge or unmerge the selected cells | &cross; | &cross; |

## Related API reference

- Configuration options:
  - [`mergeCells`](@/api/options.md#mergecells)
- Hooks:
  - [`afterMergeCells`](@/api/hooks.md#aftermergecells)
  - [`afterUnmergeCells`](@/api/hooks.md#afterunmergecells)
  - [`beforeMergeCells`](@/api/hooks.md#beforemergecells)
  - [`beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells)
- Plugins:
  - [`MergeCells`](@/api/mergeCells.md)
