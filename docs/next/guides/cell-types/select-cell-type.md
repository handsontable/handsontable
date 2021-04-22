---
title: Select cell type
permalink: /next/select-cell-type
canonicalUrl: /select-cell-type
---

# Select cell type

Select editor should be considered an example how to write editors rather than used as a fully featured editor. It is a much simpler form of the [Dropdown editor](dropdown.md). It is suggested to use the latter in your projects.

::: example #example1
```js
var
    container = document.getElementById("example1"),
    hot;

  hot = new Handsontable(container, {
    data: [
      ['2017', 'Honda', 10],
      ['2018', 'Toyota', 20],
      ['2019', 'Nissan', 30]
    ],
    colWidths: [50, 70, 50],
    colHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    columns: [
      {},
      {
        editor: 'select',
        selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda']
      },
      {}
    ]
  });
```
:::
