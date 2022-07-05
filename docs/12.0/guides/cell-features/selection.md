---
title: Selection
metaTitle: Selection - Guide - Handsontable Documentation
permalink: /12.0/selection
canonicalUrl: /selection
tags:
  - selecting ranges
---

# Selection

[[toc]]

## Overview

Selection enables you to select a single cell or ranges of cells within Handsontable. Once selected, you can retrieve data from the cell, edit the cell's contents, or change the style of the cell.

## Basic configuration

With this feature, you can select single cells or ranges of cells across a grid. Easily retrieve the coordinates of the selected cells to clear or change the cells' content.

Use <kbd>**Cmd**</kbd> on Mac or <kbd>**Ctrl**</kbd> on Windows to select non-adjacent ranges of cells.

## Selecting ranges

There are different modes in which you can use this plugin. Choose between selecting a single cell, a range of adjacent cells, and multiple non-adjacent ranges of cells.

Possible values of [`selectionMode`](@/api/options.md#selectionmode):

- [`single`](@/api/options.md#selectionmode) - A single cell can be selected.
- [`range`](@/api/options.md#selectionmode) - Multiple cells within a single range can be selected.
- [`multiple`](@/api/options.md#selectionmode) - Multiple non-contiguous ranges of cells can be selected.

::: example #example1 --html 1 --js 2
```html
<div id="example1" class="hot"></div>
<div>
  <select id="selectOption" style="width: auto; margin-top: 16px">
    <option>Single selection</option>
    <option>Range selection</option>
    <option selected="selected">Multiple ranges selection</option>
  </select>
</div>
```
```js
const container = document.querySelector('#example1');
const selectOption = document.querySelector('#selectOption');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
});

selectOption.addEventListener('change', event => {
  const value = event.target.value;
  const first = value.split(' ')[0].toLowerCase();

  hot.updateSettings({
    selectionMode: first
  });
});
```
:::

## Getting data from the selected ranges

To retrieve the selected cells as an array of arrays, you use the [`getSelected()`](@/api/core.md#getselected) or [`getSelectedRange()`](@/api/core.md#getselectedrange) methods.

::: example #example2 --css 2 --html 1 --js 3
```html
<div id="example2" class="hot"></div>
<pre id="output"></pre>
<div class="controls">
  <button id="getButton">Get data</button>
</div>
```
```css
#output {
  margin: 16px 0 7px;
  width: 100%;
  height: 160px;
  overflow:scroll;
  border: 1px solid #ccc;
  background: #fff;
  color: #2c3e50;
  box-sizing: border-box;
}
```
```js
const container = document.querySelector('#example2');
const output = document.querySelector('#output');
const getButton = document.querySelector('#getButton');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
});

getButton.addEventListener('click', event => {
  const selected = hot.getSelected() || [];
  const data = [];

  for (let i = 0; i < selected.length; i += 1) {
    const item = selected[i];

    data.push(hot.getData(...item));
  }

  output.innerText = JSON.stringify(data, null, 2);
});
```
:::

## Modifying the selected cells

You may want to delete, format, or otherwise change the selected cells. For example, you can change a value or add CSS classes to the selected cells using the demo below.

::: example #example3 --html 1 --css 2 --js 3
```html
<div id="example3" class="hot"></div>

<div id="buttons" class="controls" style="margin-top: 10px">
  <button id="set-data-action">Change selected data</button>
  <button id="add-css-class-action">Make selected cells red</button>
</div>
```
```css
.c-red {
  color: red;
}
```
```js
const container = document.querySelector('#example3');
const buttons = document.querySelector('#buttons');

const hot = new Handsontable(container, {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 'auto',
  height: 272,
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
});

buttons.addEventListener('click', event => {
  const selected = hot.getSelected() || [];
  const target = event.target.id;

  hot.suspendRender();

  for (let index = 0; index < selected.length; index += 1) {
    const [row1, column1, row2, column2] = selected[index];
    const startRow = Math.max(Math.min(row1, row2), 0);
    const endRow = Math.max(row1, row2);
    const startCol = Math.max(Math.min(column1, column2), 0);
    const endCol = Math.max(column1, column2);

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
        if (target === 'set-data-action') {
          hot.setDataAtCell(rowIndex, columnIndex, 'data changed');
        }

        if (target === 'add-css-class-action') {
          hot.setCellMeta(rowIndex, columnIndex, 'className', 'c-red');
        }
      }
    }
  }

  hot.render();
  hot.resumeRender();
});
```
:::

## Styling the selection area

The background color can be easily changed using CSS styles. The main, light blue background color is defined in the `.area` class.

For non-adjacent selection, multiple classes are making each level a bit darker. These classes are called `area-1`, `area-2`, etc.

Unfortunately, there is no easy way to change the border color of the selection.

## Jumping across the grid's edges 

When you use keyboard navigation, and you cross an edge of the grid, you can set cell selection to jump to the opposite edge.

#### Jumping across vertical edges

To enable jumping across the left and right edges:
- Set the [`autoWrapRow`](@/api/options.md#autowraprow) configuration option to `true`.

To jump across a vertical edge:
- When cell selection is on a row's first cell, press the left arrow key.
- When cell selection is on a row's last cell, press the right arrow key, or press <kbd>**Tab**</kbd>.

#### Jumping across horizontal edges

To enable jumping across the top and bottom edges:
- Set the [`autoWrapCol`](@/api/options.md#autowrapcol) configuration option to `true`.

To jump across a horizontal edge:
- When cell selection is on a column's first cell, press the up arrow key.
- When cell selection is on a column's last cell, press the down arrow key, or press <kbd>**Enter**</kbd>.

## Related keyboard shortcuts

| Windows                                                       | macOS                                                        | Action                                                                           |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**A**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**A**</kbd>                        | Select all cells and headers                                                     | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↑**</kbd> | Extend the selection to the first cell of the current column<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**↓**</kbd> | Extend the selection to the last cell of the current column<sup>**</sup>         | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**←**</kbd> | Extend the selection to the leftmost cell of the current row<sup>**</sup>        | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**→**</kbd> | Extend the selection to the rightmost cell of the current row<sup>**</sup>       | &check; | &check; |
| <kbd>**Shift**</kbd> + Arrow keys                             | <kbd>**Shift**</kbd> + Arrow keys                            | Extend the selection by one cell                                                 | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Home**</kbd>                    | <kbd>**Shift**</kbd> + <kbd>**Home**</kbd>                   | Extend the selection to the first non-frozen cell of the current row<sup>*</sup> | &check; | &cross; |
| <kbd>**Shift**</kbd> + <kbd>**End**</kbd>                     | <kbd>**Shift**</kbd> + <kbd>**End**</kbd>                    | Extend the selection to the last non-frozen cell of the current row<sup>*</sup>  | &cross; | &cross; |
| <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                 | <kbd>**Shift**</kbd> + <kbd>**Page Up**</kbd>                | Extend the selection by one screen up                                            | &check; | &check; |
| <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>               | <kbd>**Shift**</kbd> + <kbd>**Page Down**</kbd>              | Extend the selection by one screen down                                          | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Enter**</kbd>                    | <kbd>**Cmd**</kbd> + <kbd>**Enter**</kbd>                    | Fill the selected range of cells with the value of the active cell               | &cross; | &check; |
| <kbd>**Delete**</kbd>                                         | <kbd>**Delete**</kbd>                                        | Clear the contents of the selected cells                                         | &check; | &check; |
| <kbd>**Backspace**</kbd>                                      | <kbd>**Backspace**</kbd>                                     | Clear the contents of the selected cells                                         | &check; | &check; |

<sup>*</sup> This action depends on your [layout direction](@/guides/internationalization/layout-direction.md).<br>
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