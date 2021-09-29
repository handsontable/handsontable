---
title: ValueComponent
metaTitle: ValueComponent - API Reference - Handsontable Documentation
permalink: /10.0/api/value-component
canonicalUrl: /api/value-component
hotPlugin: false
editLink: false
---

# ValueComponent

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

### getMenuItemDescriptor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L158

:::

_valueComponent.getMenuItemDescriptor() ⇒ object_

Get object descriptor for menu item entry.



### getMultipleSelectElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L149

:::

_valueComponent.getMultipleSelectElement() ⇒ [MultipleSelectUI](@/api/multipleSelectUI.md)_

Get multiple select element.



### getState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L60

:::

_valueComponent.getState() ⇒ object_

Export state of the component (get selected filter and filter arguments).


**Returns**: `object` - Returns object where `command` key keeps used condition filter and `args` key its arguments.  

### reset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L187

:::

_valueComponent.reset()_

Reset elements to their initial state.



### setState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L44

:::

_valueComponent.setState(value)_

Set state of the component.


| Param | Type | Description |
| --- | --- | --- |
| value | `object` | The component value. |



### updateState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/component/value.js#L78

:::

_valueComponent.updateState(stateInfo)_

Update state of component.


| Param | Type | Description |
| --- | --- | --- |
| stateInfo | `object` | Information about state containing stack of edited column, stack of dependent conditions, data factory and optional condition arguments change. It's described by object containing keys: `editedConditionStack`, `dependentConditionStacks`, `visibleDataFactory` and `conditionArgsChange`. |


