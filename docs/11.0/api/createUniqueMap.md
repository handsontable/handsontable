---
title: CreateUniqueMap
metaTitle: CreateUniqueMap - API Reference - Handsontable Documentation
permalink: /11.0/api/create-unique-map
canonicalUrl: /api/create-unique-map
hotPlugin: false
editLink: false
---

# CreateUniqueMap

[[toc]]
## Methods

### addItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L32

:::

_createUniqueMap~addItem(id, item)_

Adds a new item to the unique map. Throws error if `id` is already added.


| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The ID of the adding item. |
| item | `*` | The adding item. |



### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L43

:::

_createUniqueMap~clear()_

Clears the map.



### getId
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L53

:::

_createUniqueMap~getId(item) ⇒ \*_

Returns ID for the passed item.


| Param | Type | Description |
| --- | --- | --- |
| item | `*` | The item of the getting ID. |



### getItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L71

:::

_createUniqueMap~getItem(id) ⇒ \*_

Returns item from the passed ID.


| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The ID of the getting item. |



### getItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L80

:::

_createUniqueMap~getItems() ⇒ Array_

Gets all items from the map.



### hasItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/uniqueMap.js#L90

:::

_createUniqueMap~hasItem(id) ⇒ boolean_

Verifies if the passed ID exists in a map.


| Param | Type | Description |
| --- | --- | --- |
| id | `*` | The ID to check if registered. |


