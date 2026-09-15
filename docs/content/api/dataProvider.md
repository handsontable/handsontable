---
title: DataProvider
metaTitle: DataProvider API reference – JavaScript Data Grid | Handsontable
permalink: /api/data-provider
canonicalUrl: /api/data-provider
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description



## Description

Initializes the data provider with a reference to the Handsontable instance used to retrieve data for export.


## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L242

:::

_DataProvider.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### options

::: ask-about-api options|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L784

:::

_dataProvider.options : object_

Format type class options.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L225

:::

_DataProvider.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L230

:::

_DataProvider.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L235

:::

_DataProvider.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L247

:::

_DataProvider.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### _appendNestedHeaderWithHidden

::: ask-about-api _appendNestedHeaderWithHidden|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L422

:::

_dataProvider.\_appendNestedHeaderWithHidden(nestedHeadersPlugin, layer, col, endCol, layerHeaders) ⇒ number_

Appends a nested header entry for a single column when hidden columns are included in the export.


| Param | Type | Description |
| --- | --- | --- |
| nestedHeadersPlugin | `object` | The NestedHeaders plugin instance. |
| layer | `number` | The header layer index. |
| col | `number` | The current column index. |
| endCol | `number` | The last column index of the export range. |
| layerHeaders | `Array` | The array to push the header entry into. |


**Returns**: `number` - The next column index to process.  

### _appendNestedHeaderWithoutHidden

::: ask-about-api _appendNestedHeaderWithoutHidden|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L462

:::

_dataProvider.\_appendNestedHeaderWithoutHidden(nestedHeadersPlugin, layer, col, endCol, layerHeaders) ⇒ number_

Appends a nested header entry for a single column when hidden columns are excluded from the export.


| Param | Type | Description |
| --- | --- | --- |
| nestedHeadersPlugin | `object` | The NestedHeaders plugin instance. |
| layer | `number` | The header layer index. |
| col | `number` | The current column index. |
| endCol | `number` | The last column index of the export range. |
| layerHeaders | `Array` | The array to push the header entry into. |


**Returns**: `number` - The next column index to process.  

### createRows

::: ask-about-api createRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L391

:::

_dataProvider.createRows([options]) ⇒ Promise&lt;void&gt;_

Server create via `onRowsCreate`. Use `rowsAmount` to insert more than one row in one call.


| Param | Type | Description |
| --- | --- | --- |
| [options] | `object` | `optional` `position`, `referenceRowId`, `rowsAmount`. |



### destroy

::: ask-about-api destroy|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L482

:::

_dataProvider.destroy()_

Destroys the plugin.



### disablePlugin

::: ask-about-api disablePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L291

:::

_dataProvider.disablePlugin()_

Disables the plugin, aborts fetch, resets query state.
Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
The constructor registers [[Hooks#hasExternalDataSource]] for the period before the first `enablePlugin()`;
`enablePlugin()` registers it again so it survives each `updatePlugin()` cycle.



### enablePlugin

::: ask-about-api enablePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L259

:::

_dataProvider.enablePlugin()_

Enables the plugin, syncs query parameters from Pagination, ColumnSorting, and Filters, and registers hooks.



### fetchData

::: ask-about-api fetchData|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L321

:::

_dataProvider.fetchData([overrides]) ⇒ Promise&lt;({rows: Array&lt;\*&gt;, totalRows: number}\|null)&gt;_

Fetches rows from `fetchRows` with current or overridden query parameters.

**Emits**: [`Hooks#event:afterDataProviderFetch](@/api/hooks.md#afterdataproviderfetch) when data loads.`, [`Hooks#event:afterDataProviderFetchError](@/api/hooks.md#afterdataproviderfetcherror) when &#x60;fetchRows&#x60; throws a non-abort error.`, `Hooks#afterDataProviderFetchAbort when the request is superseded, aborted,event: or ends with &#x60;AbortError&#x60;.`  

| Param | Type | Description |
| --- | --- | --- |
| [overrides] | `object` | `optional` Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`). Pass `{ skipLoading: true }` to mark internal refetches (for example sort or CRUD); [[Hooks#beforeDataProviderFetch]] receives it, and it is not passed to `fetchRows`. Numeric `page` is clamped to at least 1. When the response `totalRows` implies fewer pages than the requested `page`, fetches again at the last valid page without applying the out-of-range result (avoids redundant `afterPageChange` loads and aborted duplicate requests after row removal on the last page). |



### getCellElements

::: ask-about-api getCellElements|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L258

:::

_dataProvider.getCellElements() ⇒ Array_

Gets rendered DOM elements for all cells in the export range.

Returns a 2D array of `HTMLElement | null` values with the same structure as
[DataProvider#getCellsMeta](@/api/dataProvider.md#getcellsmeta). An entry is `null` when the cell is outside
the rendered viewport (virtualised grid).



### getCellsMeta

::: ask-about-api getCellsMeta|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L243

:::

_dataProvider.getCellsMeta() ⇒ Array_

Gets cell meta for all cells in the export range.

Returns a 2D array of cell meta objects with the same structure as [DataProvider#getData](@/api/dataProvider.md#getdata).
Each entry corresponds to the cell at the same position in the data array.



### getColumnHeaders

::: ask-about-api getColumnHeaders|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L79

:::

_dataProvider.getColumnHeaders() ⇒ Array_

Gets list of columns headers.



### getColumnHeadersClassNames

::: ask-about-api getColumnHeadersClassNames|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L499

:::

_dataProvider.getColumnHeadersClassNames() ⇒ Array&lt;string&gt;_

Gets `headerClassName` values for all visible column headers in the export range.

Returns values in the same column order as [DataProvider#getColumnHeaders](@/api/dataProvider.md#getcolumnheaders).
An empty string is returned for columns that have no `headerClassName` configured.



### getColumnSummaries

::: ask-about-api getColumnSummaries|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L542

:::

_dataProvider.getColumnSummaries() ⇒ Array_

Gets column summary endpoint descriptors from the ColumnSummary plugin, translated
into the coordinate space of the exported data array.

Returns an empty array when the plugin is absent or disabled.
Each descriptor contains:

- `destRow` / `destCol` — 0-based indices into `getData()` identifying the destination cell.
- `type` — lowercase summary type (`'sum'`, `'min'`, `'max'`, `'count'`, `'average'`, `'custom'`).
- `sourceCol` — 0-based data-array column index of the source column.
- `sourceRanges` — array of `[startDataRow, endDataRow]` pairs (inclusive, 0-based) covering
  the source rows after hidden-row exclusion and range clamping.



### getColumnsWidths

::: ask-about-api getColumnsWidths|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L321

:::

_dataProvider.getColumnsWidths() ⇒ Array_

Gets widths (in pixels) for all visible columns in the export range.

Returns values in the same column order as [DataProvider#getData](@/api/dataProvider.md#getdata).



### getData

::: ask-about-api getData|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L54

:::

_dataProvider.getData() ⇒ Array_

Get table data based on provided settings to the class constructor.



### getExcludedHiddenColumns

::: ask-about-api getExcludedHiddenColumns|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L161

:::

_dataProvider.getExcludedHiddenColumns() ⇒ Set&lt;number&gt;_

Returns the set of physical HOT column indices that are hidden and excluded from the
exported data matrix (i.e. `exportHiddenColumns` is `false` and the column is hidden).

Returns an empty set when `exportHiddenColumns` is `true` or `'hide'`, because in
those cases all columns are included in the data matrix and no formula-offset
adjustment is needed.

Used by the formula normalizer to adjust per-reference column offsets when building
live Excel formulas from HyperFormula formula strings.



### getExcludedHiddenRows

::: ask-about-api getExcludedHiddenRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L136

:::

_dataProvider.getExcludedHiddenRows() ⇒ Set&lt;number&gt;_

Returns the set of physical HOT row indices that are hidden and excluded from the
exported data matrix (i.e. `exportHiddenRows` is `false` and the row is hidden).

Returns an empty set when `exportHiddenRows` is `true` or `'hide'`, because in
those cases all rows are included in the data matrix and no formula-offset
adjustment is needed.

Used by the formula normalizer to adjust per-reference row offsets when building
live Excel formulas from HyperFormula formula strings.



### getFormulasSeparator

::: ask-about-api getFormulasSeparator|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L229

:::

_dataProvider.getFormulasSeparator() ⇒ string_

Gets the function argument separator used by the HyperFormula engine, if active.

Returns `','` when the Formulas plugin is absent or disabled, since that is the
separator OOXML (Excel) always expects.



### getFrozenColumns

::: ask-about-api getFrozenColumns|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L372

:::

_dataProvider.getFrozenColumns() ⇒ number_

Gets the number of frozen columns (`fixedColumnsStart` setting).



### getFrozenRows

::: ask-about-api getFrozenRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L365

:::

_dataProvider.getFrozenRows() ⇒ number_

Gets the number of frozen rows (`fixedRowsTop` setting).



### getHiddenColumnDataIndices

::: ask-about-api getHiddenColumnDataIndices|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L207

:::

_dataProvider.getHiddenColumnDataIndices() ⇒ Array&lt;number&gt;_

Returns the 0-based data-array column indices for columns that are hidden in
Handsontable and are included in the exported data matrix.

Only returns a non-empty array when `exportHiddenColumns` is `'hide'`.
When `true`, all columns are visible in Excel. When `false`, hidden columns
are omitted entirely and there is nothing to mark as hidden.



### getHiddenRowDataIndices

::: ask-about-api getHiddenRowDataIndices|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L183

:::

_dataProvider.getHiddenRowDataIndices() ⇒ Array&lt;number&gt;_

Returns the 0-based data-array row indices for rows that are hidden in
Handsontable and are included in the exported data matrix.

Only returns a non-empty array when `exportHiddenRows` is `'hide'`.
When `true`, all rows are visible in Excel. When `false`, hidden rows
are omitted entirely and there is nothing to mark as hidden.



### getLayoutDirection

::: ask-about-api getLayoutDirection|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L525

:::

_dataProvider.getLayoutDirection() ⇒ 'ltr' | 'rtl'_

Gets the layout direction of the Handsontable instance.



### getMergeCells

::: ask-about-api getMergeCells|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L273

:::

_dataProvider.getMergeCells() ⇒ Array_

Gets the merged cells configuration filtered to the current export range.

Returned coordinates are 0-based data-array indices (matching the same coordinate
space as [DataProvider#getData](@/api/dataProvider.md#getdata)). Hidden rows/columns excluded from the export
are accounted for: the row/col offsets are compressed and the rowspan/colspan values
are reduced to cover only the exported cells within the merge span.

Merges whose top-left cell is excluded, or that collapse to a single cell after
exclusion, are omitted from the result.



### getNestedColumnHeaders

::: ask-about-api getNestedColumnHeaders|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L385

:::

_dataProvider.getNestedColumnHeaders() ⇒ Array&lt;Array&gt; | null_

Gets nested column header data from the NestedHeaders plugin for the current export range.

Returns `null` when the NestedHeaders plugin is not enabled. Otherwise returns an array
of layers, where each layer is an array of `{ label, colspan, className }` objects
representing the visible column headers in that layer. Hidden columns (when
`exportHiddenColumns` is `false`) are excluded and their colspan contribution is removed
from spanning headers.



### getQueryParameters

::: ask-about-api getQueryParameters|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L300

:::

_dataProvider.getQueryParameters() ⇒ DataProviderQueryParameters_


**Returns**: `DataProviderQueryParameters` - Copy of current query parameters (`sort` and `filters` are cloned when non-null).  

### getRowHeaders

::: ask-about-api getRowHeaders|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L61

:::

_dataProvider.getRowHeaders() ⇒ Array_

Gets list of row headers.



### getRowId

::: ask-about-api getRowId|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L306

:::

_dataProvider.getRowId(visualRow) ⇒ \*_


| Param | Type | Description |
| --- | --- | --- |
| visualRow | `number` | Visual row index. |


**Returns**: `*` - Row id from `rowId` option, or undefined.  

### getRowsHeights

::: ask-about-api getRowsHeights|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L344

:::

_dataProvider.getRowsHeights() ⇒ Array_

Gets heights (in pixels) for all visible rows in the export range.

Returns values in the same row order as [DataProvider#getData](@/api/dataProvider.md#getdata).



### getSourceData

::: ask-about-api getSourceData|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L121

:::

_dataProvider.getSourceData() ⇒ Array_

Get raw source data (formulas) based on provided settings to the class constructor.

Mirrors [DataProvider#getData](@/api/dataProvider.md#getdata) but uses `getSourceDataAtCell` so that cells
containing HyperFormula formulas return the raw formula string (e.g. `'=SUM(A1:A3)'`)
rather than the calculated value.



### isEnabled

::: ask-about-api isEnabled|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L254

:::

_dataProvider.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### removeRows

::: ask-about-api removeRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L421

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



### setOptions

::: ask-about-api setOptions|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/exportFile/dataProvider.ts#L19

:::

_dataProvider.setOptions(options)_

Set options for data provider.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Object with specified options. |



### updatePlugin

::: ask-about-api updatePlugin|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L278

:::

_dataProvider.updatePlugin()_

Re-applies settings and refetches when the instance is already initialized.



### updateRows

::: ask-about-api updateRows|DataProvider

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dataProvider/dataProvider.ts#L465

:::

_dataProvider.updateRows(rows) ⇒ Promise&lt;void&gt;_

Server update via `onRowsUpdate`. Pass an array of `{ id, changes, rowData? }` (same shape as `onRowsUpdate`).

**Throws**:

- <code>Error</code> When any payload omits `id` or `id` is `null`.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array<object>` | Row update payloads (one or more). |


