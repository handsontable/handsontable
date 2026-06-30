---
title: ConditionCollection
metaTitle: ConditionCollection API reference – JavaScript Data Grid | Handsontable
permalink: /api/condition-collection
canonicalUrl: /api/condition-collection
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the condition collection with the Handsontable instance, optionally registering the filtering states index map on the column index mapper.


## Members

### filteringStates

::: ask-about-api filteringStates|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L229

:::

_conditionCollection.filteringStates : [LinkedPhysicalIndexToValueMap](@/api/linkedPhysicalIndexToValueMap.md)_

Index map storing filtering states for every column. ConditionCollection write and read to/from element.


## Methods

### addCondition

::: ask-about-api addCondition|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L75

:::

_conditionCollection.addCondition(column, conditionDefinition, [operation], [position])_

Add condition to the collection.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md#event):beforeAdd`, [`ConditionCollection#event](@/api/conditionCollection.md#event):afterAdd`  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| column | `number` |  | The physical column index. |
| conditionDefinition | `object` |  | Object with keys:  * `command` Object, Command object with condition name as `key` property.  * `args` Array, Condition arguments. |
| [operation] | `string` | <code>"conjunction"</code> | `optional` Type of conditions operation. |
| [position] | `number` |  | `optional` Position to which condition will be added. When argument is undefined the condition will be processed as the last condition. |



### clean

::: ask-about-api clean|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L194

:::

_conditionCollection.clean()_

Clean all conditions collection and reset order stack.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md#event):beforeClean`, [`ConditionCollection#event](@/api/conditionCollection.md#event):afterClean`  


### destroy

::: ask-about-api destroy|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L215

:::

_conditionCollection.destroy()_

Destroy object.



### exportAllConditions

::: ask-about-api exportAllConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L150

:::

_conditionCollection.exportAllConditions() ⇒ Array_

Export all previously added conditions.



### getColumnStackPosition

::: ask-about-api getColumnStackPosition|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L143

:::

_conditionCollection.getColumnStackPosition(column) ⇒ number_

Gets position in the filtering states stack for the specific column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


**Returns**: `number` - Returns -1 when the column doesn't exist in the stack.  

### getConditions

::: ask-about-api getConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L120

:::

_conditionCollection.getConditions(column) ⇒ Array_

Get all added conditions from the collection at specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


**Returns**: `Array` - Returns conditions collection as an array.  

### getFilteredColumns

::: ask-about-api getFilteredColumns|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L135

:::

_conditionCollection.getFilteredColumns() ⇒ Array_

Get all filtered physical columns in the order in which actions are performed.



### getOperation

::: ask-about-api getOperation|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L128

:::

_conditionCollection.getOperation(column) ⇒ string | undefined_

Get operation for particular column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |



### hasConditions

::: ask-about-api hasConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L206

:::

_conditionCollection.hasConditions(column, [name]) ⇒ boolean_

Check if at least one condition was added at specified column index. And if second parameter is passed then additionally
check if condition exists under its name.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |
| [name] | `string` | `optional` Condition name. |



### importAllConditions

::: ask-about-api importAllConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L170

:::

_conditionCollection.importAllConditions(conditions)_

Import conditions to the collection.


| Param | Type | Description |
| --- | --- | --- |
| conditions | `Array` | The collection of the conditions. |



### isEmpty

::: ask-about-api isEmpty|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L35

:::

_conditionCollection.isEmpty() ⇒ boolean_

Check if condition collection is empty (so no needed to filter data).



### isMatch

::: ask-about-api isMatch|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L44

:::

_conditionCollection.isMatch(value, column) ⇒ boolean_

Check if value is matched to the criteria of conditions chain.


| Param | Type | Description |
| --- | --- | --- |
| value | `object` | Object with `value` and `meta` keys. |
| column | `number` | The physical column index. |



### isMatchInConditions

::: ask-about-api isMatchInConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L57

:::

_conditionCollection.isMatchInConditions(conditions, value, [operationType]) ⇒ boolean_

Check if the value is matches the conditions.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| conditions | `Array` |  | List of conditions. |
| value | `object` |  | Object with `value` and `meta` keys. |
| [operationType] | `string` | <code>"conjunction"</code> | `optional` Type of conditions operation. |



### removeConditions

::: ask-about-api removeConditions|ConditionCollection

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionCollection.ts#L184

:::

_conditionCollection.removeConditions(column)_

Remove conditions at given column index.

**Emits**: [`ConditionCollection#event](@/api/conditionCollection.md#event):beforeRemove`, [`ConditionCollection#event](@/api/conditionCollection.md#event):afterRemove`  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The physical column index. |


