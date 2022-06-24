---
title: LinkedPhysicalIndexToValueMap
metaTitle: LinkedPhysicalIndexToValueMap - API Reference - Handsontable Documentation
permalink: /api/linked-physical-index-to-value-map
canonicalUrl: /api/linked-physical-index-to-value-map
hotPlugin: false
editLink: false
---

# LinkedPhysicalIndexToValueMap

[[toc]]

## Description

Map for storing mappings from an physical index to a value. Those entries are linked and stored in a certain order.

It does not update stored values on remove/add row or column action. Otherwise, order of entries is updated after
such changes.


## Methods

### clearValue

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L77

:::

_linkedPhysicalIndexToValueMap.clearValue(physicalIndex)_

Clear value for particular index.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### getEntries

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L149

:::

_linkedPhysicalIndexToValueMap.getEntries() ⇒ Array_

Get every entry containing index and value, respecting order of indexes.



### getLength

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L93

:::

_linkedPhysicalIndexToValueMap.getLength() ⇒ number_

Get length of the index map.



### getValues

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L28

:::

_linkedPhysicalIndexToValueMap.getValues() ⇒ Array_

Get full list of ordered values for particular indexes.



### setValueAtIndex

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L56

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

::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/handsontable/src/translations/maps/linkedPhysicalIndexToValueMap.js#L39

:::

_linkedPhysicalIndexToValueMap.setValues(values)_

Set new values for particular indexes. Entries are linked and stored in a certain order.

Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of set values. |
