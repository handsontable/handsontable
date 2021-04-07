---
title: Custom buttons
permalink: /next/custom-buttons
canonicalUrl: /custom-buttons
---

# {{ $frontmatter.title }}

The **[alter](api/core.md#alter)** method can be used if you want to insert or remove rows and columns using external buttons. You can programmatically select a cell using the **[selectCell](api/core.md#selectCell)** and load new data by **[loadData](api/core.md#loadData)** function. The below button implements it.

<p>
  <button id="selectFirst">Select first cell</button>
  <button id="removeFirstColumn">Remove first column</button>
  <button id="removeFirstRow">Remove first row</button>
  <button id="resetState">Reset state</button>
</p>

::: example #example1
```js
var data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16]
];
var container = document.getElementById('example1');
var selectFirst = document.getElementById('selectFirst');
var removeFirstRow = document.getElementById('removeFirstRow');
var removeFirstColumn = document.getElementById('removeFirstColumn');
var resetState = document.getElementById('resetState');
var hot = new Handsontable(container, {
  rowHeaders: true,
  colHeaders: true,
  data: JSON.parse(JSON.stringify(data))
});

Handsontable.dom.addEvent(selectFirst, 'click', function () {
  hot.selectCell(0, 0);
});

Handsontable.dom.addEvent(removeFirstRow, 'click', function () {
  hot.alter('remove_row', 0);
});

Handsontable.dom.addEvent(removeFirstColumn, 'click', function () {
  hot.alter('remove_col', 0);
});

Handsontable.dom.addEvent(resetState, 'click', function () {
  hot.loadData(JSON.parse(JSON.stringify(data)));
});
```
:::
