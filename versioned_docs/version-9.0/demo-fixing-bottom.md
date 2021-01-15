---
id: demo-fixing-bottom
title: Fixing bottom rows
sidebar_label: Fixing bottom rows
slug: /demo-fixing-bottom
---

You can fix the bottom rows of the table, by using the `fixedRowsBottom` config option. This way, when you're scrolling the table, the fixed rows will stay at the bottom edge of the table's container.

Example below shows a table with two bottom rows fixed.

Edit Log to console

var myData = Handsontable.helper.createSpreadsheetData(100, 50), container = document.getElementById('example'), hot; hot = new Handsontable(container, { data: myData, rowHeaders: true, colHeaders: true, fixedRowsBottom: 2 });
