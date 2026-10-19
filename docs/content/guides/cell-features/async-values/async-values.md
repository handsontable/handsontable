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

The [`AsyncValues`](@/api/asyncValues.md) plugin of Handsontable DataGrid starts one request per cell. While a request is pending, the cell keeps its current value and shows a spinner. When the promise resolves, the plugin writes the value into the cell. When it rejects, the cell keeps its previous value, and shows an error state with the rejection message.

Each request gets an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). The plugin aborts it, and ignores the request's late result, when:

- The user or your code changes the cell's value.
- The user or your code changes a cell the request depends on.
- A new request starts for the same cell.
- The row is removed, or the data is replaced.

Requests are tied to the row's physical index, so sorting, filtering, or moving rows while a request is pending still writes the result to the right record.

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

Pass the cell's visual coordinates and a function that returns a promise. The function receives the request's `signal`, and the cell's `row`, `column`, `physicalRow`, and `prop`:

```js
const asyncValues = hot.getPlugin('asyncValues');

asyncValues.setAsyncValue(0, 2, async ({ physicalRow, signal }) => {
  const sku = hot.getSourceDataAtCell(physicalRow, 'sku');
  const response = await fetch(`/api/products/${sku}`, { signal });

  return (await response.json()).name;
});
```

Read the row's data through `physicalRow`, as above. The function runs once, when the request starts, but the visual index of the row can change before the promise settles.

You can also pass a promise instead of a function. A promise cannot receive the signal, so its work goes on after a cancellation, but the plugin still ignores its result.

To start a request for every cell of a range, use [`setAsyncValues()`](@/api/asyncValues.md#setasyncvalues). It calls the function once per cell, and renders the grid once:

```js
asyncValues.setAsyncValues(0, 2, hot.countRows() - 1, 2, ({ physicalRow, signal }) => (
  lookUpProduct(hot.getSourceDataAtCell(physicalRow, 'sku'), signal)
));
```

Results that settle in the same task are written in one change and painted in one render. Responses that arrive separately, as network responses do, are written one by one.

## Cancel a request when its inputs change

List the columns a value is computed from in the `dependsOn` option. A change to any of them, in the same row, cancels the request, or clears the error state a failed request left:

```js
asyncValues.setAsyncValue(row, 2, source, { dependsOn: ['sku', 'quantity'] });
```

`dependsOn` takes column properties: the `data` keys of object data, or the physical column indexes of array data. A resolved value is a change too, so it cancels the pending requests that depend on its cell.

The plugin does not start a new request on its own. Start one from your [`afterChange`](@/api/hooks.md#afterchange) hook when an input column changes, as the example above does. The plugin handles `afterChange` before your listeners, so the change cancels the old request first, and your new request stays.

To cancel requests from your code, use [`cancel()`](@/api/asyncValues.md#cancel) for one cell, or [`cancelAll()`](@/api/asyncValues.md#cancelall) for every cell. Both also clear the error state.

## Read the state of a cell

[`getAsyncState()`](@/api/asyncValues.md#getasyncstate) returns `{ status: 'pending' }`, `{ status: 'error', error, message }`, or `null`. [`isPending()`](@/api/asyncValues.md#ispending) returns a boolean.

The state is also available in the cell meta, so a custom renderer can read it:

| Cell meta key | Value |
| ------------- | ----- |
| `asyncState`  | `'pending'`, `'error'`, or `null` (`undefined` on a cell that never had a request) |
| `asyncError`  | The error message, or `null` |

The error message is the rejection reason's `message`, or the reason converted to a string.

Every `setAsyncValue()` call returns a promise that never rejects. It resolves with an object that tells how the request ended: `{ status: 'resolved', value }`, `{ status: 'rejected', error, message }`, or `{ status: 'cancelled', reason }`.

`resolved` means the plugin passed the value to the grid. A `beforeChange` listener, or a validator with [`allowInvalid: false`](@/api/options.md#allowinvalid), can still change or reject the value. A cell with a validator gets the value after the validation finishes, so read it in `afterChange` rather than right after the promise resolves.

## Hooks

| Hook | Fires |
| ---- | ----- |
| [`afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart) | After a request starts. |
| [`afterAsyncValueResolve`](@/api/hooks.md#afterasyncvalueresolve) | After a resolved value is passed to the grid. |
| [`afterAsyncValueReject`](@/api/hooks.md#afterasyncvaluereject) | After a request rejects. |
| [`afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel) | After a pending request is cancelled. |

Each hook receives the cell's physical row index and column property. A row hidden by a filter has no visual index, which is why the hooks use physical coordinates. To get the visual row, call [`toVisualRow()`](@/api/core.md#tovisualrow).

`afterAsyncValueCancel` also receives the reason: `'edit'`, `'dependency'`, `'restart'`, `'rowRemoved'`, `'columnsChanged'`, `'dataReplaced'`, `'manual'`, or `'disabled'`.

## How async values work with other features

- **Undo and redo:** a resolved value is not added to the undo history. Undo of an earlier edit of the same cell restores the value that edit replaced, over the async value. An undo or redo that changes a pending cell cancels its request, and redo does not start it again.
- **Validation:** a resolved value goes through `beforeChange`, the cell's validator, and `afterChange`, with the `'AsyncValues.resolve'` source. A row hidden by a filter has no visual index, so its value is written with [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell): the cell's validator does not run, a [`sourceDataValidator`](@/api/options.md#sourcedatavalidator) does, and `afterChange` does not fire.
- **Copy, paste, and export:** copy and export read the cell's current value -- its previous value while a request is pending or failed. A paste into a pending cell is an edit, so it cancels the request.
- **Rows and columns:** inserting rows keeps every request on its record. Removing a row cancels its requests. In array data, whose column properties are indexes, inserting or removing a column cancels the requests of the columns after it.
- **Data:** [`loadData()`](@/api/core.md#loaddata) and [`updateData()`](@/api/core.md#updatedata) cancel every request. With the [`DataProvider`](@/api/dataProvider.md) plugin, a server-side sort, filter, or page change loads new data, so it cancels every request too. A resolved value is saved through `onRowsUpdate` like any other edit, and a failed save reverts it.
- **Settings:** [`updateSettings()`](@/api/core.md#updatesettings) keeps pending requests, even when it sends `asyncValues: true` again, as the framework wrappers do. Setting `asyncValues` to `false` cancels every request.

## Styling

The plugin adds these classes to a cell:

| Class | Cell state |
| ----- | ---------- |
| `htAsyncPending` | A request is pending. The spinner is a `span.htAsyncIndicator` element inside the cell. |
| `htAsyncError` | The last request failed. |

The spinner uses the theme's accent color (`--ht-accent-color`), and the error state uses the invalid cell background (`--ht-cell-error-background-color`). Override either class to change the look. With `prefers-reduced-motion: reduce`, the spinner does not spin. The spinner sits at the inline end of the cell, over the end of a long or right-aligned value.

## Accessibility

A pending cell has `aria-busy="true"`. A failed cell has `aria-invalid="true"`, and carries the error message twice: in its `title` attribute, which a pointer shows on hover, and in visually hidden text (`span.htAsyncErrorMessage`), which a screen reader reads with the cell. When the request of the selected cell fails, the error message is also announced. Both ARIA attributes follow the [`ariaTags`](@/api/options.md#ariatags) option.

## Related API reference

- Configuration options:
  - [`asyncValues`](@/api/options.md#asyncvalues)
- Plugins:
  - [`AsyncValues`](@/api/asyncValues.md)
- Hooks:
  - [`afterAsyncValueCancel`](@/api/hooks.md#afterasyncvaluecancel)
  - [`afterAsyncValueReject`](@/api/hooks.md#afterasyncvaluereject)
  - [`afterAsyncValueResolve`](@/api/hooks.md#afterasyncvalueresolve)
  - [`afterAsyncValueStart`](@/api/hooks.md#afterasyncvaluestart)
