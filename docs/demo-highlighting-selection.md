---
id: demo-highlighting-selection
title: Highlighting selection
sidebar_label: Highlighting selection
slug: /demo-highlighting-selection
---

function getCarData() { return \[ \["Tesla", 2017, "black", "black"\], \["Nissan", 2018, "blue", "blue"\], \["Chrysler", 2019, "yellow", "black"\], \["Volvo", 2020, "white", "gray"\] \]; }

Use options `currentRowClassName` and `currentColumnClassName`

Edit Log to console

.currentRow { background-color: #F9F9FB !important; } .currentCol { background-color: #E7E8EF !important; } var data = \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda'\], \['2017', 10, 11, 12, 13\], \['2018', 20, 11, 14, 13\], \['2019', 30, 15, 12, 13\] \], container = document.getElementById('example1'), hot; hot = Handsontable(container, { data: data, minRows: 5, minCols: 6, currentRowClassName: 'currentRow', currentColClassName: 'currentCol', rowHeaders: true, colHeaders: true }); hot.selectCell(2,2);

