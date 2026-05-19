---
type: how-to
id: 42px61id
title: Row pre-populating
metaTitle: Row pre-populating - JavaScript Data Grid | Handsontable
description: Pre-populate spare rows with default values using minSpareRows, custom placeholder renderers, or auto-filling template values.
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
Pre-populate new rows with default values when users add rows to the grid.

[[toc]]

## Basic spare rows

To keep one empty row at the bottom of the grid, set [`minSpareRows`](@/api/options.md#minsparerows) to `1`.

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

## Spare rows with placeholder styling

To hint what to enter in the spare row, add a custom cell renderer that displays greyed-out placeholder text in empty cells. The renderer checks whether the whole row is empty, then shows a template value in a lighter color.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/javascript/example2.js)
@[code](@/content/guides/rows/row-prepopulating/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/react/example2.jsx)
@[code](@/content/guides/rows/row-prepopulating/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-prepopulating/angular/example2.ts)
@[code](@/content/guides/rows/row-prepopulating/angular/example2.html)

:::

:::

## Auto-populating with template values

For full pre-population, use the [`beforeChange`](@/api/hooks.md#beforechange) hook to fill all cells in a spare row with template values the moment the user starts editing. The `isEmptyRow()` helper detects whether the row is untouched, and the hook pushes changes for every column except the one the user is editing.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/javascript/example3.js)
@[code](@/content/guides/rows/row-prepopulating/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-prepopulating/react/example3.jsx)
@[code](@/content/guides/rows/row-prepopulating/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-prepopulating/angular/example3.ts)
@[code](@/content/guides/rows/row-prepopulating/angular/example3.html)

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

Your grid keeps one or more empty rows at the bottom. Depending on the approach, spare rows show greyed-out placeholder text or auto-fill all cells with template values when the user starts editing.

## Related API reference

**Hooks**

<div class="boxes-list">

- [afterCreateRow](@/api/hooks.md#aftercreaterow)
- [beforeChange](@/api/hooks.md#beforechange)

</div>
