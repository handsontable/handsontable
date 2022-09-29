---
title: IndexMap
metaTitle: IndexMap - JavaScript Data Grid | Handsontable
permalink: /api/index-map
canonicalUrl: /api/index-map
searchCategory: API Reference
hotPlugin: false
editLink: false
description: Options, members, and methods of Handsontable's IndexMap API.
react:
  metaTitle: IndexMap - React Data Grid | Handsontable
---

# IndexMap

[[toc]]

## Description

Map for storing mappings from an index to a value.


## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L92

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L166

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L101

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L44

:::

_indexMap.getValueAtIndex(index) ⇒ \*_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L34

:::

_indexMap.getValues() ⇒ Array_

Get full list of values for particular indexes.



### setValueAtIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L77

:::

_indexMap.setValueAtIndex(index, value) ⇒ boolean_

Set new value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set map's size). Please use the `setValues` method when you would like to extend the map. Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately. |



### setValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/translations/maps/indexMap.js#L59

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


