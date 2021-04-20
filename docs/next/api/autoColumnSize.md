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

## Options

### data
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L123
  

_autoColumnSize.data : Array&lt;Array&gt; | Array&lt;object&gt;_
Initial data source that will be bound to the data grid __by reference__ (editing data grid alters the data source).
Can be declared as an array of arrays or an array of objects.

See [Understanding binding as reference](https://docs.handsontable.com/tutorial-data-binding.html#page-reference).

**Default**: <code>undefined</code>  
**Category**: AutoColumnSize, Data, AutoColumnSize2  
**Example**  
```js
// as an array of arrays
data: [
  ['A', 'B', 'C'],
  ['D', 'E', 'F'],
  ['G', 'H', 'J']
]

// as an array of objects
data: [
  {id: 1, name: 'Ted Right'},
  {id: 2, name: 'Frank Honest'},
  {id: 3, name: 'Joan Well'},
  {id: 4, name: 'Gail Polite'},
  {id: 5, name: 'Michael Fair'},
]
```


### dataSchema
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L152
  

_autoColumnSize.dataSchema : object_
Defines the structure of a new row when data source is an array of objects.

See [data-schema](https://docs.handsontable.com/tutorial-data-sources.html#page-data-schema) for more options.

**Default**: <code>undefined</code>  
**Category**: AutoColumnSize  
**Example**  
```
// with data schema we can start with an empty table
data: null,
dataSchema: {id: null, name: {first: null, last: null}, address: null},
colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
columns: [
  {data: 'id'},
  {data: 'name.first'},
  {data: 'name.last'},
  {data: 'address'}
],
startRows: 5,
minSpareRows: 1
```


### width
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L176
  

_autoColumnSize.width : number | string | function_
Width of the grid. Can be a value or a function that returns a value.

**Default**: <code>undefined</code>  
**Category**: AutoColumnSize  
**Example**  
```
// as a number
width: 500,

// as a string
width: '75vw',

// as a function
width: function() {
  return 500;
},
```

## Members

### inProgress
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L144
  

_autoColumnSize.inProgress : boolean_
`true` if the size calculation is in progress.



### measuredColumns
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L150
  

_autoColumnSize.measuredColumns : number_
Number of already measured columns (we already know their sizes).


## Methods

### calculateAllColumnsWidth
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L295
  

_autoColumnSize.calculateAllColumnsWidth(rowRange)_
Calculates all columns width. The calculated column will be cached in the [AutoColumnSize#widths](./auto-column-size/#widths) property.
To retrieve width for specified column use [AutoColumnSize#getColumnWidth](./auto-column-size/#getcolumnwidth) method.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` \| `number` | Row index or an object with `from` and `to` properties which define row range. |



### calculateColumnsWidth
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L255
  

_autoColumnSize.calculateColumnsWidth(colRange, rowRange, [force])_
Calculates a columns width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `number` \| `object` |  | Visual column index or an object with `from` and `to` visual indexes as a range. |
| rowRange | `number` \| `object` |  | Visual row index or an object with `from` and `to` visual indexes as a range. |
| [force] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleColumnsWidth
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L229
  

_autoColumnSize.calculateVisibleColumnsWidth()_
Calculates visible columns width.



### clearCache
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L518
  

_autoColumnSize.clearCache([columns])_
Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [columns] | `Array.&lt;number&gt;` | `optional` List of physical column indexes to clear. |



### destroy
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L618
  

_autoColumnSize.destroy()_
Destroys the plugin instance.



### disablePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L217
  

_autoColumnSize.disablePlugin()_
Disables the plugin functionality for this Handsontable instance.



### enablePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L179
  

_autoColumnSize.enablePlugin()_
Enables the plugin functionality for this Handsontable instance.



### getColumnWidth
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L411
  

_autoColumnSize.getColumnWidth(column, [defaultWidth], [keepMinimum]) ⇒ number_
Gets the calculated column width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | Visual column index. |
| [defaultWidth] | `number` |  | `optional` Default column width. It will be picked up if no calculated width found. |
| [keepMinimum] | `boolean` | <code>true</code> | `optional` If `true` then returned value won't be smaller then 50 (default column width). |



### getFirstVisibleColumn
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L430
  

_autoColumnSize.getFirstVisibleColumn() ⇒ number_
Gets the first visible column.


**Returns**: `number` - Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.  

### getLastVisibleColumn
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L459
  

_autoColumnSize.getLastVisibleColumn() ⇒ number_
Gets the last visible column.


**Returns**: `number` - Returns visual column index or -1 if table is not rendered.  

### getSyncCalculationLimit
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L383
  

_autoColumnSize.getSyncCalculationLimit() ⇒ number_
Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see [Options#autoColumnSize](./options/#autocolumnsize)).



### isEnabled
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L172
  

_autoColumnSize.isEnabled() ⇒ boolean_
Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./hooks/#beforeinit)
hook and if it returns `true` than the [#enablePlugin](./auto-column-size/#enableplugin) method is called.



### isNeedRecalculate
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L536
  

_autoColumnSize.isNeedRecalculate() ⇒ boolean_
Checks if all widths were calculated. If not then return `true` (need recalculate).



### recalculateAllColumnsWidth
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L370
  

_autoColumnSize.recalculateAllColumnsWidth()_
Recalculates all columns width (overwrite cache values).



### updatePlugin
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autoColumnSize/autoColumnSize.js#L203
  

_autoColumnSize.updatePlugin()_
Updates the plugin state. This method is executed when [Core#updateSettings](./core/#updatesettings) is invoked.


