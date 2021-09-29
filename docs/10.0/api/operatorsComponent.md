---
title: OperatorsComponent
metaTitle: OperatorsComponent - API Reference - Handsontable Documentation
permalink: /10.0/api/operators-component
canonicalUrl: /api/operators-component
hotPlugin: false
editLink: false
---

# OperatorsComponent

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

### getActiveOperationId
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L98

:::

_operatorsComponent.getActiveOperationId() ⇒ string_

Get `id` of active operator.



### getMenuItemDescriptor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L34

:::

_operatorsComponent.getMenuItemDescriptor() ⇒ object_

Get menu object descriptor.



### getState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L113

:::

_operatorsComponent.getState() ⇒ string_

Export state of the component (get selected operator).


**Returns**: `string` - Returns `id` of selected operator.  

### reset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L151

:::

_operatorsComponent.reset()_

Reset elements to their initial state.



### setChecked
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L83

:::

_operatorsComponent.setChecked(searchedIndex)_

Set state of operators component to check radio input at specific `index`.


| Param | Type | Description |
| --- | --- | --- |
| searchedIndex | `number` | Index of radio input to check. |



### setState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L122

:::

_operatorsComponent.setState(value)_

Set state of the component.


| Param | Type | Description |
| --- | --- | --- |
| value | `object` | State to restore. |



### updateState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/operators.js#L138

:::

_operatorsComponent.updateState([operationId], column)_

Update state of component.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [operationId] | `string` | <code>"conjunction"</code> | `optional` Id of selected operation. |
| column | `number` |  | Physical column index. |


