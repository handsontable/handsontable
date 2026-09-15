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


## Options

### autoRowSize

::: ask-about-api autoRowSize|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L501

:::

_autoRowSize.autoRowSize : object | boolean_

The `autoRowSize` option configures the `AutoRowSize` plugin.

You can set the `autoRowSize` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the `AutoRowSize` plugin                               |
| `true`    | Enable the `AutoRowSize` plugin with the default configuration |
| An object | Enable the `AutoRowSize` plugin and modify the plugin options  |

To give Handsontable's scrollbar a proper size, set the `autoRowSize` option to `true`.

If you set the `autoRowSize` option to an object, you can set the following `AutoRowSize` plugin options:

| Property                | Possible values                 | Description                                                                                                |
| ----------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `syncLimit`             | A number \| A percentage string | The number/percentage of rows to keep in sync<br>(default: `500`)                                          |
| `samplingRatio`         | A number                        | The number of samples of the same length to be used in row height calculations                             |
| `allowSampleDuplicates` | `true` \| `false`               | When calculating row heights:<br>`true`: Allow duplicate samples<br>`false`: Don't allow duplicate samples |

Using the [`rowHeights`](@/api/options.md#rowheights) option forcibly disables the `AutoRowSize` plugin.

Read more:

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
autoRowSize: {
  // keep 40% of rows in sync (the rest of rows: async)
  syncLimit: '40%',
  // when calculating row heights, use 10 samples of the same length
  samplingRatio: 10,
  // when calculating row heights, allow duplicate samples
  allowSampleDuplicates: true
},
```

## Members

### CALCULATION_STEP

::: ask-about-api CALCULATION_STEP|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L172

:::

_AutoRowSize.CALCULATION\_STEP_

Returns the number of rows processed in a single calculation step during asynchronous sizing.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L163

:::

_AutoRowSize.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### inProgress

::: ask-about-api inProgress|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L582

:::

_autoRowSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredRows

::: ask-about-api measuredRows|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L586

:::

_autoRowSize.measuredRows : number_

Number of already measured rows (we already know their sizes).



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L148

:::

_AutoRowSize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L153

:::

_AutoRowSize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L158

:::

_AutoRowSize.SETTING\_KEYS_

Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.



### SYNC_CALCULATION_LIMIT

::: ask-about-api SYNC_CALCULATION_LIMIT|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L177

:::

_AutoRowSize.SYNC\_CALCULATION\_LIMIT_

Returns the maximum number of rows whose heights are calculated synchronously before switching to async mode.


## Methods

### calculateAllRowsHeight

::: ask-about-api calculateAllRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L310

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L255

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L233

:::

_autoRowSize.calculateVisibleRowsHeight()_

Calculates heights for visible rows in the viewport only.



### clearCache

::: ask-about-api clearCache|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L454

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L470

:::

_autoRowSize.clearCacheByRange(range)_

Clears cache by range.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### destroy

::: ask-about-api destroy|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L490

:::

_autoRowSize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L217

:::

_autoRowSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L191

:::

_autoRowSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnHeaderHeight

::: ask-about-api getColumnHeaderHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L422

:::

_autoRowSize.getColumnHeaderHeight() ⇒ number | undefined_

Get the calculated column header height.



### getFirstVisibleRow

::: ask-about-api getFirstVisibleRow|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L434

:::

_autoRowSize.getFirstVisibleRow() ⇒ number_

Get the first visible row.

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range. In that case this method can
return a row index outside the strictly visible viewport. To read the actual visible viewport, use
[Core#getFirstFullyVisibleRow](@/api/core.md#getfirstfullyvisiblerow) or [Core#getFirstPartiallyVisibleRow](@/api/core.md#getfirstpartiallyvisiblerow).


**Returns**: `number` - Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.  

### getLastVisibleRow

::: ask-about-api getLastVisibleRow|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L446

:::

_autoRowSize.getLastVisibleRow() ⇒ number_

Gets the last visible row.

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered row range. In that case this method can
return a row index outside the strictly visible viewport. To read the actual visible viewport, use
[Core#getLastFullyVisibleRow](@/api/core.md#getlastfullyvisiblerow) or [Core#getLastPartiallyVisibleRow](@/api/core.md#getlastpartiallyvisiblerow).


**Returns**: `number` - Returns row index or -1 if table is not rendered.  

### getRowHeight

::: ask-about-api getRowHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L399

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L371

:::

_autoRowSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see [Options#autoRowSize](@/api/options.md#autorowsize)).



### isEnabled

::: ask-about-api isEnabled|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L185

:::

_autoRowSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### isNeedRecalculate

::: ask-about-api isNeedRecalculate|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L485

:::

_autoRowSize.isNeedRecalculate() ⇒ boolean_

Checks if all heights were calculated. If not then return `true` (need recalculate).



### recalculateAllRowsHeight

::: ask-about-api recalculateAllRowsHeight|AutoRowSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoRowSize/autoRowSize.ts#L358

:::

_autoRowSize.recalculateAllRowsHeight()_

Recalculates all rows height (overwrite cache values).


