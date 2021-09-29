---
title: IndexMap
metaTitle: IndexMap - API Reference - Handsontable Documentation
permalink: /10.0/api/index-map
canonicalUrl: /api/index-map
hotPlugin: false
editLink: false
---

# IndexMap

[[toc]]
## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L90

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L164

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L99

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L42

:::

_indexMap.getValueAtIndex(index) ⇒ \*_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L32

:::

_indexMap.getValues() ⇒ Array_

Get full list of values for particular indexes.



### setValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L75

:::

_indexMap.setValueAtIndex(index, value) ⇒ boolean_

Set new value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set map's size). Please use the `setValues` method when you would like to extend the map. Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately. |



### setValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/translations/maps/indexMap.js#L57

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


