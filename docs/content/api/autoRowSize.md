---
title: AutoRowSize
metaTitle: AutoRowSize - JavaScript Data Grid | Handsontable
permalink: /api/auto-row-size
canonicalUrl: /api/auto-row-size
searchCategory: API Reference
hotPlugin: true
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

# Plugin: AutoRowSize

[[toc]]

## Description

The `AutoRowSize` plugin allows you to set row heights based on their highest cells.

By default, the plugin is declared as `undefined`, which makes it disabled (same as if it was declared as `false`).
Enabling this plugin may decrease the overall table performance, as it needs to calculate the heights of all cells to
resize the rows accordingly.
If you experience problems with the performance, try turning this feature off and declaring the row heights manually.

But, to display Handsontable's scrollbar in a proper size, you need to enable the `AutoRowSize` plugin,
by setting the [`autoRowSize`](@/api/options.md#autorowsize) option to `true`.

Row height calculations are divided into sync and async part. Each of this parts has their own advantages and
disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
operations don't block the browser UI.

To configure the sync/async distribution, you can pass an absolute value (number of rows) or a percentage value to a config object:
```js
// as a number (300 rows in sync, rest async)
autoRowSize: {syncLimit: 300},

// as a string (percent)
autoRowSize: {syncLimit: '40%'},

// allow sample duplication
autoRowSize: {syncLimit: '40%', allowSampleDuplicates: true},
```

You can also use the `allowSampleDuplicates` option to allow sampling duplicate values when calculating the row
height. __Note__, that this might have a negative impact on performance.

::: tip
Note: Updating some of the table's settings can cause the row heights to change (e.g. `wordWrap`, `textEllipsis`, renderers etc.).
In those cases, to ensure that the row heights are properly recalculated, you need to call the [AutoRowSize#recalculateAllRowsHeight](@/api/autoRowSize.md#recalculateallrowsheight) method after calling [Core#updateSettings](@/api/core.md#updatesettings).
:::

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

::: only-for angular
```ts
import { AfterViewInit, Component, ViewChild } from "@angular/core";
import {
  GridSettings,
  HotTableModule,
  HotTableComponent,
} from "@handsontable/angular-wrapper";

`@Component`({
  selector: "app-example",
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table themeName="ht-theme-main" [settings]="gridSettings" />
  </div>`,
})
export class ExampleComponent implements AfterViewInit {
  `@ViewChild`(HotTableComponent, { static: false })
  readonly hotTable!: HotTableComponent;

  readonly gridSettings = <GridSettings>{
    data: this.getData(),
    autoRowSize: true,
  };

  ngAfterViewInit(): void {
    // Access to plugin instance:
    const hot = this.hotTable.hotInstance;
    const plugin = hot.getPlugin("autoRowSize");

    plugin.getRowHeight(4);

    if (plugin.isEnabled()) {
      // code...
    }
  }

  private getData(): any[] {
    // get some data
  }
}
```
:::

## Options

### autoRowSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L457

:::

_autoRowSize.autoRowSize : object | boolean_

The `autoRowSize` option configures the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

You can set the `autoRowSize` option to one of the following:

| Setting   | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `false`   | Disable the [`AutoRowSize`](@/api/autoRowSize.md) plugin                               |
| `true`    | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin with the default configuration |
| An object | Enable the [`AutoRowSize`](@/api/autoRowSize.md) plugin and modify the plugin options  |

To give Handsontable's scrollbar a proper size, set the `autoRowSize` option to `true`.

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L230

:::

_autoRowSize.inProgress : boolean_

`true` if the size calculation is in progress.



### measuredRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L236

:::

_autoRowSize.measuredRows : number_

Number of already measured rows (we already know their sizes).


## Methods

### calculateAllRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L405

:::

_autoRowSize.calculateAllRowsHeight(colRange, [overwriteCache])_

Calculate all rows heights. The calculated row will be cached in the [AutoRowSize#heights](@/api/autoRowSize.md#heights) property.
To retrieve height for specified row use [AutoRowSize#getRowHeight](@/api/autoRowSize.md#getrowheight) method.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| colRange | `object` <br/> `number` |  | Row index or an object with `from` and `to` properties which define row range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L352

:::

_autoRowSize.calculateRowsHeight(rowRange, colRange, [overwriteCache])_

Calculate a given rows height.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| rowRange | `number` <br/> `object` |  | Row index or an object with `from` and `to` indexes as a range. |
| colRange | `number` <br/> `object` |  | Column index or an object with `from` and `to` indexes as a range. |
| [overwriteCache] | `boolean` | <code>false</code> | `optional` If `true` the calculation will be processed regardless of whether the width exists in the cache. |



### calculateVisibleRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L327

:::

_autoRowSize.calculateVisibleRowsHeight()_

Calculates heights for visible rows in the viewport only.



### clearCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L589

:::

_autoRowSize.clearCache([physicalRows])_

Clears cache of calculated row heights. If you want to clear only selected rows pass an array with their indexes.
Otherwise whole cache will be cleared.


| Param | Type | Description |
| --- | --- | --- |
| [physicalRows] | `Array<number>` | `optional` List of physical row indexes to clear. |



### clearCacheByRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L609

:::

_autoRowSize.clearCacheByRange(range)_

Clears cache by range.


| Param | Type | Description |
| --- | --- | --- |
| range | `object` <br/> `number` | Row index or an object with `from` and `to` properties which define row range. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L757

:::

_autoRowSize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L311

:::

_autoRowSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L282

:::

_autoRowSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L561

:::

_autoRowSize.getColumnHeaderHeight() ⇒ number | undefined_

Get the calculated column header height.



### getFirstVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L570

:::

_autoRowSize.getFirstVisibleRow() ⇒ number_

Get the first visible row.


**Returns**: `number` - Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.  

### getLastVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L579

:::

_autoRowSize.getLastVisibleRow() ⇒ number_

Gets the last visible row.


**Returns**: `number` - Returns row index or -1 if table is not rendered.  

### getRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L535

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L502

:::

_autoRowSize.getSyncCalculationLimit() ⇒ number_

Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see [Options#autoRowSize](@/api/options.md#autorowsize)).



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L273

:::

_autoRowSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [AutoRowSize#enablePlugin](@/api/autoRowSize.md#enableplugin) method is called.



### isNeedRecalculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L624

:::

_autoRowSize.isNeedRecalculate() ⇒ boolean_

Checks if all heights were calculated. If not then return `true` (need recalculate).



### recalculateAllRowsHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/autoRowSize/autoRowSize.js#L490

:::

_autoRowSize.recalculateAllRowsHeight()_

Recalculates all rows height (overwrite cache values).


