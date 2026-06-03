# DataProvider plugin — server-backed grids and error UI

The `dataProvider` plugin backs the grid with a remote source via `fetchRows` and CRUD callbacks (`onRowsCreate` / `onRowsUpdate` / `onRowsRemove`). Read this before touching `dataProvider.ts` or wiring up error handling.

## Error UI contract (the trap)

- **Built-in error toasts require the `notification` plugin.** Enable `notification` (`notification: true` or a config object) to get toasts on failed fetches or mutations. **`dialog: true` alone does NOT show these errors** — Dialog is for blocking overlays (Loading, ExportFile export progress, custom modal content), not fetch/mutation errors.
- **Fetch-failure toasts include a Refetch button** that calls `fetchData()` again. The toast uses `duration: 0`, so it stays until dismissed or Refetch is clicked.
- **For custom error UI when Notification is disabled**, hook `afterDataProviderFetchError` and `afterRowsMutationError` instead of relying on the built-in toasts.

## Where to look next

- Plugin source: `dataProvider.ts`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
- Data flow and error-UI architecture: `handsontable/.ai/ARCHITECTURE.md` (Plugin System).
