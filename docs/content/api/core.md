---
title: Core
metaTitle: Core API reference - JavaScript Data Grid | Handsontable
permalink: /api/core
canonicalUrl: /api/core
searchCategory: API Reference
hotPlugin: false
editLink: false
id: o9civnqe
description: A complete list of the public API methods of Handsontable's core that let you control your data grid programmatically.
react:
  id: 6kcorabp
  metaTitle: Core methods API reference - React Data Grid | Handsontable
angular:
  id: a8m3k9xz
  metaTitle: Core methods API reference - Angular Data Grid | Handsontable
---

# Plugin: Core

[[toc]]

## Description

The `Handsontable` class (known as the `Core`) lets you modify the grid's behavior by using Handsontable's public API methods.

::: only-for react
To use these methods, associate a Handsontable instance with your instance
of the [`HotTable` component](@/guides/getting-started/installation/installation.md#_4-use-the-hottable-component),
by using React's `ref` feature (read more on the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page).
:::

::: only-for angular
To use these methods, associate a Handsontable instance with your instance
of the [`HotTable` component](@/guides/getting-started/installation/installation.md#5-use-the-hottable-component),
by using `@ViewChild` decorator (read more on the [Instance access](@/guides/getting-started/angular-hot-instance/angular-hot-instance.md) page).
:::

## How to call a method

::: only-for javascript
```js
// create a Handsontable instance
const hot = new Handsontable(document.getElementById('example'), options);

// call a method
hot.setDataAtCell(0, 0, 'new value');
```
:::

::: only-for react
```jsx
import { useRef } from 'react';

const hotTableComponent = useRef(null);

<HotTable
  // associate your `HotTable` component with a Handsontable instance
  ref={hotTableComponent}
  settings={options}
/>

// access the Handsontable instance, under the `.current.hotInstance` property
// call a method
hotTableComponent.current.hotInstance.setDataAtCell(0, 0, 'new value');
```
:::

::: only-for angular
```ts
import { Component, ViewChild, AfterViewInit } from "@angular/core";
import {
  GridSettings,
  HotTableComponent,
  HotTableModule,
} from "@handsontable/angular-wrapper";

`@Component`({
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
    columns: [{}],
  };

  ngAfterViewInit(): void {
    // Access the Handsontable instance
    // Call a method
    this.hotTable?.hotInstance?.setDataAtCell(0, 0, "new value");
  }
}
```
:::


## Members

### columnIndexMapper
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L401

:::

_core.columnIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the column indexes.



### isDestroyed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L274

:::

_core.isDestroyed : boolean_

A boolean to tell if the Handsontable has been fully destroyed. This is set to `true`
after `afterDestroy` hook is called.



### rowIndexMapper
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L410

:::

_core.rowIndexMapper : [IndexMapper](@/api/indexMapper.md)_

Instance of index mapper which is responsible for managing the row indexes.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5131

:::

_core.addHook(key, callback, [orderIndex])_

Adds listener to the specified hook name (only for this Handsontable instance).

**See**: [Hooks#add](@/api/hooks.md#add)  
**Example**  
```js
hot.addHook('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name (see [Hooks](@/api/hooks.md)). |
| callback | `function` <br/> `Array` | Function or array of functions. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### addHookOnce
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5171

:::

_core.addHookOnce(key, callback, [orderIndex])_

Adds listener to specified hook name (only for this Handsontable instance). After the listener is triggered,
it will be automatically removed.

**See**: [Hooks#once](@/api/hooks.md#once)  
**Example**  
```js
hot.addHookOnce('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name (see [Hooks](@/api/hooks.md)). |
| callback | `function` <br/> `Array` | Function or array of functions. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### alter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2956

:::

_core.alter(action, [index], [amount], [source], [keepEmptyRows])_

The `alter()` method lets you alter the grid's structure
by adding or removing rows and columns at specified positions.

::: tip
If you use an array of objects in your [`data`](@/api/options.md#data), the column-related actions won't work.
:::

```js
// above row 10 (by visual index), insert 1 new row
hot.alter('insert_row_above', 10);
```

 | Action               | With `index` | Without `index` |
 | -------------------- | ------------ | --------------- |
 | `'insert_row_above'` | Inserts rows above the `index` row. | Inserts rows above the first row. |
 | `'insert_row_below'` | Inserts rows below the `index` row. | Inserts rows below the last row. |
 | `'remove_row'`       | Removes rows, starting from the `index` row. | Removes rows, starting from the last row. |
 | `'insert_col_start'` | Inserts columns before the `index` column. | Inserts columns before the first column. |
 | `'insert_col_end'`   | Inserts columns after the `index` column. | Inserts columns after the last column. |
 | `'remove_col'`       | Removes columns, starting from the `index` column. | Removes columns, starting from the last column. |

Additional information about `'insert_col_start'` and `'insert_col_end'`:
- Their behavior depends on your [`layoutDirection`](@/api/options.md#layoutdirection).
- If the provided `index` is higher than the actual number of columns, Handsontable doesn't generate
the columns missing in between. Instead, the new columns are inserted next to the last column.

**Example**  
```js
// above row 10 (by visual index), insert 1 new row
hot.alter('insert_row_above', 10);

// below row 10 (by visual index), insert 3 new rows
hot.alter('insert_row_below', 10, 3);

// in the LTR layout direction: to the left of column 10 (by visual index), insert 3 new columns
// in the RTL layout direction: to the right of column 10 (by visual index), insert 3 new columns
hot.alter('insert_col_start', 10, 3);

// in the LTR layout direction: to the right of column 10 (by visual index), insert 1 new column
// in the RTL layout direction: to the left of column 10 (by visual index), insert 1 new column
hot.alter('insert_col_end', 10);

// remove 2 rows, starting from row 10 (by visual index)
hot.alter('remove_row', 10, 2);

// remove 3 rows, starting from row 1 (by visual index)
// remove 2 rows, starting from row 5 (by visual index)
hot.alter('remove_row', [[1, 3], [5, 2]]);
```

| Param | Type | Description |
| --- | --- | --- |
| action | `string` | Available operations: <ul>    <li> `'insert_row_above'` </li>    <li> `'insert_row_below'` </li>    <li> `'remove_row'` </li> </li>    <li> `'insert_col_start'` </li>    <li> `'insert_col_end'` </li>    <li> `'remove_col'` </li> </ul> |
| [index] | `number` <br/> `Array<number>` | `optional` A visual index of the row/column before or after which the new row/column will be                                inserted or removed. Can also be an array of arrays, in format `[[index, amount],...]`. |
| [amount] | `number` | `optional` The amount of rows or columns to be inserted or removed (default: `1`). |
| [source] | `string` | `optional` Source indicator. |
| [keepEmptyRows] | `boolean` | `optional` If set to `true`: prevents removing empty rows. |



### batch
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2342

:::

_core.batch(wrappedOperations) ⇒ \*_

It batches the rendering process and index recalculations. The method aggregates
multi-line API calls into a callback and postpones the table rendering process
as well aggregates the table logic changes such as index changes into one call
after which the cache is updated. After the execution of the operations, the
table is rendered, and the cache is updated once. As a result, it improves the
performance of wrapped operations.

**Since**: 8.3.0  
**Example**  
```js
hot.batch(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.alter('insert_col_start', 10, 40);
  hot.setDataAtCell(1, 1, 'x');
  hot.setDataAtCell(2, 2, 'c');
  hot.setDataAtCell(3, 3, 'v');
  hot.setDataAtCell(4, 4, 'b');
  hot.setDataAtCell(5, 5, 'n');
  hot.selectCell(0, 0);

  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table will be re-rendered and cache will be recalculated once after executing the callback
});
```

| Param | Type | Description |
| --- | --- | --- |
| wrappedOperations | `function` | Batched operations wrapped in a function. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### batchExecution
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2306

:::

_core.batchExecution(wrappedOperations, [forceFlushChanges]) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table execution process. After the execution of the operations, the internal table
cache is recalculated once. As a result, it improves the performance of wrapped
operations. Without batching, a similar case could trigger multiple table cache rebuilds.

**Since**: 8.3.0  
**Example**  
```js
hot.batchExecution(() => {
  const filters = hot.getPlugin('filters');

  filters.addCondition(2, 'contains', ['3']);
  filters.filter();
  hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
  // The table cache will be recalculated once after executing the callback
});
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| wrappedOperations | `function` |  | Batched operations wrapped in a function. |
| [forceFlushChanges] | `boolean` | <code>false</code> | `optional` If `true`, the table internal data cache is recalculated after the execution of the batched operations. For nested calls, it can be a desire to recalculate the table after each batch. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### batchRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2192

:::

_core.batchRender(wrappedOperations) ⇒ \*_

The method aggregates multi-line API calls into a callback and postpones the
table rendering process. After the execution of the operations, the table is
rendered once. As a result, it improves the performance of wrapped operations.
Without batching, a similar case could trigger multiple table render calls.

**Since**: 8.3.0  
**Example**  
```js
hot.batchRender(() => {
  hot.alter('insert_row_above', 5, 45);
  hot.alter('insert_col_start', 10, 40);
  hot.setDataAtCell(1, 1, 'John');
  hot.setDataAtCell(2, 2, 'Mark');
  hot.setDataAtCell(3, 3, 'Ann');
  hot.setDataAtCell(4, 4, 'Sophia');
  hot.setDataAtCell(5, 5, 'Mia');
  hot.selectCell(0, 0);
  // The table will be rendered once after executing the callback
});
```

| Param | Type | Description |
| --- | --- | --- |
| wrappedOperations | `function` | Batched operations wrapped in a function. |


**Returns**: `*` - Returns result from the wrappedOperations callback.  

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2945

:::

_core.clear()_

Clears the data from the table (the table settings remain intact).



### clearUndo <span class="tag-deprecated">Deprecated</span>
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/undoRedo/undoRedo.js#L380

:::

_core.clearUndo()_

::: warning
This method is deprecated and it will be removed from the Core API in the future. Please use the method from the [&#x60;UndoRedo&#x60;](@/api/undoRedo.md#clear) plugin.
:::


### colToProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3108

:::

_core.colToProp(column) ⇒ string | number_

Returns the property name that corresponds with the given column index.
If the data source is an array of arrays, it returns the columns index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `string` | `number` - Column property or physical column index.  

### countColHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4333

:::

_core.countColHeaders() ⇒ number_

Returns the number of rendered column headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of column headers.  

### countCols
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4259

:::

_core.countCols() ⇒ number_

Returns the total number of visible columns in the table.


**Returns**: `number` - Total number of columns.  

### countEmptyCols
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4369

:::

_core.countEmptyCols([ending]) ⇒ number_

Returns the number of empty columns. If the optional ending parameter is `true`, returns the number of empty
columns at right hand edge of the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ending] | `boolean` | <code>false</code> | `optional` If `true`, will only count empty columns at the end of the data source row. |


**Returns**: `number` - Count empty cols.  

### countEmptyRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4345

:::

_core.countEmptyRows([ending]) ⇒ number_

Returns the number of empty rows. If the optional ending parameter is `true`, returns the
number of empty rows at the bottom of the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [ending] | `boolean` | <code>false</code> | `optional` If `true`, will only count empty rows at the end of the data source. |


**Returns**: `number` - Count empty rows.  

### countRenderedCols
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4297

:::

_core.countRenderedCols() ⇒ number_

Returns the number of rendered rows including columns that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRenderedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4273

:::

_core.countRenderedRows() ⇒ number_

Returns the number of rendered rows including rows that are partially or fully rendered
outside the table viewport.


**Returns**: `number` - Returns -1 if table is not visible.  

### countRowHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4321

:::

_core.countRowHeaders() ⇒ number_

Returns the number of rendered row headers.

**Since**: 14.0.0  

**Returns**: `number` - Number of row headers.  

### countRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4248

:::

_core.countRows() ⇒ number_

Returns the total number of visual rows in the table.


**Returns**: `number` - Total number of rows.  

### countSourceCols
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4237

:::

_core.countSourceCols() ⇒ number_

Returns the total number of columns in the data source.


**Returns**: `number` - Total number of columns.  

### countSourceRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4226

:::

_core.countSourceRows() ⇒ number_

Returns the total number of rows in the data source.


**Returns**: `number` - Total number of rows.  

### countVisibleCols
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4309

:::

_core.countVisibleCols() ⇒ number_

Returns the number of rendered columns that are only visible in the table viewport.
The columns that are partially visible are not counted.


**Returns**: `number` - Number of visible columns or -1.  

### countVisibleRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4285

:::

_core.countVisibleRows() ⇒ number_

Returns the number of rendered rows that are only visible in the table viewport.
The rows that are partially visible are not counted.


**Returns**: `number` - Number of visible rows or -1.  

### deselectCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4611

:::

_core.deselectCell()_

Deselects the current cell selection on the table.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4827

:::

_core.destroy()_

Removes the table from the DOM and destroys the instance of the Handsontable.

**Emits**: [`Hooks#event:afterDestroy`](@/api/hooks.md#afterdestroy)  


### destroyEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1847

:::

_core.destroyEditor([revertOriginal], [prepareEditorIfNeeded])_

Destroys the current editor, render the table and prepares the editor of the newly selected cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [revertOriginal] | `boolean` | <code>false</code> | `optional` If `true`, the previous value will be restored. Otherwise, the edited value will be saved. |
| [prepareEditorIfNeeded] | `boolean` | <code>true</code> | `optional` If `true` the editor under the selected cell will be prepared to open. |



### emptySelectedCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2044

:::

_core.emptySelectedCells([source])_

Erases content from cells that have been selected in the table.

**Since**: 0.36.0  

| Param | Type | Description |
| --- | --- | --- |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty. |



### getActiveEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4928

:::

_core.getActiveEditor() ⇒ [BaseEditor](@/api/baseEditor.md)_

Returns the active editor class instance.


**Returns**: [`BaseEditor`](@/api/baseEditor.md) - The active editor instance.  

### getActiveSelectionLayerIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2031

:::

_core.getActiveSelectionLayerIndex() ⇒ number_

Returns the index of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `number` - The index of the active selection layer. `0` to `N` where `0` is the last (oldest) layer and `N` is the first (newest) layer.  

### getCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3027

:::

_core.getCell(row, column, [topmost]) ⇒ HTMLTableCellElement | null_

Returns a TD element for the given `row` and `column` arguments, if it is rendered on screen.
Returns `null` if the TD is not rendered on screen (probably because that part of the table is not visible).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [topmost] | `boolean` | <code>false</code> | `optional` If set to `true`, it returns the TD element from the topmost overlay. For example, if the wanted cell is in the range of fixed rows, it will return a TD element from the `top` overlay. |


**Returns**: `HTMLTableCellElement` | `null` - The cell's TD element.  

### getCellEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3737

:::

_core.getCellEditor(rowOrMeta, column) ⇒ function | boolean_

Returns the cell editor class by the provided `row` and `column` arguments.

**Example**  
```js
// Get cell editor class using `row` and `column` coordinates.
hot.getCellEditor(1, 1);
// Get cell editor class using cell meta object.
hot.getCellEditor(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` | `boolean` - Returns the editor class or `false` is cell editor is disabled.  

### getCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3636

:::

_core.getCellMeta(row, column, options) ⇒ object_

Returns the cell properties object for the given `row` and `column` coordinates.

**Emits**: [`Hooks#event:beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta), [`Hooks#event:afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| options | `object` |  | Execution options for the `getCellMeta` method. |
| [options.skipMetaExtension] | `boolean` | <code>false</code> | `optional` If `true`, skips extending the cell meta object. This means, the `cells` function, as well as the `afterGetCellMeta` and `beforeGetCellMeta` hooks, will not be called. |


**Returns**: `object` - The cell properties object.  

### getCellMetaAtRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3681

:::

_core.getCellMetaAtRow(row) ⇒ Array_

Returns an array of cell meta objects for specified physical row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |



### getCellRenderer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3710

:::

_core.getCellRenderer(rowOrMeta, column) ⇒ function_

Returns the cell renderer function by given `row` and `column` arguments.

**Example**  
```js
// Get cell renderer using `row` and `column` coordinates.
hot.getCellRenderer(1, 1);
// Get cell renderer using cell meta object.
hot.getCellRenderer(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` <br/> `object` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` - Returns the renderer function.  

### getCellsMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3625

:::

_core.getCellsMeta() ⇒ Array_

Get all the cells meta settings at least once generated in the table (in order of cell initialization).


**Returns**: `Array` - Returns an array of ColumnSettings object instances.  

### getCellValidator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3764

:::

_core.getCellValidator(rowOrMeta, column) ⇒ function | RegExp | undefined_

Returns the cell validator by `row` and `column`.

**Example**  
```js
// Get cell validator using `row` and `column` coordinates.
hot.getCellValidator(1, 1);
// Get cell validator using cell meta object.
hot.getCellValidator(hot.getCellMeta(1, 1));
```

| Param | Type | Description |
| --- | --- | --- |
| rowOrMeta | `number` <br/> `object` | Visual row index or cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |
| column | `number` | Visual column index. |


**Returns**: `function` | `RegExp` | `undefined` - The validator function.  

### getColHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3992

:::

_core.getColHeader([column], [headerLevel]) ⇒ Array | string | number_

Gets the values of column headers (if column headers are [enabled](@/api/options.md#colheaders)).

To get an array with the values of all
[bottom-most](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers) column headers,
call `getColHeader()` with no arguments.

To get the value of the bottom-most header of a specific column, use the `column` parameter.

To get the value of a [specific-level](@/guides/columns/column-groups/column-groups.md) header
of a specific column, use the `column` and `headerLevel` parameters.

Read more:
- [Guides: Column groups](@/guides/columns/column-groups/column-groups.md)
- [Options: `colHeaders`](@/api/options.md#colheaders)
- [Guides: Copy with headers](@/guides/cell-features/clipboard/clipboard.md#copy-with-headers)

```js
// get the contents of all bottom-most column headers
hot.getColHeader();

// get the contents of the bottom-most header of a specific column
hot.getColHeader(5);

// get the contents of a specific column header at a specific level
hot.getColHeader(5, -2);
```

**Emits**: [`Hooks#event:modifyColHeader`](@/api/hooks.md#modifycolheader), [`Hooks#event:modifyColumnHeaderValue`](@/api/hooks.md#modifycolumnheadervalue)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [column] | `number` |  | `optional` A visual column index. |
| [headerLevel] | `number` | <code>-1</code> | `optional` (Since 12.3.0) Header level index. Accepts positive (0 to n)                                  and negative (-1 to -n) values. For positive values, 0 points to the                                  topmost header. For negative values, -1 points to the bottom-most                                  header (the header closest to the cells). |


**Returns**: `Array` | `string` | `number` - Column header values.  

### getColumnMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3668

:::

_core.getColumnMeta(column) ⇒ object_

Returns the meta information for the provided column.

**Since**: 14.5.0  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getColWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4134

:::

_core.getColWidth(column, [source]) ⇒ number_

Returns the width of the requested column.

**Emits**: [`Hooks#event:modifyColWidth`](@/api/hooks.md#modifycolwidth)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [source] | `string` | `optional` The source of the call. |


**Returns**: `number` - Column width.  

### getCoords
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3072

:::

_core.getCoords(element) ⇒ [CellCoords](@/api/cellCoords.md) | null_

Returns the coordinates of the cell, provided as a HTML table cell element.

**Example**  
```js
hot.getCoords(hot.getCell(1, 1));
// it returns CellCoords object instance with props row: 1 and col: 1.
```

| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLTableCellElement` | The HTML Element representing the cell. |


**Returns**: [`CellCoords`](@/api/cellCoords.md) | `null` - Visual coordinates object.  

### getCopyableData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2631

:::

_core.getCopyableData(row, column) ⇒ string_

Returns the data's copyable value at specified `row` and `column` index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableSourceData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2644

:::

_core.getCopyableSourceData(row, column) ⇒ string_

Returns the source data's copyable value at specified `row` and `column` index.

**Since**: 16.1.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getCopyableText
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2614

:::

_core.getCopyableText(startRow, startCol, endRow, endCol) ⇒ string_

Returns a string value of the selected range. Each column is separated by tab, each row is separated by a new
line character.


| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | From visual row index. |
| startCol | `number` | From visual column index. |
| endRow | `number` | To visual row index. |
| endCol | `number` | To visual column index. |



### getCurrentThemeName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5311

:::

_core.getCurrentThemeName() ⇒ string | undefined_

Gets the name of the currently used theme.

**Since**: 15.0.0  

**Returns**: `string` | `undefined` - The name of the currently used theme.  

### getData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2581

:::

_core.getData([row], [column], [row2], [column2]) ⇒ Array&lt;Array&gt;_

Returns the current data object (the same one that was passed by `data` configuration option or `loadData` method,
unless some modifications have been applied (i.e. Sequence of rows/columns was changed, some row/column was skipped).
If that's the case - use the [Core#getSourceData](@/api/core.md#getsourcedata) method.).

Optionally you can provide cell range by defining `row`, `column`, `row2`, `column2` to get only a fragment of table data.

**Example**  
```js
// Get all data (in order how it is rendered in the table).
hot.getData();
// Get data fragment (from top-left 0, 0 to bottom-right 3, 3).
hot.getData(3, 3);
// Get data fragment (from top-left 2, 1 to bottom-right 3, 3).
hot.getData(2, 1, 3, 3);
```

| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From visual row index. |
| [column] | `number` | `optional` From visual column index. |
| [row2] | `number` | `optional` To visual row index. |
| [column2] | `number` | `optional` To visual column index. |


**Returns**: `Array<Array>` - Array with the data.  

### getDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3185

:::

_core.getDataAtCell(row, column) ⇒ \*_

Returns the cell value at `row`, `column`.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `*` - Data at cell.  

### getDataAtCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3216

:::

_core.getDataAtCol(column) ⇒ Array_

Returns array of column values from the data source.

__Note__: If columns were reordered or sorted, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of cell values.  

### getDataAtProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3244

:::

_core.getDataAtProp(prop) ⇒ Array_

Given the object property name (e.g. `'first.name'` or `'0'`), returns an array of column's values from the table data.
You can also provide a column index as the first argument.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Property name or physical column index. |


**Returns**: `Array` - Array of cell values.  

### getDataAtRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3441

:::

_core.getDataAtRow(row) ⇒ Array_

Returns a single row of the data.

__Note__: If rows were reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `Array` - Array of row's cell data.  

### getDataAtRowProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3201

:::

_core.getDataAtRowProp(row, prop) ⇒ \*_

Returns value at visual `row` and `prop` indexes.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| prop | `string` | Property name. |


**Returns**: `*` - Cell value.  

### getDataType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3462

:::

_core.getDataType(rowFrom, columnFrom, rowTo, columnTo) ⇒ string_

Returns a data type defined in the Handsontable settings under the `type` key ([Options#type](@/api/options.md#type)).
If there are cells with different types in the selected range, it returns `'mixed'`.

__Note__: If data is reordered, sorted or trimmed, the currently visible order will be used.


| Param | Type | Description |
| --- | --- | --- |
| rowFrom | `number` | From visual row index. |
| columnFrom | `number` | From visual column index. |
| rowTo | `number` | To visual row index. |
| columnTo | `number` | To visual column index. |


**Returns**: `string` - Cell type (e.q: `'mixed'`, `'text'`, `'numeric'`, `'autocomplete'`).  

### getDirectionFactor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L337

:::

_core.getDirectionFactor() ⇒ number_

Returns 1 for LTR; -1 for RTL. Useful for calculations.

**Since**: 12.0.0  

**Returns**: `number` - Returns 1 for LTR; -1 for RTL.  

### getFirstFullyVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5013

:::

_core.getFirstFullyVisibleColumn() ⇒ number | null_

Returns the first fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstFullyVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4987

:::

_core.getFirstFullyVisibleRow() ⇒ number | null_

Returns the first fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstPartiallyVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5065

:::

_core.getFirstPartiallyVisibleColumn() ⇒ number | null_

Returns the first partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstPartiallyVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5039

:::

_core.getFirstPartiallyVisibleRow() ⇒ number | null_

Returns the first partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getFirstRenderedVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4963

:::

_core.getFirstRenderedVisibleColumn() ⇒ number | null_

Returns the first rendered column in the DOM (usually, it is not visible in the table's viewport).

**Since**: 14.6.0  


### getFirstRenderedVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4939

:::

_core.getFirstRenderedVisibleRow() ⇒ number | null_

Returns the first rendered row in the DOM (usually, it is not visible in the table's viewport).

**Since**: 14.6.0  


### getFocusManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5464

:::

_core.getFocusManager() ⇒ FocusManager_

Return the Focus Manager responsible for managing the browser's focus in the table.

**Since**: 14.0.0  


### getFocusScopeManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5476

:::

_core.getFocusScopeManager() ⇒ [FocusScopeManager](@/api/focusScopeManager.md)_

Returns the Focus Scope Manager. The module allows to register focus scopes for different parts of the grid
e.g. for dialogs, pagination, and other plugins that have own UI elements and need separate context.

**Since**: 16.2.0  
**Example**  
```js
hot.getFocusScopeManager().registerScope('myPluginName', containerElement, {
  shortcutsContextName: 'plugin:myPluginName',
  onActivate: (focusSource) => {
    // Focus the internal focusable element within the plugin UI element
    // depends on the activation focus source.
  },
});
```

**Returns**: [`FocusScopeManager`](@/api/focusScopeManager.md) - Instance of [FocusScopeManager](@/api/focusScopeManager.md)  

### getInstance
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5120

:::

_core.getInstance() ⇒ [Handsontable](@/api/core.md)_

Returns the Handsontable instance.


**Returns**: [`Handsontable`](@/api/core.md) - The Handsontable instance.  

### getLastFullyVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5026

:::

_core.getLastFullyVisibleColumn() ⇒ number | null_

Returns the last fully visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastFullyVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5000

:::

_core.getLastFullyVisibleRow() ⇒ number | null_

Returns the last fully visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastPartiallyVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5078

:::

_core.getLastPartiallyVisibleColumn() ⇒ number | null_

Returns the last partially visible column in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastPartiallyVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5052

:::

_core.getLastPartiallyVisibleRow() ⇒ number | null_

Returns the last partially visible row in the table viewport. When the table has overlays the method returns
the first row of the main table that is not overlapped by overlay.

**Since**: 14.6.0  


### getLastRenderedVisibleColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4975

:::

_core.getLastRenderedVisibleColumn() ⇒ number | null_

Returns the last rendered column in the DOM (usually, it is not visible in the table's viewport).

**Since**: 14.6.0  


### getLastRenderedVisibleRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4951

:::

_core.getLastRenderedVisibleRow() ⇒ number | null_

Returns the last rendered row in the DOM (usually, it is not visible in the table's viewport).

**Since**: 14.6.0  


### getPlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5091

:::

_core.getPlugin(pluginName) ⇒ [BasePlugin](@/api/basePlugin.md) | undefined_

Returns plugin instance by provided its name.


| Param | Type | Description |
| --- | --- | --- |
| pluginName | `string` | The plugin name. |


**Returns**: [`BasePlugin`](@/api/basePlugin.md) | `undefined` - The plugin instance or undefined if there is no plugin.  

### getRowHeader
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3925

:::

_core.getRowHeader([row]) ⇒ Array | string | number_

Returns an array of row headers' values (if they are enabled). If param `row` was given, it returns the header of the given row as a string.

**Emits**: [`Hooks#event:modifyRowHeader`](@/api/hooks.md#modifyrowheader)  

| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` Visual row index. |


**Returns**: `Array` | `string` | `number` - Array of header values / single header value.  

### getRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4191

:::

_core.getRowHeight(row, [source]) ⇒ number | undefined_

Returns a row's height, as recognized by Handsontable.

Depending on your configuration, the method returns (in order of priority):
  1. The row height set by the [`ManualRowResize`](@/api/manualRowResize.md) plugin
    (if the plugin is enabled).
  2. The row height set by the [`rowHeights`](@/api/options.md#rowheights) configuration option
    (if the option is set).
  3. The row height as measured in the DOM by the [`AutoRowSize`](@/api/autoRowSize.md) plugin
    (if the plugin is enabled).
  4. `undefined`, if neither [`ManualRowResize`](@/api/manualRowResize.md),
    nor [`rowHeights`](@/api/options.md#rowheights),
    nor [`AutoRowSize`](@/api/autoRowSize.md) is used.

The height returned includes 1 px of the row's bottom border.

Mind that this method is different from the
[`getRowHeight()`](@/api/autoRowSize.md#getrowheight) method
of the [`AutoRowSize`](@/api/autoRowSize.md) plugin.

**Emits**: [`Hooks#event:modifyRowHeight`](@/api/hooks.md#modifyrowheight)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | A visual row index. |
| [source] | `string` | `optional` The source of the call. |


**Returns**: `number` | `undefined` - The height of the specified row, in pixels.  

### getSchema
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2658

:::

_core.getSchema() ⇒ object_

Returns schema provided by constructor settings. If it doesn't exist then it returns the schema based on the data
structure in the first row.


**Returns**: `object` - Schema object.  

### getSelected
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1923

:::

_core.getSelected() ⇒ Array&lt;Array&gt; | undefined_

Returns indexes of the currently selected cells as an array of arrays `[[startRow, startCol, endRow, endCol],...]`.

Start row and start column are the coordinates of the active cell (where the selection was started).

The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
Additionally to collect the coordinates of the currently selected area (as it was previously done by the method)
you need to use `getSelectedLast` method.


**Returns**: `Array<Array>` | `undefined` - An array of arrays of the selection's coordinates.  

### getSelectedLast
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1942

:::

_core.getSelectedLast() ⇒ Array | undefined_

Returns the last coordinates applied to the table as a an array `[startRow, startCol, endRow, endCol]`.

**Since**: 0.36.0  

**Returns**: `Array` | `undefined` - An array of the selection's coordinates.  

### getSelectedRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1982

:::

_core.getSelectedRange() ⇒ Array&lt;[CellRange](@/api/cellRange.md)&gt; | undefined_

Returns the current selection as an array of CellRange objects.

The version 0.36.0 adds a non-consecutive selection feature. Since this version, the method returns an array of arrays.
Additionally to collect the coordinates of the active selected area (as it was previously done by the method)
you need to use `getSelectedRangeActive()` method.


**Returns**: <code>Array<[CellRange](@/api/cellRange.md)></code> | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSelectedRangeActive
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1961

:::

_core.getSelectedRangeActive() ⇒ Array&lt;number&gt; | undefined_

Returns the range coordinates of the active selection layer as an array. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: `Array<number>` | `undefined` - Selected range as an array of coordinates or `undefined` if there is no selection.  

### getSelectedRangeActive
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2018

:::

_core.getSelectedRangeActive() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the range coordinates of the active selection layer. Active selection layer is the layer that
has visible focus highlight.

**Since**: 16.1.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSelectedRangeLast
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1999

:::

_core.getSelectedRangeLast() ⇒ [CellRange](@/api/cellRange.md) | undefined_

Returns the last coordinates applied to the table as a CellRange object.

**Since**: 0.36.0  

**Returns**: [`CellRange`](@/api/cellRange.md) | `undefined` - Selected range object or `undefined` if there is no selection.  

### getSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2934

:::

_core.getSettings() ⇒ TableMeta_

Returns the object settings.


**Returns**: `TableMeta` - Object containing the current table settings.  

### getShortcutManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5447

:::

_core.getShortcutManager() ⇒ [ShortcutManager](@/api/shortcutManager.md)_

Returns instance of a manager responsible for handling shortcuts stored in some contexts. It run actions after
pressing key combination in active Handsontable instance.

**Since**: 12.0.0  

**Returns**: [`ShortcutManager`](@/api/shortcutManager.md) - Instance of [ShortcutManager](@/api/shortcutManager.md)  

### getSourceData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3270

:::

_core.getSourceData([row], [column], [row2], [column2]) ⇒ Array&lt;Array&gt; | Array&lt;object&gt;_

Returns a clone of the source data object.
Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
fragment of the table data.

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.

__Note__: This method may return incorrect values for cells that contain
[formulas](@/guides/formulas/formula-calculation/formula-calculation.md). This is because `getSourceData()`
operates on source data ([physical indexes](@/api/indexMapper.md)),
whereas formulas operate on visual data (visual indexes).


| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From physical row index. |
| [column] | `number` | `optional` From physical column index (or visual index, if data type is an array of objects). |
| [row2] | `number` | `optional` To physical row index. |
| [column2] | `number` | `optional` To physical column index (or visual index, if data type is an array of objects). |


**Returns**: `Array<Array>` | `Array<object>` - The table data.  

### getSourceDataArray
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3304

:::

_core.getSourceDataArray([row], [column], [row2], [column2]) ⇒ Array_

Returns the source data object as an arrays of arrays format even when source data was provided in another format.
Optionally you can provide a cell range by using the `row`, `column`, `row2`, `column2` arguments, to get only a
fragment of the table data.

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.


| Param | Type | Description |
| --- | --- | --- |
| [row] | `number` | `optional` From physical row index. |
| [column] | `number` | `optional` From physical column index (or visual index, if data type is an array of objects). |
| [row2] | `number` | `optional` To physical row index. |
| [column2] | `number` | `optional` To physical column index (or visual index, if data type is an array of objects). |


**Returns**: `Array` - An array of arrays.  

### getSourceDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3427

:::

_core.getSourceDataAtCell(row, column) ⇒ \*_

Returns a single value from the data source.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |
| column | `number` | Visual column index. |


**Returns**: `*` - Cell data.  

### getSourceDataAtCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3333

:::

_core.getSourceDataAtCol(column) ⇒ Array_

Returns an array of column values from the data source.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `Array` - Array of the column's cell values.  

### getSourceDataAtRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3412

:::

_core.getSourceDataAtRow(row) ⇒ Array | object_

Returns a single row of the data (array or object, depending on what data format you use).

__Note__: This method does not participate in data transformation. If the visual data of the table is reordered,
sorted or trimmed only physical indexes are correct.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |


**Returns**: `Array` | `object` - Single row of data.  

### getTableHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5323

:::

_core.getTableHeight() ⇒ number_

Gets the table's root container element height.

**Since**: 16.0.0  


### getTableWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5335

:::

_core.getTableWidth() ⇒ number_

Gets the table's root container element width.

**Since**: 16.0.0  


### getTranslatedPhrase
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5238

:::

_core.getTranslatedPhrase(dictionaryKey, extraArguments) ⇒ string_

Get language phrase for specified dictionary key.

**Since**: 0.35.0  

| Param | Type | Description |
| --- | --- | --- |
| dictionaryKey | `string` | Constant which is dictionary key. |
| extraArguments | `*` | Arguments which will be handled by formatters. |



### getValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2907

:::

_core.getValue() ⇒ \*_

Gets the value of the currently focused cell.

For column headers and row headers, returns `null`.


**Returns**: `*` - The value of the focused cell.  

### hasColHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3972

:::

_core.hasColHeaders() ⇒ boolean_

Returns information about if this table is configured to display column headers.


**Returns**: `boolean` - `true` if the instance has the column headers enabled, `false` otherwise.  

### hasHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5152

:::

_core.hasHook(key) ⇒ boolean_

Check if for a specified hook name there are added listeners (only for this Handsontable instance). All available
hooks you will find [Hooks](@/api/hooks.md).

**See**: [Hooks#has](@/api/hooks.md#has)  
**Example**  
```js
const hasBeforeInitListeners = hot.hasHook('beforeInit');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |



### hasRowHeaders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3961

:::

_core.hasRowHeaders() ⇒ boolean_

Returns information about if this table is configured to display row headers.


**Returns**: `boolean` - `true` if the instance has the row headers enabled, `false` otherwise.  

### isColumnModificationAllowed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3693

:::

_core.isColumnModificationAllowed() ⇒ boolean_

Checks if your [data format](@/guides/getting-started/binding-to-data/binding-to-data.md#compatible-data-types)
and [configuration options](@/guides/getting-started/configuration-options/configuration-options.md)
allow for changing the number of columns.

Returns `false` when your data is an array of objects,
or when you use the [`columns`](@/api/options.md#columns) option.
Otherwise, returns `true`.



### isEmptyCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4405

:::

_core.isEmptyCol(column) ⇒ boolean_

Check if all cells in the the column declared by the `column` argument are empty.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Column index. |


**Returns**: `boolean` - `true` if the column at the given `col` is empty, `false` otherwise.  

### isEmptyRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4393

:::

_core.isEmptyRow(row) ⇒ boolean_

Check if all cells in the row declared by the `row` argument are empty.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `boolean` - `true` if the row at the given `row` is empty, `false` otherwise.  

### isExecutionSuspended
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2228

:::

_core.isExecutionSuspended() ⇒ boolean_

Checks if the table indexes recalculation process was suspended. See explanation
in [Core#suspendExecution](@/api/core.md#suspendexecution).

**Since**: 8.3.0  


### isListening
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1836

:::

_core.isListening() ⇒ boolean_

Returns `true` if the current Handsontable instance is listening to keyboard input on document body.


**Returns**: `boolean` - `true` if the instance is listening, `false` otherwise.  

### isLtr
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L325

:::

_core.isLtr() ⇒ boolean_

Checks if the grid is rendered using the left-to-right layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if LTR.  

### isRedoAvailable <span class="tag-deprecated">Deprecated</span>
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/undoRedo/undoRedo.js#L370

:::

_core.isRedoAvailable() ⇒ boolean_

::: warning
This method is deprecated and it will be removed from the Core API in the future. Please use the method from the [&#x60;UndoRedo&#x60;](@/api/undoRedo.md#isredoavailable) plugin.
:::


### isRenderSuspended
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2081

:::

_core.isRenderSuspended() ⇒ boolean_

Checks if the table rendering process was suspended. See explanation in [Core#suspendRender](@/api/core.md#suspendrender).

**Since**: 8.3.0  


### isRtl
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L313

:::

_core.isRtl() ⇒ boolean_

Checks if the grid is rendered using the right-to-left layout direction.

**Since**: 12.0.0  

**Returns**: `boolean` - True if RTL.  

### isUndoAvailable <span class="tag-deprecated">Deprecated</span>
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/undoRedo/undoRedo.js#L359

:::

_core.isUndoAvailable() ⇒ boolean_

::: warning
This method is deprecated and it will be removed from the Core API in the future. Please use the method from the [&#x60;UndoRedo&#x60;](@/api/undoRedo.md#isundoavailable) plugin.
:::


### listen
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1801

:::

_core.listen()_

Listen to the keyboard input on document body. This allows Handsontable to capture keyboard events and respond
in the right way.

**Emits**: [`Hooks#event:afterListen`](@/api/hooks.md#afterlisten)  


### loadData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2478

:::

_core.loadData(data, [source])_

The `loadData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

Additionally, the `loadData()` method:
- Resets cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Resets rows' states (e.g. row order)
- Resets columns' states (e.g. column order)

To replace Handsontable's [`data`](@/api/options.md#data) without resetting states, use the [`updateData()`](#updatedata) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Emits**: [`Hooks#event:beforeLoadData`](@/api/hooks.md#beforeloaddata), [`Hooks#event:afterLoadData`](@/api/hooks.md#afterloaddata), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  

| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| [source] | `string` | `optional` The source of the `loadData()` call |



### populateFromArray
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1864

:::

_core.populateFromArray(row, column, input, [endRow], [endCol], [source], [method]) ⇒ object | undefined_

Populates cells at position with 2D input array (e.g. `[[1, 2], [3, 4]]`). Use `endRow`, `endCol` when you
want to cut input when a certain row is reached.

The `populateFromArray()` method can't change [`readOnly`](@/api/options.md#readonly) cells.

Optional `method` argument has the same effect as pasteMode option (see [Options#pasteMode](@/api/options.md#pastemode)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Start visual row index. |
| column | `number` |  | Start visual column index. |
| input | `Array` |  | 2d array. |
| [endRow] | `number` |  | `optional` End visual row index (use when you want to cut input when certain row is reached). |
| [endCol] | `number` |  | `optional` End visual column index (use when you want to cut input when certain column is reached). |
| [source] | `string` | <code>&quot;populateFromArray&quot;</code> | `optional` Used to identify this call in the resulting events (beforeChange, afterChange). |
| [method] | `string` | <code>&quot;overwrite&quot;</code> | `optional` Populate method, possible values: `'shift_down'`, `'shift_right'`, `'overwrite'`. |


**Returns**: `object` | `undefined` - Ending td in pasted area (only if any cell was changed).  

### propToCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3121

:::

_core.propToCol(prop) ⇒ number_

Returns column index that corresponds with the given property.


| Param | Type | Description |
| --- | --- | --- |
| prop | `string` <br/> `number` | Property name or physical column index. |


**Returns**: `number` - Visual column index.  

### redo <span class="tag-deprecated">Deprecated</span>
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/undoRedo/undoRedo.js#L349

:::

_core.redo()_

::: warning
This method is deprecated and it will be removed from the Core API in the future. Please use the method from the [&#x60;UndoRedo&#x60;](@/api/undoRedo.md#redo) plugin.
:::


### refreshDimensions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2388

:::

_core.refreshDimensions()_

Updates dimensions of the table. The method compares previous dimensions with the current ones and updates accordingly.

**Emits**: [`Hooks#event:beforeRefreshDimensions`](@/api/hooks.md#beforerefreshdimensions), [`Hooks#event:afterRefreshDimensions`](@/api/hooks.md#afterrefreshdimensions)  


### removeCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3517

:::

_core.removeCellMeta(row, column, key)_

Remove a property defined by the `key` argument from the cell meta object for the provided `row` and `column` coordinates.

**Emits**: [`Hooks#event:beforeRemoveCellMeta`](@/api/hooks.md#beforeremovecellmeta), [`Hooks#event:afterRemoveCellMeta`](@/api/hooks.md#afterremovecellmeta)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | Property name. |



### removeHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5193

:::

_core.removeHook(key, callback)_

Removes the hook listener previously registered with [Core#addHook](@/api/core.md#addhook).

**See**: [Hooks#remove](@/api/hooks.md#remove)  
**Example**  
```js
hot.removeHook('beforeInit', myCallback);
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |
| callback | `function` | Reference to the function which has been registered using [Core#addHook](@/api/core.md#addhook). |



### render
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2171

:::

_core.render()_

Rerender the table. Calling this method starts the process of recalculating, redrawing and applying the changes
to the DOM. While rendering the table all cell renderers are recalled.

Calling this method manually is not recommended. Handsontable tries to render itself by choosing the most
optimal moments in its lifecycle.



### resumeExecution
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2269

:::

_core.resumeExecution([forceFlushChanges])_

Resumes the execution process. In combination with the [Core#suspendExecution](@/api/core.md#suspendexecution)
method it allows aggregating the table logic changes after which the cache is
updated. Resuming the state automatically invokes the table cache updating process.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceFlushChanges] | `boolean` | <code>false</code> | `optional` If `true`, the table internal data cache is recalculated after the execution of the batched operations. For nested [Core#batchExecution](@/api/core.md#batchexecution) calls, it can be desire to recalculate the table after each batch. |



### resumeRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2131

:::

_core.resumeRender()_

Resumes the rendering process. In combination with the [Core#suspendRender](@/api/core.md#suspendrender)
method it allows aggregating the table render cycles triggered by API calls or UI
actions (or both) and calls the "render" once in the end. When the table is in
the suspend state, most operations will have no visual effect until the rendering
state is resumed. Resuming the state automatically invokes the table rendering.

The method is intended to be used by advanced users. Suspending the rendering
process could cause visual glitches when wrongly implemented.

Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendRender();
hot.alter('insert_row_above', 5, 45);
hot.alter('insert_col_start', 10, 40);
hot.setDataAtCell(1, 1, 'John');
hot.setDataAtCell(2, 2, 'Mark');
hot.setDataAtCell(3, 3, 'Ann');
hot.setDataAtCell(4, 4, 'Sophia');
hot.setDataAtCell(5, 5, 'Mia');
hot.selectCell(0, 0);
hot.resumeRender(); // It re-renders the table internally
```


### runHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5211

:::

_core.runHooks(key, [p1], [p2], [p3], [p4], [p5], [p6]) ⇒ \*_

Run the callbacks for the hook provided in the `key` argument using the parameters given in the other arguments.

**See**: [Hooks#run](@/api/hooks.md#run)  
**Example**  
```js
// Run built-in hook
hot.runHooks('beforeInit');
// Run custom hook
hot.runHooks('customAction', 10, 'foo');
```

| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Hook name. |
| [p1] | `*` | `optional` Argument passed to the callback. |
| [p2] | `*` | `optional` Argument passed to the callback. |
| [p3] | `*` | `optional` Argument passed to the callback. |
| [p4] | `*` | `optional` Argument passed to the callback. |
| [p5] | `*` | `optional` Argument passed to the callback. |
| [p6] | `*` | `optional` Argument passed to the callback. |



### scrollToFocusedCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4793

:::

_core.scrollToFocusedCell([callback]) ⇒ boolean_

Scrolls the viewport to coordinates specified by the currently focused cell.

**Emits**: [`Hooks#event:afterScroll`](@/api/hooks.md#afterscroll)  
**Since**: 14.0.0  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | `function` | `optional` The callback function to call after the viewport is scrolled. |


**Returns**: `boolean` - `true` if the viewport was scrolled, `false` otherwise.  

### scrollViewportTo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4677

:::

_core.scrollViewportTo(options, [callback]) ⇒ boolean_

Scroll viewport to coordinates specified by the `row` and/or `col` object properties.

```js
// scroll the viewport to the visual row index (leave the horizontal scroll untouched)
hot.scrollViewportTo({ row: 50 });

// scroll the viewport to the passed coordinates so that the cell at 50, 50 will be snapped to
// the bottom-end table's edge.
hot.scrollViewportTo({
  row: 50,
  col: 50,
  verticalSnap: 'bottom',
  horizontalSnap: 'end',
}, () => {
  // callback function executed after the viewport is scrolled
});
```


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | `object` |  | A dictionary containing the following parameters: |
| [options.row] | `number` |  | `optional` Specifies the number of visual rows along the Y axis to scroll the viewport. |
| [options.col] | `number` |  | `optional` Specifies the number of visual columns along the X axis to scroll the viewport. |
| [options.verticalSnap] | `'top'` <br/> `'bottom'` |  | `optional` Determines to which edge of the table the viewport will be scrolled based on the passed coordinates. This option is a string which must take one of the following values: - `top`: The viewport will be scrolled to a row in such a way that it will be positioned on the top of the viewport; - `bottom`: The viewport will be scrolled to a row in such a way that it will be positioned on the bottom of the viewport; - If the property is not defined the vertical auto-snapping is enabled. Depending on where the viewport is scrolled from, a row will be positioned at the top or bottom of the viewport. |
| [options.horizontalSnap] | `'start'` <br/> `'end'` |  | `optional` Determines to which edge of the table the viewport will be scrolled based on the passed coordinates. This option is a string which must take one of the following values: - `start`: The viewport will be scrolled to a column in such a way that it will be positioned on the start (left edge or right, if the layout direction is set to `rtl`) of the viewport; - `end`: The viewport will be scrolled to a column in such a way that it will be positioned on the end (right edge or left, if the layout direction is set to `rtl`) of the viewport; - If the property is not defined the horizontal auto-snapping is enabled. Depending on where the viewport is scrolled from, a column will be positioned at the start or end of the viewport. |
| [options.considerHiddenIndexes] | `boolean` | <code>true</code> | `optional` If `true`, we handle visual indexes, otherwise we handle only indexes which may be rendered when they are in the viewport (we don't consider hidden indexes as they aren't rendered). |
| [callback] | `function` |  | `optional` The callback function to call after the viewport is scrolled. |


**Returns**: `boolean` - `true` if viewport was scrolled, `false` otherwise.  

### selectAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4621

:::

_core.selectAll([includeRowHeaders], [includeColumnHeaders], [options])_

Select all cells in the table excluding headers and corner elements.

The previous selection is overwritten.

```js
// Select all cells in the table along with row headers, including all headers and the corner cell.
// Doesn't select column headers and corner elements.
hot.selectAll();

// Select all cells in the table, including row headers but excluding the corner cell and column headers.
hot.selectAll(true, false);

// Select all cells in the table, including all headers and the corner cell, but move the focus.
// highlight to position 2, 1
hot.selectAll(-2, -1, {
   focusPosition: { row: 2, col: 1 }
});

// Select all cells in the table, without headers and corner elements.
hot.selectAll(false);
```

**Since**: 0.38.2  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [includeRowHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the row headers, `false` otherwise. |
| [includeColumnHeaders] | `boolean` | <code>false</code> | `optional` `true` If the selection should include the column headers, `false` otherwise. |
| [options] | `object` |  | `optional` Additional object with options. Since 14.0.0 |
| [options.focusPosition] | `Object` <br/> `boolean` |  | `optional` The argument allows changing the cell/header focus position. The value takes an object with a `row` and `col` properties from -N to N, where negative values point to the headers and positive values point to the cell range. If `false`, the focus position won't be changed. Example: ```js hot.selectAll(0, 0, { focusPosition: { row: 0, col: 1 }, disableHeadersHighlight: true }) ``` |
| [options.disableHeadersHighlight] | `boolean` |  | `optional` If `true`, disables highlighting the headers even when the logical coordinates points on them. |



### selectCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4417

:::

_core.selectCell(row, column, [endRow], [endColumn], [scrollToCell], [changeListener]) ⇒ boolean_

Select a single cell, or a single range of adjacent cells.

To select a cell, pass its visual row and column indexes, for example: `selectCell(2, 4)`.

To select a range, pass the visual indexes of the first and last cell in the range, for example: `selectCell(2, 4, 3, 5)`.

If your columns have properties, you can pass those properties' values instead of column indexes, for example: `selectCell(2, 'first_name')`.

By default, `selectCell()` also:
 - Scrolls the viewport to the newly-selected cells.
 - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).

**Example**  
```js
// select a single cell
hot.selectCell(2, 4);

// select a range of cells
hot.selectCell(2, 4, 3, 5);

// select a single cell, using a column property
hot.selectCell(2, 'first_name');

// select a range of cells, using column properties
hot.selectCell(2, 'first_name', 3, 'last_name');

// select a range of cells, without scrolling to them
hot.selectCell(2, 4, 3, 5, false);

// select a range of cells, without switching the keyboard focus to Handsontable
hot.selectCell(2, 4, 3, 5, null, false);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | A visual row index. |
| column | `number` <br/> `string` |  | A visual column index (`number`), or a column property's value (`string`). |
| [endRow] | `number` |  | `optional` If selecting a range: the visual row index of the last cell in the range. |
| [endColumn] | `number` <br/> `string` |  | `optional` If selecting a range: the visual column index (or a column property's value) of the last cell in the range. |
| [scrollToCell] | `boolean` | <code>true</code> | `optional` `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport. |
| [changeListener] | `boolean` | <code>true</code> | `optional` `true`: switch the keyboard focus to Handsontable. `false`: keep the previous keyboard focus. |


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed.  

### selectCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4469

:::

_core.selectCells(coords, [scrollToCell], [changeListener]) ⇒ boolean_

Select multiple cells or ranges of cells, adjacent or non-adjacent.

You can pass one of the below:
- An array of arrays (which matches the output of Handsontable's [`getSelected()`](#getselected) method).
- An array of [`CellRange`](@/api/cellRange.md) objects (which matches the output of Handsontable's [`getSelectedRange()`](#getselectedrange) method).

To select multiple cells, pass the visual row and column indexes of each cell, for example: `hot.selectCells([[1, 1], [5, 5]])`.

To select multiple ranges, pass the visual indexes of the first and last cell in each range, for example: `hot.selectCells([[1, 1, 2, 2], [6, 2, 0, 2]])`.

If your columns have properties, you can pass those properties' values instead of column indexes, for example: `hot.selectCells([[1, 'first_name'], [5, 'last_name']])`.

By default, `selectCell()` also:
 - Scrolls the viewport to the newly-selected cells.
 - Switches the keyboard focus to Handsontable (by calling Handsontable's [`listen()`](#listen) method).

**Since**: 0.38.0  
**Example**  
```js
// select non-adjacent cells
hot.selectCells([[1, 1], [5, 5], [10, 10]]);

// select non-adjacent ranges of cells
hot.selectCells([[1, 1, 2, 2], [10, 10, 20, 20]]);

// select cells and ranges of cells
hot.selectCells([[1, 1, 2, 2], [3, 3], [6, 2, 0, 2]]);

// select cells, using column properties
hot.selectCells([[1, 'id', 2, 'first_name'], [3, 'full_name'], [6, 'last_name', 0, 'first_name']]);

// select multiple ranges, using an array of `CellRange` objects
const selected = hot.getSelectedRange();

selected[0].from.row = 0;
selected[0].from.col = 0;
selected[0].to.row = 5;
selected[0].to.col = 5;

selected[1].from.row = 10;
selected[1].from.col = 10;
selected[1].to.row = 20;
selected[1].to.col = 20;

hot.selectCells(selected);
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `Array<Array>` <br/> `Array<CellRange>` |  | Visual coordinates, passed either as an array of arrays (`[[rowStart, columnStart, rowEnd, columnEnd], ...]`) or as an array of [`CellRange`](@/api/cellRange.md) objects. |
| [scrollToCell] | `boolean` | <code>true</code> | `optional` `true`: scroll the viewport to the newly-selected cells. `false`: keep the previous viewport. |
| [changeListener] | `boolean` | <code>true</code> | `optional` `true`: switch the keyboard focus to Handsontable. `false`: keep the previous keyboard focus. |


**Returns**: `boolean` - `true`: the selection was successful, `false`: the selection failed.  

### selectColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4541

:::

_core.selectColumns(startColumn, [endColumn], [focusPosition]) ⇒ boolean_

Select column specified by `startColumn` visual index, column property or a range of columns finishing at `endColumn`.

**Since**: 0.38.0  
**Example**  
```js
// Select column using visual index.
hot.selectColumns(1);
// Select column using column property.
hot.selectColumns('id');
// Select range of columns using visual indexes.
hot.selectColumns(1, 4);
// Select range of columns using visual indexes and mark the first header as highlighted.
hot.selectColumns(1, 2, -1);
// Select range of columns using visual indexes and mark the second cell as highlighted.
hot.selectColumns(2, 1, 1);
// Select range of columns using visual indexes and move the focus position somewhere in the middle of the range.
hot.selectColumns(2, 5, { row: 2, col: 3 });
// Select range of columns using column properties.
hot.selectColumns('id', 'last_name');
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startColumn | `number` |  | The visual column index from which the selection starts. |
| [endColumn] | `number` | <code>startColumn</code> | `optional` The visual column index to which the selection finishes. If `endColumn` is not defined the column defined by `startColumn` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position horizontally. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise.  

### selectRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L4578

:::

_core.selectRows(startRow, [endRow], [focusPosition]) ⇒ boolean_

Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.

**Since**: 0.38.0  
**Example**  
```js
// Select row using visual index.
hot.selectRows(1);
// select a range of rows, using visual indexes.
hot.selectRows(1, 4);
// select a range of rows, using visual indexes, and mark the header as highlighted.
hot.selectRows(1, 2, -1);
// Select range of rows using visual indexes and mark the second cell as highlighted.
hot.selectRows(2, 1, 1);
// Select range of rows using visual indexes and move the focus position somewhere in the middle of the range.
hot.selectRows(2, 5, { row: 2, col: 3 });
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| startRow | `number` |  | The visual row index from which the selection starts. |
| [endRow] | `number` | <code>startRow</code> | `optional` The visual row index to which the selection finishes. If `endRow` is not defined the row defined by `startRow` will be selected. |
| [focusPosition] | `number` <br/> `Object` <br/> `CellCoords` | <code>0</code> | `optional` The argument allows changing the cell/header focus position. The value can take visual row index from -N to N, where negative values point to the headers and positive values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus position vertically. |


**Returns**: `boolean` - `true` if selection was successful, `false` otherwise.  

### setCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3590

:::

_core.setCellMeta(row, column, key, value)_

Sets a property defined by the `key` property to the meta object of a cell corresponding to params `row` and `column`.

**Emits**: [`Hooks#event:beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta), [`Hooks#event:afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| key | `string` | Property name. |
| value | `string` | Property value. |



### setCellMetaObject
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3573

:::

_core.setCellMetaObject(row, column, prop)_

Set cell meta data object defined by `prop` to the corresponding params `row` and `column`.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| prop | `object` | Meta object. |



### setDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1698

:::

_core.setDataAtCell(row, [column], [value], [source])_

Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
`[[row, col, value],...]` as the first argument.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, col, value],...]`. |
| [column] | `number` | `optional` Visual column index. |
| [value] | `string` | `optional` New value. |
| [source] | `string` | `optional` String that identifies how this change will be described in the changes array (useful in afterChange or beforeChange callback). Set to 'edit' if left empty. |



### setDataAtRowProp
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1756

:::

_core.setDataAtRowProp(row, prop, value, [source])_

Set new value to a cell. To change many cells at once (recommended way), pass an array of `changes` in format
`[[row, prop, value],...]` as the first argument.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Visual row index or array of changes in format `[[row, prop, value], ...]`. |
| prop | `string` | Property name or the source string (e.g. `'first.name'` or `'0'`). |
| value | `string` | Value to be set. |
| [source] | `string` | `optional` String that identifies how this change will be described in changes array (useful in onChange callback). |



### setSourceDataAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3347

:::

_core.setSourceDataAtCell(row, column, value, [source])_

Set the provided value in the source data set at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` <br/> `Array` | Physical row index or array of changes in format `[[row, prop, value], ...]`. |
| column | `number` <br/> `string` | Physical column index / prop name. |
| value | `*` | The value to be set at the provided coordinates. |
| [source] | `string` | `optional` Source of the change as a string. |



### spliceCellsMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3543

:::

_core.spliceCellsMeta(visualIndex, [deleteAmount], [...cellMetaRows])_

Removes or adds one or more rows of the cell meta objects to the cell meta collections.

**Since**: 0.30.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| visualIndex | `number` |  | A visual index that specifies at what position to add/remove items. |
| [deleteAmount] | `number` | <code>0</code> | `optional` The number of items to be removed. If set to 0, no cell meta objects will be removed. |
| [...cellMetaRows] | `object` |  | `optional` The new cell meta row objects to be added to the cell meta collection. |



### spliceCol
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1893

:::

_core.spliceCol(column, index, amount, [...elements]) ⇒ Array_

Adds/removes data from the column. This method works the same as Array.splice for arrays.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Index of the column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `number` | `optional` The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array. |


**Returns**: `Array` - Returns removed portion of columns.  

### spliceRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1908

:::

_core.spliceRow(row, index, amount, [...elements]) ⇒ Array_

Adds/removes data from the row. This method works the same as Array.splice for arrays.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Index of column in which do you want to do splice. |
| index | `number` | Index at which to start changing the array. If negative, will begin that many elements from the end. |
| amount | `number` | An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed. |
| [...elements] | `number` | `optional` The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array. |


**Returns**: `Array` - Returns removed portion of rows.  

### suspendExecution
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2241

:::

_core.suspendExecution()_

Suspends the execution process. It's helpful to wrap the table logic changes
such as index changes into one call after which the cache is updated. As a result,
it improves the performance of wrapped operations.

The method is intended to be used by advanced users. Suspending the execution
process could cause visual glitches caused by not updated the internal table cache.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendExecution();
const filters = hot.getPlugin('filters');

filters.addCondition(2, 'contains', ['3']);
filters.filter();
hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });
hot.resumeExecution(); // It updates the cache internally
```


### suspendRender
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2093

:::

_core.suspendRender()_

Suspends the rendering process. It's helpful to wrap the table render
cycles triggered by API calls or UI actions (or both) and call the "render"
once in the end. As a result, it improves the performance of wrapped operations.
When the table is in the suspend state, most operations will have no visual
effect until the rendering state is resumed. Resuming the state automatically
invokes the table rendering. To make sure that after executing all operations,
the table will be rendered, it's highly recommended to use the [Core#batchRender](@/api/core.md#batchrender)
method or [Core#batch](@/api/core.md#batch), which additionally aggregates the logic execution
that happens behind the table.

The method is intended to be used by advanced users. Suspending the rendering
process could cause visual glitches when wrongly implemented.

Every [`suspendRender()`](@/api/core.md#suspendrender) call needs to correspond with one [`resumeRender()`](@/api/core.md#resumerender) call.
For example, if you call [`suspendRender()`](@/api/core.md#suspendrender) 5 times, you need to call [`resumeRender()`](@/api/core.md#resumerender) 5 times as well.

**Since**: 8.3.0  
**Example**  
```js
hot.suspendRender();
hot.alter('insert_row_above', 5, 45);
hot.alter('insert_col_start', 10, 40);
hot.setDataAtCell(1, 1, 'John');
hot.setDataAtCell(2, 2, 'Mark');
hot.setDataAtCell(3, 3, 'Ann');
hot.setDataAtCell(4, 4, 'Sophia');
hot.setDataAtCell(5, 5, 'Mia');
hot.selectCell(0, 0);
hot.resumeRender(); // It re-renders the table internally
```


### toHTML
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5252

:::

_core.toHTML() ⇒ string_

Converts instance into outerHTML of HTMLTableElement.

**Since**: 7.1.0  


### toPhysicalColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3172

:::

_core.toPhysicalColumn(column) ⇒ number_

Translate visual column index into physical.

This method is useful when you want to retrieve physical column index based on a visual index which can be
reordered, moved or trimmed.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |


**Returns**: `number` - Returns physical column index.  

### toPhysicalRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3159

:::

_core.toPhysicalRow(row) ⇒ number_

Translate visual row index into physical.

This method is useful when you want to retrieve physical row index based on a visual index which can be
reordered, moved or trimmed.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |


**Returns**: `number` - Returns physical row index.  

### toTableElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5262

:::

_core.toTableElement() ⇒ HTMLTableElement_

Converts instance into HTMLTableElement.

**Since**: 7.1.0  


### toVisualColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3146

:::

_core.toVisualColumn(column) ⇒ number_

Translate physical column index into visual.

This method is useful when you want to retrieve visual column index which can be reordered, moved or trimmed
based on a physical index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Physical column index. |


**Returns**: `number` - Returns visual column index.  

### toVisualRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3133

:::

_core.toVisualRow(row) ⇒ number_

Translate physical row index into visual.

This method is useful when you want to retrieve visual row index which can be reordered, moved or trimmed
based on a physical index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Physical row index. |


**Returns**: `number` - Returns visual row index.  

### undo <span class="tag-deprecated">Deprecated</span>
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/undoRedo/undoRedo.js#L340

:::

_core.undo()_

::: warning
This method is deprecated and it will be removed from the Core API in the future. Please use the method from the [&#x60;UndoRedo&#x60;](@/api/undoRedo.md#undo-2) plugin.
:::


### unlisten
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1822

:::

_core.unlisten()_

Stop listening to keyboard input on the document body. Calling this method makes the Handsontable inactive for
any keyboard events.



### updateData
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2430

:::

_core.updateData(data, [source])_

The `updateData()` method replaces Handsontable's [`data`](@/api/options.md#data) with a new dataset.

The `updateData()` method:
- Keeps cells' states (e.g. cells' [formatting](@/guides/cell-features/formatting-cells/formatting-cells.md) and cells' [`readOnly`](@/api/options.md#readonly) states)
- Keeps rows' states (e.g. row order)
- Keeps columns' states (e.g. column order)

To replace Handsontable's [`data`](@/api/options.md#data) and reset states, use the [`loadData()`](#loaddata) method.

Read more:
- [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md)
- [Saving data](@/guides/getting-started/saving-data/saving-data.md)

**Emits**: [`Hooks#event:beforeUpdateData`](@/api/hooks.md#beforeupdatedata), [`Hooks#event:afterUpdateData`](@/api/hooks.md#afterupdatedata), [`Hooks#event:afterChange`](@/api/hooks.md#afterchange)  
**Since**: 11.1.0  

| Param | Type | Description |
| --- | --- | --- |
| data | `Array` | An [array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays), or an [array of objects](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-objects), that contains Handsontable's data |
| [source] | `string` | `optional` The source of the `updateData()` call |



### updateSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L2670

:::

_core.updateSettings(settings, [init])_

Use it if you need to change configuration after initialization. The `settings` argument is an object containing the changed
settings, declared the same way as in the initial settings object.

__Note__, that although the `updateSettings` method doesn't overwrite the previously declared settings, it might reset
the settings made post-initialization. (for example - ignore changes made using the columnResize feature).

Since 8.0.0 passing `columns` or `data` inside `settings` objects will result in resetting states corresponding to rows and columns
(for example, row/column sequence, column width, row height, frozen columns etc.).

Since 12.0.0 passing `data` inside `settings` objects no longer results in resetting states corresponding to rows and columns
(for example, row/column sequence, column width, row height, frozen columns etc.).

**Emits**: [`Hooks#event:afterCellMetaReset`](@/api/hooks.md#aftercellmetareset), [`Hooks#event:afterUpdateSettings`](@/api/hooks.md#afterupdatesettings)  
**Example**  
```js
hot.updateSettings({
   contextMenu: true,
   colHeaders: true,
   fixedRowsTop: 2
});
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| settings | `object` |  | A settings object (see [Options](@/api/options.md)). Only provide the settings that are changed, not the whole settings object that was used for initialization. |
| [init] | `boolean` | <code>false</code> | `optional` Internally used for in initialization mode. |



### useTheme
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L5280

:::

_core.useTheme(themeName)_

Use the theme specified by the provided name.

**Since**: 15.0.0  

| Param | Type | Description |
| --- | --- | --- |
| themeName | `string` <br/> `boolean` <br/> `undefined` | The name of the theme to use. |



### validateCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L1566

:::

_core.validateCell(value, cellProperties, callback, source)_

Validate a single cell.


| Param | Type | Description |
| --- | --- | --- |
| value | `string` <br/> `number` | The value to validate. |
| cellProperties | `object` | The cell meta which corresponds with the value. |
| callback | `function` | The callback function. |
| source | `string` | The string that identifies source of the validation. |



### validateCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3791

:::

_core.validateCells([callback])_

Validates every cell in the data set,
using a [validator function](@/guides/cell-functions/cell-validator/cell-validator.md) configured for each cell.

Doesn't validate cells that are currently [trimmed](@/guides/rows/row-trimming/row-trimming.md),
[hidden](@/guides/rows/row-hiding/row-hiding.md), or [filtered](@/guides/columns/column-filter/column-filter.md),
as such cells are not included in the data set until you bring them back again.

After the validation, the `callback` function is fired, with the `valid` argument set to:
- `true` for valid cells
- `false` for invalid cells

**Example**  
```js
hot.validateCells((valid) => {
  if (valid) {
    // ... code for validated cells
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [callback] | `function` | `optional` The callback function. |



### validateColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3845

:::

_core.validateColumns([columns], [callback])_

Validates columns using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

**Example**  
```js
hot.validateColumns([3, 4, 5], (valid) => {
  if (valid) {
    // ... code for validated columns
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [columns] | `Array` | `optional` Array of validation target visual columns indexes. |
| [callback] | `function` | `optional` The callback function. |



### validateRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/core.js#L3819

:::

_core.validateRows([rows], [callback])_

Validates rows using their validator functions and calls callback when finished.

If one of the cells is invalid, the callback will be fired with `'valid'` arguments as `false` - otherwise it
 would equal `true`.

**Example**  
```js
hot.validateRows([3, 4, 5], (valid) => {
  if (valid) {
    // ... code for validated rows
  }
})
```

| Param | Type | Description |
| --- | --- | --- |
| [rows] | `Array` | `optional` Array of validation target visual row indexes. |
| [callback] | `function` | `optional` The callback function. |


