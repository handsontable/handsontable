---
title: AggregatedCollection
metaTitle: AggregatedCollection - API Reference - Handsontable Documentation
permalink: /10.0/api/aggregated-collection
canonicalUrl: /api/aggregated-collection
hotPlugin: false
editLink: false
---

# AggregatedCollection

[[toc]]
## Members

### aggregationFunction
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L21

:::

_aggregatedCollection.aggregationFunction_

Function which do aggregation on the values for particular index.



### fallbackValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L25

:::

_aggregatedCollection.fallbackValue_

Fallback value when there is no calculated value for particular index.



### mergedValuesCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L17

:::

_aggregatedCollection.mergedValuesCache : Array_

List of merged values. Value for each index is calculated using values inside registered maps.


## Methods

### getMergedValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L92

:::

_aggregatedCollection.getMergedValueAtIndex(index, [readFromCache]) ⇒ \*_

Get merged value for particular index.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` |  | Index for which we calculate single result. |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read results from the cache. |



### getMergedValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L34

:::

_aggregatedCollection.getMergedValues([readFromCache]) ⇒ Array_

Get merged values for all indexes.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read results from the cache. |



### updateCache
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/mapCollections/aggregatedCollection.js#L101

:::

_aggregatedCollection.updateCache()_

Rebuild cache for the collection.


