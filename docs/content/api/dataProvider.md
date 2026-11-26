---
title: DataProvider
metaTitle: DataProvider API reference | Handsontable DataGrid for JavaScript
permalink: /api/data-provider
canonicalUrl: /api/data-provider
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) guide for examples and configuration details.


## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L555

:::

_DataProvider.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L539

:::

_DataProvider.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L528

:::

_DataProvider.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L533

:::

_DataProvider.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L547

:::

_DataProvider.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`. Besides its own key,
the settings of the plugins the query reads: re-applying one of them resets the page, sort, or filters, so the
query has to be read again and the rows fetched for it. The framework wrappers pass only the settings that
changed, so such a setting usually arrives without `dataProvider`.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L560

:::

_DataProvider.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### createRows

::: ask-about-api createRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L710

:::

_dataProvider.createRows([options]) ⇒ Promise&lt;void&gt;_

Server create via `onRowsCreate`. Use `rowsAmount` to insert more than one row in one call.
After a successful `onRowsCreate`, refetches the current query unless `refetchAfterCreate` is `false`;
[Hooks#afterRowsMutation](@/api/hooks.md#afterrowsmutation) fires in both cases. With the refetch off, a `fetchRows` request that is
still in flight when the create finishes (a sort or filter change made just before) would otherwise resolve
later and `loadData()` the rows `onRowsCreate` applied out of the grid, so that one case refetches anyway
(superseding the pending request, which fires [Hooks#afterDataProviderFetchAbort](@/api/hooks.md#afterdataproviderfetchabort)). With the
[SheetsBar](@/api/sheetsBar.md) plugin, a create that finishes while its sheet is not shown refetches that sheet anyway too:
the grid shows another sheet then, so `onRowsCreate` has no grid to apply the rows to.


| Param | Type | Description |
| --- | --- | --- |
| [options] | `object` | `optional` `position`, `referenceRowId`, `rowsAmount`. |



### destroy

::: ask-about-api destroy|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L967

:::

_dataProvider.destroy()_

Destroys the plugin.



### disablePlugin

::: ask-about-api disablePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L663

:::

_dataProvider.disablePlugin()_

Disables the plugin, aborts the fetch the grid is waiting for, and resets query state. With the
[SheetsBar](@/api/sheetsBar.md) plugin, fetches of the sheets you do not see keep running.
Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
The constructor registers [Hooks#hasExternalDataSource](@/api/hooks.md#hasexternaldatasource) for the period before the first `enablePlugin()`;
`enablePlugin()` registers it again so it survives each `updatePlugin()` cycle.



### enablePlugin

::: ask-about-api enablePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L572

:::

_dataProvider.enablePlugin()_

Enables the plugin, syncs query parameters from Pagination, ColumnSorting, and Filters, and registers hooks.



### fetchData

::: ask-about-api fetchData|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L690

:::

_dataProvider.fetchData([overrides]) ⇒ Promise&lt;({rows: Array&lt;\*&gt;, totalRows: number}\|null)&gt;_

Fetches rows from `fetchRows` with current or overridden query parameters. With the [SheetsBar](@/api/sheetsBar.md) plugin, it
fetches the sheet you see.

**Emits**: [`Hooks#event:afterDataProviderFetch](@/api/hooks.md#afterdataproviderfetch) when data loads.`, [`Hooks#event:afterDataProviderFetchError](@/api/hooks.md#afterdataproviderfetcherror) when &#x60;fetchRows&#x60; throws a non-abort error.`, `Hooks#afterDataProviderFetchAbort when the request is superseded, aborted,event: or ends with &#x60;AbortError&#x60;.`  

| Param | Type | Description |
| --- | --- | --- |
| [overrides] | `object` | `optional` Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`). Pass `{ skipLoading: true }` to mark internal refetches (for example sort or CRUD); [Hooks#beforeDataProviderFetch](@/api/hooks.md#beforedataproviderfetch) receives it, and it is not passed to `fetchRows`. Numeric `page` is clamped to at least 1. When the response `totalRows` implies fewer pages than the requested `page`, fetches again at the last valid page without applying the out-of-range result (avoids redundant `afterPageChange` loads and aborted duplicate requests after row removal on the last page). |



### getQueryParameters

::: ask-about-api getQueryParameters|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L668

:::

_dataProvider.getQueryParameters() ⇒ DataProviderQueryParameters_


**Returns**: `DataProviderQueryParameters` - Copy of current query parameters (`sort` and `filters` are cloned when non-null).  

### getRowId

::: ask-about-api getRowId|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L674

:::

_dataProvider.getRowId(visualRow) ⇒ \*_


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | Visual row index. |


**Returns**: `*` - Row id from `rowId` option, or undefined.  

### isEnabled

::: ask-about-api isEnabled|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L567

:::

_dataProvider.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isFetching

::: ask-about-api isFetching|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L829

:::

_dataProvider.isFetching() ⇒ boolean_

Tells whether the grid is waiting for a `fetchRows` response that shows the loading overlay. A fetch that passes
`skipLoading: true` does not count. The answer is already `false` inside the [Hooks#afterDataProviderFetch](@/api/hooks.md#afterdataproviderfetch),
[Hooks#afterDataProviderFetchError](@/api/hooks.md#afterdataproviderfetcherror), and [Hooks#afterDataProviderFetchAbort](@/api/hooks.md#afterdataproviderfetchabort) listeners of the fetch
that settled, unless another fetch has started in the meantime. With the sheets bar, it answers for the sheet
you see.



### removeRows

::: ask-about-api removeRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L746

:::

_dataProvider.removeRows(rowIds) ⇒ Promise&lt;void&gt;_

Server remove via `onRowsRemove`. Pass one row id or an array of ids.

After a successful `onRowsRemove`, refetches from the server. When the remove clears every row currently
loaded (typical when emptying the last page) and the current page is greater than 1, loads the previous page
in one request. Otherwise refetches the current page, then loads the previous page when that response is empty
and the current page is still greater than 1.

**Throws**:

- <code>Error</code> When any id is `null` or `undefined`.


| Param | Type | Description |
| --- | --- | --- |
| rowIds | `Array<*>` <br/> `*` | Row id or ids. |



### updatePlugin

::: ask-about-api updatePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L606

:::

_dataProvider.updatePlugin([newSettings])_

Re-applies settings and refetches when the instance is already initialized. Two payloads leave the
configuration in place: one whose `dataProvider` is no longer the grid's (an earlier `afterUpdateSettings`
listener replaced it with a nested `updateSettings()` call, which already re-applied the plugin), and one that
sends the `dataProvider` object whose rows the plugin already fetched, which would otherwise abort the running
fetch and refetch the same rows. A payload that also re-applies a plugin the query reads (Pagination,
ColumnSorting, Filters, or `columns`, which clears the sort) runs the full cycle, because that plugin's state
was reset and the query has to be read from it again.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` The settings passed to `updateSettings()`. |



### updateRows

::: ask-about-api updateRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L800

:::

_dataProvider.updateRows(rows) ⇒ Promise&lt;void&gt;_

Server update via `onRowsUpdate`. Pass an array of `{ id, changes, rowData? }` (same shape as `onRowsUpdate`).

**Throws**:

- <code>Error</code> When any payload omits `id` or `id` is `null`.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<object>` | Row update payloads (one or more). |


