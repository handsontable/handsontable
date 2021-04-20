---
title: Column virtualization
permalink: /next/column-virtualization
canonicalUrl: /column-virtualization
tags:
  - scrolling
---

# {{ $frontmatter.title }}

[[toc]]

## Overview

- O wirtualizacji i performance. Kiedy wirtualizacja dziala. Wspomniec o ustawieniach okna, a takze wplywu wielkosci grida na performance. Koniecznie odwolywac sie do front-end side operations dla odroznienia back-end side w przyszlosci.
- Jakie sa domyslne ustawienia
- Jak wylaczyc wylaczyc wirtualizacje i jakie moga byc tego konsekwencje (offset, renderallrows)

To make the grid scrollable, set constant width and height to the container holding Handsontable and set the `overflow` property to `hidden` in the container's stylesheet. Then, if the table contains enough rows or columns, you can scroll through it.

Note, that Handsontable renders only the visible part of the table plus a fixed amount of rows and columns. You can experiment with the `viewportColumnRenderingOffset` and `viewportRowRenderingOffset` config options, which define this behavior, to improve the performance of your app.

The overall scrolling performance depends mainly on these four factors:

* the amount of cells,
* the amount of custom renderers,
* the number of features (options) in use,
* the end-user's machine and browser performance.

This demo below shows a table of 1 million cells (1000 x 1000):

::: example #example1
```js
var example = document.getElementById('example1');
var hot1 = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(1000, 1000),
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeights: 23,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
