---
title: IndexMap
metaTitle: IndexMap - API Reference - Handsontable Documentation
permalink: /api/index-map
canonicalUrl: /api/index-map
hotPlugin: false
editLink: false
---

# IndexMap

[[toc]]

## Description

Map for storing mappings from an index to a value.


## Methods

### clear

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L91

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L165

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L100

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L43

:::

_indexMap.getValueAtIndex(index) ⇒ \*_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L33

:::

_indexMap.getValues() ⇒ Array_

Get full list of values for particular indexes.



### setValueAtIndex

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L76

:::

_indexMap.setValueAtIndex(index, value) ⇒ boolean_

Set new value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set map's size). Please use the `setValues` method when you would like to extend the map. Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately. |



### setValues

::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/translations/maps/indexMap.js#L58

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |
