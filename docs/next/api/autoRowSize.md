---
title: AutoRowSize
permalink: /next/api/auto-row-size
canonicalUrl: /api/auto-row-size
editLink: false
---

# AutoRowSize

[[toc]]

## Description


This plugin allows to set row heights based on their highest cells.

By default, the plugin is declared as `undefined`, which makes it disabled (same as if it was declared as `false`).
Enabling this plugin may decrease the overall table performance, as it needs to calculate the heights of all cells to
resize the rows accordingly.
If you experience problems with the performance, try turning this feature off and declaring the row heights manually.

Row height calculations are divided into sync and async part. Each of this parts has their own advantages and
disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
operations don't block the browser UI.

To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value to a config object:
```js
// as a number (300 columns in sync, rest async)
autoRowSize: {syncLimit: 300},.

// as a string (percent)
autoRowSize: {syncLimit: '40%'},.

// allow sample duplication
autoRowSize: {syncLimit: '40%', allowSampleDuplicates: true},
```

You can also use the `allowSampleDuplicates` option to allow sampling duplicate values when calculating the row
height. __Note__, that this might have a negative impact on performance.

To configure this plugin see [Options#autoRowSize](./options/#autorowsize).

**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  autoRowSize: true
});
// Access to plugin instance:
const plugin = hot.getPlugin('autoRowSize');

plugin.getRowHeight(4);

if (plugin.isEnabled()) {
  // code...
}
```

## Members:

### inProgress

_autoRowSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredRows

_autoRowSize.measuredRows : number_

Number of already measured rows (we already know their sizes).


## Methods:

### calculateAllRowsHeight

_autoRowSize.calculateAllRowsHeight(colRange)_

Calculate all rows heights. The calculated row will be cached in the [AutoRowSize#heights](./auto-row-size/#heights) property.
To retrieve height for specified row use [AutoRowSize#getRowHeight](./auto-row-size/#getrowheight) method.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` \| `number` | Row index or an object with `from` and `to` properties which define row range. |



### calculateRowsHeight

_autoRowSize.calculateRowsHeight(rowRange, colRange, [force])_

Calculate a given rows height.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| rowRange | `number` \| `object` |  | Row index or an object with `from` and `to` indexes as a range. |
| colRange | `number` \| `object` |  | Column index or an object with `from` and `to` indexes as a range. |
| [force] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### clearCache

_autoRowSize.clearCache()_

Clears cached heights.



### clearCacheByRange

_autoRowSize.clearCacheByRange(range)_

Clears cache by range.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` \| `number` | Row index or an object with `from` and `to` properties which define row range. |



### destroy

_autoRowSize.destroy()_

Destroys the plugin instance.



### disablePlugin

_autoRowSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_autoRowSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnHeaderHeight

_autoRowSize.getColumnHeaderHeight() ⇒ number | undefined_

Get the calculated column header height.



### getFirstVisibleRow

_autoRowSize.getFirstVisibleRow() ⇒ number_

Get the first visible row.


**Returns**: `number` - Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.  

### getLastVisibleRow

_autoRowSize.getLastVisibleRow() ⇒ number_

Gets the last visible row.


**Returns**: `number` - Returns row index or -1 if table is not rendered.  

### getRowHeight

_autoRowSize.getRowHeight(row, [defaultHeight]) ⇒ number_

Gets the calculated row height.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [defaultHeight] | `number` | `optional` Default row height. It will be picked up if no calculated height found. |



### getSyncCalculationLimit

_autoRowSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see [Options#autoRowSize](./options/#autorowsize)).



### isEnabled

_autoRowSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./hooks/#beforeinit)
hook and if it returns `true` than the [AutoRowSize#enablePlugin](./auto-row-size/#enableplugin) method is called.



### isNeedRecalculate

_autoRowSize.isNeedRecalculate() ⇒ boolean_

Checks if all heights were calculated. If not then return `true` (need recalculate).



### recalculateAllRowsHeight

_autoRowSize.recalculateAllRowsHeight()_

Recalculates all rows height (overwrite cache values).


