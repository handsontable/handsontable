---
id: demo-read-only
title: Read-only
sidebar_label: Read-only
slug: /demo-read-only
---

function getCarData() { return \[ {car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black'}, {car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue'}, {car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black'}, {car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray'} \]; }

*   [Read-only columns](#page-columns)
*   [Read-only specific cells](#page-cells)
*   [Read-only comments](#page-comments)

### Read-only columns

In many usage cases, you will need to configure a certain column to be read only. This column will be available for keyboard navigation and CTRL+C. Only editing and pasting data will be disabled.

To make a column read-only, declare it in the `columns` setting. You can also define a special renderer function that will dim the read-only values.

Edit Log to console

var container1 = document.getElementById('example1'); var hot1 = new Handsontable(container1, { data: getCarData(), colHeaders: \['Car', 'Year', 'Chassis color', 'Bumper color'\], columns: \[ { data: 'car', readOnly: true }, { data: 'year' }, { data: 'chassis' }, { data: 'bumper' } \] });

### Read-only specific cells

This example makes cells that contain the word "Nissan" read only. It forces all cells to be processed by the `cells` function which will decide whether a cell meta should have set `readOnly` property.

Edit Log to console

var container2 = document.getElementById('example2'); var hot2 = new Handsontable(container2, { data: getCarData(), colHeaders: \['Car', 'Year', 'Chassis color', 'Bumper color'\] }); hot2.updateSettings({ cells: function (row, col) { var cellProperties = {}; if (hot2.getData()\[row\]\[col\] === 'Nissan') { cellProperties.readOnly = true; } return cellProperties; } });

### Read-only comments

This example makes the comment attached to a cell that contain the word "Tesla" read only.

You can compare it with the comment inside a cell with "Honda" wording.

Edit Log to console

function getData() { return \[ \['', 'Tesla', 'Toyota', 'Honda', 'Ford'\], \['2018', 10, 11, 12, 13, 15, 16\], \['2019', 10, 11, 12, 13, 15, 16\], \['2020', 10, 11, 12, 13, 15, 16\], \]; } var container3 = document.getElementById('example3'), hot3; hot3 = new Handsontable(container3, { data: getData(), rowHeaders: true, colHeaders: true, contextMenu: true, comments: true, cell: \[ {row: 0, col: 1, comment: {value: 'A read-only comment.', readOnly: true}}, {row: 0, col: 3, comment: {value: 'You can edit this comment!'}} \] });
