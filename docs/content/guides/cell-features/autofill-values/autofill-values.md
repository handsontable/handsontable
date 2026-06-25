---
type: how-to
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
  metaTitle: Autofill values - React Data Grid | Handsontable
angular:
  metaTitle: Autofill values - Angular Data Grid | Handsontable
vue:
  metaTitle: Autofill values - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Copy a cell's value into multiple other cells, using the "fill handle" UI element. Configure the direction of copying, and more, through Handsontable's API.

[[toc]]

Autofill lets users drag the fill handle to copy or extend values across adjacent cells. Use it to speed up repetitive data entry.

## Autofill in all directions

Using the tiny square known as the 'fill handle' in the corner of the selected cell, you can drag it to repeat or extend values across adjacent cells.

You can also **double-click the fill handle** to autofill downward without dragging. Double-click the fill handle in `cell B4` where the value is `30` to see this in action.

### How double-click autofill determines the range

Handsontable scans the rows below your selection and fills down to the last row where the column immediately to the left or right of your selection contains a value. In the example below, the year column (column A) acts as the guide -- rows 2020 and 2021 have values there, so the fill extends through both rows.

Two conditions must be met for the fill to happen:

- **All cells below the selection in the filled column(s) must be empty.** If any cell below the selection in those columns contains data, double-clicking does nothing.
- At least one column adjacent to your selection must have data in the rows below.

**Visual difference from drag-fill:** When you drag the fill handle, a preview border shows the target range as you drag. When you double-click, no drag-preview appears -- the cells populate immediately based on the adjacent column data.

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

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/autofill-values/angular/example1.ts)
@[code](@/content/guides/cell-features/autofill-values/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/autofill-values/vue/example1.vue)

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

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/autofill-values/angular/example2.ts)
@[code](@/content/guides/cell-features/autofill-values/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/autofill-values/vue/example2.vue)

:::

:::

## Related API reference

**Configuration options**

<div class="boxes-list">

- [fillHandle](@/api/options.md#fillhandle)

</div>

**Hooks**

<div class="boxes-list">

- [afterAutofill](@/api/hooks.md#afterautofill)
- [beforeAutofill](@/api/hooks.md#beforeautofill)
- [modifyAutofillRange](@/api/hooks.md#modifyautofillrange)

</div>

**Plugins**

<div class="boxes-list">

- [Autofill](@/api/autofill.md)

</div>

## Result

The fill handle appears on the selected cell. Dragging it copies or extends values into adjacent cells in the configured direction.
