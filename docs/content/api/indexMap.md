---
title: IndexMap
metaTitle: IndexMap - JavaScript Data Grid | Handsontable
permalink: /api/index-map
canonicalUrl: /api/index-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 8b008itj
description: Options, members, and methods of Handsontable's IndexMap API.
react:
  id: nwnemipo
  metaTitle: IndexMap - React Data Grid | Handsontable
angular:
  id: t4m5v3ef
  metaTitle: IndexMap - Angular Data Grid | Handsontable
---

# Plugin: IndexMap

[[toc]]

## Description

Map for storing mappings from an index to a value.


## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L94

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L168

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L103

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L46

:::

_indexMap.getValueAtIndex(index) ⇒ \*_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L36

:::

_indexMap.getValues() ⇒ Array_

Get full list of values for particular indexes.



### setValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L79

:::

_indexMap.setValueAtIndex(index, value) ⇒ boolean_

Set new value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set map's size). Please use the `setValues` method when you would like to extend the map. Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately. |



### setValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/translations/maps/indexMap.js#L61

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


