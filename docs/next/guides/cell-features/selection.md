---
title: Selection
permalink: /next/selection
canonicalUrl: /selection
tags:
  - selecting ranges
---

# Selection

[[toc]]

## Basic configuration

With this feature, you can select single cells or ranges of cells across a spreadsheet. The coordinates of the selected cells can be easily retrieved to clear or change the cells' content.

This functionality is a part of Handsontable Core.

Use <kbd>CMD</kbd> on Mac or <kbd>CTRL</kbd> on Windows to select non-contiguous ranges of cells.

## Selecting ranges

There are different modes in which you can use this plugin. Choose between selecting a single cell, a range of adjacent cells and multiple ranges of non-contiguous cells.

Possible values of `selectionMode`:

* `single` - A single cell can be selected,
* `range` - Multiple cells within a single range can be selected,
* `multiple` - Multiple non-contiguous ranges of cells can be selected.

Single selection Range selection Multiple selection

<div>
  <select id="selectOption" style="width: auto; margin-top: 16px">
    <option>Single selection</option>
    <option>Range selection</option>
    <option selected="selected">Multiple selection</option>
  </select>
</div>

::: example #example1
```js
const container = document.querySelector('#example1');
const selectOption = document.querySelector('#selectOption');

const settings1 = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 650,
  height: 'auto',
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};

const hot1 = new Handsontable(container, settings1);

selectOption.addEventListener('change', event => {
  const value = event.target.value;
  const first = value.split(' ')[0].toLowerCase();

  hot1.updateSettings({
    selectionMode: first
  });
});
```
:::

## Getting data from the selected ranges

To retrieve the selected cells as an array of arrays, you should use `getSelected()` or `getSelectedRange()` methods.

<textarea style="margin: 16px 0 7px; width: 350px; height: 87px" id="output"></textarea>
<div>
  <button id="getButton">Get data</button>
</div>

::: example #example2
```js
const container = document.querySelector('#example2');
const output = document.querySelector('#output');
const getButton = document.querySelector('#getButton');

const settings2 = {
  data: Handsontable.helper.createSpreadsheetData(10, 10),
  width: 650,
  height: 'auto',
  colWidths: 100,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  selectionMode: 'multiple', // 'single', 'range' or 'multiple',
  licenseKey: 'non-commercial-and-evaluation'
};

const hot2 = new Handsontable(container, settings2);

getButton.addEventListener('click', event => {
  const selected = hot2.getSelected();
  const data = [];

  for (let i = 0; i < selected.length; i += 1) {
    const item = selected[i];

    data.push(hot2.getData.apply(hot2, item));
  }

  output.value = JSON.stringify(data);
});
```
:::

## Modifying the selected cells

You may want to delete, format or otherwise change the selected cells. For instance, you can change value or add CSS classes to the all selected cells using the demo below.

<div id="buttons" style="margin-top: 10px">
  <button id="setButton">Set data</button>
  <button id="addButton">Add class</button>
</div>

::: example #example3
```js
const container = document.querySelector('#example3');
const buttons = document.querySelector('#buttons');

const settings3 = {
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

const hot3 = new Handsontable(container, settings3);

buttons.addEventListener('click', event => {
  const selected = hot3.getSelected();
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

The background color can be easily changed using CSS styles. The main, light blue background color, is defined in the `.area` class.

For non-contiguous selection, there are multiple classes making each level a bit darker. These classes are called `area-1`, `area-2` etc.

Unfortunately, there is no easy way to change the border color of selection.
