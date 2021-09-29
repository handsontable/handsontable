---
title: Endpoints
metaTitle: Endpoints - Plugin - Handsontable Documentation
permalink: /10.0/api/endpoints
canonicalUrl: /api/endpoints
hotPlugin: true
editLink: false
---

# Endpoints

[[toc]]

## Description

Class used to make all endpoint-related operations.


## Members

### currentEndpoint
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L49

:::

_endpoints.currentEndpoint : object_

The current endpoint (calculation destination point) in question.

**Default**: <code>null</code>  


### endpoints
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L28

:::

_endpoints.endpoints : Array_

Array of declared plugin endpoints (calculation destination points).

**Default**: <code>{Array} Empty array.</code>  


### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L21

:::

_endpoints.hot : object_

Handsontable instance.



### plugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L15

:::

_endpoints.plugin_

The main plugin instance.



### settings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L35

:::

_endpoints.settings : object | function_

The plugin settings, taken from Handsontable configuration.

**Default**: <code>null</code>  


### settingsType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L42

:::

_endpoints.settingsType : string_

Settings type. Can be either 'array' or 'function.

**Default**: <code>&quot;{&#x27;array&#x27;}&quot;</code>  

## Methods

### assignSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L152

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L79

:::

_endpoints.getAllEndpoints() ⇒ Array_

Get an array with all the endpoints.



### getEndpoint
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L66

:::

_endpoints.getEndpoint(index) ⇒ object_

Get a single endpoint object.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index of the endpoint. |



### parseSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L104

:::

_endpoints.parseSettings(settings) ⇒ Array&lt;object&gt;_

Parse plugin's settings.


| Param | Type | Description |
| --- | --- | --- |
| settings | `Array` | The settings array. |



### refreshAllEndpoints
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L435

:::

_endpoints.refreshAllEndpoints()_

Calculate and refresh all defined endpoints.



### refreshChangedEndpoints
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L455

:::

_endpoints.refreshChangedEndpoints(changes)_

Calculate and refresh endpoints only in the changed columns.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | Array of changes from the `afterChange` hook. |



### refreshEndpoint
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L486

:::

_endpoints.refreshEndpoint(endpoint)_

Calculate and refresh a single endpoint.


| Param | Type | Description |
| --- | --- | --- |
| endpoint | `object` | Contains the endpoint information. |



### resetAllEndpoints
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L404

:::

_endpoints.resetAllEndpoints([endpoints], [useOffset])_

Resets (removes) the endpoints from the table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [endpoints] | `Array` |  | `optional` Array containing the endpoints. |
| [useOffset] | `boolean` | <code>true</code> | `optional` Use the cell offset value. |



### resetEndpointValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L499

:::

_endpoints.resetEndpointValue(endpoint, [useOffset])_

Reset the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [useOffset] | `boolean` | <code>true</code> | `optional` Use the cell offset value. |



### setEndpointValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/columnSummary/endpoints.js#L529

:::

_endpoints.setEndpointValue(endpoint, [source], [render])_

Set the endpoint value.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| endpoint | `object` |  | Contains the endpoint information. |
| [source] | `string` |  | `optional` Source of the call information. |
| [render] | `boolean` | <code>false</code> | `optional` `true` if it needs to render the table afterwards. |


