---
title: AutoColumnSize
permalink: /8.2/api/auto-column-size
canonicalUrl: /api/auto-column-size
---

# {{ $frontmatter.title }}

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
## Members:

### inProgress
`autoColumnSize.inProgress : boolean`

`true` if the size calculation is in progress.



### measuredColumns
`autoColumnSize.measuredColumns : number`

Number of already measured columns (we already know their sizes).


## Functions:

### isEnabled
`autoColumnSize.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./hooks/#beforeinit)
hook and if it returns `true` than the [#enablePlugin](./auto-column-size/#enableplugin) method is called.



### enablePlugin
`autoColumnSize.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`autoColumnSize.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./core/#updatesettings) is invoked.



### disablePlugin
`autoColumnSize.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### calculateVisibleColumnsWidth
`autoColumnSize.calculateVisibleColumnsWidth()`

Calculates visible columns width.



### calculateColumnsWidth
`autoColumnSize.calculateColumnsWidth(colRange, rowRange, [force])`

Calculates a columns width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | <code>number</code> \| <code>object</code> |  | Visual column index or an object with `from` and `to` visual indexes as a range. |
| rowRange | <code>number</code> \| <code>object</code> |  | Visual row index or an object with `from` and `to` visual indexes as a range. |
| [force] | <code>boolean</code> | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateAllColumnsWidth
`autoColumnSize.calculateAllColumnsWidth(rowRange)`

Calculates all columns width. The calculated column will be cached in the [AutoColumnSize#widths](./auto-column-size/#widths) property.
To retrieve width for specified column use [AutoColumnSize#getColumnWidth](./auto-column-size/#getcolumnwidth) method.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | <code>object</code> \| <code>number</code> | Row index or an object with `from` and `to` properties which define row range. |



### recalculateAllColumnsWidth
`autoColumnSize.recalculateAllColumnsWidth()`

Recalculates all columns width (overwrite cache values).



### getSyncCalculationLimit
`autoColumnSize.getSyncCalculationLimit() ⇒ number`

Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see [Options#autoColumnSize](./options/#autocolumnsize)).



### getColumnWidth
`autoColumnSize.getColumnWidth(column, [defaultWidth], [keepMinimum]) ⇒ number`

Gets the calculated column width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | <code>number</code> |  | Visual column index. |
| [defaultWidth] | <code>number</code> |  | `optional` Default column width. It will be picked up if no calculated width found. |
| [keepMinimum] | <code>boolean</code> | <code>true</code> | `optional` If `true` then returned value won't be smaller then 50 (default column width). |



### getFirstVisibleColumn
`autoColumnSize.getFirstVisibleColumn() ⇒ number`

Gets the first visible column.


**Returns**: <code>number</code> - Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.  

### getLastVisibleColumn
`autoColumnSize.getLastVisibleColumn() ⇒ number`

Gets the last visible column.


**Returns**: <code>number</code> - Returns visual column index or -1 if table is not rendered.  

### clearCache
`autoColumnSize.clearCache([columns])`

Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [columns] | <code>Array.&lt;number&gt;</code> | `optional` List of physical column indexes to clear. |



### isNeedRecalculate
`autoColumnSize.isNeedRecalculate() ⇒ boolean`

Checks if all widths were calculated. If not then return `true` (need recalculate).



### destroy
`autoColumnSize.destroy()`

Destroys the plugin instance.


