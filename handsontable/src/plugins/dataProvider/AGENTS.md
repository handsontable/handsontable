# DataProvider plugin — server-backed grids and error UI

The `dataProvider` plugin backs the grid with a remote source via `fetchRows` and CRUD callbacks (`onRowsCreate` / `onRowsUpdate` / `onRowsRemove`). Read this before touching `dataProvider.ts` or wiring up error handling.

## Error UI contract (the trap)

- **Built-in error toasts require the `notification` plugin.** Enable `notification` (`notification: true` or a config object) to get toasts on failed fetches or mutations. **`dialog: true` alone does NOT show these errors** — Dialog is for blocking overlays (Loading, ExportFile export progress, custom modal content), not fetch/mutation errors.
- **Fetch-failure toasts include a Refetch button** that calls `fetchData()` again. The toast uses `duration: 0`, so it stays until dismissed or Refetch is clicked.
- **For custom error UI when Notification is disabled**, hook `afterDataProviderFetchError` and `afterRowsMutationError` instead of relying on the built-in toasts.

## Who is allowed to let `fetchData()` reject

`fetchData()` fires `afterDataProviderFetchError` and shows the error toast, then rethrows. That rethrow is public API — a caller awaiting `fetchData()` still gets the rejection.

- **Internal fire-and-forget refetches must go through `#fetchDataSilently()`**: the initial load (`afterInit`), `updatePlugin()`, the sort ctx, the filter ctx, and the Refetch toast action. The wrapper logs `Data fetch failed:` and resolves `null`. `void this.fetchData()` does NOT work — `void` discards the value, not the rejection, so a failing `fetchRows` reaches the page as an `unhandledrejection` (Sentry HANDSONTABLE-DOCS-20B / 1JN).
- **`#commitRowsUpdate`'s ctx (`fetchData: () => this.fetchData({ skipLoading: true })`) must keep rejecting.** `query/crud.ts` catches it to revert the optimistic cell values and log `Data reload failed:`. Do not "consistency-fix" this one to the silent wrapper.
- **Pagination ctx callbacks stay rejecting too** — `query/pagination.ts` catches them to revert the page or page size.

## Optional config keys vs the completeness check

`isCompleteDataProviderConfig()` (`utils.ts`) decides `hasExternalDataSource`. It iterates `REQUIRED_CONFIG_KEYS`, **not** `Object.keys(SETTINGS_VALIDATORS)`. Every validator in `SETTINGS_VALIDATORS` runs only when the key is present (`BasePlugin#updatePluginSettings`), but the completeness check runs the validator on the *absent* value. So a new optional key with a strict validator (`refetchAfterCreate`, `typeof value === 'boolean'`) would have made every existing config incomplete and silently turned server mode off — the pre-existing "complete config" unit test fails the moment the check iterates the validator keys again. Add optional keys to `SETTINGS_VALIDATORS` and `DEFAULT_SETTINGS`; add a key to `REQUIRED_CONFIG_KEYS` only when the plugin cannot run without it (DEV-1679).

`refetchAfterCreate` is read from the raw config (`#shouldRefetchAfterCreate()`), like every other key here, not through `getSetting()`. `#pluginSettings` in the base class keeps keys a later `updateSettings()` omits, so `getSetting()` would keep an old `false` alive after the integrator drops the key. Only the create path honors the flag; update and remove keep their unconditional refetch (remove also owns page-rollback logic that a skip would have to reason about).

**A manual apply after `refetchAfterCreate: false` must use `updateData()`, never `loadData()`.** `fetchData()` itself calls `loadData(rows, PLUGIN_KEY)`, and that is a full reload: it re-initializes the index maps, so ColumnSorting's column-state map comes back empty (no `beforeColumnSort`/`afterColumnSort` fires; `getSortConfig()` is just `[]`). The plugin survives this only because `afterDataProviderFetch` carries `columnSortConfig` and ColumnSorting's `#onAfterDataProviderFetch` restores it from the payload. An integrator who runs `hot.loadData(rows)` inside `onRowsCreate` gets the wipe without the restore: the header loses its indicator, and the next `updatePlugin()` copies the empty state into the query, so the following fetch runs unsorted (measured on the DEV-1679 demo page; the ticket's own snippet has this bug, and its `runHooks('afterDataProviderFetch', { queryParameters: {} })` makes it worse because a payload without `columnSortConfig` is read as "no sort"). `updateData(rows)` keeps the sort and the meta. Two gaps stay open as follow-ups: there is no public way to update the Pagination total without firing that hook by hand, and `afterRowsMutation('create')` does not carry the rows `onRowsCreate` resolved with.

**`updateData()` keeps cell meta by physical row, so the documented apply pattern appends.** Only `loadData()` calls `metaManager.clearCellsCache()`; `updateData()` rebuilds the `DataMap` and `fitToLength()`s the row index mapper, which adds the new index at the end. A `splice` into the middle therefore moves the data under the meta: the new row shows the pushed-down row's `readOnly`/comment/invalid mark, and every row below is off by one, until the next fetch. The guide's example uses `push` for that reason (review of #13563); a Playwright spec (`tests/e2e/data-provider-refetch-after-create.spec.ts`) pins that a `readOnly` mark stays on its record across the insert.

**The skip has one exception: an in-flight `fetchRows` forces the refetch anyway.** The old post-create `fetchData()` also aborted whatever fetch was running (a sort or filter fetch started just before the insert) through `#createFetchAbortController()`. With the refetch skipped nothing aborts it, the mutation queue does not wait on fetches, and the integrator has no public cancel, so the late response would `loadData()` the applied row out of the grid. `createRows()` checks `#hasFetchInFlight()` (`#abortController !== null`) and refetches when it is true; `afterDataProviderFetchAbort` fires for the superseded request. `refetchAfterCreate: undefined` is valid (the base plugin validates every key that is `in` the object, and wrapper props send explicit `undefined`), and reads as the default.

## Where to look next

- Plugin source: `dataProvider.ts`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
- Data flow and error-UI architecture: `handsontable/.ai/ARCHITECTURE.md` (Plugin System).

## Testing

From `handsontable/`:

- Unit: `npm run test:unit --testPathPattern=plugins/dataProvider`
- Legacy specs for one area: `npm run test:e2e --testPathPattern=dataProvider/__tests__/methods/createRows` (the pattern is compiled into the bundle; re-run `test:e2e.dump` when you change it)
- Whole plugin: `npm run test:e2e --testPathPattern=plugins/dataProvider`

The `__tests__/` tree is split by kind: `methods/`, `hooks/`, `plugins/` (interactions with Pagination, Filters, ColumnSorting), `query/*.unit.js`, plus `alter.spec.js` for the context-menu insert/remove path. Specs that must assert "no refetch happened" wait on the `afterRowsMutation` spy: the refetch, when enabled, starts synchronously right after that hook, so `fetchRows` already reflects it.
