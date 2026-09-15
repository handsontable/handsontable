---
title: Endpoints
metaTitle: Endpoints API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L639

:::

_endpoints.currentEndpoint : object_

The current endpoint (calculation destination point) in question.

**Default**: <code>null</code>  


### endpoints

::: ask-about-api endpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L627

:::

_endpoints.endpoints : Array_

Array of declared plugin endpoints (calculation destination points).

**Default**: <code>{Array} Empty array.</code>  


### settingsType

::: ask-about-api settingsType|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L633

:::

_endpoints.settingsType : string_

Settings type. Can be either 'array' or 'function'.

**Default**: <code>&quot;{&#x27;array&#x27;}&quot;</code>  

## Methods

### assignSetting

::: ask-about-api assignSetting|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L228

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L144

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L101

:::

_endpoints.countAddressableRows() ⇒ number_

Returns the number of rows an endpoint may address, that is the physical row count capped by
`maxRows`. Used for the settings defaults that need a row count rather than a bounds check.

`maxRows` is normalized the same way `DataMap#getLength` does it: `0` or less means zero rows,
anything falsy means no cap.



### countPhysicalRows

::: ask-about-api countPhysicalRows|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L90

:::

_endpoints.countPhysicalRows() ⇒ number_

Returns the number of physical rows the dataset holds, ignoring trimming.

Endpoint destination rows and calculation ranges are physical indexes, so they must never be
compared against `countRows()` - that counts only the *visible* rows and shrinks whenever a
plugin trims rows (NestedRows collapsing a group, TrimRows, the Filters plugin).



### getAllEndpoints

::: ask-about-api getAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L131

:::

_endpoints.getAllEndpoints() ⇒ Array_

Get an array with all the endpoints.



### getEndpoint

::: ask-about-api getEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L76

:::

_endpoints.getEndpoint(index) ⇒ object_

Get a single endpoint object.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index of the endpoint. |



### initEndpoints

::: ask-about-api initEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L67

:::

_endpoints.initEndpoints()_

Initialize the endpoints provided in the settings.



### isEndpointOutOfBounds

::: ask-about-api isEndpointOutOfBounds|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L122

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



### isSummaryDestination

::: ask-about-api isSummaryDestination|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L165

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L185

:::

_endpoints.parseSettings(settings) ⇒ Array&lt;object&gt;_

Parse plugin's settings.


| Param | Type | Description |
| --- | --- | --- |
| settings | `Array` | The settings array. |



### refreshAllEndpoints

::: ask-about-api refreshAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L454

:::

_endpoints.refreshAllEndpoints()_

Calculate and refresh all defined endpoints.



### refreshCellMetas

::: ask-about-api refreshCellMetas|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L523

:::

_endpoints.refreshCellMetas()_

Refreshes the cell meta information for the all endpoints after the `updateSettings` method call which in some
cases (call with `columns` option) can reset the cell metas to the initial state.



### refreshChangedEndpoints

::: ask-about-api refreshChangedEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L473

:::

_endpoints.refreshChangedEndpoints(changes)_

Calculate and refresh endpoints only in the changed columns.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | Array of changes from the `afterChange` hook. |



### refreshEndpoint

::: ask-about-api refreshEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L541

:::

_endpoints.refreshEndpoint(endpoint)_

Calculate and refresh a single endpoint.


| Param | Type | Description |
| --- | --- | --- |
| endpoint | `object` | Contains the endpoint information. |



### refreshEndpointsBySourceColumns

::: ask-about-api refreshEndpointsBySourceColumns|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L501

:::

_endpoints.refreshEndpointsBySourceColumns(visualColumns)_

Calculate and refresh endpoints whose `sourceColumn` (visual) matches any of the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| visualColumns | `Set<number>` <br/> `Array<number>` | Visual column indexes to match against. |



### resetAllEndpoints

::: ask-about-api resetAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L436

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L552

:::

_endpoints.resetEndpointValue(endpoint, [useOffset])_

Reset the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [useOffset] | `boolean` | <code>true</code> | `optional` Use the cell offset value. |



### setEndpointValue

::: ask-about-api setEndpointValue|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/columnSummary/endpoints.ts#L573

:::

_endpoints.setEndpointValue(endpoint, [source], [render])_

Set the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [source] | `string` |  | `optional` Source of the call information. |
| [render] | `boolean` | <code>false</code> | `optional` `true` if it needs to render the table afterwards. |


