---
type: how-to
title: Autofill values
metaTitle: Autofill values | Handsontable DataGrid for JavaScript
description: Copy a cell's value into other cells using the "fill handle" UI element. Configure the direction of copying, and more, through Handsontable DataGrid's API.
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
  metaTitle: Autofill values | Handsontable DataGrid for React
angular:
  metaTitle: Autofill values | Handsontable DataGrid for Angular
vue:
  metaTitle: Autofill values | Handsontable DataGrid for Vue
searchCategory: Guides
category: Cell features
menuTag: updated
---
Copy a cell's value into multiple other cells, using the "fill handle" UI element. Configure the direction of copying, and more, through Handsontable DataGrid's API.

[[toc]]

Autofill lets users drag the fill handle to copy values across adjacent cells. Use it to speed up repetitive data entry.

## Autofill in all directions

Using the tiny square known as the 'fill handle' in the corner of the selected cell, you can drag it to copy and repeat the selected values across adjacent cells.

The fill handle appears only when the selection is a single range. When you select several separate ranges, for example with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+click, the fill handle is hidden.

You can also **double-click the fill handle** to autofill downward without dragging. Select the four cells from Symbol to Known Isotopes in the `Lithium` row (row header 3) and double-click the fill handle to see this in action.

### How double-click autofill determines the range

Handsontable follows one guide column: the column immediately to the left of your selection, or the column to its right if the left one is empty in the first row below your selection. It scans the rows below your selection, one row at a time, and fills down as long as the guide column contains a value. In the example below, the Name column acts as the guide -- the rows with row headers 4 and 5 have values there, so the fill copies the selected values through both rows.

The fill stops at the first row where either of these is true:

- **A cell in the filled column(s) already contains data.** The fill stops above that row, so double-clicking never overwrites existing values.
- **The guide column is empty.** A gap in the guide column ends the fill, even if more values follow further down.

If the first row below your selection meets one of these conditions, double-clicking does nothing.

A few cells count differently from what they display:

- A formula counts as data, even if it evaluates to an empty string.
- A merged cell in the guide column counts as one value across all the rows it spans.
- A hidden row never ends the fill. A value in a hidden row of the filled column still stops the fill above it.

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

## Altering and tracking autofilled values

Use the [`beforeAutofill`](@/api/hooks.md#beforeautofill) hook to change the values Handsontable is about to fill in, and the [`afterAutofill`](@/api/hooks.md#afterautofill) hook to react once the fill completes.

In the example below, select the four cells from Symbol to Known Isotopes in the `Lithium` row and drag the fill handle down through the rows with row headers 4 and 5. The `afterAutofill` hook logs the affected range and direction to the output box below the grid. The logged row and column numbers are 0-based indices, so the two filled rows appear as `3-4`, not `4-5`.

The `beforeAutofill` hook in this example rounds every filled number up to the nearest multiple of 5. This is a demonstration of what the hook can do, not the default autofill result: without the hook, Handsontable repeats the selected values as they are.

When Handsontable fires [`beforeChange`](@/api/hooks.md#beforechange) or [`afterChange`](@/api/hooks.md#afterchange) as part of an autofill operation, their `source` argument is `Autofill.fill`. Read more about the `source` argument in [Events and hooks: Definition for `source` argument](@/guides/getting-started/events-and-hooks/events-and-hooks.md#definition-for-source-argument).

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/autofill-values/javascript/example3.html)
@[code](@/content/guides/cell-features/autofill-values/javascript/example3.js)
@[code](@/content/guides/cell-features/autofill-values/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/react/example3.jsx)
@[code](@/content/guides/cell-features/autofill-values/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/autofill-values/angular/example3.ts)
@[code](@/content/guides/cell-features/autofill-values/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-features/autofill-values/vue/example3.vue)

:::

:::

## Autofill and formulas

With the [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin enabled, autofill delegates to the HyperFormula engine instead of copying cell contents literally:

- **Relative references adjust per target cell.** Filling `=A1+B1` down from row 1 to row 2 produces `=A2+B2` in the new cell, the same way a spreadsheet application adjusts formulas on fill.
- **Absolute references stay fixed.** Filling `=$A$1+B1` down keeps `$A$1` unchanged in every filled cell, while the relative `B1` part still adjusts.
- **The fill is canceled** if the engine reports that the target cells can't be written to (for example, because the target range includes part of an array formula, or extends past the sheet size limits), leaving the target range unchanged.

In the example below, the **Total** column holds `=A1*B1`, and the **Total with tax** column holds `=C1*(1+$E$1)`, where `$E$1` is an absolute reference to the tax rate, stored once in cell `E1` of the **Tax rate** column. Select the cells from **Total** to **Total with tax** in row 1 and drag the fill handle down. The row references adjust in each new row (`=A2*B2`, `=C2*(1+$E$1)`), and `$E$1` stays fixed. Double-click a filled cell, or press <kbd>Enter</kbd>, to see its formula.

::: only-for vue

::: tip

When using HyperFormula with Vue 3, always wrap HyperFormula instances with `markRaw()`. Vue's reactivity proxy interferes with the engine's internal state, which leads to subtle bugs and degraded performance. The example below uses `markRaw()` for this reason.

:::

:::

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/javascript/example4.js)
@[code](@/content/guides/cell-features/autofill-values/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/autofill-values/react/example4.jsx)
@[code](@/content/guides/cell-features/autofill-values/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/autofill-values/angular/example4.ts)
@[code](@/content/guides/cell-features/autofill-values/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-features/autofill-values/vue/example4.vue)

:::

:::

## Result

The fill handle appears on the selected cell. Autofill copies the selected values into the adjacent cells, and repeats them to fill a larger range.

- **Dragging the fill handle** copies the selected values into the cells you drag across, in the direction allowed by the [`fillHandle`](@/api/options.md#fillhandle) option. If the target range is larger than the selection, the selected values repeat.
- **Double-clicking the fill handle** copies the selected values down only, to the last row determined by the adjacent column, as described in [How double-click autofill determines the range](#how-double-click-autofill-determines-the-range).

Use the [`beforeAutofill`](@/api/hooks.md#beforeautofill) hook to change the values before they're written, and the [`afterAutofill`](@/api/hooks.md#afterautofill) hook to react once the fill completes. With the [`Formulas`](@/guides/formulas/formula-calculation/formula-calculation.md) plugin enabled, relative references in copied formulas adjust to each target cell.

When you use `beforeAutofill` together with the `Formulas` plugin, the order of the callbacks decides the result. The last callback that returns a value wins. Global hooks (`Handsontable.hooks.add()`) run before the hooks of an instance. Within the instance, callbacks run in ascending `orderIndex` order, and callbacks with the same `orderIndex` run in the order they were registered. The plugin registers its own `beforeAutofill` callback with the default `orderIndex` of 0 when it's enabled.

- These run after the plugin and override it: the `beforeAutofill` option set at initialization, and an [`addHook()`](@/api/core.md#addhook) call made after the plugin is enabled.
- These run before the plugin and are overridden by it: a global hook, an `addHook()` call made before the plugin is enabled, and the `beforeAutofill` option when you enable the plugin later with `updateSettings()`.

Disabling and re-enabling the plugin registers its callback again, after your callbacks that have an `orderIndex` of 0. Passing a new `beforeAutofill` function through `updateSettings()` replaces the previous one in place, so it keeps its position. This is what happens when a wrapper re-renders with the same option.

To always override the plugin, add your callback with [`addHook()`](@/api/core.md#addhook) and an `orderIndex` greater than 0. Such a callback runs after the plugin's callback, whenever you add it.

::: only-for javascript

```js
hot.addHook('beforeAutofill', (selectionData, sourceRange, targetRange, direction) => {
  return [['n/a']];
}, 1);
```

:::

::: only-for react

```jsx
hotRef.current.hotInstance.addHook('beforeAutofill', (selectionData, sourceRange, targetRange, direction) => {
  return [['n/a']];
}, 1);
```

:::

::: only-for angular

```ts
hotTable.hotInstance.addHook('beforeAutofill', (selectionData, sourceRange, targetRange, direction) => {
  return [['n/a']];
}, 1);
```

:::

::: only-for vue

```js
hotTableRef.value?.hotInstance.addHook('beforeAutofill', (selectionData, sourceRange, targetRange, direction) => {
  return [['n/a']];
}, 1);
```

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
