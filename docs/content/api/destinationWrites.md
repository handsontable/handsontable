---
title: DestinationWrites
metaTitle: DestinationWrites API reference | Handsontable DataGrid for JavaScript
permalink: /api/destination-writes
canonicalUrl: /api/destination-writes
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### clear

::: ask-about-api clear|DestinationWrites

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/destinationWrites.ts#L260

:::

_destinationWrites.clear()_

Forgets every record.



### recordAfter

::: ask-about-api recordAfter|DestinationWrites

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/destinationWrites.ts#L210

:::

_destinationWrites.recordAfter(row, prop, dataDotNotation)_

Records the value a destination cell holds after the plugin wrote into it, read back from the cell, so
two results written into one cell in one batch leave the one that landed.


| Param | Type | Description |
| --- | --- | --- |
| row | `object` | The data row. |
| prop | `string` <br/> `number` <br/> `function` | The cell's property. |
| dataDotNotation | `boolean` | The `dataDotNotation` setting. |



### recordBefore

::: ask-about-api recordBefore|DestinationWrites

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/destinationWrites.ts#L183

:::

_destinationWrites.recordBefore(row, prop, dataDotNotation)_

Records what a destination cell holds right before the plugin writes into it, unless it was recorded
before: the first state is the one a restore puts back.


| Param | Type | Description |
| --- | --- | --- |
| row | `object` | The data row. |
| prop | `string` <br/> `number` <br/> `function` | The cell's property. |
| dataDotNotation | `boolean` | The `dataDotNotation` setting. |



### restore

::: ask-about-api restore|DestinationWrites

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/destinationWrites.ts#L224

:::

_destinationWrites.restore(data, dataDotNotation)_

Puts the recorded values back into the rows of `data` and forgets every record. A cell that no longer
holds the result the plugin wrote last (the user or the host replaced it), a row no longer in `data`,
and a cell that cannot be written without throwing (a frozen row) are left as they are.


| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | The data array the grid is about to replace. |
| dataDotNotation | `boolean` | The `dataDotNotation` setting. |



### restoreInCopy

::: ask-about-api restoreInCopy|DestinationWrites

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/destinationWrites.ts#L244

:::

_destinationWrites.restoreInCopy(source, copy, dataDotNotation)_

Puts the recorded values into a copy of `source`, row for row, and keeps the records: `source` is
still the data the grid shows.


| Param | Type | Description |
| --- | --- | --- |
| source | `Array` | The data array the records describe. |
| copy | `Array` | A copy of it, with the same row order. |
| dataDotNotation | `boolean` | The `dataDotNotation` setting. |


