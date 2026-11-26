---
title: Endpoints
metaTitle: Endpoints API reference | Handsontable DataGrid for JavaScript
permalink: /api/endpoints
canonicalUrl: /api/endpoints
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Class used to make all endpoint-related operations.



## Description

Initializes the endpoints manager with a reference to the ColumnSummary plugin and the summary endpoint configuration.


## Members

### currentEndpoint

::: ask-about-api currentEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L908

:::

_endpoints.currentEndpoint : object_

The current endpoint (calculation destination point) in question.

**Default**: <code>null</code>  


### endpoints

::: ask-about-api endpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L896

:::

_endpoints.endpoints : Array_

Array of declared plugin endpoints (calculation destination points).

**Default**: <code>{Array} Empty array.</code>  


### settingsType

::: ask-about-api settingsType|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L902

:::

_endpoints.settingsType : string_

Settings type. Can be either 'array' or 'function'.

**Default**: <code>&quot;{&#x27;array&#x27;}&quot;</code>  

## Methods

### assignSetting

::: ask-about-api assignSetting|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L443

:::

_endpoints.assignSetting(settings, endpoint, name, defaultValue)_

Setter for the internal setting objects.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | Object with the settings. |
| endpoint | `object` | Contains information about the endpoint for the the calculation. |
| name | `string` | Settings name. |
| defaultValue | `object` | Default value for the settings. |



### cacheSummaryDestinations

::: ask-about-api cacheSummaryDestinations|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L300

:::

_endpoints.cacheSummaryDestinations(endpoints)_

Records the destinations of the endpoints a refresh pass is about to calculate.

The resolved endpoints are passed in rather than read through `getAllEndpoints()`, which would
re-invoke a settings function and could describe a different layout than the pass is working on.


| Param | Type | Description |
| --- | --- | --- |
| endpoints | `Array<object>` | The endpoints the current pass will calculate. |



### countAddressableRows

::: ask-about-api countAddressableRows|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L257

:::

_endpoints.countAddressableRows() ⇒ number_

Returns the number of rows an endpoint may address, that is the physical row count capped by
`maxRows`. Used for the settings defaults that need a row count rather than a bounds check.

`maxRows` is normalized the same way `DataMap#getLength` does it: `0` or less means zero rows,
anything falsy means no cap.



### countPhysicalRows

::: ask-about-api countPhysicalRows|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L246

:::

_endpoints.countPhysicalRows() ⇒ number_

Returns the number of physical rows the dataset holds, ignoring trimming.

Endpoint destination rows and calculation ranges are physical indexes, so they must never be
compared against `countRows()` - that counts only the *visible* rows and shrinks whenever a
plugin trims rows (NestedRows collapsing a group, TrimRows, the Filters plugin).



### exportSettings

::: ask-about-api exportSettings|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L203

:::

_endpoints.exportSettings() ⇒ Array&lt;object&gt; | null_

Returns the endpoints in the form of the plugin's settings, at the positions they hold now. A row or
column alteration shifts an endpoint's destination and ranges, and the settings still name the
positions they declared, so a caller that applies the settings again later (the sheets bar, on a
return to a sheet) applies these instead. A destination counted from the bottom is given back as the
offset it has now, which differs from the declared one once a removal left the summary parked above a
data row, and a whole-table range is left out so it keeps following the table. Returns `null` for the
function form, which reads its settings again on every pass, and before the endpoints are parsed.



### getAllEndpoints

::: ask-about-api getAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L287

:::

_endpoints.getAllEndpoints() ⇒ Array_

Get an array with all the endpoints.



### getDefaultRanges

::: ask-about-api getDefaultRanges|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L841

:::

_endpoints.getDefaultRanges() ⇒ Array&lt;Array&lt;number&gt;&gt;_

Returns the range an endpoint without `ranges` sums: the whole table, or no range at all when the table has
no rows (a `[0, -1]` range would read row `-1`).



### getDestinationEndpoint

::: ask-about-api getDestinationEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L329

:::

_endpoints.getDestinationEndpoint(physicalRow, physicalColumn) ⇒ object | undefined_

Returns the endpoint whose result a physical cell receives, from the endpoints of the current
pass. When two endpoints share a destination, the last one wins, as in `isSummaryDestination()`.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |
| physicalColumn | `number` | Physical column index. |



### getEndpoint

::: ask-about-api getEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L232

:::

_endpoints.getEndpoint(index) ⇒ object_

Get a single endpoint object.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index of the endpoint. |



### initEndpoints

::: ask-about-api initEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L189

:::

_endpoints.initEndpoints()_

Initialize the endpoints provided in the settings.



### isEndpointOutOfBounds

::: ask-about-api isEndpointOutOfBounds|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L278

:::

_endpoints.isEndpointOutOfBounds(endpoint, [rowOffset], [colOffset]) ⇒ boolean_

Checks whether an endpoint points outside the table.

A *trimmed* destination row is not out of bounds - the row exists, it is only hidden - so it is
deliberately not reported here. A row that is visible but sits past `maxRows` is out of bounds,
because the grid renders no cell for it.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [rowOffset] | `number` | <code>0</code> | `optional` Row offset to apply before the check. |
| [colOffset] | `number` | <code>0</code> | `optional` Column offset to apply before the check. |



### isReadOnlyDestination

::: ask-about-api isReadOnlyDestination|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L384

:::

_endpoints.isReadOnlyDestination(physicalRow, column) ⇒ boolean_

Checks whether a physical cell holds the result of an endpoint configured as `readOnly`.

The plugin owns the `readOnly` state of such a cell, so it is locked against any other write
(see `ColumnSummary#isLockedSummaryCell`). An endpoint configured `readOnly: false` is not
reported, which leaves its cell as toggleable as any other.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |
| column | `number` | Column index. |



### isSummaryDestination

::: ask-about-api isSummaryDestination|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L368

:::

_endpoints.isSummaryDestination(physicalRow, column) ⇒ boolean_

Checks whether a physical cell holds the result of an endpoint.

`getCellValue` normally recognizes a result by its `columnSummaryResult` class, but cell meta is
addressed by visual coordinates, so a trimmed row has no readable class. Without this check a
hidden summary row is summed as if it were plain data and inflates every summary covering it.


| Param | Type | Description |
| --- | --- | --- |
| physicalRow | `number` | Physical row index. |
| column | `number` | Column index. |



### parseSettings

::: ask-about-api parseSettings|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L404

:::

_endpoints.parseSettings(settings) ⇒ Array&lt;object&gt;_

Parse plugin's settings.


| Param | Type | Description |
| --- | --- | --- |
| settings | `Array` | The settings array. |



### refreshAllEndpoints

::: ask-about-api refreshAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L651

:::

_endpoints.refreshAllEndpoints()_

Calculate and refresh all defined endpoints.



### refreshCellMetas

::: ask-about-api refreshCellMetas|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L736

:::

_endpoints.refreshCellMetas()_

Refreshes the cell meta information for the all endpoints after the `updateSettings` method call which in some
cases (call with `columns` option) can reset the cell metas to the initial state.



### refreshChangedEndpoints

::: ask-about-api refreshChangedEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L672

:::

_endpoints.refreshChangedEndpoints(changes)_

Calculate and refresh endpoints only in the changed columns.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | Array of changes from the `afterChange` hook. |



### refreshEndpoint

::: ask-about-api refreshEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L759

:::

_endpoints.refreshEndpoint(endpoint)_

Calculate and refresh a single endpoint.

The refresh can run inside another endpoint's calculation: a cell read there can run a pending
Formulas resync, whose values update refreshes the endpoints again. The endpoint it replaced is
therefore put back on exit, not cleared, or the outer calculation reads a `null` endpoint.


| Param | Type | Description |
| --- | --- | --- |
| endpoint | `object` | Contains the endpoint information. |



### refreshEndpointsBySourceColumns

::: ask-about-api refreshEndpointsBySourceColumns|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L711

:::

_endpoints.refreshEndpointsBySourceColumns(physicalColumns)_

Calculate and refresh endpoints whose `sourceColumn` (physical) matches any of the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| physicalColumns | `Set<number>` <br/> `Array<number>` | Physical column indexes to match against. |



### resetAllEndpoints

::: ask-about-api resetAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L633

:::

_endpoints.resetAllEndpoints([endpoints], [useOffset])_

Resets (removes) the endpoints from the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [endpoints] | `Array` |  | `optional` Array containing the endpoints. |
| [useOffset] | `boolean` | <code>true</code> | `optional` Use the cell offset value. |



### resetEndpointValue

::: ask-about-api resetEndpointValue|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L770

:::

_endpoints.resetEndpointValue(endpoint, [useOffset])_

Reset the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [useOffset] | `boolean` | <code>true</code> | `optional` Use the cell offset value. |



### resolveDependencyResult

::: ask-about-api resolveDependencyResult|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L348

:::

_endpoints.resolveDependencyResult(endpoint) ⇒ number | string | null_

Returns the result an endpoint writes into its destination cell, for an `includeSummaryResults`
endpoint that has that cell in its range. The endpoint is calculated once per pass, so the value
is fresh whatever the declaration order, and it is read from the endpoint, not from the cell: the
cell writes are batched, and a trimmed destination is never written.

The value is rounded the way `setEndpointValue()` rounds it, and the rounded value is kept on the
endpoint, so `endpoint.result` matches the cell whether or not the endpoint is refreshed in this
pass. A result that holds no number (`'Not enough data'`) answers `null`, and so does an endpoint
whose calculation is already running (two endpoints include each other), which warns once per pass.


| Param | Type | Description |
| --- | --- | --- |
| endpoint | `object` | The endpoint whose result is included. |



### setEndpointValue

::: ask-about-api setEndpointValue|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/columnSummary/endpoints.ts#L792

:::

_endpoints.setEndpointValue(endpoint, [source], [render])_

Set the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [source] | `string` |  | `optional` Source of the call information. |
| [render] | `boolean` | <code>false</code> | `optional` `true` if it needs to render the table afterwards. |


