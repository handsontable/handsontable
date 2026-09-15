---
title: AutoColumnSize
metaTitle: AutoColumnSize - JavaScript Data Grid | Handsontable
permalink: /api/auto-column-size
canonicalUrl: /api/auto-column-size
searchCategory: API Reference
hotPlugin: false
editLink: false
id: hjr7zdxy
description: Use the AutoColumnSize plugin with its API options, members, and methods to set column widths based on the widest cell in a given column.
react:
  id: 11f3lp0s
  metaTitle: AutoColumnSize - React Data Grid | Handsontable
angular:
  id: d6w1v4zu
  metaTitle: AutoColumnSize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin, registers the column widths map, and sets up the column resize hook.


## Options

### autoColumnSize

::: ask-about-api autoColumnSize|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L455

:::

_autoColumnSize.autoColumnSize : object | boolean_

The `autoColumnSize` option configures the `AutoColumnSize` plugin.

You can set the `autoColumnSize` option to one of the following:

| Setting   | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `false`   | Disable the `AutoColumnSize` plugin                               |
| `true`    | Enable the `AutoColumnSize` plugin with the default configuration |
| An object | Enable the `AutoColumnSize` plugin and modify the plugin options  |

If you set the `autoColumnSize` option to an object, you can set the following `AutoColumnSize` plugin options:

| Property                | Possible values                 | Description                                                                                                    |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `syncLimit`             | A number \| A percentage string | The number/percentage of columns to keep in sync<br>(default: `50`)                                            |
| `useHeaders`            | `true` \| `false`               | When calculating column widths:<br>`true`: use column headers<br>`false`: don't use column headers          |
| `samplingRatio`         | A number                        | The number of samples of the same length to be used in column width calculations                               |
| `allowSampleDuplicates` | `true` \| `false`               | When calculating column widths:<br>`true`: Allow duplicate samples<br>`false`: Don't allow duplicate samples |

By default, the `autoColumnSize` option is set to `undefined`,
but the `AutoColumnSize` plugin acts as enabled.
To disable the `AutoColumnSize` plugin completely,
set the `autoColumnSize` option to `false`.

Using the [`colWidths`](@/api/options.md#colwidths) option forcibly disables the `AutoColumnSize` plugin.

Read more:

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
autoColumnSize: {
  // keep 40% of columns in sync (the rest of columns: async)
  syncLimit: '40%',
  // when calculating column widths, use column headers
  useHeaders: true,
  // when calculating column widths, use 10 samples of the same length
  samplingRatio: 10,
  // when calculating column widths, allow duplicate samples
  allowSampleDuplicates: true
},
```

## Members

### CALCULATION_CELLS_BUDGET

::: ask-about-api CALCULATION_CELLS_BUDGET|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L259

:::

_AutoColumnSize.CALCULATION\_CELLS\_BUDGET_

Returns the maximum number of cells sampled in a single asynchronous calculation step. Together
with [CALCULATION_STEP](#autocolumnsize.calculation_step) it bounds the work done per animation frame: a
column whose row range exceeds the budget is swept across multiple frames, and its width is
written once, when the sweep completes.



### CALCULATION_STEP

::: ask-about-api CALCULATION_STEP|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L246

:::

_AutoColumnSize.CALCULATION\_STEP_

Returns the number of columns processed in a single calculation step during asynchronous sizing.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L237

:::

_AutoColumnSize.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### inProgress

::: ask-about-api inProgress|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L729

:::

_autoColumnSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredColumns

::: ask-about-api measuredColumns|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L733

:::

_autoColumnSize.measuredColumns : number_

Number of already measured columns (we already know their sizes).



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L222

:::

_AutoColumnSize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L227

:::

_AutoColumnSize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L232

:::

_AutoColumnSize.SETTING\_KEYS_

Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.



### SYNC_CALCULATION_LIMIT

::: ask-about-api SYNC_CALCULATION_LIMIT|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L251

:::

_AutoColumnSize.SYNC\_CALCULATION\_LIMIT_

Returns the maximum number of columns whose widths are calculated synchronously before switching to async mode.


## Methods

### calculateAllColumnsWidth

::: ask-about-api calculateAllColumnsWidth|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L390

:::

_autoColumnSize.calculateAllColumnsWidth(rowRange, [overwriteCache])_

Calculates all columns width. The calculated column will be cached in the [AutoColumnSize#widths](@/api/autoColumnSize.md#widths) property.
To retrieve width for specified column use [AutoColumnSize#getColumnWidth](@/api/autoColumnSize.md#getcolumnwidth) method.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| rowRange | `object` <br/> `number` |  | Row index or an object with `from` and `to` properties which define row range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateColumnsWidth

::: ask-about-api calculateColumnsWidth|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L346

:::

_autoColumnSize.calculateColumnsWidth(colRange, rowRange, [overwriteCache])_

Calculates a columns width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `number` <br/> `object` |  | Visual column index or an object with `from` and `to` visual indexes as a range. |
| rowRange | `number` <br/> `object` |  | Visual row index or an object with `from` and `to` visual indexes as a range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleColumnsWidth

::: ask-about-api calculateVisibleColumnsWidth|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L324

:::

_autoColumnSize.calculateVisibleColumnsWidth()_

Calculates widths for visible columns in the viewport only.



### clearCache

::: ask-about-api clearCache|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L607

:::

_autoColumnSize.clearCache([physicalColumns])_

Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [physicalColumns] | `Array<number>` | `optional` List of physical column indexes to clear. |



### destroy

::: ask-about-api destroy|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L629

:::

_autoColumnSize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L310

:::

_autoColumnSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L272

:::

_autoColumnSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnWidth

::: ask-about-api getColumnWidth|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L544

:::

_autoColumnSize.getColumnWidth(column, [defaultWidth], [keepMinimum]) ⇒ number_

Gets the calculated column width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| [defaultWidth] | `number` |  | `optional` Default column width. It will be picked up if no calculated width found. |
| [keepMinimum] | `boolean` | <code>true</code> | `optional` If `true` then returned value won't be smaller then 50 (default column width). |



### getFirstVisibleColumn

::: ask-about-api getFirstVisibleColumn|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L563

:::

_autoColumnSize.getFirstVisibleColumn() ⇒ number_

Gets the first visible column.

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range. In that case this method can
return a column index outside the strictly visible viewport. To read the actual visible viewport, use
[Core#getFirstFullyVisibleColumn](@/api/core.md#getfirstfullyvisiblecolumn) or [Core#getFirstPartiallyVisibleColumn](@/api/core.md#getfirstpartiallyvisiblecolumn).


**Returns**: `number` - Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.  

### getLastVisibleColumn

::: ask-about-api getLastVisibleColumn|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L575

:::

_autoColumnSize.getLastVisibleColumn() ⇒ number_

Gets the last visible column.

When the [MergeCells](@/api/mergeCells.md) plugin is enabled with its default `virtualized: false` setting, a merged
cell that crosses the viewport edge extends the rendered column range. In that case this method can
return a column index outside the strictly visible viewport. To read the actual visible viewport, use
[Core#getLastFullyVisibleColumn](@/api/core.md#getlastfullyvisiblecolumn) or [Core#getLastPartiallyVisibleColumn](@/api/core.md#getlastpartiallyvisiblecolumn).


**Returns**: `number` - Returns visual column index or -1 if table is not rendered.  

### getSyncCalculationLimit

::: ask-about-api getSyncCalculationLimit|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L521

:::

_autoColumnSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see [Options#autoColumnSize](@/api/options.md#autocolumnsize)).



### isEnabled

::: ask-about-api isEnabled|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L267

:::

_autoColumnSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [#enablePlugin](#enableplugin) method is called.



### isNeedRecalculate

::: ask-about-api isNeedRecalculate|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L624

:::

_autoColumnSize.isNeedRecalculate() ⇒ boolean_

Checks if all widths were calculated. If not then return `true` (need recalculate).



### recalculateAllColumnsWidth

::: ask-about-api recalculateAllColumnsWidth|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L497

:::

_autoColumnSize.recalculateAllColumnsWidth()_

Recalculates all columns width (overwrite cache values).



### updatePlugin

::: ask-about-api updatePlugin|AutoColumnSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/autoColumnSize/autoColumnSize.ts#L299

:::

_autoColumnSize.updatePlugin()_

Updates the plugin's state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


