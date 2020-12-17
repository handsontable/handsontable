---
id: demo-custom-buttons
title: Custom buttons
sidebar_label: Custom buttons
slug: /demo-custom-buttons
---

The **[alter](/docs/8.2.0/Core.html#alter)** method can be used if you want to insert or remove rows and columns using external buttons. You can programmatically select a cell using the **[selectCell](/docs/8.2.0/Core.html#selectCell)** and load new data by **[loadData](/docs/8.2.0/Core.html#loadData)** function. The below button implements it.

Select first cell Remove first column Remove first row Reset state

document.addEventListener("DOMContentLoaded", function() { var data = \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'\], \['2017', 10, 11, 12, 13, 15, 16\], \['2018', 10, 11, 12, 13, 15, 16\], \['2019', 10, 11, 12, 13, 15, 16\], \['2020', 10, 11, 12, 13, 15, 16\], \['2021', 10, 11, 12, 13, 15, 16\] \]; var container = document.getElementById('example1'); var selectFirst = document.getElementById('selectFirst'); var removeFirstRow = document.getElementById('removeFirstRow'); var removeFirstColumn = document.getElementById('removeFirstColumn'); var resetState = document.getElementById('resetState'); var hot = new Handsontable(container, { rowHeaders: true, colHeaders: true, data: JSON.parse(JSON.stringify(data)) }); Handsontable.dom.addEvent(selectFirst, 'click', function () { hot.selectCell(0, 0); }); Handsontable.dom.addEvent(removeFirstRow, 'click', function () { hot.alter('remove\_row', 0); }); Handsontable.dom.addEvent(removeFirstColumn, 'click', function () { hot.alter('remove\_col', 0); }); Handsontable.dom.addEvent(resetState, 'click', function () { hot.loadData(JSON.parse(JSON.stringify(data))); }); });

