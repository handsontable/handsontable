---
title: LinkedPhysicalIndexToValueMap
metaTitle: LinkedPhysicalIndexToValueMap - JavaScript Data Grid | Handsontable
permalink: /api/linked-physical-index-to-value-map
canonicalUrl: /api/linked-physical-index-to-value-map
searchCategory: API Reference
hotPlugin: false
editLink: false
id: pjeolp38
description: Options, members, and methods of Handsontable's LinkedPhysicalIndexToValueMap API.
react:
  id: h10c2au0
  metaTitle: LinkedPhysicalIndexToValueMap - React Data Grid | Handsontable
angular:
  id: w1p8y6kl
  metaTitle: LinkedPhysicalIndexToValueMap - Angular Data Grid | Handsontable
---

[[toc]]
## Methods

### clearValue

::: ask-about-api clearValue|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L61

:::

_linkedPhysicalIndexToValueMap.clearValue(physicalIndex)_

Clear value for particular index.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### getEntries

::: ask-about-api getEntries|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L115

:::

_linkedPhysicalIndexToValueMap.getEntries() ⇒ Array_

Get every entry containing index and value, respecting order of indexes.



### getLength

::: ask-about-api getLength|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L75

:::

_linkedPhysicalIndexToValueMap.getLength() ⇒ number_

Get length of the index map.



### getValues

::: ask-about-api getValues|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L21

:::

_linkedPhysicalIndexToValueMap.getValues() ⇒ Array_

Get full list of ordered values for particular indexes.



### setValueAtIndex

::: ask-about-api setValueAtIndex|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L46

:::

_linkedPhysicalIndexToValueMap.setValueAtIndex(index, value, position) ⇒ boolean_

Set value at index and add it to the linked list of entries. Entries are stored in a certain order.

Note: Value will be added at the end of the queue.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The index. |
| value | `*` | The value to save. |
| position | `number` | Position to which entry will be added. |



### setValues

::: ask-about-api setValues|LinkedPhysicalIndexToValueMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/maps/linkedPhysicalIndexToValueMap.ts#L30

:::

_linkedPhysicalIndexToValueMap.setValues(values)_

Set new values for particular indexes. Entries are linked and stored in a certain order.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |


