---
title: IndexMapper
metaTitle: IndexMapper - JavaScript Data Grid | Handsontable
permalink: /api/index-mapper
canonicalUrl: /api/index-mapper
searchCategory: API Reference
hotPlugin: false
editLink: false
description: Options, members, and methods of Handsontable's IndexMapper API.
react:
  metaTitle: IndexMapper - React Data Grid | Handsontable
---

# IndexMapper

[[toc]]

## Description

Index mapper stores, registers and manages the indexes on the basis of calculations collected from the subsidiary maps.
It should be seen as a single source of truth (regarding row and column indexes, for example, their sequence, information if they are skipped in the process of rendering (hidden or trimmed), values linked to them)
for any operation that considers CRUD actions such as **insertion**, **movement**, **removal** etc, and is used to properly calculate physical and visual indexes translations in both ways.
It has a built-in cache that is updated only when the data or structure changes.

**Physical index** is a type of an index from the sequence of indexes assigned to the data source rows or columns
 (from 0 to n, where n is number of the cells on the axis of data set).
**Visual index** is a type of an index from the sequence of indexes assigned to rows or columns existing in [DataMap](@/api/dataMap.md) (from 0 to n, where n is number of the cells on the axis of data set).
**Renderable index** is a type of an index from the sequence of indexes assigned to rows or columns whose may be rendered (when they are in a viewport; from 0 to n, where n is number of the cells renderable on the axis).

There are different kinds of index maps which may be registered in the collections and can be used by a reference.
They also expose public API and trigger two local hooks such as `init` (on initialization) and `change` (on change).

These are: [IndexesSequence](@/api/indexesSequence.md), [PhysicalIndexToValueMap](@/api/physicalIndexToValueMap.md), [LinkedPhysicalIndexToValueMap](@/api/linkedPhysicalIndexToValueMap.md), [HidingMap](@/api/hidingMap.md), and [TrimmingMap](@/api/trimmingMap.md).


## Methods

### createAndRegisterIndexMap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L232

:::

_indexMapper.createAndRegisterIndexMap(indexName, mapType, [initValueOrFn]) ⇒ [IndexMap](@/api/indexMap.md)_

Creates and register the new IndexMap for specified IndexMapper instance.


| Param | Type | Description |
| --- | --- | --- |
| indexName | `string` | The uniq index name. |
| mapType | `string` | The index map type (e.q. "hiding, "trimming", "physicalIndexToValue"). |
| [initValueOrFn] | `*` | `optional` The initial value for the index map. |



### createChangesObserver
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L216

:::

_indexMapper.createChangesObserver(indexMapType) ⇒ [ChangesObserver](@/api/changesObserver.md)_

It creates and returns the new instance of the ChangesObserver object. The object
allows listening to the index changes that happen while the Handsontable is running.


| Param | Type | Description |
| --- | --- | --- |
| indexMapType | `string` | The index map type which we want to observe.                              Currently, only the 'hiding' index map types are observable. |



### fitToLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L502

:::

_indexMapper.fitToLength(length)_

Trim/extend the mappers to fit the desired length.


| Param | Type | Description |
| --- | --- | --- |
| length | `number` | New mapper length. |



### getFirstNotHiddenIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L395

:::

_indexMapper.getFirstNotHiddenIndex(fromVisualIndex, incrementBy, searchAlsoOtherWayAround, indexForNextSearch) ⇒ number | null_

***Deprecated***

Search for the first visible, not hidden index (represented by a visual index).

This method is deprecated and will be removed in a next major version of Handsontable.
Use the [IndexMapper#getNearestNotHiddenIndex](@/api/indexMapper.md#getnearestnothiddenindex) method instead.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromVisualIndex | `number` |  | Visual start index. Starting point for finding destination index. Start point may be destination point when handled index is NOT hidden. |
| incrementBy | `number` |  | We are searching for a next visible indexes by increasing (to be precise, or decreasing) indexes. This variable represent indexes shift. We are looking for an index: - for rows: from the top to the bottom (increasing indexes, then variable should have value 1) or other way around (decreasing indexes, then variable should have the value -1) - for columns: from the left to the right (increasing indexes, then variable should have value 1) or other way around (decreasing indexes, then variable should have the value -1). |
| searchAlsoOtherWayAround | `boolean` | <code>false</code> | The argument determine if an additional other way around search should be performed, when the search in the first direction had no effect in finding visual index. |
| indexForNextSearch | `number` |  | Visual index for next search, when the flag is truthy. |


**Returns**: `number` | `null` - Visual column index or `null`.  

### getIndexesSequence
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L522

:::

_indexMapper.getIndexesSequence() ⇒ Array_

Get sequence of indexes.


**Returns**: `Array` - Physical indexes.  

### getNearestNotHiddenIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L441

:::

_indexMapper.getNearestNotHiddenIndex(fromVisualIndex, searchDirection, searchAlsoOtherWayAround) ⇒ number | null_

Search for the nearest not-hidden row or column.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromVisualIndex | `number` |  | The visual index of the row or column from which the search starts.<br><br> If the row or column from which the search starts is not hidden, the method simply returns the `fromVisualIndex` number. |
| searchDirection | `number` |  | The search direction.<br><br>`1`: search from `fromVisualIndex` to the end of the dataset.<br><br> `-1`: search from `fromVisualIndex` to the beginning of the dataset (i.e., to the row or column at visual index `0`). |
| searchAlsoOtherWayAround | `boolean` | <code>false</code> | `true`: if a search in a first direction failed, try the opposite direction.<br><br> `false`: search in one direction only. |


**Returns**: `number` | `null` - A visual index of a row or column, or `null`.  

### getNotHiddenIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L573

:::

_indexMapper.getNotHiddenIndexes([readFromCache]) ⇒ Array_

Get all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Please keep in mind that index of this native array IS NOT a "visual index".  

### getNotHiddenIndexesLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L590

:::

_indexMapper.getNotHiddenIndexesLength() ⇒ number_

Get length of all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.



### getNotTrimmedIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L544

:::

_indexMapper.getNotTrimmedIndexes([readFromCache]) ⇒ Array_

Get all NOT trimmed indexes.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Index of this native array is a "visual index",
value of this native array is a "physical index".  

### getNotTrimmedIndexesLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L561

:::

_indexMapper.getNotTrimmedIndexesLength() ⇒ number_

Get length of all NOT trimmed indexes.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.



### getNumberOfIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L625

:::

_indexMapper.getNumberOfIndexes() ⇒ number_

Get number of all indexes.



### getPhysicalFromRenderableIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L319

:::

_indexMapper.getPhysicalFromRenderableIndex(renderableIndex) ⇒ null | number_

Get a physical index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### getPhysicalFromVisualIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L302

:::

_indexMapper.getPhysicalFromVisualIndex(visualIndex) ⇒ number | null_

Get a physical index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |


**Returns**: `number` | `null` - Returns translated index mapped by passed visual index.  

### getRenderableFromVisualIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L363

:::

_indexMapper.getRenderableFromVisualIndex(visualIndex) ⇒ null | number_

Get a renderable index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |



### getRenderableIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L601

:::

_indexMapper.getRenderableIndexes([readFromCache]) ⇒ Array_

Get list of physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Index of this native array is a "renderable index",
value of this native array is a "physical index".  

### getRenderableIndexesLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L616

:::

_indexMapper.getRenderableIndexesLength() ⇒ number_

Get length of all NOT trimmed and NOT hidden indexes.



### getVisualFromPhysicalIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L336

:::

_indexMapper.getVisualFromPhysicalIndex(physicalIndex) ⇒ number | null_

Get a visual index corresponding to the given physical index.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index to search. |


**Returns**: `number` | `null` - Returns a visual index of the index mapper.  

### getVisualFromRenderableIndex
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L353

:::

_indexMapper.getVisualFromRenderableIndex(renderableIndex) ⇒ null | number_

Get a visual index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### initToLength
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L477

:::

_indexMapper.initToLength([length])_

Set default values for all indexes in registered index maps.


| Param | Type | Description |
| --- | --- | --- |
| [length] | `number` | `optional` Destination length for all stored index maps. |



### isHidden
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L678

:::

_indexMapper.isHidden(physicalIndex) ⇒ boolean_

Get whether index is hidden. Index marked as hidden is included in a [DataMap](@/api/dataMap.md), but isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### isTrimmed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L668

:::

_indexMapper.isTrimmed(physicalIndex) ⇒ boolean_

Get whether index is trimmed. Index marked as trimmed isn't included in a [DataMap](@/api/dataMap.md) and isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### moveIndexes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L635

:::

_indexMapper.moveIndexes(movedIndexes, finalIndex)_

Move indexes in the index mapper.


| Param | Type | Description |
| --- | --- | --- |
| movedIndexes | `number` <br/> `Array` | Visual index(es) to move. |
| finalIndex | `number` | Visual index being a start index for the moved elements. |



### registerMap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L243

:::

_indexMapper.registerMap(uniqueName, indexMap) ⇒ [IndexMap](@/api/indexMap.md)_

Register map which provide some index mappings. Type of map determining to which collection it will be added.


| Param | Type | Description |
| --- | --- | --- |
| uniqueName | `string` | Name of the index map. It should be unique. |
| indexMap | `IndexMap` | Registered index map updated on items removal and insertion. |



### resumeOperations
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L203

:::

_indexMapper.resumeOperations()_

Resumes the cache update for this map. It recalculates the cache and restores the
default behavior where each map modification updates the cache.



### setIndexesSequence
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L531

:::

_indexMapper.setIndexesSequence(indexes)_

Set completely new indexes sequence.


| Param | Type | Description |
| --- | --- | --- |
| indexes | `Array` | Physical indexes. |



### suspendOperations
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L195

:::

_indexMapper.suspendOperations()_

Suspends the cache update for this map. The method is helpful to group multiple
operations, which affects the cache. In this case, the cache will be updated once after
calling the `resumeOperations` method.



### unregisterAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L290

:::

_indexMapper.unregisterAll()_

Unregisters all collected index map instances from all map collection types.



### unregisterMap
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/translations/indexMapper.js#L281

:::

_indexMapper.unregisterMap(name)_

Unregister a map with given name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Name of the index map. |


