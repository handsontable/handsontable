---
title: CreatePriorityMap
metaTitle: CreatePriorityMap - API Reference - Handsontable Documentation
permalink: /11.0/api/create-priority-map
canonicalUrl: /api/create-priority-map
hotPlugin: false
editLink: false
---

# CreatePriorityMap

[[toc]]
## Methods

### addItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/priorityMap.js#L38

:::

_createPriorityMap~addItem(priority, item)_

Adds items to priority map. Throws an error if `priority` is not a number or if is already added.


| Param | Type | Description |
| --- | --- | --- |
| priority | `number` | The priority for adding item. |
| item | `*` | The adding item. |



### getItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/utils/dataStructures/priorityMap.js#L55

:::

_createPriorityMap~getItems([order]) ⇒ \*_

Gets items from the passed map in a ASC or DESC order of priorities.


| Param | Type | Description |
| --- | --- | --- |
| [order] | `string` | `optional` The order for getting items. ASC is an default. |


