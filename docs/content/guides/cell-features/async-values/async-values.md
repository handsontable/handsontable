---
type: how-to
title: Async values
metaTitle: Async values | Handsontable DataGrid for JavaScript
description: Fill cells from promises, with a pending and an error state per cell and cancellation of stale requests.
permalink: /async-values
canonicalUrl: /async-values
tags:
  - async
  - promise
  - loading
  - pending
  - remote data
  - lookup
  - abortsignal
react:
  metaTitle: Async values | Handsontable DataGrid for React
angular:
  metaTitle: Async values | Handsontable DataGrid for Angular
vue:
  metaTitle: Async values | Handsontable DataGrid for Vue
searchCategory: Guides
category: Cell features
menuTag: new
addedIn: "19.0.0"
---

Fill cells from promises -- a remote lookup, a server-computed value, or an AI model -- and show a pending and an error state in each cell while the request runs.

[[toc]]

## Overview

The [`AsyncValues`](@/api/asyncValues.md) plugin of Handsontable DataGrid starts a request per cell, or one request for a batch of cells. While a request is pending, the cell keeps its current value and shows a spinner. When the promise resolves, the plugin writes the value into the cell. When it rejects, the cell keeps its previous value, and shows an error state with the rejection message.

Each request gets an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). The plugin aborts it, and ignores the request's late result, when:

- The user or your code changes the cell's value.
- The user or your code changes a cell the request depends on.
- A new request starts for the same cell.
- The row is removed, or replaced data no longer holds the row.

Requests are tied to the row's physical index, so sorting, filtering, or moving rows on the client while a request is pending still writes the result to the right record. With [row ids](@/guides/rows/row-identity/row-identity.md), requests also follow their rows when the data is replaced.

The plugin can't be enabled together with the [`NestedRows`](@/api/nestedRows.md) plugin.

## Enable async values

Set the [`asyncValues`](@/api/options.md#asyncvalues) option to `true`, and start requests with the [`setAsyncValue()`](@/api/asyncValues.md#setasyncvalue) method.

In the example below, click **Look up products** to fetch each product's name by its SKU. The lookup for `X-999` fails, so its cell shows the error state. Change a SKU to look its product up again -- the change cancels a pending lookup or clears the error, and the example starts a new lookup from its `afterChange` hook.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/async-values/javascript/example1.html)
@[code](@/content/guides/cell-features/async-values/javascript/example1.js)
@[code](@/content/guides/cell-features/async-values/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/async-values/react/example1.jsx)
@[code](@/content/guides/cell-features/async-values/react/example1.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/async-values/angular/example1.ts)
@[code](@/content/guides/cell-features/async-values/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/async-values/vue/example1.vue)

:::

:::

## Start a request

Pass the cell's visual coordinates and a function that returns a promise. The function receives the request's `signal`, and the cell's `row`, `column`, `physicalRow`, `prop`, and `rowId`:

```js
const asyncValues = hot.getPlugin('asyncValues');

asyncValues.setAsyncValue(0, 2, async ({ physicalRow, signal }) => {
  const sku = hot.getSourceDataAtCell(physicalRow, 'sku');
  const response = await fetch(`/api/products/${sku}`, { signal });

  return (await response.json()).name;
});
```

Read the row's data through `physicalRow`, as above. The visual index of a row can change before the promise settles, and a row that is filtered out has none (`row` is `null`).

You can also pass a promise instead of a function. A promise cannot receive the signal, so its work goes on after a cancellation, but the plugin still ignores its result. Only a function can be retried.

To start a request for every cell of a visual range, use [`setAsyncValues()`](@/api/asyncValues.md#setasyncvalues). It calls the function once per cell, and renders the grid once.

## Start requests by row id or physical row

A filtered-out or trimmed row has no visual index, so a visual range can't reach it. Address such cells by physical row or by [row id](@/guides/rows/row-identity/row-identity.md) instead:

```js
// one cell
asyncValues.setAsyncValueAt({ rowId: 'SKU-4821', prop: 'name' }, source);
asyncValues.setAsyncValueAt({ physicalRow: 12, prop: 'name' }, source);

// one column, for every row of the data, filtered-out rows included
asyncValues.setAsyncValuesForRows('all', 'name', source, { dependsOn: ['sku'] });

// one column, for some rows
asyncValues.setAsyncValuesForRows([{ rowId: 'SKU-4821' }, { rowId: 'SKU-0093' }], 'name', source);
```

If a row or the column doesn't exist, the method throws before it starts any request. [`cancelAt()`](@/api/asyncValues.md#cancelat), [`retryAt()`](@/api/asyncValues.md#retryat), and [`getAsyncStateAt()`](@/api/asyncValues.md#getasyncstateat) take the same cell references.

## Compute many cells in one request

An AI model or a bulk API is cheaper per batch than per cell. [`setAsyncValuesInBatches()`](@/api/asyncValues.md#setasyncvaluesinbatches) calls your function once per batch of up to `batchSize` cells (default `25`):

```js
asyncValues.setAsyncValuesInBatches('all', 'category', async (cells, signal) => {
  const products = cells.map(({ physicalRow }) => hot.getSourceDataAtCell(physicalRow, 'product'));
  const response = await fetch('/api/classify', { method: 'POST', body: JSON.stringify(products), signal });
  const answers = await response.json();

  // One element per cell: a value, or an `Error` for a cell the model couldn't answer.
  return answers.map((answer) => (answer.ok ? answer.category : new Error(answer.reason)));
}, { batchSize: 20, dependsOn: ['product'] });
```

Each cell settles on its own: an `Error` element rejects only its cell, and a missing element (past the end of the array, a hole, or `undefined`) rejects it with an empty message. To clear a cell, answer `null`. A rejected batch rejects every cell of the batch, and so does an answer that isn't an array (the plugin also logs a warning). The batch's `signal` aborts only when every cell of the batch is canceled, so cancelling a few cells doesn't stop the request for the others. A row listed twice is computed once, and both of its results settle with the same value.

## Limit concurrent requests and coalesce writes

For hundreds of rows, set the plugin's options:

```js
asyncValues: {
  concurrency: 4, // at most four sources (or batches) run at once (default: 6)
  flush: 'frame', // write the results that arrived once per animation frame
},
```

With `concurrency`, the cells beyond the limit stay pending and wait for a free slot. The default of `6` matches the number of connections a browser opens to one server; set `Infinity` to start every source at once. A canceled cell gives its slot back at once, even when its request ignores the signal. A batch gives its slot back once every cell of the batch is canceled.

`flush` decides when settled requests are written:

| `flush` | Writes |
| ------- | ------ |
| `'microtask'` (default) | Right after the task the requests settled in. Responses that arrive separately, as network responses do, are written one by one. |
| `'frame'` | Once per animation frame. |
| A number | After that many milliseconds, collecting every result that settled meanwhile. |

The grid renders at most once per animation frame: a flush renders at once, and a later flush in the same frame renders when the frame comes. So separate network responses don't each render the grid. Each flush writes one change per write [`source`](#request-options): `afterChange` fires once for the rows the grid shows, and the rows hidden by a filter are written separately, without `afterChange` (see [Validation](#how-async-values-work-with-other-features)).

## Show progress, retry, and stop

[`countPending()`](@/api/asyncValues.md#countpending) and [`countErrors()`](@/api/asyncValues.md#counterrors) give the numbers for a progress display. [`getPendingCells()`](@/api/asyncValues.md#getpendingcells) and [`getErrorCells()`](@/api/asyncValues.md#geterrorcells) list the cells as `{ physicalRow, prop, rowId }` objects. The [`afterAsyncValuesIdle`](@/api/hooks.md#afterasyncvaluesidle) hook fires when the last pending request settles.

[`retryErrors()`](@/api/asyncValues.md#retryerrors) starts every failed cell again, with the source and the options it failed with. Cells that failed in one batch are retried in batches again. [`retry()`](@/api/asyncValues.md#retry) does the same for one cell. Pass `keepSource: false` to a request to let a failed cell drop its source.

[`cancelAll()`](@/api/asyncValues.md#cancelall) stops everything.

The example below classifies products with a stand-in model, in batches of four, two batches at a time. Click **Classify**, then **Stop** or **Retry failed**:

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/async-values/javascript/example2.html)
@[code](@/content/guides/cell-features/async-values/javascript/example2.js)
@[code](@/content/guides/cell-features/async-values/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/async-values/react/example2.jsx)
@[code](@/content/guides/cell-features/async-values/react/example2.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/async-values/angular/example2.ts)
@[code](@/content/guides/cell-features/async-values/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/async-values/vue/example2.vue)

:::

:::

## Cancel a request when its inputs change

List the columns a value is computed from in the `dependsOn` option. A change to any of them, in the same row, cancels the request, or clears the error state a failed request left:

```js
asyncValues.setAsyncValue(row, 2, source, { dependsOn: ['sku', 'quantity'] });
```

`dependsOn` takes column properties: the `data` keys of object data, or the physical column indexes of array data. A resolved value is a change too, so it cancels the pending requests that depend on its cell, and a value computed from an input that lands in the same write is canceled as well.

A value that arrives while the user edits its cell is dropped: the request ends canceled with the `'edit'` reason, and the user's text stays in the editor.

The plugin does not start a new request on its own. Start one from your [`afterChange`](@/api/hooks.md#afterchange) hook when an input column changes, as the first example does. The plugin handles `afterChange` before the listeners you add to the grid, so the change cancels the old request first, and your new request stays. A global listener (`Handsontable.hooks.add()` without an instance) runs before every instance listener, so it can't start the new request this way.

To cancel requests from your code, use [`cancel()`](@/api/asyncValues.md#cancel) for one cell, or [`cancelAll()`](@/api/asyncValues.md#cancelall) for every cell. Both also clear the error state.

## Request options

Every method that starts requests takes these options:

| Option | Default | Description |
| ------ | ------- | ----------- |
| `dependsOn` | `[]` | The columns, in the same row, whose change cancels the request. |
| `source` | `'AsyncValues.resolve'` | The source the value is written with, as `beforeChange` and `afterChange` receive it. Use your own (for example, `'AI.classify'`) to tell AI writes apart in your hooks, in a backend sync, or in an audit log. `'auto'`, `'UndoRedo.undo'`, `'UndoRedo.redo'`, and a source ending with `Validator` are reserved: the plugin logs a warning and uses the default. |
| `meta` | none | Cell meta merged into the cell once the grid stores its value, for example `{ aiGenerated: true }`. A value that `beforeChange` or a validator rejects gets no meta. Applied to rows with a visual index only. Never part of an undo step, so an undo doesn't remove it. |
| `undo` | `'skip'` | `'skip'` writes the values without an undo step. `'record'` records every value the call wrote as one undo step (see [Undo](#undo)). |
| `keepSource` | `true` | Whether a failed cell keeps its source for `retry()`. |
| `batchSize` | `25` | The cells per call of a batch source ([`setAsyncValuesInBatches()`](@/api/asyncValues.md#setasyncvaluesinbatches) only). |

## Review values before they're written

The [`beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart) hook can skip a request: return `false`, and the cell doesn't become pending and its source isn't called. Use it to throttle or to skip rows that already have a value. A skipped request's promise resolves as canceled with the `'vetoed'` reason, but no `afterAsyncValueCancel` hook fires, because nothing was pending.

The [`beforeAsyncValueResolve`](@/api/hooks.md#beforeasyncvalueresolve) hook receives each resolved value before it's written. Return another value to write that one instead, or `false` to discard it (the cell keeps its previous value):

```js
const hot = new Handsontable(container, {
  // ...
  asyncValues: true,
  beforeAsyncValueResolve(value, physicalRow, prop, rowId) {
    if (!allowedCategories.includes(value)) {
      return false; // discard a suggestion outside the list
    }

    return value.trim();
  },
});
```

A discarded value ends its request as canceled, with the `'vetoed'` reason, and fires `afterAsyncValueCancel`. Because `false` discards, a listener can't replace a value with a literal `false`.

When several listeners are added to one of these hooks, each one receives the previous listener's result as its first argument, unless that result is `undefined`. So:

- Return `undefined` (or nothing) to keep a request or a value. Returning `true` from `beforeAsyncValueStart` passes `true` to the next listener in place of the row index.
- To respect an earlier listener's decision, check whether the first argument is `false`.

Every `beforeAsyncValueResolve` listener of a flush runs before any value is written. A listener that throws fails its own cell with the error it threw. The plugin writes the other cells, then reports the error as an uncaught error.

A `beforeAsyncValueStart` listener that throws skips its cell. The method that started the requests starts the other cells first, then throws the error.

A listener of any other async values hook that throws doesn't keep the other cells from their hooks.

## Read the state of a cell

[`getAsyncState()`](@/api/asyncValues.md#getasyncstate) returns `{ status: 'pending' }`, `{ status: 'error', error, message }`, or `null`. [`isPending()`](@/api/asyncValues.md#ispending) returns a boolean. [`getAsyncStateAt()`](@/api/asyncValues.md#getasyncstateat) and [`isPendingAt()`](@/api/asyncValues.md#ispendingat) take a cell by physical row or row id.

The state is also available in the cell meta, so a custom renderer can read it:

| Cell meta key | Value |
| ------------- | ----- |
| `asyncState`  | `'pending'`, `'error'`, or `null` (`undefined` on a cell that never had a request) |
| `asyncError`  | The error message, or `null` |

The error message is the rejection reason's `message`, or the reason converted to a string.

Every method that starts requests returns a promise that never rejects. It resolves with an object (or an array of them) that tells how each request ended: `{ status: 'resolved', value }`, `{ status: 'rejected', error, message }`, or `{ status: 'canceled', reason }`.

`resolved` means the plugin passed the value to the grid. A `beforeChange` listener, or a validator with [`allowInvalid: false`](@/api/options.md#allowinvalid), can still change or reject the value, and a later write to the cell can drop it (see [Undo](#undo)). A cell with a validator gets the value after the validation finishes, so read it in `afterChange` rather than right after the promise resolves.

## Hooks

| Hook | Fires |
| ---- | ----- |
| [`beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart) | Before a request starts. Return `false` to skip it. |
| [`afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart) | After a request starts. |
| [`beforeAsyncValueResolve`](@/api/hooks.md#beforeasyncvalueresolve) | Before a resolved value is written. Return a value to replace it, or `false` to discard it. |
| [`afterAsyncValueResolve`](@/api/hooks.md#afterasyncvalueresolve) | After a resolved value is passed to the grid. |
| [`afterAsyncValueReject`](@/api/hooks.md#afterasyncvaluereject) | After a request rejects. |
| [`afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel) | After a pending request is canceled. |
| [`afterAsyncValuesIdle`](@/api/hooks.md#afterasyncvaluesidle) | After the last pending request settles. |

Each hook (except `afterAsyncValuesIdle`) receives the cell's physical row index, its column property, and its row id (`null` without [row ids](@/guides/rows/row-identity/row-identity.md)). A row hidden by a filter has no visual index, which is why the hooks use physical coordinates. To get the visual row, call [`toVisualRow()`](@/api/core.md#tovisualrow).

::: tip

A value written to a row hidden by a filter fires no `afterChange` (see [Validation](#how-async-values-work-with-other-features) below). `afterAsyncValueResolve` covers those rows, but it also fires for a value the grid then rejects or drops (see [Undo](#undo)). To sync only the values that landed, listen to `afterChange`, and use `afterAsyncValueResolve` for the hidden rows.

:::

`afterAsyncValueCancel` also receives the reason: `'edit'`, `'dependency'`, `'restart'`, `'rowRemoved'`, `'columnsChanged'`, `'dataReplaced'`, `'manual'`, `'disabled'`, or `'vetoed'`. For exhaustive handling, the `ASYNC_VALUE_CANCEL_REASONS` array lists them all. Import it from the plugin's module (an ES module):

```js
import { ASYNC_VALUE_CANCEL_REASONS } from 'handsontable/plugins/asyncValues';
```

## Undo

By default (`undo: 'skip'`), a resolved value is not added to the undo history. Undo of an earlier edit of the same cell restores the value that edit replaced, over the async value.

With `undo: 'record'`, every value one call wrote becomes one undo step, recorded when the call's last request settles:

```js
asyncValues.setAsyncValuesInBatches('all', 'category', classify, { undo: 'record' });
```

One undo then reverts the whole run, and one redo applies it again. The values appear while the run is in progress, so the user can keep editing and undoing meanwhile. The step lands on the undo stack once the run's last request settles and its last value passes the cell's validator. For a cell without a validator, the step is there by the time the call's promise resolves. A validator can answer later than that, and the step then lands when the last validator answers.

The step is a `'change'` action with the call's `source`, as [`beforeUndo`](@/api/hooks.md#beforeundo) receives it. It records what the grid stored, after a `valueSetter` or a validator changed the value, a validator that corrects the value through a source ending with `Validator` included. When two calls write one cell while its validator runs, the cell keeps the value of the write made last, and that value is what the later call's step records. Like any new step, it clears the redo history: an undo the user makes while a run is in progress can't be redone once the run's step lands.

A few values stay out of the run's step:

- A cell the user edits after its value landed: the user's edit is a step of its own.
- A cell that a later call writes before this call finishes: the later call's step owns it.
- A value the grid dropped because it applied a later write to the same cell instead.
- A cell that a data update, such as [`updateData()`](@/api/core.md#updatedata), changed after the value landed.
- The `meta` the run merged into the cells: an undo doesn't remove it.

If you disable the plugin while a call is in progress, the call's step records the values that already landed.

A cell's validator decides when a value lands. When two writes reach one cell and both wait on a validator, the grid applies the write made last, whatever order the validators answer in. A write that skips the validator is not ordered (see [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)). So if the user edits a cell while the async value written to it still waits for its validator, and the edit's validator answers first, the user's edit stays and the grid drops the async value. If the async value's validator answers first, the value lands and the edit then replaces it. If a validator with [`allowInvalid: false`](@/api/options.md#allowinvalid) rejects the edit, the async value still lands.

A dropped async value still ends as `{ status: 'resolved', value }`, because the plugin passed it to the grid. This differs from an edit made while the request is pending, or while the cell's editor is open: that edit cancels the request with the `'edit'` reason. A dropped value is the case where the edit is committed after the request resolved, while the value waits for its validator. No cancel hook fires for it. The dropped value fires [`beforeChange`](@/api/hooks.md#beforechange), but not [`afterChange`](@/api/hooks.md#afterchange) (see [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)). To tell that a value landed, listen to `afterChange` for the request's [`source`](#request-options). A row hidden by a filter fires no `afterChange` (see [Validation](#how-async-values-work-with-other-features)).

An undo or redo that changes a pending cell cancels its request, and redo does not start it again.

## Framework apps and data updates

The React wrapper calls [`updateData()`](@/api/core.md#updatedata) whenever it receives a `data` prop, which is on every render, and the Angular wrapper calls it whenever `data` changes. Pending requests survive those updates:

- With [row ids](@/guides/rows/row-identity/row-identity.md) (the `rowId` option, or `dataProvider.rowId`), each request moves to the row that holds the same id in the new data. A request whose row id is gone is canceled with the `'rowRemoved'` reason.
- Without row ids, `updateData()` keeps each request on the same physical row, the way it keeps cell meta. If your app reorders the rows it passes in, set `rowId`, or the results land on whatever record moved into that position.

[`loadData()`](@/api/core.md#loaddata) starts a new dataset: with row ids, requests follow their ids as above; without them, every request is canceled with the `'dataReplaced'` reason.

The Vue wrapper keeps your data array by reference. When the array gains or loses rows, the wrapper only resizes the grid's row index, at its end. With row ids, each pending request then moves to the row that holds its id; a request whose row is gone is canceled with the `'rowRemoved'` reason. Without row ids, requests keep their physical rows, so insert rows at the end of the array, or set `rowId`.

If your app stores resolved values in its own state, read them in `afterChange`, which fires only for a value that landed. For rows hidden by a filter, use `afterAsyncValueResolve`, which fires when the plugin passes the value to the grid. Then pass the updated data back as usual. The other pending requests keep running.

## Save resolved values to a server

With the [`DataProvider`](@/api/dataProvider.md) plugin, a resolved value is not sent to `onRowsUpdate` by default, so the next refetch replaces it. To save resolved values, set `saveToDataProvider` to `true` in the plugin's options:

```js
const hot = new Handsontable(container, {
  asyncValues: { saveToDataProvider: true },
  dataProvider: {
    rowId: 'id',
    fetchRows: (query) => fetchProducts(query),
    onRowsCreate: (rows) => createProducts(rows),
    onRowsUpdate: (rows) => updateProducts(rows),
    onRowsRemove: (ids) => removeProducts(ids),
  },
});
```

The plugin sends the values of one flush in one [`updateRows()`](@/api/dataProvider.md#updaterows) call. It needs `dataProvider.rowId` and `onRowsUpdate`, and it warns once when either is missing. The save follows these rules:

- A value is saved only when the grid stored it. A value that `beforeChange` or a validator rejected, a value a validator marked invalid (with `allowInvalid`), a rejected request, and a cell the user edited after the value landed are not saved. A value a validator corrects before the save is saved corrected.
- A failed save leaves the cell resolved. Handle it in [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror).
- The values of a call with `undo: 'record'` are not saved.
- Each save is a serialized `onRowsUpdate` call followed by a refetch. The refetch loads the data again, so it clears the undo and redo stack. Values that resolve in separate tasks make separate calls, and a value that resolves while a save runs waits for it. Use a numeric [`flush`](#limit-concurrent-requests-and-coalesce-writes) to merge responses into fewer calls.
- A save that runs while a page change is loading refetches the old page, because the new page is not stored until its fetch ends.
- A correction a validator makes after the save went out is not saved again.
- A call with a [`source`](#request-options) that DataProvider already saves, such as `'edit'`, is saved twice.

## How async values work with other features

- **Validation:** a resolved value goes through `beforeChange`, the cell's validator, and `afterChange`, with the request's `source`. A later write to the cell can drop the value before `afterChange` (see [Undo](#undo)). A row hidden by a filter, or past [`maxRows`](@/api/options.md#maxrows), has no visual index, so its value is written with [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell): the cell's validator does not run, a [`sourceDataValidator`](@/api/options.md#sourcedatavalidator) does, and `afterChange` does not fire.
- **Many calls:** each call that starts or cancels requests renders the grid once. To start many cells, call [`setAsyncValuesForRows()`](@/api/asyncValues.md#setasyncvaluesforrows) or [`setAsyncValues()`](@/api/asyncValues.md#setasyncvalues) once, or wrap your loop in [`batch()`](@/api/core.md#batch).
- **Copy, paste, and export:** copy and export read the cell's current value -- its previous value while a request is pending or failed. With `copyPendingAs: 'empty'` in the plugin's options, copying or cutting puts an empty value for a pending cell. The empty value also applies to the data a paste into another Handsontable grid reads, including with `parsePastedValue`. A paste into a pending cell is an edit, so it cancels the request.
- **Rows and columns:** inserting rows keeps every request on its record. Removing a row cancels its requests. In array data, whose column properties are indexes, inserting or removing a column cancels the requests of that column and the columns after it.
- **Server-side data:** with the [`DataProvider`](@/api/dataProvider.md) plugin, a refetch (a sort, a filter, a page change, or the refetch after a saved edit) loads new data. With `dataProvider.rowId`, the requests of the rows still on the page keep running; the others are canceled. To save resolved values, see [Save resolved values to a server](#save-resolved-values-to-a-server).
- **Settings:** [`updateSettings()`](@/api/core.md#updatesettings) keeps pending requests, even when it sends `asyncValues` again, as the framework wrappers do, and when it changes `columns`. A raised `concurrency` starts the waiting requests that now fit. Setting `asyncValues` to `false` or enabling [`nestedRows`](@/api/options.md#nestedrows) cancels every request.
- **Nested rows:** the plugin can't be enabled together with the [`NestedRows`](@/api/nestedRows.md) plugin, which moves rows without keeping their physical indexes.

## Styling

The plugin adds these classes to a cell:

| Class | Cell state |
| ----- | ---------- |
| `htAsyncPending` | A request is pending. The spinner is a `span.htAsyncIndicator` element inside the cell. |
| `htAsyncError` | The last request failed. The cell gets a background color and a bar at its inline start (`span.htAsyncErrorMarker`), so the state doesn't rely on color alone. |

Three theme variables control the colors, so an async error can look different from a validation error:

| CSS variable | Default |
| ------------ | ------- |
| `--ht-async-indicator-color` | `--ht-accent-color` |
| `--ht-async-error-background-color` | `--ht-cell-error-background-color` |
| `--ht-async-error-marker-color` | `--ht-notification-error-accent` |

With `prefers-reduced-motion: reduce`, the spinner does not spin. The spinner sits at the inline end of the cell, next to a dropdown arrow, and on the left in a right-aligned cell (a numeric one, for example), so it doesn't cover the value's end. It can still cover the end of a long value.

## Accessibility

A pending cell has `aria-busy="true"` and visually hidden "Loading..." text (`span.htAsyncPendingMessage`, translated with the grid's [language](@/guides/internationalization/language/language.md)), because screen readers don't announce `aria-busy` on a cell. A failed cell has `aria-invalid="true"`, and carries the error message twice: in its `title` attribute, which a pointer shows on hover, and in visually hidden text (`span.htAsyncErrorMessage`), which a screen reader reads with the cell. When the request of the selected cell fails, the error message is also announced. Both ARIA attributes, and the announcement, follow the [`ariaTags`](@/api/options.md#ariatags) option.

## Related API reference

- Configuration options:
  - [`asyncValues`](@/api/options.md#asyncvalues)
  - [`rowId`](@/api/options.md#rowid)
- Plugins:
  - [`AsyncValues`](@/api/asyncValues.md)
- Hooks:
  - [`afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel)
  - [`afterAsyncValueReject`](@/api/hooks.md#afterasyncvaluereject)
  - [`afterAsyncValueResolve`](@/api/hooks.md#afterasyncvalueresolve)
  - [`afterAsyncValuesIdle`](@/api/hooks.md#afterasyncvaluesidle)
  - [`afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)
  - [`beforeAsyncValueResolve`](@/api/hooks.md#beforeasyncvalueresolve)
  - [`beforeAsyncValueStart`](@/api/hooks.md#beforeasyncvaluestart)
