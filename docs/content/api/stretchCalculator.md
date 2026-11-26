---
title: StretchCalculator
metaTitle: StretchCalculator API reference | Handsontable DataGrid for JavaScript
permalink: /api/stretch-calculator
canonicalUrl: /api/stretch-calculator
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the stretch columns calculator with the Handsontable instance and registers the stretch widths index map.


## Methods

### getStretchedWidth

::: ask-about-api getStretchedWidth|StretchCalculator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/stretchColumns/calculator.ts#L163

:::

_stretchCalculator.getStretchedWidth(columnVisualIndex) ⇒ number | null_

Gets the calculated column width.


| Param | Type | Description |
| --- | --- | --- |
| columnVisualIndex | `number` | Column visual index. |



### refreshStretching

::: ask-about-api refreshStretching|StretchCalculator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/stretchColumns/calculator.ts#L139

:::

_stretchCalculator.refreshStretching()_

Recalculates the column widths.

The result is written to the widths map with a single `setValues()` call, and only when it
differs from what the map already holds. Two consumers depend on that shape. The `change`
hook of the map is what a caller of `observeMapChange` sees, so one write means one
notification per real change and none in steady state. And the engine's column-width
prefix-sum cache (`Viewport#columnWidthCache`) is keyed on the item COUNT only — a stretched
width that moves keeps the count, so the cache has to be dropped explicitly, the way
`ManualColumnResize` and `AutoColumnSize` drop it when their maps change. Left in place, the
cache fed the layout snapshot the PREVIOUS total, the solver predicted scrollbars for a grid
that had none, and the top overlay clipped the last header by the scrollbar width (DEV-2902).



### useStrategy

::: ask-about-api useStrategy|StretchCalculator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/stretchColumns/calculator.ts#L124

:::

_stretchCalculator.useStrategy(strategyName)_

Sets the active stretch strategy.


| Param | Type | Description |
| --- | --- | --- |
| strategyName | `'all'` <br/> `'last'` <br/> `'none'` | The stretch strategy to use. |


