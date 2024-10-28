---
id: a52om5wr
title: Selection
metaTitle: Selection - JavaScript Data Grid | Handsontable
description: Select a single cell, a range of adjacent cells, or multiple non-adjacent ranges of cells.
permalink: /selection
canonicalUrl: /selection
tags:
  - selecting ranges
  - cell selection
react:
  id: k88lznt8
  metaTitle: Selection - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Selection

Select a single cell, a range of adjacent cells, or multiple non-adjacent ranges of cells.

[[toc]]

## Overview

Selection enables you to select a single cell or ranges of cells within Handsontable. Once selected, you can retrieve data from the cell, edit the cell's contents, or change the style of the cell.

## Basic configuration

With this feature, you can select single cells or ranges of cells across a grid. Easily retrieve the coordinates of the selected cells to clear or change the cells' content.

Use <kbd>**Cmd**</kbd> on Mac or <kbd>**Ctrl**</kbd> on Windows to select non-adjacent ranges of cells.

## Select ranges

There are different modes in which you can use this plugin. Choose between selecting a single cell, a range of adjacent cells, and multiple non-adjacent ranges of cells.

Possible values of [`selectionMode`](@/api/options.md#selectionmode):

- [`single`](@/api/options.md#selectionmode) - You can select a single cell.
- [`range`](@/api/options.md#selectionmode) - You can select multiple cells within a single rangeselected.
- [`multiple`](@/api/options.md#selectionmode) - You can select multiple, non-adjacent ranges of cells.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/selection/javascript/example1.html)
@[code](@/content/guides/cell-features/selection/javascript/example1.js)
@[code](@/content/guides/cell-features/selection/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/selection/react/example1.jsx)
@[code](@/content/guides/cell-features/selection/react/example1.tsx)

:::

:::

## Get data from the selected ranges

To retrieve the selected cells as an array of arrays, you use the [`getSelected()`](@/api/core.md#getselected) or [`getSelectedRange()`](@/api/core.md#getselectedrange) methods.

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/selection/javascript/example2.html)
@[code](@/content/guides/cell-features/selection/javascript/example2.js)
@[code](@/content/guides/cell-features/selection/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/selection/react/example2.jsx)
@[code](@/content/guides/cell-features/selection/react/example2.tsx)

:::

:::

## Modify the selected cells

You may want to delete, format, or otherwise change the selected cells. For example, you can change a value or add CSS classes to the selected cells using the demo below.

::: only-for javascript

::: example #example3 --html 1 --css 2 --js 3 --ts 4

@[code](@/content/guides/cell-features/selection/javascript/example3.html)
@[code](@/content/guides/cell-features/selection/javascript/example3.css)
@[code](@/content/guides/cell-features/selection/javascript/example3.js)
@[code](@/content/guides/cell-features/selection/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --css 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/selection/react/example3.css)
@[code](@/content/guides/cell-features/selection/react/example3.jsx)
@[code](@/content/guides/cell-features/selection/react/example3.tsx)

:::

:::

## Style the selection area

You can easily change the background color, using CSS styles. The main, light blue background color is defined in the `.area` class.

For non-adjacent selection, multiple classes are making each level a bit darker. These classes are called `area-1`, `area-2`, etc.

Unfortunately, there is no easy way to change the border color of the selection.

## Jump across the grid's edges

When you use keyboard navigation to cross an edge of the grid, you can set cell selection to jump to the opposite edge.

#### Jump across vertical edges

To enable jumping across the left and right edges:
- Set the [`autoWrapRow`](@/api/options.md#autowraprow) configuration option to `true`.

To jump across a vertical edge:
- When cell selection is on a row's first cell, press the left arrow key.
- When cell selection is on a row's last cell, press the right arrow key, or press <kbd>**Tab**</kbd>.

#### Jump across horizontal edges

To enable jumping across the top and bottom edges:
- Set the [`autoWrapCol`](@/api/options.md#autowrapcol) configuration option to `true`.

To jump across a horizontal edge:
- When cell selection is on a column's first cell, press the up arrow key.
- When cell selection is on a column's last cell, press the down arrow key, or press <kbd>**Enter**</kbd>.

## Related keyboard shortcuts

| Windows                                                       | macOS                                                        | Action                                                                           |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**A**</kbd>                        | <kbd>**Cmd**</kbd>+<kbd>**A**</kbd>                        | Select all cells | &check; | &check; |
|<kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Space**</kbd> |<kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Space**</kbd> | Select all cells and headers                                                      | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                    | <kbd>**Ctrl**</kbd>+<kbd>**Space**</kbd>                   | Select the entire column                                                         | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                   | <kbd>**Shift**</kbd>+<kbd>**Space**</kbd>                  | Select the entire row                                                            | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↑**</kbd> | Extend the selection to the first cell of the current column<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**↓**</kbd> | Extend the selection to the last cell of the current column<sup>**</sup>         | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**←**</kbd> | Extend the selection to the leftmost cell of the current row<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd> | <kbd>**Cmd**</kbd>+<kbd>**Shift**</kbd>+<kbd>**→**</kbd> | Extend the selection to the rightmost cell of the current row<sup>**</sup>       | &check; | &check; |
| <kbd>**Shift**</kbd> + Arrow keys                             | <kbd>**Shift**</kbd> + Arrow keys                            | Extend the selection by one cell                                                 | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Home**</kbd>                    | <kbd>**Shift**</kbd>+<kbd>**Home**</kbd>                   | Extend the selection to the first non-frozen cell of the current row<sup>*</sup> | &check; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**End**</kbd>                     | <kbd>**Shift**</kbd>+<kbd>**End**</kbd>                    | Extend the selection to the last non-frozen cell of the current row<sup>*</sup>  | &cross; | &cross; |
| <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>                 | <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>                | Extend the selection by one screen up                                            | &check; | &check; |
| <kbd>**Shift**</kbd>+<kbd>**Page Down**</kbd>               | <kbd>**Shift**</kbd>+<kbd>**Page Down**</kbd>              | Extend the selection by one screen down                                          | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Enter**</kbd>                    | <kbd>**Cmd**</kbd>+<kbd>**Enter**</kbd>                    | Fill the selected range of cells with the value of the active cell               | &cross; | &check; |
| <kbd>**Delete**</kbd>                                         | <kbd>**Delete**</kbd>                                        | Clear the contents of the selected cells                                         | &check; | &check; |
| <kbd>**Backspace**</kbd>                                      | <kbd>**Backspace**</kbd>                                     | Clear the contents of the selected cells                                         | &check; | &check; |

<sup>*</sup> This action depends on your [layout direction](@/guides/internationalization/layout-direction/layout-direction.md).<br>
<sup>**</sup> In case of multiple selection layers, only the last selection layer gets extended.

## Related API reference

- Configuration options:
  - [`autoWrapCol`](@/api/options.md#autowrapcol)
  - [`autoWrapRow`](@/api/options.md#autowraprow)
  - [`fragmentSelection`](@/api/options.md#fragmentselection)
  - [`disableVisualSelection`](@/api/options.md#disablevisualselection)
  - [`dragToScroll`](@/api/options.md#dragtoscroll)
  - [`selectionMode`](@/api/options.md#selectionmode)
  - [`outsideClickDeselects`](@/api/options.md#outsideclickdeselects)
- Core methods:
  - [`deselectCell()`](@/api/core.md#deselectcell)
  - [`getSelected()`](@/api/core.md#getselected)
  - [`getSelectedLast()`](@/api/core.md#getselectedlast)
  - [`getSelectedRange()`](@/api/core.md#getselectedrange)
  - [`getSelectedRangeLast()`](@/api/core.md#getselectedrangelast)
  - [`selectAll()`](@/api/core.md#selectall)
  - [`selectCell()`](@/api/core.md#selectcell)
  - [`selectCells()`](@/api/core.md#selectcells)
  - [`selectColumns()`](@/api/core.md#selectcolumns)
  - [`selectRows()`](@/api/core.md#selectrows)
- Hooks:
  - [`afterDeselect`](@/api/hooks.md#afterdeselect)
  - [`afterDrawSelection`](@/api/hooks.md#afterdrawselection)
  - [`afterModifyTransformEnd`](@/api/hooks.md#aftermodifytransformend)
  - [`afterModifyTransformStart`](@/api/hooks.md#aftermodifytransformstart)
  - [`afterSelection`](@/api/hooks.md#afterselection)
  - [`afterSelectionByProp`](@/api/hooks.md#afterselectionbyprop)
  - [`afterSelectionEnd`](@/api/hooks.md#afterselectionend)
  - [`afterSelectionEndByProp`](@/api/hooks.md#afterselectionendbyprop)
  - [`modifyTransformStart`](@/api/hooks.md#modifytransformstart)
- Plugins:
  - [`DragToScroll`](@/api/dragToScroll.md)
