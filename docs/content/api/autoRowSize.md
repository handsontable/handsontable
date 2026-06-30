---
title: AutoRowSize
metaTitle: AutoRowSize - JavaScript Data Grid | Handsontable
permalink: /api/auto-row-size
canonicalUrl: /api/auto-row-size
searchCategory: API Reference
hotPlugin: false
editLink: false
id: fm3dhdw8
description: Use the AutoRowSize plugin with its API options, members, and methods to set row heights based on the highest cell in a given row.
react:
  id: 8bcocfq1
  metaTitle: AutoRowSize - React Data Grid | Handsontable
angular:
  id: e3x7s0ab
  metaTitle: AutoRowSize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin, registers the row heights map, and sets up the row resize hook.


## Members

### CALCULATION_STEP

::: ask-about-api CALCULATION_STEP|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L160

:::

_AutoRowSize.CALCULATION\_STEP_

Returns the number of rows processed in a single calculation step during asynchronous sizing.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L151

:::

_AutoRowSize.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### inProgress

::: ask-about-api inProgress|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L545

:::

_autoRowSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredRows

::: ask-about-api measuredRows|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L549

:::

_autoRowSize.measuredRows : number_

Number of already measured rows (we already know their sizes).



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L136

:::

_AutoRowSize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L141

:::

_AutoRowSize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L146

:::

_AutoRowSize.SETTING\_KEYS_

Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.



### SYNC_CALCULATION_LIMIT

::: ask-about-api SYNC_CALCULATION_LIMIT|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L165

:::

_AutoRowSize.SYNC\_CALCULATION\_LIMIT_

Returns the maximum number of rows whose heights are calculated synchronously before switching to async mode.


## Methods

### calculateAllRowsHeight

::: ask-about-api calculateAllRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L294

:::

_autoRowSize.calculateAllRowsHeight(colRange, [overwriteCache])_

Calculate all rows heights. The calculated row will be cached in the [AutoRowSize#heights](@/api/autoRowSize.md#heights) property.
To retrieve height for specified row use [AutoRowSize#getRowHeight](@/api/autoRowSize.md#getrowheight) method.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `object` <br/> `number` |  | Row index or an object with `from` and `to` properties which define row range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateRowsHeight

::: ask-about-api calculateRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L243

:::

_autoRowSize.calculateRowsHeight(rowRange, colRange, [overwriteCache])_

Calculate a given rows height.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| rowRange | `number` <br/> `object` |  | Row index or an object with `from` and `to` indexes as a range. |
| colRange | `number` <br/> `object` |  | Column index or an object with `from` and `to` indexes as a range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleRowsHeight

::: ask-about-api calculateVisibleRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L221

:::

_autoRowSize.calculateVisibleRowsHeight()_

Calculates heights for visible rows in the viewport only.



### clearCache

::: ask-about-api clearCache|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L428

:::

_autoRowSize.clearCache([physicalRows])_

Clears cache of calculated row heights. If you want to clear only selected rows pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [physicalRows] | `Array<number>` | `optional` List of physical row indexes to clear. |



### clearCacheByRange

::: ask-about-api clearCacheByRange|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L444

:::

_autoRowSize.clearCacheByRange(range)_

Clears cache by range.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### destroy

::: ask-about-api destroy|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L464

:::

_autoRowSize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L205

:::

_autoRowSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L179

:::

_autoRowSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnHeaderHeight

::: ask-about-api getColumnHeaderHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L406

:::

_autoRowSize.getColumnHeaderHeight() ⇒ number | undefined_

Get the calculated column header height.



### getFirstVisibleRow

::: ask-about-api getFirstVisibleRow|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L413

:::

_autoRowSize.getFirstVisibleRow() ⇒ number_

Get the first visible row.


**Returns**: `number` - Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.  

### getLastVisibleRow

::: ask-about-api getLastVisibleRow|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L420

:::

_autoRowSize.getLastVisibleRow() ⇒ number_

Gets the last visible row.


**Returns**: `number` - Returns row index or -1 if table is not rendered.  

### getRowHeight

::: ask-about-api getRowHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L383

:::

_autoRowSize.getRowHeight(row, [defaultHeight]) ⇒ number_

Get a row's height, as measured in the DOM.

The height returned includes 1 px of the row's bottom border.

Mind that this method is different from the
[`getRowHeight()`](@/api/core.md#getrowheight) method
of Handsontable's [Core](@/api/core.md).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | A visual row index. |
| [defaultHeight] | `number` | `optional` If no height is found, `defaultHeight` is returned instead. |


**Returns**: `number` - The height of the specified row, in pixels.  

### getSyncCalculationLimit

::: ask-about-api getSyncCalculationLimit|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L355

:::

_autoRowSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see [Options#autoRowSize](@/api/options.md#autorowsize)).



### isEnabled

::: ask-about-api isEnabled|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L173

:::

_autoRowSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### isNeedRecalculate

::: ask-about-api isNeedRecalculate|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L459

:::

_autoRowSize.isNeedRecalculate() ⇒ boolean_

Checks if all heights were calculated. If not then return `true` (need recalculate).



### recalculateAllRowsHeight

::: ask-about-api recalculateAllRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L342

:::

_autoRowSize.recalculateAllRowsHeight()_

Recalculates all rows height (overwrite cache values).


