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

## Members

### inProgress

_autoColumnSize.inProgress : boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L144

`true` if the size calculation is in progress.



### measuredColumns

_autoColumnSize.measuredColumns : number_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L150

Number of already measured columns (we already know their sizes).


## Methods

### calculateAllColumnsWidth

_autoColumnSize.calculateAllColumnsWidth(rowRange)_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L295

Calculates all columns width. The calculated column will be cached in the [AutoColumnSize#widths](./auto-column-size/#widths) property.
To retrieve width for specified column use [AutoColumnSize#getColumnWidth](./auto-column-size/#getcolumnwidth) method.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` \| `number` | Row index or an object with `from` and `to` properties which define row range. |



### calculateColumnsWidth

_autoColumnSize.calculateColumnsWidth(colRange, rowRange, [force])_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L255

Calculates a columns width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `number` \| `object` |  | Visual column index or an object with `from` and `to` visual indexes as a range. |
| rowRange | `number` \| `object` |  | Visual row index or an object with `from` and `to` visual indexes as a range. |
| [force] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleColumnsWidth

_autoColumnSize.calculateVisibleColumnsWidth()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L229

Calculates visible columns width.



### clearCache

_autoColumnSize.clearCache([columns])_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L518

Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [columns] | `Array.&lt;number&gt;` | `optional` List of physical column indexes to clear. |



### destroy

_autoColumnSize.destroy()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L618

Destroys the plugin instance.



### disablePlugin

_autoColumnSize.disablePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L217

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_autoColumnSize.enablePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L179

Enables the plugin functionality for this Handsontable instance.



### getColumnWidth

_autoColumnSize.getColumnWidth(column, [defaultWidth], [keepMinimum]) ⇒ number_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L411

Gets the calculated column width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| [defaultWidth] | `number` |  | `optional` Default column width. It will be picked up if no calculated width found. |
| [keepMinimum] | `boolean` | <code>true</code> | `optional` If `true` then returned value won't be smaller then 50 (default column width). |



### getFirstVisibleColumn

_autoColumnSize.getFirstVisibleColumn() ⇒ number_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L430

Gets the first visible column.


**Returns**: `number` - Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.  

### getLastVisibleColumn

_autoColumnSize.getLastVisibleColumn() ⇒ number_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L459

Gets the last visible column.


**Returns**: `number` - Returns visual column index or -1 if table is not rendered.  

### getSyncCalculationLimit

_autoColumnSize.getSyncCalculationLimit() ⇒ number_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L383

Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see [Options#autoColumnSize](./options/#autocolumnsize)).



### isEnabled

_autoColumnSize.isEnabled() ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L172

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./hooks/#beforeinit)
hook and if it returns `true` than the [#enablePlugin](./auto-column-size/#enableplugin) method is called.



### isNeedRecalculate

_autoColumnSize.isNeedRecalculate() ⇒ boolean_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L536

Checks if all widths were calculated. If not then return `true` (need recalculate).



### recalculateAllColumnsWidth

_autoColumnSize.recalculateAllColumnsWidth()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L370

Recalculates all columns width (overwrite cache values).



### updatePlugin

_autoColumnSize.updatePlugin()_

::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L203

Updates the plugin state. This method is executed when [Core#updateSettings](./core/#updatesettings) is invoked.


