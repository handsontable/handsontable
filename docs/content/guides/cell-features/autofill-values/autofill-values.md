---
id: if13we5c
title: Autofill values
metaTitle: Autofill values - JavaScript Data Grid | Handsontable
description: Copy a cell's value into multiple other cells, using the "fill handle" UI element. Configure the direction of copying, and more, through Handsontable's API.
permalink: /autofill-values
canonicalUrl: /autofill-values
tags:
  - fill handle
  - smart fill
  - populate data
  - drag down
  - square
  - auto-fill
  - auto fill
react:
  id: m4x3zpiw
  metaTitle: Autofill values - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Autofill values

Copy a cell's value into multiple other cells, using the "fill handle" UI element. Configure the direction of copying, and more, through Handsontable's API.

[[toc]]

## Autofill in all directions

Using the tiny square known as the 'fill handle' in the corner of the selected cell, you can drag it (drag-down) to repeat the values from the cell. Double click the fill handle in `cell B4` where the value is `30` to fill the selection down to the last value in neighboring column, just like it would in Excel or Google Sheets.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/javascript/example1.js)
@[code](@/content/guides/cell-features/autofill-values/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/react/example1.jsx)
@[code](@/content/guides/cell-features/autofill-values/react/example1.tsx)

:::

:::

## Autofill in a vertical direction only and creating new rows

In this configuration, the fill handle is restricted to move only vertically. New rows are automatically added to the bottom of the table by changing [`autoInsertRow`](@/api/options.md#fillhandle) to `true`.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/javascript/example2.js)
@[code](@/content/guides/cell-features/autofill-values/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/react/example2.jsx)
@[code](@/content/guides/cell-features/autofill-values/react/example2.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`fillHandle`](@/api/options.md#fillhandle)
- Hooks:
  - [`afterAutofill`](@/api/hooks.md#afterautofill)
  - [`beforeAutofill`](@/api/hooks.md#beforeautofill)
  - [`modifyAutofillRange`](@/api/hooks.md#modifyautofillrange)
- Plugins:
  - [`Autofill`](@/api/autofill.md)
