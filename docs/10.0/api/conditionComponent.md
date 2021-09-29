---
title: ConditionComponent
metaTitle: ConditionComponent - API Reference - Handsontable Documentation
permalink: /10.0/api/condition-component
canonicalUrl: /api/condition-component
hotPlugin: false
editLink: false
---

# ConditionComponent

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

### getInputElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L139

:::

_conditionComponent.getInputElement(index) ⇒ [InputUI](@/api/inputUI.md)_

Get input element.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| index | `number` | <code>0</code> | Index an array of elements. |



### getInputElements
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L148

:::

_conditionComponent.getInputElements() ⇒ Array_

Get input elements.



### getMenuItemDescriptor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L157

:::

_conditionComponent.getMenuItemDescriptor() ⇒ object_

Get menu object descriptor.



### getSelectElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L129

:::

_conditionComponent.getSelectElement() ⇒ [SelectUI](@/api/selectUI.md)_

Get select element.



### getState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L87

:::

_conditionComponent.getState() ⇒ object_

Export state of the component (get selected filter and filter arguments).


**Returns**: `object` - Returns object where `command` key keeps used condition filter and `args` key its arguments.  

### reset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L191

:::

_conditionComponent.reset()_

Reset elements to their initial state.



### setState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L52

:::

_conditionComponent.setState(value)_

Set state of the component.


| Param | Type | Description |
| --- | --- | --- |
| value | `object` | State to restore. |



### updateState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/condition.js#L111

:::

_conditionComponent.updateState(condition, column)_

Update state of component.


| Param | Type | Description |
| --- | --- | --- |
| condition | `object` | The condition object. |
| condition.command | `object` | The command object with condition name as `key` property. |
| condition.args | `Array` | An array of values to compare. |
| column | `number` | Physical column index. |


