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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L490

:::

_endpoints.currentEndpoint : object_

The current endpoint (calculation destination point) in question.

**Default**: <code>null</code>  


### endpoints

::: ask-about-api endpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L478

:::

_endpoints.endpoints : Array_

Array of declared plugin endpoints (calculation destination points).

**Default**: <code>{Array} Empty array.</code>  


### settingsType

::: ask-about-api settingsType|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L484

:::

_endpoints.settingsType : string_

Settings type. Can be either 'array' or 'function'.

**Default**: <code>&quot;{&#x27;array&#x27;}&quot;</code>  

## Methods

### assignSetting

::: ask-about-api assignSetting|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L104

:::

_endpoints.assignSetting(settings, endpoint, name, defaultValue)_

Setter for the internal setting objects.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | Object with the settings. |
| endpoint | `object` | Contains information about the endpoint for the the calculation. |
| name | `string` | Settings name. |
| defaultValue | `object` | Default value for the settings. |



### getAllEndpoints

::: ask-about-api getAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L41

:::

_endpoints.getAllEndpoints() ⇒ Array_

Get an array with all the endpoints.



### getEndpoint

::: ask-about-api getEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L31

:::

_endpoints.getEndpoint(index) ⇒ object_

Get a single endpoint object.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index of the endpoint. |



### initEndpoints

::: ask-about-api initEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L22

:::

_endpoints.initEndpoints()_

Initialize the endpoints provided in the settings.



### parseSettings

::: ask-about-api parseSettings|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L61

:::

_endpoints.parseSettings(settings) ⇒ Array&lt;object&gt;_

Parse plugin's settings.


| Param | Type | Description |
| --- | --- | --- |
| settings | `Array` | The settings array. |



### refreshAllEndpoints

::: ask-about-api refreshAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L335

:::

_endpoints.refreshAllEndpoints()_

Calculate and refresh all defined endpoints.



### refreshCellMetas

::: ask-about-api refreshCellMetas|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L396

:::

_endpoints.refreshCellMetas()_

Refreshes the cell meta information for the all endpoints after the `updateSettings` method call which in some
cases (call with `columns` option) can reset the cell metas to the initial state.



### refreshChangedEndpoints

::: ask-about-api refreshChangedEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L352

:::

_endpoints.refreshChangedEndpoints(changes)_

Calculate and refresh endpoints only in the changed columns.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | Array of changes from the `afterChange` hook. |



### refreshEndpoint

::: ask-about-api refreshEndpoint|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L410

:::

_endpoints.refreshEndpoint(endpoint)_

Calculate and refresh a single endpoint.


| Param | Type | Description |
| --- | --- | --- |
| endpoint | `object` | Contains the endpoint information. |



### refreshEndpointsBySourceColumns

::: ask-about-api refreshEndpointsBySourceColumns|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L378

:::

_endpoints.refreshEndpointsBySourceColumns(visualColumns)_

Calculate and refresh endpoints whose `sourceColumn` (visual) matches any of the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| visualColumns | `Set<number>` <br/> `Array<number>` | Visual column indexes to match against. |



### resetAllEndpoints

::: ask-about-api resetAllEndpoints|Endpoints

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L312

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L421

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/endpoints.ts#L436

:::

_endpoints.setEndpointValue(endpoint, [source], [render])_

Set the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [source] | `string` |  | `optional` Source of the call information. |
| [render] | `boolean` | <code>false</code> | `optional` `true` if it needs to render the table afterwards. |


