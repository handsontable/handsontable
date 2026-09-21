---
type: reference
title: Server-side CRUD
metaTitle: Server-side CRUD - JavaScript Data Grid | Handsontable
description: Handsontable dataProvider create, update, and remove -- onRowsCreate, onRowsUpdate, onRowsRemove, mutation hooks, optimistic UI, validators, and programmatic CRUD.
permalink: /server-side-data-crud
canonicalUrl: /server-side-data-crud
tags:
  - data provider
  - server-side
  - CRUD
react:
  metaTitle: Server-side CRUD - React Data Grid | Handsontable
angular:
  metaTitle: Server-side CRUD - Angular Data Grid | Handsontable
vue:
  metaTitle: Server-side CRUD - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
menuTag: updated
---

With a complete [`dataProvider`](@/api/options.md#dataprovider) configuration, Handsontable sends **create**, **update**, and **remove** operations to your backend. For loading and `fetchRows`, see [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md) and [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md).

[[toc]]

## Create, update, and remove

With a complete `dataProvider` configuration, Handsontable sends **create**, **update**, and **remove** operations to your backend through three callbacks. Valid edits appear in the grid immediately; if the server rejects an update (or the mutation promise rejects), or if [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation) returns `false`, affected cells roll back. **Cell and column validators** run before `onRowsUpdate`; if any cell in the batch fails, Handsontable does not call `onRowsUpdate`, fires [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) with a validation failure, and reverts the edit. If `rowId` resolves to `null` or `undefined` for a row, Handsontable cannot send an update or remove for that row (edits revert; remove from the UI throws). Programmatic [`updateRows`](@/api/dataProvider.md#updaterows) and [`removeRows`](@/api/dataProvider.md#removerows) throw if an id is missing. Row insert from the context menu is skipped when the table already has as many rows as [`maxRows`](@/api/options.md#maxrows).

### Update lifecycle

When a user edits a cell, the update flows through these steps in order:

1. **Cell and column validators** run on the edited cells. If any cell fails validation, the edit is reverted and [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires with a validation failure. The remaining steps do not run.
2. **[`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation)** fires with `('update', { rows })`. Return `false` to cancel — the optimistic values revert and `onRowsUpdate` is not called.
3. **Optimistic UI update** — the new cell values appear in the grid immediately.
4. **`onRowsUpdate`** — your server callback runs with the batch of changes.
5. **On success**: [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation) fires, then Handsontable refetches the current page (with `skipLoading: true` so the loading overlay does not flash).
6. **On failure**: the optimistic values roll back and [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) fires. If [`notification`](@/api/options.md#notification) is enabled, an error toast appears.

### `onRowsCreate`

Called when the user inserts rows (for example from the context menu). Payload shape:

- `position`: `'above'` or `'below'`.
- `referenceRowId`: anchor row id when inserting next to a row (from `rowId`); may be `undefined` when there is no anchor (for example some programmatic inserts).
- `rowsAmount`: how many rows to create in one request.

Your API should create the rows and return a promise. By default, Handsontable refetches the current query after success.

Set `refetchAfterCreate: false` to skip that refetch. Use it when your `onRowsCreate` applies the server response to the grid itself. For example, when the grid is sorted, a refetched new row can land on a different page. With the refetch off, you decide where the row appears. [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation) still fires with `('create', { rowsCreate })`. Rows created from the context menu are not inserted locally, so with the refetch off the grid does not change until your code updates it.

Apply the rows with [`updateData()`](@/api/core.md#updatedata), not [`loadData()`](@/api/core.md#loaddata). `loadData()` is a full reload: it resets the column sort state and the cell meta, so the header loses its sort indicator and the next fetch runs unsorted.

Append the new rows at the end of the current page. `updateData()` keeps cell meta by physical row index, so a row spliced into the middle takes over the meta of the row it pushes down (an invalid-cell mark, a comment, or a `readOnly` set with [`setCellMeta()`](@/api/core.md#setcellmeta)), and every row below shifts the same way, until the next fetch. The next `fetchRows` call puts the row where the server sorts it.

With [`pagination`](@/api/options.md#pagination) enabled, two things stay stale until that next `fetchRows` call: the row total does not change, and the current page grows past `pageSize` (for example, page 1 shows 11 rows with `pageSize: 10`), because in server mode Pagination does not hide rows on its side.

If a `fetchRows` request is still running when the create finishes (for example, a sort or filter change made just before the insert), Handsontable refetches anyway, so the late response cannot remove the rows you applied.

The example shows only the keys that change; the other keys stay as in [Configuration](@/guides/getting-started/server-side-data/server-side-data-configuration.md).

```js
dataProvider: {
  refetchAfterCreate: false,
  onRowsCreate: async ({ position, referenceRowId, rowsAmount }) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({ position, referenceRowId, rowsAmount }),
    });
    const created = await response.json();
    const rows = hot.getSourceData();

    rows.push(...created);
    hot.updateData(rows);

    return created;
  },
},
```

Create, update, and remove requests are **serialized**: if the user triggers another mutation before the previous one finishes, work runs in order so your backend sees a single stream of operations.

### `onRowsUpdate`

Called with an array of `{ id, changes, rowData }`:

- `id` — stable row id (same as `rowId`).
- `changes` — map of property names to new cell values.
- `rowData` — optional full row snapshot; Handsontable fills it when applying edits from the grid.

One batch usually corresponds to one user action (typing a cell, paste, autofill, clear column, and similar). Implement your PATCH or PUT logic here, then rely on the refetch that follows a successful mutation.

### `onRowsRemove`

Called with an array of row ids to delete. After success, Handsontable refetches and may move to the previous page if the current page becomes empty.

### Programmatic CRUD

From the plugin instance (`hot.getPlugin('dataProvider')`), you can also call [`createRows`](@/api/dataProvider.md#createrows), [`updateRows`](@/api/dataProvider.md#updaterows), and [`removeRows`](@/api/dataProvider.md#removerows) with the same shapes as the callbacks above.

### Mutation hooks

- [`beforeRowsMutation`](@/api/hooks.md#beforerowsmutation) — `(operation, payload)`; return `false` to cancel. For **create** and **remove**, the server callback is not invoked and there is no refetch. For **update** from the grid, `false` reverts optimistic cell values and skips `onRowsUpdate`; cell validators run only when the hook allows the mutation to continue.
- [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation) — runs after the server mutation callback succeeds and before the post-mutation refetch (for `create`, the refetch is skipped when `refetchAfterCreate` is `false`).
- [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) — runs when the mutation callback throws or rejects, when validation fails before the request, or when the refetch after a successful update fails.

`operation` is `'create'`, `'update'`, or `'remove'`. The hook `payload` is a wrapper object, not the same reference as the callback argument: `'create'` uses `{ rowsCreate }` (same inner shape as `onRowsCreate`), `'update'` uses `{ rows }` (the array passed to `onRowsUpdate`), and `'remove'` uses `{ rowsRemove }` (the id array passed to `onRowsRemove`).

When the server callback succeeds but the following refetch fails, `afterRowsMutationError` still uses the same `operation` as the mutation (`'update'`, `'create'`, or `'remove'`). Use [`afterDataProviderFetchError`](@/api/hooks.md#afterdataproviderfetcherror) if you need to handle fetch failures separately from rejected mutation callbacks.

### Undo stack

When `onRowsUpdate` is set, Handsontable skips stacking certain edit sources on the local undo stack so client undo does not fight server-backed data (including `edit`, paste, cut, autofill, **Clear column** from the context menu, and revert after a failed `onRowsUpdate`). See [Undo/Redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md) for the general model.

## More in this guide

<div class="boxes-list">

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- [Migrate from client-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md)
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md)
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md)

</div>
