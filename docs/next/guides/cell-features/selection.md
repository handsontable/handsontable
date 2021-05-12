---
title: Selection
permalink: /next/selection
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

Use <kbd>CMD</kbd> on Mac or <kbd>CTRL</kbd> on Windows to select non-contiguous ranges of cells.

## Selecting ranges

There are different modes in which you can use this plugin. Choose between selecting a single cell, a range of adjacent cells, and multiple ranges of non-contiguous cells.

Possible values of `selectionMode`:

- `single` - A single cell can be selected.
- `range` - Multiple cells within a single range can be selected.
- `multiple` - Multiple non-contiguous ranges of cells can be selected.

::: example #example1 --html 1 --js 2
```html
<div id="example1" class="hot"></div>
<div>
  <select id="selectOption" style="width: auto; margin-top: 16px">
    <option>Single selection</option>
    <option>Range selection</option>
    <option selected="selected">Multiple selection</option>
  </select>
</div>
```
```js
const container = document.querySelector('#example1');
const selectOption = document.querySelector('#selectOption');

const settings = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};

const hot = new Handsontable(container, settings);

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

To retrieve the selected cells as an array of arrays, you should use the `getSelected()` or `getSelectedRange()` methods.

::: example #example2 --css 2 --html 1 --js 3
```html
<div id="example2" class="hot"></div>
<pre id="output"></pre>
<div>
  <button id="getButton">Get data</button>
</div>
```
```css
#output{
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

const settings = {
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
};

const hot = new Handsontable(container, settings);

getButton.addEventListener('click', event => {
  const selected = hot.getSelected();
  const data = [];

  for (let i = 0; i < selected.length; i += 1) {
    const item = selected[i];
    
    data.push(hot.getData.apply(hot, item));
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

<div id="buttons" style="margin-top: 10px">
  <button id="setButton">Set data</button>
  <button id="addButton">Add class</button>
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

const settings = {
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
};

const hot = new Handsontable(container, settings);

buttons.addEventListener('click', event => {
  const selected = hot.getSelected();
  const target = event.target.id;

  for (let index = 0; index < selected.length; index += 1) {
    const item = selected[index];
    const startRow = Math.min(item[0], item[2]);
    const endRow = Math.max(item[0], item[2]);
    const startCol = Math.min(item[1], item[3]);
    const endCol = Math.max(item[1], item[3]);

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      for (let columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
        if (target === 'setButton') {
          hot.setDataAtCell(rowIndex, columnIndex, 'data changed');
        }

        if (target === 'addButton') {
          hot.setCellMeta(rowIndex, columnIndex, 'className', 'c-red');
        }
      }
    }
  }

  hot.render();
});
```
:::

## Styling the selection area

The background color can be easily changed using CSS styles. The main, light blue background color is defined in the `.area` class.

For non-contiguous selection, multiple classes are making each level a bit darker. These classes are called `area-1`, `area-2`, etc.

Unfortunately, there is no easy way to change the border color of the selection.

## Jumping to the first/last cell

By default, the cell selection "jumps" to the other end of the row or column during navigating across the grid using the arrow keys.

Select any cell in the first row and press <kbd>ARROW UP</kbd> to jump to the last cell in the current column. The same thing happens when you are in first column and press <kbd>ARROW LEFT</kbd> - the selection jumps to the last column.

 This behavior can be disabled by setting `autoWrapCol: false` and `autoWrapRow: false`.


