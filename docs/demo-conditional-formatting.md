---
id: demo-conditional-formatting
title: Conditional formatting
sidebar_label: Conditional formatting
slug: /demo-conditional-formatting
---

This demo shows how to use the cell type renderer feature to make some conditional formatting:

1.  first row is **read-only**, and formatted in **green bold** text,
2.  all cells in the Nissan column are written in _italic_,
3.  empty cells have silver background,
4.  negative numbers are written in red.

Edit Log to console

.make-me-red { color: #f00; } var data = \[ \['', 'Tesla', 'Nissan', 'Toyota', 'Honda'\], \['2017', -5, '', 12, 13\], \['2018', '', -11, 14, 13\], \['2019', '', 15, -12, 'readOnly'\] \], container, hot1; function firstRowRenderer(instance, td, row, col, prop, value, cellProperties) { Handsontable.renderers.TextRenderer.apply(this, arguments); td.style.fontWeight = 'bold'; td.style.color = 'green'; td.style.background = '#CEC'; } function negativeValueRenderer(instance, td, row, col, prop, value, cellProperties) { Handsontable.renderers.TextRenderer.apply(this, arguments); // if row contains negative number if (parseInt(value, 10) < 0) { // add class "negative" td.className = 'make-me-red'; } if (!value || value === '') { td.style.background = '#EEE'; } else { if (value === 'Nissan') { td.style.fontStyle = 'italic'; } td.style.background = ''; } } // maps function to lookup string Handsontable.renderers.registerRenderer('negativeValueRenderer', negativeValueRenderer); container = document.getElementById('example1'); hot1 = new Handsontable(container, { data: data, afterSelection: function (row, col, row2, col2) { var meta = this.getCellMeta(row2, col2); if (meta.readOnly) { this.updateSettings({fillHandle: false}); } else { this.updateSettings({fillHandle: true}); } }, cells: function (row, col) { var cellProperties = {}; var data = this.instance.getData(); if (row === 0 || data\[row\] && data\[row\]\[col\] === 'readOnly') { cellProperties.readOnly = true; // make cell read-only if it is first row or the text reads 'readOnly' } if (row === 0) { cellProperties.renderer = firstRowRenderer; // uses function directly } else { cellProperties.renderer = "negativeValueRenderer"; // uses lookup map } return cellProperties; } });

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/conditional-formatting.html)
