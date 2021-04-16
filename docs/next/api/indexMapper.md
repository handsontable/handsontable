---
title: IndexMapper
permalink: /next/api/index-mapper
canonicalUrl: /api/index-mapper
editLink: false
---

# IndexMapper

[[toc]]
## Methods

### getFirstNotHiddenIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L327
  

_indexMapper.getFirstNotHiddenIndex(fromVisualIndex, incrementBy, searchAlsoOtherWayAround, indexForNextSearch) ⇒ number | null_
Search for the first visible, not hidden index (represented by a visual index).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromVisualIndex | `number` |  | Visual start index. Starting point for finding destination index. Start point may be destination point when handled index is NOT hidden. |
| incrementBy | `number` |  | We are searching for a next visible indexes by increasing (to be precise, or decreasing) indexes. This variable represent indexes shift. We are looking for an index: - for rows: from the left to the right (increasing indexes, then variable should have value 1) or other way around (decreasing indexes, then variable should have the value -1) - for columns: from the top to the bottom (increasing indexes, then variable should have value 1) or other way around (decreasing indexes, then variable should have the value -1). |
| searchAlsoOtherWayAround | `boolean` | <code>false</code> | The argument determine if an additional other way around search should be performed, when the search in the first direction had no effect in finding visual index. |
| indexForNextSearch | `number` |  | Visual index for next search, when the flag is truthy. |


**Returns**: `number` | `null` - Visual column index or `null`.  

### getIndexesSequence
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L385
  

_indexMapper.getIndexesSequence() ⇒ Array_
Get sequence of indexes.


**Returns**: `Array` - Physical indexes.  

### getNotHiddenIndexes
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L436
  

_indexMapper.getNotHiddenIndexes([readFromCache]) ⇒ Array_
Get all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](./DataMap/), but aren't rendered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Please keep in mind that index of this native array IS NOT a "visual index".  

### getNotHiddenIndexesLength
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L453
  

_indexMapper.getNotHiddenIndexesLength() ⇒ number_
Get length of all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](./DataMap/), but aren't rendered.



### getNotTrimmedIndexes
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L407
  

_indexMapper.getNotTrimmedIndexes([readFromCache]) ⇒ Array_
Get all NOT trimmed indexes.

Note: Indexes marked as trimmed aren't included in a [DataMap](./DataMap/) and aren't rendered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Index of this native array is a "visual index",
value of this native array is a "physical index".  

### getNotTrimmedIndexesLength
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L424
  

_indexMapper.getNotTrimmedIndexesLength() ⇒ number_
Get length of all NOT trimmed indexes.

Note: Indexes marked as trimmed aren't included in a [DataMap](./DataMap/) and aren't rendered.



### getNumberOfIndexes
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L488
  

_indexMapper.getNumberOfIndexes() ⇒ number_
Get number of all indexes.



### getPhysicalFromRenderableIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L255
  

_indexMapper.getPhysicalFromRenderableIndex(renderableIndex) ⇒ null | number_
Get a physical index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### getPhysicalFromVisualIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L238
  

_indexMapper.getPhysicalFromVisualIndex(visualIndex) ⇒ number | null_
Get a physical index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |


**Returns**: `number` | `null` - Returns translated index mapped by passed visual index.  

### getRenderableFromVisualIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L299
  

_indexMapper.getRenderableFromVisualIndex(visualIndex) ⇒ null | number_
Get a renderable index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |



### getRenderableIndexes
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L464
  

_indexMapper.getRenderableIndexes([readFromCache]) ⇒ Array_
Get list of physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Index of this native array is a "renderable index",
value of this native array is a "physical index".  

### getRenderableIndexesLength
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L479
  

_indexMapper.getRenderableIndexesLength() ⇒ number_
Get length of all NOT trimmed and NOT hidden indexes.



### getVisualFromPhysicalIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L272
  

_indexMapper.getVisualFromPhysicalIndex(physicalIndex) ⇒ number | null_
Get a visual index corresponding to the given physical index.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index to search. |


**Returns**: `number` | `null` - Returns a visual index of the index mapper.  

### getVisualFromRenderableIndex
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L289
  

_indexMapper.getVisualFromRenderableIndex(renderableIndex) ⇒ null | number_
Get a visual index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### initToLength
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L360
  

_indexMapper.initToLength([length])_
Set default values for all indexes in registered index maps.


| Param | Type | Description |
| --- | --- | --- |
| [length] | `number` | `optional` Destination length for all stored index maps. |



### isHidden
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L540
  

_indexMapper.isHidden(physicalIndex) ⇒ boolean_
Get whether index is hidden. Index marked as hidden is included in a [DataMap](./DataMap/), but isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### isTrimmed
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L530
  

_indexMapper.isTrimmed(physicalIndex) ⇒ boolean_
Get whether index is trimmed. Index marked as trimmed isn't included in a [DataMap](./DataMap/) and isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### moveIndexes
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L498
  

_indexMapper.moveIndexes(movedIndexes, finalIndex)_
Move indexes in the index mapper.


| Param | Type | Description |
| --- | --- | --- |
| movedIndexes | `number` \| `Array` | Visual index(es) to move. |
| finalIndex | `number` | Visual index being a start index for the moved elements. |



### registerMap
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L189
  

_indexMapper.registerMap(uniqueName, indexMap) ⇒ IndexMap_
Register map which provide some index mappings. Type of map determining to which collection it will be added.


| Param | Type | Description |
| --- | --- | --- |
| uniqueName | `string` | Name of the index map. It should be unique. |
| indexMap | `IndexMap` | Registered index map updated on items removal and insertion. |



### resumeOperations
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L177
  

_indexMapper.resumeOperations()_
Resumes the cache update for this map. It recalculates the cache and restores the
default behavior where each map modification updates the cache.



### setIndexesSequence
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L394
  

_indexMapper.setIndexesSequence(indexes)_
Set completely new indexes sequence.


| Param | Type | Description |
| --- | --- | --- |
| indexes | `Array` | Physical indexes. |



### suspendOperations
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L169
  

_indexMapper.suspendOperations()_
Suspends the cache update for this map. The method is helpful to group multiple
operations, which affects the cache. In this case, the cache will be updated once after
calling the `resumeOperations` method.



### unregisterMap
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/translations/indexMapper.js#L226
  

_indexMapper.unregisterMap(name)_
Unregister a map with given name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Name of the index map. |


