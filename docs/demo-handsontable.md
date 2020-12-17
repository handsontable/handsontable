---
id: demo-handsontable
title: Handsontable
sidebar_label: Handsontable
slug: /demo-handsontable
---

function getCarData() { return \[ \["Tesla", 2017, "black", "black"\], \["Nissan", 2018, "blue", "blue"\], \["Chrysler", 2019, "yellow", "black"\], \["Volvo", 2020, "white", "gray"\] \]; }

This page shows using Handsontable as a cell editor in Handsontable (sometimes referred as **HOT-in-HOT**). Please **note** that although the functionality of **HOT-in-HOT** is similar to this of the Handsontable, it may not support all of its features.

**HOT-in-HOT opens by any of the following:**

*   F2 or ENTER key is pressed while the cell is selected,
*   the triangle icon is clicked,
*   the cell content is double clicked.

While HOT-in-HOT is opened, the text field above the HOT-in-HOT remains focused at all times.

**Keyboard bindings while the HOT-in-HOT is opened:**

*   ESC - close editor (cancel change),
*   ENTER - close editor (apply change\*), move the selection in the main HOT downwards (or according to `enterMoves` setting),
*   TAB - behave as the ENTER key, but move the selection in the main HOT to the right (or according to `tabMoves` setting),
*   ARROW DOWN - move the selection in HOT-in-HOT downwards. If the last row was selected, has no effect,
*   ARROW UP - move the selection in HOT-in-HOT upwards. If the first row was selected, deselect. If HOT-in-HOT was deselected, behave as the ENTER key but move the selection in the main HOT upwards,
*   ARROW RIGTH - move the text cursor in the text field to the left. If the text cursor was at the start position, behave as the ENTER key but move the selection in the main HOT to the left,
*   ARROW LEFT - move the text cursor in the text field to the right. If the text cursor was at the end position, behave as the TAB key.

Mouse click outside of the editor or on one of the cells in HOT-in-HOT applies change.

**\*apply change** means: The value of the cell highlighted or clicked in HOT-in-HOT is applied as new cell value in the main HOT. If no cell in HOT-in-HOT is selected, the value of the text field is used instead.

Edit Log to console

var carData = getCarData(), container = document.getElementById('example1'), manufacturerData, colors, color, colorData = \[\], hot; manufacturerData = \[ {name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG'}, {name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC'}, {name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd'}, {name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation'}, {name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation'}, {name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group'} \]; colors = \['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white'\]; while (color = colors.shift()) { colorData.push(\[ \[color\] \]); } hot = new Handsontable(container, { data: carData, colHeaders: \['Car', 'Year', 'Chassis color', 'Bumper color'\], columns: \[ { type: 'handsontable', handsontable: { colHeaders: \['Marque', 'Country', 'Parent company'\], autoColumnSize: true, data: manufacturerData, getValue: function() { var selection = this.getSelectedLast(); // Get always manufacture name of clicked row and ignore header // coordinates (negative values) return this.getSourceDataAtRow(Math.max(selection\[0\], 0)).name; }, } }, {type: 'numeric'}, { type: 'handsontable', handsontable: { colHeaders: false, data: colorData } }, { type: 'handsontable', handsontable: { colHeaders: false, data: colorData } } \] });

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/handsontable.html)
