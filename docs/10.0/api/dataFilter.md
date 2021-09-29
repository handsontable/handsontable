---
title: DataFilter
metaTitle: DataFilter - API Reference - Handsontable Documentation
permalink: /10.0/api/data-filter
canonicalUrl: /api/data-filter
hotPlugin: false
editLink: false
---

# DataFilter

[[toc]]
## Options

### filters
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L2794

:::

_filters.filters : boolean_

The [Filters](#filters) plugin allows filtering the table data either by the built-in component or with the API.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable filters
filters: true,
```

## Methods
## Members

### columnDataFactory
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/dataFilter.js#L20

:::

_dataFilter.columnDataFactory : function_

Function which provide source data factory for specified column.



### conditionCollection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/dataFilter.js#L14

:::

_dataFilter.conditionCollection : [ConditionCollection](@/api/conditionCollection.md)_

Reference to the instance of {ConditionCollection}.


## Methods

### filter
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/dataFilter.js#L28

:::

_dataFilter.filter() ⇒ Array_

Filter data based on the conditions collection.



### filterByColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/dataFilter.js#L51

:::

_dataFilter.filterByColumn(column, [dataSource]) ⇒ Array_

Filter data based on specified physical column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |
| [dataSource] | `Array` | `optional` Data source as array of objects with `value` and `meta` keys (e.g. `{value: 'foo', meta: {}}`). |


**Returns**: `Array` - Returns filtered data.  
