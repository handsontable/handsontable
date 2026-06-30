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

[[toc]]

## Description

Initializes the index map with an optional default value or factory function applied to each index.


## Methods

### clear

::: ask-about-api clear|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L71

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy

::: ask-about-api destroy|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L131

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength

::: ask-about-api getLength|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L78

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex

::: ask-about-api getValueAtIndex|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L34

:::

_indexMap.getValueAtIndex(index) ⇒ T | undefined_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues

::: ask-about-api getValues|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L26

:::

_indexMap.getValues([unused]) ⇒ Array_

Get full list of values for particular indexes.


| Param | Type | Description |
| --- | --- | --- |
| [unused] | `*` | `optional` Unused parameter for TypeScript compatibility. |



### setValueAtIndex

::: ask-about-api setValueAtIndex|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L61

:::

_indexMap.setValueAtIndex(index, value) ⇒ boolean_

Set new value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set map's size). Please use the `setValues` method when you would like to extend the map. Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately. |



### setValues

::: ask-about-api setValues|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/indexMap.ts#L46

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


