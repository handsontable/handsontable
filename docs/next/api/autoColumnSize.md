---
title: AutoColumnSize
permalink: /next/api/auto-column-size
canonicalUrl: /api/auto-column-size
editLink: false
---

# AutoColumnSize

[[toc]]

## Description

This plugin allows to set column widths based on their widest cells.

By default, the plugin is declared as `undefined`, which makes it enabled (same as if it was declared as `true`).
Enabling this plugin may decrease the overall table performance, as it needs to calculate the widths of all cells to
resize the columns accordingly.
If you experience problems with the performance, try turning this feature off and declaring the column widths manually.

Column width calculations are divided into sync and async part. Each of this parts has their own advantages and
disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
operations don't block the browser UI.

To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value to a config object:
```js
// as a number (300 columns in sync, rest async)
autoColumnSize: {syncLimit: 300},.

// as a string (percent)
autoColumnSize: {syncLimit: '40%'},
```

The plugin uses [GhostTable](./GhostTable/) and [SamplesGenerator](./SamplesGenerator/) for calculations.
First, [SamplesGenerator](./SamplesGenerator/) prepares samples of data with its coordinates.
Next [GhostTable](./GhostTable/) uses coordinates to get cells' renderers and append all to the DOM through DocumentFragment.

Sampling accepts additional options:
- *samplingRatio* - Defines how many samples for the same length will be used to calculate. Default is `3`.
  ```js
  autoColumnSize: {
    samplingRatio: 10,
  }
  ```
- *allowSampleDuplicates* - Defines if duplicated values might be used in sampling. Default is `false`.
  ```js
  autoColumnSize: {
    allowSampleDuplicates: true,
  }
```

To configure this plugin see [Options#autoColumnSize](./options/#autocolumnsize).

**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  autoColumnSize: true
});
// Access to plugin instance:
const plugin = hot.getPlugin('autoColumnSize');

plugin.getColumnWidth(4);

if (plugin.isEnabled()) {
  // code...
}
```

## Options

### autoColumnSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L2420

:::

`autoColumnSize.autoColumnSize : object | boolean`

Enables or disables the [AutoColumnSize](./auto-column-size/) plugin. Default value `undefined`
is an equivalent of `true`, sets `syncLimit` to 50.
Disabling this plugin can increase performance, as no size-related calculations would be done.
To disable plugin it's necessary to set `false`.

Column width calculations are divided into sync and async part. Each of those parts has their own advantages and
disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
operations don't block the browser UI.

To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value.

You can also use the `useHeaders` option to take the column headers width into calculation.

Note: Using [Core#colWidths](./Core/#colWidths) option will forcely disable [AutoColumnSize](#AutoColumnSize).

**Default**: <code>undefined</code>  
**Category**: [AutoColumnSize](../auto-column-size)  
**Example**  
```js
// as a number (300 columns in sync, rest async)
autoColumnSize: { syncLimit: 300 },

// as a string (percent)
autoColumnSize: { syncLimit: '40%' },

// use headers width while calculating the column width
autoColumnSize: { useHeaders: true },

// defines how many samples for the same length will be caught to calculations
autoColumnSize: { samplingRatio: 10 },

// defines if duplicated samples are allowed in calculations
autoColumnSize: { allowSampleDuplicates: true },
```

## Members

### inProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L154

:::

`autoColumnSize.inProgress : boolean`

`true` if the size calculation is in progress.



### measuredColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L160

:::

`autoColumnSize.measuredColumns : number`

Number of already measured columns (we already know their sizes).


## Methods

### calculateAllColumnsWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L305

:::

`autoColumnSize.calculateAllColumnsWidth(rowRange)`

Calculates all columns width. The calculated column will be cached in the [AutoColumnSize#widths](./auto-column-size/#widths) property.
To retrieve width for specified column use [AutoColumnSize#getColumnWidth](./auto-column-size/#getcolumnwidth) method.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### calculateColumnsWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L265

:::

`autoColumnSize.calculateColumnsWidth(colRange, rowRange, [force])`

Calculates a columns width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `number` <br/> `object` |  | Visual column index or an object with `from` and `to` visual indexes as a range. |
| rowRange | `number` <br/> `object` |  | Visual row index or an object with `from` and `to` visual indexes as a range. |
| [force] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleColumnsWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L239

:::

`autoColumnSize.calculateVisibleColumnsWidth()`

Calculates visible columns width.



### clearCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L528

:::

`autoColumnSize.clearCache([columns])`

Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [columns] | `Array<number>` | `optional` List of physical column indexes to clear. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L628

:::

`autoColumnSize.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L227

:::

`autoColumnSize.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L189

:::

`autoColumnSize.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L421

:::

`autoColumnSize.getColumnWidth(column, [defaultWidth], [keepMinimum]) ⇒ number`

Gets the calculated column width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| [defaultWidth] | `number` |  | `optional` Default column width. It will be picked up if no calculated width found. |
| [keepMinimum] | `boolean` | <code>true</code> | `optional` If `true` then returned value won't be smaller then 50 (default column width). |



### getFirstVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L440

:::

`autoColumnSize.getFirstVisibleColumn() ⇒ number`

Gets the first visible column.


**Returns**: `number` - Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.  

### getLastVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L469

:::

`autoColumnSize.getLastVisibleColumn() ⇒ number`

Gets the last visible column.


**Returns**: `number` - Returns visual column index or -1 if table is not rendered.  

### getSyncCalculationLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L393

:::

`autoColumnSize.getSyncCalculationLimit() ⇒ number`

Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see [Options#autoColumnSize](./options/#autocolumnsize)).



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L182

:::

`autoColumnSize.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./hooks/#beforeinit)
hook and if it returns `true` than the [#enablePlugin](./auto-column-size/#enableplugin) method is called.



### isNeedRecalculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L546

:::

`autoColumnSize.isNeedRecalculate() ⇒ boolean`

Checks if all widths were calculated. If not then return `true` (need recalculate).



### recalculateAllColumnsWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L380

:::

`autoColumnSize.recalculateAllColumnsWidth()`

Recalculates all columns width (overwrite cache values).



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L213

:::

`autoColumnSize.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./core/#updatesettings) is invoked.


