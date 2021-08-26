---
title: ItemsFactory
metaTitle: ItemsFactory - Plugin - Handsontable Documentation
permalink: /8.3/api/items-factory
canonicalUrl: /api/items-factory
hotPlugin: true
editLink: false
---

# ItemsFactory

[[toc]]

## Description

Predefined items class factory for menu items.


## Methods

### getItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/plugins/contextMenu/itemsFactory.js#L61

:::

_itemsFactory.getItems(pattern) ⇒ Array_

Get all menu items based on pattern.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pattern | `Array` <br/> `object` <br/> `boolean` | <code>null</code> | Pattern which you can define by displaying menu items order. If `true` default                                       pattern will be used. |



### setPredefinedItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/plugins/contextMenu/itemsFactory.js#L27

:::

_itemsFactory.setPredefinedItems(predefinedItemsCollection)_

Set predefined items.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItemsCollection | `Array` | Array of predefined items. |


