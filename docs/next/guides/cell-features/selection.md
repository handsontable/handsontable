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

<div>
  <select id="selectOption" style="width: auto; margin-top: 16px">
    <option>Single selection</option>
    <option>Range selection</option>
    <option selected="selected">Multiple selection</option>
  </select>
</div>

::: example #example1
```js
var example1 = document.getElementById('example1');
var selectOption = document.getElementById('selectOption');
var settings1 = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 650,
  height: 272,
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};
var hot1 = new Handsontable(example1, settings1);

selectOption.addEventListener('change', function(event) {
  var value = event.target.value;
  var first = value.split(' ')[0].toLowerCase();

  hot1.updateSettings({
    selectionMode: first
  });
});
```
:::

## Getting data from the selected ranges

To retrieve the selected cells as an array of arrays, you should use the `getSelected()` or `getSelectedRange()` methods.

<textarea style="margin: 16px 0 7px; width: 350px; height: 87px" id="output"></textarea>
<div>
  <button id="getButton">Get data</button>
</div>

::: example #example2
```js
var example2 = document.getElementById('example2');
var output = document.getElementById('output');
var getButton = document.getElementById('getButton');
var settings2 = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 650,
  height: 272,
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};
var hot2 = new Handsontable(example2, settings2);

getButton.addEventListener('click', function(event) {
  var selected = hot2.getSelected();
  var data = [];

  for (var i = 0; i < selected.length; i += 1) {
    var item = selected[i];

    data.push(hot2.getData.apply(hot2, item));
  }

  output.value = JSON.stringify(data);
});
```
:::

## Modifying the selected cells

You may want to delete, format, or otherwise change the selected cells. For example, you can change a value or add CSS classes to the selected cells using the demo below.

<div id="buttons" style="margin-top: 10px">
  <button id="setButton">Set data</button>
  <button id="addButton">Add class</button>
</div>

::: example #example3
```js
var example3 = document.getElementById('example3');
var buttons = document.getElementById('buttons');
var settings3 = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 650,
  height: 272,
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};
var hot3 = new Handsontable(example3, settings3);

buttons.addEventListener('click', function(event) {
  var selected = hot3.getSelected();
  var target = event.target.id;

  for (var index = 0; index < selected.length; index += 1) {
    var item = selected[index];
    var startRow = Math.min(item[0], item[2]);
    var endRow = Math.max(item[0], item[2]);
    var startCol = Math.min(item[1], item[3]);
    var endCol = Math.max(item[1], item[3]);

    for (var rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      for (var columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) {
        if (target === 'setButton') {
          hot3.setDataAtCell(rowIndex, columnIndex, 'data changed');
        }

        if (target === 'addButton') {
          hot3.setCellMeta(rowIndex, columnIndex, 'className', 'c-deeporange');
        }
      }
    }
  }

  hot3.render();
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


