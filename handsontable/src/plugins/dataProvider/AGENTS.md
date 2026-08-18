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

## Where to look next

- Plugin source: `dataProvider.ts`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
- Data flow and error-UI architecture: `handsontable/.ai/ARCHITECTURE.md` (Plugin System).
