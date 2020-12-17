---
id: demo-selecting-ranges
title: Selecting ranges
sidebar_label: Selecting ranges
slug: /demo-selecting-ranges
---

*   [Basic configuration](#page-basic)
*   [Selecting ranges](#page-selecting)
*   [Getting data from the selected ranges](#page-getting)
*   [Modifying the selected cells](#page-modifying)
*   [Styling the selection area](#page-styling)

### Basic configuration

With this feature, you can select single cells or ranges of cells across a spreadsheet. The coordinates of the selected cells can be easily retrieved to clear or change the cells' content.

This functionality is a part of Handsontable Core.

Use CMD on Mac or CTRL on Windows to select non-contiguous ranges of cells.

### Selecting ranges

There are different modes in which you can use this plugin. Choose between selecting a single cell, a range of adjacent cells and multiple ranges of non-contiguous cells.

Possible values of `selectionMode`:

*   `single` - A single cell can be selected,
*   `range` - Multiple cells within a single range can be selected,
*   `multiple` - Multiple non-contiguous ranges of cells can be selected.

Single selection Range selection Multiple selection

Edit Log to console

var example1 = document.getElementById('example1'); var selectOption = document.getElementById('selectOption'); var settings1 = { data: Handsontable.helper.createSpreadsheetData(10, 10), width: 650, height: 272, colWidths: 100, rowHeights: 23, rowHeaders: true, colHeaders: true, selectionMode: 'multiple', // 'single', 'range' or 'multiple' }; var hot1 = new Handsontable(example1, settings1); selectOption.addEventListener('change', function(event) { var value = event.target.value; var first = value.split(' ')\[0\].toLowerCase(); hot1.updateSettings({ selectionMode: first }); });

### Getting data from the selected ranges

To retrieve the selected cells as an array of arrays, you should use `getSelected()` or `getSelectedRange()` methods.

Get data

Edit Log to console

var example2 = document.getElementById('example2'); var output = document.getElementById('output'); var getButton = document.getElementById('getButton'); var settings2 = { data: Handsontable.helper.createSpreadsheetData(10, 10), width: 650, height: 272, colWidths: 100, rowHeights: 23, rowHeaders: true, colHeaders: true, outsideClickDeselects: false, selectionMode: 'multiple', // 'single', 'range' or 'multiple' }; var hot2 = new Handsontable(example2, settings2); getButton.addEventListener('click', function(event) { var selected = hot2.getSelected(); var data = \[\]; for (var i = 0; i < selected.length; i += 1) { var item = selected\[i\]; data.push(hot2.getData.apply(hot2, item)); } output.value = JSON.stringify(data); });

### Modifying the selected cells

You may want to delete, format or otherwise change the selected cells. For instance, you can change value or add CSS classes to the all selected cells using the demo below.

Set data Add class

Edit Log to console

var example3 = document.getElementById('example3'); var buttons = document.getElementById('buttons'); var settings3 = { data: Handsontable.helper.createSpreadsheetData(10, 10), width: 650, height: 272, colWidths: 100, rowHeights: 23, rowHeaders: true, colHeaders: true, outsideClickDeselects: false, selectionMode: 'multiple', // 'single', 'range' or 'multiple' }; var hot3 = new Handsontable(example3, settings3); buttons.addEventListener('click', function(event) { var selected = hot3.getSelected(); var target = event.target.id; for (var index = 0; index < selected.length; index += 1) { var item = selected\[index\]; var startRow = Math.min(item\[0\], item\[2\]); var endRow = Math.max(item\[0\], item\[2\]); var startCol = Math.min(item\[1\], item\[3\]); var endCol = Math.max(item\[1\], item\[3\]); for (var rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) { for (var columnIndex = startCol; columnIndex <= endCol; columnIndex += 1) { if (target === 'setButton') { hot3.setDataAtCell(rowIndex, columnIndex, 'data changed'); } if (target === 'addButton') { hot3.setCellMeta(rowIndex, columnIndex, 'className', 'c-deeporange'); } } } } hot3.render(); });

### Styling the selection area

The background color can be easily changed using CSS styles. The main, light blue background color, is defined in the `.area` class.

For non-contiguous selection, there are multiple classes making each level a bit darker. These classes are called `area-1`, `area-2` etc.

Unfortunately, there is no easy way to change the border color of selection.

