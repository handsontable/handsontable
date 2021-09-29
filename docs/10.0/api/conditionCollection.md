---
title: ConditionCollection
metaTitle: ConditionCollection - API Reference - Handsontable Documentation
permalink: /10.0/api/condition-collection
canonicalUrl: /api/condition-collection
hotPlugin: false
editLink: false
---

# ConditionCollection

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

### filteringStates
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L38

:::

_conditionCollection.filteringStates : [LinkedPhysicalIndexToValueMap](@/api/linkedPhysicalIndexToValueMap.md)_

Index map storing filtering states for every column. ConditionCollection write and read to/from this element.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L24

:::

_conditionCollection.hot : [Core](@/api/core.md)_

Handsontable instance.



### isMapRegistrable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L32

:::

_conditionCollection.isMapRegistrable : boolean_

Indicates whether the internal IndexMap should be registered or not. Generally,
registered Maps responds to the index changes. Within that collection, sometimes
this is not necessary.


## Methods

### addCondition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L101

:::

_conditionCollection.addCondition(column, conditionDefinition, [operation], [position])_

Add condition to the collection.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md##event):beforeAdd`, [`ConditionCollection#event](@/api/conditionCollection.md##event):afterAdd`  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | The physical column index. |
| conditionDefinition | `object` |  | Object with keys:  * `command` Object, Command object with condition name as `key` property.  * `args` Array, Condition arguments. |
| [operation] | `string` | <code>"conjunction"</code> | `optional` Type of conditions operation. |
| [position] | `number` |  | `optional` Position to which condition will be added. When argument is undefined the condition will be processed as the last condition. |



### clean
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L235

:::

_conditionCollection.clean()_

Clean all conditions collection and reset order stack.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md##event):beforeClean`, [`ConditionCollection#event](@/api/conditionCollection.md##event):afterClean`  


### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L262

:::

_conditionCollection.destroy()_

Destroy object.



### exportAllConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L191

:::

_conditionCollection.exportAllConditions() ⇒ Array_

Export all previously added conditions.



### getColumnStackPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L182

:::

_conditionCollection.getColumnStackPosition(column) ⇒ number_

Gets position in the filtering states stack for the specific column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


**Returns**: `number` - Returns -1 when the column doesn't exist in the stack.  

### getConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L153

:::

_conditionCollection.getConditions(column) ⇒ Array_

Get all added conditions from the collection at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


**Returns**: `Array` - Returns conditions collection as an array.  

### getFilteredColumns
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L172

:::

_conditionCollection.getFilteredColumns() ⇒ Array_

Get all filtered physical columns in the order in which actions are performed.



### getOperation
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L163

:::

_conditionCollection.getOperation(column) ⇒ string | undefined_

Get operation for particular column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |



### hasConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L249

:::

_conditionCollection.hasConditions(column, [name]) ⇒ boolean_

Check if at least one condition was added at specified column index. And if second parameter is passed then additionally
check if condition exists under its name.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |
| [name] | `string` | `optional` Condition name. |



### importAllConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L208

:::

_conditionCollection.importAllConditions(conditions)_

Import conditions to the collection.


| Param | Type | Description |
| --- | --- | --- |
| conditions | `Array` | The collection of the conditions. |



### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L53

:::

_conditionCollection.isEmpty() ⇒ boolean_

Check if condition collection is empty (so no needed to filter data).



### isMatch
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L64

:::

_conditionCollection.isMatch(value, column) ⇒ boolean_

Check if value is matched to the criteria of conditions chain.


| Param | Type | Description |
| --- | --- | --- |
| value | `object` | Object with `value` and `meta` keys. |
| column | `number` | The physical column index. |



### isMatchInConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L80

:::

_conditionCollection.isMatchInConditions(conditions, value, [operationType]) ⇒ boolean_

Check if the value is matches the conditions.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| conditions | `Array` |  | List of conditions. |
| value | `object` |  | Object with `value` and `meta` keys. |
| [operationType] | `string` | <code>"conjunction"</code> | `optional` Type of conditions operation. |



### removeConditions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionCollection.js#L223

:::

_conditionCollection.removeConditions(column)_

Remove conditions at given column index.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md##event):beforeRemove`, [`ConditionCollection#event](@/api/conditionCollection.md##event):afterRemove`  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


