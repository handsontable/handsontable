---
title: AsyncValues
metaTitle: AsyncValues API reference | Handsontable DataGrid for JavaScript
permalink: /api/async-values
canonicalUrl: /api/async-values
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Async values](@/guides/cell-features/async-values/async-values.md) guide for examples and configuration details.

## Options

### asyncValues
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api asyncValues|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L653

:::

_asyncValues.asyncValues : boolean | object_

The `asyncValues` option configures the `AsyncValues` plugin, which
computes cell values asynchronously, from promises, and shows a pending and an error state per
cell.

You can set the `asyncValues` option to one of the following:

| Setting           | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `false` (default) | Disable the `AsyncValues` plugin                     |
| `true`            | Enable the `AsyncValues` plugin with the defaults    |
| An object         | Enable the `AsyncValues` plugin and configure it     |

If you set the `asyncValues` option to an object, you can configure the following settings:

| Setting         | Possible values                                  | Description                                                                                       |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `flush`         | `'microtask'` (default), `'frame'`, or a number  | When settled requests are written: right after the task they settled in, once per animation frame, or after a number of milliseconds that collects results |
| `concurrency`   | A number (default: `6`), or `Infinity`           | The maximum number of sources running at once (a batch counts as one); further requests stay pending until a slot frees |
| `copyPendingAs` | `'previous'` (default) or `'empty'`              | What copying a pending cell puts on the clipboard                                                 |
| `saveToDataProvider` | `false` (default) or `true`                 | Saves each resolved value through the [`dataProvider`](@/api/options.md#dataprovider) `onRowsUpdate` callback, one `updateRows()` call per flush |

The plugin can't be enabled together with the [`nestedRows`](@/api/options.md#nestedrows) option, because NestedRows
moves rows without keeping their physical indexes.

Read more:
- [Async values](@/guides/cell-features/async-values/async-values.md)

**Default**: <code>false</code>  
**Since**: 19.0.0  
**Example**  
```js
// enable the `AsyncValues` plugin
asyncValues: true,

// write results once per animation frame, and run at most four requests at once
asyncValues: {
  flush: 'frame',
  concurrency: 4,
},
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L703

:::

_AsyncValues.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L698

:::

_AsyncValues.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L687

:::

_AsyncValues.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L692

:::

_AsyncValues.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L713

:::

_AsyncValues.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### cancel

::: ask-about-api cancel|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L982

:::

_asyncValues.cancel(row, column)_

Cancels the pending request of a cell, or clears its error state.

**Emits**: [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### cancelAll

::: ask-about-api cancelAll|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1007

:::

_asyncValues.cancelAll()_

Cancels every pending request and clears every error state.

**Emits**: [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel)  
**Since**: 19.0.0  


### cancelAt

::: ask-about-api cancelAt|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L995

:::

_asyncValues.cancelAt(cell)_

Cancels the pending request of a cell, or clears its error state, by visual coordinates, physical
row, or row id (see [AsyncValues#setAsyncValueAt](@/api/asyncValues.md#setasyncvalueat)).

**Emits**: [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| cell | `object` | The cell. |



### countErrors

::: ask-about-api countErrors|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1150

:::

_asyncValues.countErrors() ⇒ number_

Returns the number of cells whose last request failed.

**Since**: 19.0.0  


### countPending

::: ask-about-api countPending|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1142

:::

_asyncValues.countPending() ⇒ number_

Returns the number of cells that have a pending request.

**Since**: 19.0.0  


### destroy

::: ask-about-api destroy|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1156

:::

_asyncValues.destroy()_

Destroys the plugin instance. Pending requests and batches are aborted, and their promises resolve
as canceled with the `'disabled'` reason.



### disablePlugin

::: ask-about-api disablePlugin|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L779

:::

_asyncValues.disablePlugin()_

Disables the plugin functionality for this Handsontable instance. Cancels every pending request
and clears every error state.



### enablePlugin

::: ask-about-api enablePlugin|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L730

:::

_asyncValues.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getAsyncState

::: ask-about-api getAsyncState|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1072

:::

_asyncValues.getAsyncState(row, column) ⇒ object | null_

Returns the state of a cell: `{ status: 'pending' }`, `{ status: 'error', error, message }`, or
`null` when the cell has no pending request and no error.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### getAsyncStateAt

::: ask-about-api getAsyncStateAt|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1085

:::

_asyncValues.getAsyncStateAt(cell) ⇒ object | null_

Returns the state of a cell, by visual coordinates, physical row, or row id (see
[AsyncValues#getAsyncState](@/api/asyncValues.md#getasyncstate)).

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| cell | `object` | The cell. |



### getErrorCells

::: ask-about-api getErrorCells|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1134

:::

_asyncValues.getErrorCells() ⇒ Array&lt;object&gt;_

Lists the cells whose last request failed.

**Since**: 19.0.0  

**Returns**: `Array<object>` - The cells, as `{ physicalRow, prop, rowId }` objects.  

### getPendingCells

::: ask-about-api getPendingCells|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1126

:::

_asyncValues.getPendingCells() ⇒ Array&lt;object&gt;_

Lists the cells that have a pending request.

**Since**: 19.0.0  

**Returns**: `Array<object>` - The cells, as `{ physicalRow, prop, rowId }` objects.  

### isEnabled

::: ask-about-api isEnabled|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L725

:::

_asyncValues.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### isPending

::: ask-about-api isPending|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1105

:::

_asyncValues.isPending(row, column) ⇒ boolean_

Checks whether a cell has a pending request.

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |



### isPendingAt

::: ask-about-api isPendingAt|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1118

:::

_asyncValues.isPendingAt(cell) ⇒ boolean_

Checks whether a cell has a pending request, by visual coordinates, physical row, or row id (see
[AsyncValues#setAsyncValueAt](@/api/asyncValues.md#setasyncvalueat)).

**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| cell | `object` | The cell. |



### retry

::: ask-about-api retry|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1024

:::

_asyncValues.retry(row, column) ⇒ Promise&lt;object&gt; | null_

Starts a failed cell's request again, with the source and the options it failed with.

**Throws**:

- <code>Error</code> When a hook listener throws, once the cells are started.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `Promise<object>` | `null` - A promise of how the new request ended, or `null` when the cell has
no error, or no source to retry (a plain promise, or `keepSource: false`).  

### retryAt

::: ask-about-api retryAt|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1040

:::

_asyncValues.retryAt(cell) ⇒ Promise&lt;object&gt; | null_

Starts a failed cell's request again, by visual coordinates, physical row, or row id (see
[AsyncValues#retry](@/api/asyncValues.md#retry)).

**Throws**:

- <code>Error</code> When a hook listener throws, once the cells are started.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| cell | `object` | The cell. |


**Returns**: `Promise<object>` | `null` - A promise of how the new request ended, or `null`.  

### retryErrors

::: ask-about-api retryErrors|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L1058

:::

_asyncValues.retryErrors() ⇒ Promise&lt;Array&lt;object&gt;&gt;_

Starts the requests of every failed cell again. Cells that failed in one batch are retried in batches
again.

**Throws**:

- <code>Error</code> When a hook listener throws, once the cells are started.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

**Returns**: `Promise<Array<object>>` - A promise of the results of the retried cells.  

### setAsyncValue

::: ask-about-api setAsyncValue|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L847

:::

_asyncValues.setAsyncValue(row, column, source, [options]) ⇒ Promise&lt;object&gt;_

Starts an asynchronous computation of a cell's value, by visual coordinates.

The cell shows the pending state until the request settles. A request already pending for the
cell is canceled first, and an error state is cleared.

The returned promise resolves with `{ status: 'resolved' }` once the plugin passes the value to
the grid. A `beforeChange` listener or the cell's validator can still change or reject it, and an
asynchronous validator delays the write.

**Throws**:

- <code>Error</code> When the plugin is disabled, or the coordinates point outside the grid.
A hook listener's error is thrown too, once the call has started its other cells.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| source | `function` <br/> `Promise` | A function that returns a promise of the value, or the promise itself. The function receives an object with the `signal` (an `AbortSignal`), `row`, `column`, `physicalRow`, `prop`, and `rowId` of the cell. |
| [options] | `object` | `optional` The request options: `dependsOn`, `source`, `meta`, `undo`, and `keepSource`. |


**Returns**: `Promise<object>` - A promise that never rejects. It resolves with an object that describes
how the request ended: `{ status: 'resolved', value }`, `{ status: 'rejected', error, message }`,
or `{ status: 'canceled', reason }`.  

### setAsyncValueAt

::: ask-about-api setAsyncValueAt|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L869

:::

_asyncValues.setAsyncValueAt(cell, source, [options]) ⇒ Promise&lt;object&gt;_

Starts an asynchronous computation of a cell's value, by visual coordinates (`{ row, column }`), by
physical row (`{ physicalRow, prop }`), or by row id (`{ rowId, prop }`). A physical row or a row id
also reaches a row that is filtered out or trimmed.

**Throws**:

- <code>Error</code> When the plugin is disabled, or the cell does not exist.
A hook listener's error is thrown too, once the call has started its other cells.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| cell | `object` | The cell. |
| source | `function` <br/> `Promise` | A function that returns a promise of the value, or the promise itself (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |
| [options] | `object` | `optional` The request options (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |


**Returns**: `Promise<object>` - A promise of how the request ended (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)).  

### setAsyncValues

::: ask-about-api setAsyncValues|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L902

:::

_asyncValues.setAsyncValues(rowFrom, columnFrom, rowTo, columnTo, source, [options]) ⇒ Promise&lt;Array&lt;object&gt;&gt;_

Starts an asynchronous computation for every cell of a range of visual coordinates, and renders
once. The `source` function is called once per cell.

**Throws**:

- <code>Error</code> When the plugin is disabled, or the range reaches outside the grid.
A hook listener's error is thrown too, once the call has started its other cells.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| rowFrom | `number` | Visual index of the first row. |
| columnFrom | `number` | Visual index of the first column. |
| rowTo | `number` | Visual index of the last row. |
| columnTo | `number` | Visual index of the last column. |
| source | `function` | A function that returns a promise of a cell's value (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |
| [options] | `object` | `optional` The request options, shared by every cell (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |


**Returns**: `Promise<Array<object>>` - A promise of the results, one per cell, in row-major order.  

### setAsyncValuesForRows

::: ask-about-api setAsyncValuesForRows|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L937

:::

_asyncValues.setAsyncValuesForRows(rows, prop, source, [options]) ⇒ Promise&lt;Array&lt;object&gt;&gt;_

Starts an asynchronous computation of one column for many rows, by physical row or by row id.
`'all'` takes every row of the data, the rows that are filtered out or trimmed included. The
`source` function is called once per cell.

**Throws**:

- <code>Error</code> When the plugin is disabled, a row does not exist, or the column cannot hold values.
A hook listener's error is thrown too, once the call has started its other cells.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| rows | `string` <br/> `Array` | `'all'`, or the rows as `{ physicalRow }` or `{ rowId }` objects. |
| prop | `string` <br/> `number` | The property of the column. |
| source | `function` | A function that returns a promise of a cell's value (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |
| [options] | `object` | `optional` The request options, shared by every cell (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)). |


**Returns**: `Promise<Array<object>>` - A promise of the results, one per row, in the order of `rows`.  

### setAsyncValuesInBatches

::: ask-about-api setAsyncValuesInBatches|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L963

:::

_asyncValues.setAsyncValuesInBatches(rows, prop, source, [options]) ⇒ Promise&lt;Array&lt;object&gt;&gt;_

Starts an asynchronous computation of one column for many rows, with one call of `source` per batch
of up to `batchSize` cells (default `25`). Rows are given as in [AsyncValues#setAsyncValuesForRows](@/api/asyncValues.md#setasyncvaluesforrows).

`source` receives the cells' contexts and the batch's `AbortSignal`, and resolves with an array aligned
with the cells: an element that is an `Error` rejects that cell, and a missing element rejects it with
an empty message. A rejection, or an answer that is not an array, rejects every cell of the batch. Each
cell settles on its own, and the batch's signal aborts only when every cell of the batch was canceled.
A batch takes one concurrency slot. A row listed twice is computed once.

**Throws**:

- <code>Error</code> When the plugin is disabled, a row does not exist, or the column cannot hold values.
A hook listener's error is thrown too, once the call has started its other cells.

**Emits**: [`Hooks#event:beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart), [`Hooks#event:afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel), [`Hooks#event:afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)  
**Since**: 19.0.0  

| Param | Type | Description |
| --- | --- | --- |
| rows | `string` <br/> `Array` | `'all'`, or the rows as `{ physicalRow }` or `{ rowId }` objects. |
| prop | `string` <br/> `number` | The property of the column. |
| source | `function` | A function that receives the cells and a signal, and returns a promise of their values. |
| [options] | `object` | `optional` The request options (see [AsyncValues#setAsyncValue](@/api/asyncValues.md#setasyncvalue)), and `batchSize`. |


**Returns**: `Promise<Array<object>>` - A promise of the results, one per row, in the order of `rows`.  

### updatePlugin

::: ask-about-api updatePlugin|AsyncValues

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/asyncValues/asyncValues.ts#L772

:::

_asyncValues.updatePlugin()_

Updates the plugin's state. This method is executed when `updateSettings()` is invoked with the
`asyncValues` option. The requests keep running, because the framework wrappers send the option
again on every update; a raised `concurrency` starts the queued sources that now fit.


