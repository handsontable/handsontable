---
title: Highlighting selection
permalink: /8.5/highlighting-selection
canonicalUrl: /highlighting-selection
---

# {{ $frontmatter.title }}

Use options `currentRowClassName` and `currentColumnClassName`

::: example #example1
```js
var
  data = [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13]
  ],
  container = document.getElementById('example1'),
  hot;

hot = Handsontable(container, {
  data: data,
  minRows: 5,
  minCols: 6,
  currentRowClassName: 'currentRow',
  currentColClassName: 'currentCol',
  rowHeaders: true,
  colHeaders: true
});

hot.selectCell(2,2);
```
:::
