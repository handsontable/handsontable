---
title: StretchCalculator
metaTitle: StretchCalculator API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/calculator.ts#L134

:::

_stretchCalculator.getStretchedWidth(columnVisualIndex) ⇒ number | null_

Gets the calculated column width.


| Param | Type | Description |
| --- | --- | --- |
| columnVisualIndex | `number` | Column visual index. |



### refreshStretching

::: ask-about-api refreshStretching|StretchCalculator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/calculator.ts#L99

:::

_stretchCalculator.refreshStretching()_

Recalculates the column widths.



### useStrategy

::: ask-about-api useStrategy|StretchCalculator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/calculator.ts#L94

:::

_stretchCalculator.useStrategy(strategyName)_

Sets the active stretch strategy.


| Param | Type | Description |
| --- | --- | --- |
| strategyName | `'all'` <br/> `'last'` <br/> `'none'` | The stretch strategy to use. |


