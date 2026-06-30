---
title: ItemsFactory
metaTitle: ItemsFactory API reference – JavaScript Data Grid | Handsontable
permalink: /api/items-factory
canonicalUrl: /api/items-factory
searchCategory: API Reference
hotPlugin: false
editLink: false
id: y3p9w2kd
react:
  id: u8c4m1ra
angular:
  id: d5f7n2sz
---

[[toc]]

## Description

Initializes the items factory with a Handsontable instance and an optional default ordering pattern for menu items.


## Members

### predefinedItems

::: ask-about-api predefinedItems|ItemsFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/itemsFactory.ts#L70

:::

_itemsFactory.predefinedItems : object_


## Methods

### getItems

::: ask-about-api getItems|ItemsFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/itemsFactory.ts#L62

:::

_itemsFactory.getItems(pattern) ⇒ Array_

Get all menu items based on pattern.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pattern | `Array` <br/> `object` <br/> `boolean` | <code>null</code> | Pattern which you can define by displaying menu items order. If `true` default                                       pattern will be used. |



### setPredefinedItems

::: ask-about-api setPredefinedItems|ItemsFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/itemsFactory.ts#L19

:::

_itemsFactory.setPredefinedItems(predefinedItemsCollection)_

Set predefined items.


| Param | Type | Description |
| --- | --- | --- |
| predefinedItemsCollection | `Array` | Array of predefined items. |


