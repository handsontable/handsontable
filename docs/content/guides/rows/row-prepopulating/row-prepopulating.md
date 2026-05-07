---
type: how-to
id: 42px61id
title: Row pre-populating
metaTitle: Row pre-populating - JavaScript Data Grid | Handsontable
description: Populate newly-added rows with predefined template values, using cell renderers.
permalink: /row-prepopulating
canonicalUrl: /row-prepopulating
tags:
  - spare rows
  - extra rows
  - bottom rows
  - placeholder
react:
  id: kmqhr00y
  metaTitle: Row pre-populating - React Data Grid | Handsontable
angular:
  id: me99ozqr
  metaTitle: Row pre-populating - Angular Data Grid | Handsontable
searchCategory: Guides
category: Rows
---
Pre-populate new rows with default values when users add rows to the grid. Use the `afterCreateRow` hook to set initial cell values.

[[toc]]

## Example

The example below shows how cell renderers can be used to populate the template values in empty rows. When a cell in the empty row is edited, the [`beforeChange`](@/api/hooks.md#beforechange) callback fills the row with the template values.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/javascript/example1.js)
@[code](@/content/guides/rows/row-prepopulating/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/react/example1.jsx)
@[code](@/content/guides/rows/row-prepopulating/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-prepopulating/angular/example1.ts)
@[code](@/content/guides/rows/row-prepopulating/angular/example1.html)

:::

:::

## Pre-populate from an adjacent row

You can copy values from the row above when the user inserts a new row. Use the [`afterCreateRow`](@/api/hooks.md#aftercreaterow) hook to read the source row's data and write it to the newly created row.

```js
const hot = new Handsontable(container, {
  data: [
    ['Product A', 10, 'active'],
    ['Product B', 20, 'inactive'],
  ],
  colHeaders: ['Name', 'Quantity', 'Status'],
  afterCreateRow(index) {
    if (index > 0) {
      const sourceRow = hot.getSourceDataAtRow(index - 1);

      sourceRow.forEach((value, col) => {
        hot.setDataAtCell(index, col, value);
      });
    }
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

## Pre-populate from a server-fetched default

You can fetch default row values from a server and apply them when the user adds a new row. Use the [`afterCreateRow`](@/api/hooks.md#aftercreaterow) hook to trigger the request and populate the row once the response arrives.

```js
const hot = new Handsontable(container, {
  data: [],
  colHeaders: ['Name', 'Quantity', 'Status'],
  afterCreateRow(index) {
    fetch('/api/row-defaults')
      .then((response) => response.json())
      .then((defaults) => {
        hot.setDataAtRow(index, [defaults.name, defaults.quantity, defaults.status]);
      });
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

## Result

After completing this guide, your grid fills new rows with template values automatically. You can pre-populate rows from static defaults, adjacent row values, or server-fetched data.

## Related API reference

**Hooks**

<div class="boxes-list">

- [afterCreateRow](@/api/hooks.md#aftercreaterow)
- [beforeChange](@/api/hooks.md#beforechange)

</div>
