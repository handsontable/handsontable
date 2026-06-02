---
type: reference
id: p9q3r6s1
title: Server-side CRUD
metaTitle: Server-side CRUD - JavaScript Data Grid | Handsontable
description: Handsontable dataProvider create, update, and remove—onRowsCreate, onRowsUpdate, onRowsRemove, mutation hooks, optimistic UI, validators, and programmatic CRUD.
permalink: /server-side-data-crud
canonicalUrl: /server-side-data-crud
tags:
  - data provider
  - server-side
  - CRUD
react:
  id: v8y4r0p6
  metaTitle: Server-side CRUD - React Data Grid | Handsontable
angular:
  id: w9z5s1q7
  metaTitle: Server-side CRUD - Angular Data Grid | Handsontable
vue:
  id: aryloxoj
  metaTitle: Server-side CRUD - Vue Data Grid | Handsontable
searchCategory: Guides
category: Server-side data
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

Your API should create the rows and return a promise. Handsontable refetches the current query after success.

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
- [`afterRowsMutation`](@/api/hooks.md#afterrowsmutation) — runs after the server mutation callback succeeds and before the post-mutation refetch.
- [`afterRowsMutationError`](@/api/hooks.md#afterrowsmutationerror) — runs when the mutation callback throws or rejects, when validation fails before the request, or when the refetch after a successful update fails.

`operation` is `'create'`, `'update'`, or `'remove'`. The hook `payload` is a wrapper object, not the same reference as the callback argument: `'create'` uses `{ rowsCreate }` (same inner shape as `onRowsCreate`), `'update'` uses `{ rows }` (the array passed to `onRowsUpdate`), and `'remove'` uses `{ rowsRemove }` (the id array passed to `onRowsRemove`).

When the server callback succeeds but the following refetch fails, `afterRowsMutationError` still uses the same `operation` as the mutation (`'update'`, `'create'`, or `'remove'`). Use [[Hooks#afterDataProviderFetchError]] if you need to handle fetch failures separately from rejected mutation callbacks.

### Undo stack

When `onRowsUpdate` is set, Handsontable skips stacking certain edit sources on the local undo stack so client undo does not fight server-backed data (including `edit`, paste, cut, autofill, **Clear column** from the context menu, and revert after a failed `onRowsUpdate`). See [Undo/Redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md) for the general model.

## More in this guide

<div class="boxes-list">

- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md)
- [Migrate from client-side data](@/guides/getting-started/server-side-data/server-side-data-migration.md)
- [Configuration and query parameters](@/guides/getting-started/server-side-data/server-side-data-configuration.md)
- [Fetching, hooks, and examples](@/guides/getting-started/server-side-data/server-side-data-fetching.md)

</div>
