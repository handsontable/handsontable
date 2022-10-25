---
title: AutoRowSize
metaTitle: AutoRowSize - JavaScript Data Grid | Handsontable
permalink: /api/auto-row-size
canonicalUrl: /api/auto-row-size
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the AutoRowSize plugin with its API options, members, and methods to set row heights based on the highest cell in a given row.
react:
  metaTitle: AutoRowSize - React Data Grid | Handsontable
---

# AutoRowSize

[[toc]]

## Description

The `AutoRowSize` plugin allows you to set row heights based on their highest cells.

By default, the plugin is declared as `undefined`, which makes it disabled (same as if it was declared as `false`).
Enabling this plugin may decrease the overall table performance, as it needs to calculate the heights of all cells to
resize the rows accordingly.
If you experience problems with the performance, try turning this feature off and declaring the row heights manually.

But, to display Handsontable's [scrollbar](https://handsontable.com/docs/8.0.0/demo-scrolling.html)
in a proper size, you need to enable the `AutoRowSize` plugin,
by setting the [`autoRowSize`](@/api/options.md#autorowsize) option to `true`.

Row height calculations are divided into sync and async part. Each of this parts has their own advantages and
disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
operations don't block the browser UI.

To configure the sync/async distribution, you can pass an absolute value (number of rows) or a percentage value to a config object:
```js
// as a number (300 rows in sync, rest async)
autoRowSize: {syncLimit: 300},.

// as a string (percent)
autoRowSize: {syncLimit: '40%'},.

// allow sample duplication
autoRowSize: {syncLimit: '40%', allowSampleDuplicates: true},
```

You can also use the `allowSampleDuplicates` option to allow sampling duplicate values when calculating the row
height. __Note__, that this might have a negative impact on performance.

To configure this plugin see [Options#autoRowSize](@/api/options.md#autorowsize).

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

// First, let's contruct Handsontable
<HotTable
  ref={hotRef}
  data={getData()}
  autoRowSize={true}
/>

...

// Access to plugin instance:
const hot = hotRef.current.hotInstance;
const plugin = hot.getPlugin('autoRowSize');

plugin.getRowHeight(4);

if (plugin.isEnabled()) {
  // code...
}
```
:::

## Options

### autoRowSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/dataMap/metaManager/metaSchema.js#L413

:::

_autoRowSize.autoRowSize : object | boolean_

The `autoRowSize` option configures the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

You can set the `autoRowSize` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the [`AutoRowSize`](@/api/autoRowSize.md) plugin                               |
| `true`    | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin with the default configuration |
| An object | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin and modify the plugin options  |

To give Handsontable's [scrollbar](https://handsontable.com/docs/8.0.0/demo-scrolling.html)
a proper size, set the `autoRowSize` option to `true`.

If you set the `autoRowSize` option to an object, you can set the following [`AutoRowSize`](@/api/autoRowSize.md) plugin options:

| Property    | Possible values                 | Description                                                       |
| ----------- | ------------------------------- | ----------------------------------------------------------------- |
| `syncLimit` | A number \| A percentage string | The number/percentage of rows to keep in sync<br>(default: `500`) |

Using the [`rowHeights`](#rowheights) option forcibly disables the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

Read more:
- [Plugins: `AutoRowSize`](@/api/autoRowSize.md)

**Default**: <code>undefined</code>  
**Example**  
```js
autoRowSize: {
  // keep 40% of rows in sync (the rest of rows: async)
  syncLimit: '40%'
},
```

## Members

### inProgress
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L174

:::

_autoRowSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L180

:::

_autoRowSize.measuredRows : number_

Number of already measured rows (we already know their sizes).


## Methods

### calculateAllRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L290

:::

_autoRowSize.calculateAllRowsHeight(colRange)_

Calculate all rows heights. The calculated row will be cached in the [AutoRowSize#heights](@/api/autoRowSize.md#heights) property.
To retrieve height for specified row use [AutoRowSize#getRowHeight](@/api/autoRowSize.md#getrowheight) method.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### calculateRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L247

:::

_autoRowSize.calculateRowsHeight(rowRange, colRange, [force])_

Calculate a given rows height.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| rowRange | `number` <br/> `object` |  | Row index or an object with `from` and `to` indexes as a range. |
| colRange | `number` <br/> `object` |  | Column index or an object with `from` and `to` indexes as a range. |
| [force] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### clearCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L469

:::

_autoRowSize.clearCache()_

Clears cached heights.



### clearCacheByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L479

:::

_autoRowSize.clearCacheByRange(range)_

Clears cache by range.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L603

:::

_autoRowSize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L230

:::

_autoRowSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L210

:::

_autoRowSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L426

:::

_autoRowSize.getColumnHeaderHeight() ⇒ number | undefined_

Get the calculated column header height.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L435

:::

_autoRowSize.getFirstVisibleRow() ⇒ number_

Get the first visible row.


**Returns**: `number` - Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.  

### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L453

:::

_autoRowSize.getLastVisibleRow() ⇒ number_

Gets the last visible row.


**Returns**: `number` - Returns row index or -1 if table is not rendered.  

### getRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L410

:::

_autoRowSize.getRowHeight(row, [defaultHeight]) ⇒ number_

Gets the calculated row height.

Mind that this method is different from the [Core](@/api/core.md)'s [`getRowHeight()`](@/api/core.md#getrowheight) method.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [defaultHeight] | `number` | `optional` Default row height. It will be picked up if no calculated height found. |



### getSyncCalculationLimit
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L381

:::

_autoRowSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see [Options#autoRowSize](@/api/options.md#autorowsize)).



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L201

:::

_autoRowSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### isNeedRecalculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L494

:::

_autoRowSize.isNeedRecalculate() ⇒ boolean_

Checks if all heights were calculated. If not then return `true` (need recalculate).



### recalculateAllRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/autoRowSize/autoRowSize.js#L368

:::

_autoRowSize.recalculateAllRowsHeight()_

Recalculates all rows height (overwrite cache values).


