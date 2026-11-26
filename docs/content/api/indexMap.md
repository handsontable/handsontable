---
title: IndexMap
metaTitle: IndexMap | Handsontable DataGrid for JavaScript
permalink: /api/index-map
canonicalUrl: /api/index-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 8b008itj
description: Options, members, and methods of Handsontable DataGrid's IndexMap API.
react:
  id: nwnemipo
  metaTitle: IndexMap | Handsontable DataGrid for React
angular:
  id: t4m5v3ef
  metaTitle: IndexMap | Handsontable DataGrid for Angular
---

[[toc]]

## Description

Initializes the index map with an optional default value or factory function applied to each
index, and optional map behavior options.


## Members

### skipUnchangedWrites

::: ask-about-api skipUnchangedWrites|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L67

:::

_indexMap.skipUnchangedWrites ⇒ boolean_

Whether `setValueAtIndex` treats a write of a strictly-equal value as a no-op. Read-only;
configured through the constructor. Exposed so subclasses that fully override
`setValueAtIndex` (e.g. `BooleanMap`) can honor the same contract.


## Methods

### clear

::: ask-about-api clear|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L125

:::

_indexMap.clear()_

Clear all values to the defaults.



### destroy

::: ask-about-api destroy|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L192

:::

_indexMap.destroy()_

Destroys the Map instance.



### getLength

::: ask-about-api getLength|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L132

:::

_indexMap.getLength() ⇒ number_

Get length of the index map.



### getValueAtIndex

::: ask-about-api getValueAtIndex|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L83

:::

_indexMap.getValueAtIndex(index) ⇒ T | undefined_

Get value for the particular index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Index for which value is got. |



### getValues

::: ask-about-api getValues|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L75

:::

_indexMap.getValues([unused]) ⇒ Array_

Get full list of values for particular indexes.


| Param | Type | Description |
| --- | --- | --- |
| [unused] | `*` | `optional` Unused parameter for TypeScript compatibility. |



### setValueAtIndex

::: ask-about-api setValueAtIndex|IndexMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L110

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/indexMap.ts#L95

:::

_indexMap.setValues(values)_

Set new values for particular indexes.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


