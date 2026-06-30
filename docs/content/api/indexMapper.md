---
title: IndexMapper
metaTitle: IndexMapper - JavaScript Data Grid | Handsontable
permalink: /api/index-mapper
canonicalUrl: /api/index-mapper
searchCategory: API Reference
hotPlugin: false
editLink: false
id: uolxl0ol
description: Options, members, and methods of Handsontable's IndexMapper API.
react:
  id: sbs3825t
  metaTitle: IndexMapper - React Data Grid | Handsontable
angular:
  id: u3n6w4gh
  metaTitle: IndexMapper - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the IndexMapper by wiring change listeners on the indexes sequence, trimming, and hiding map collections to keep caches up to date.


## Members

### indexesChangeSource

::: ask-about-api indexesChangeSource|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L665

:::

_indexMapper.indexesChangeSource : undefined | string_

Flag informing about source of the change.


## Methods

### createChangesObserver

::: ask-about-api createChangesObserver|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L121

:::

_indexMapper.createChangesObserver(indexMapType) ⇒ [ChangesObserver](@/api/changesObserver.md)_

It creates and returns the new instance of the ChangesObserver object. The object
allows listening to the index changes that happen while the Handsontable is running.


| Param | Type | Description |
| --- | --- | --- |
| indexMapType | `string` | The index map type which we want to observe.                              Currently, only the 'hiding' index map types are observable. |



### destroy

::: ask-about-api destroy|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L570

:::

_indexMapper.destroy()_

Destroys the IndexMapper instance. Clears all registered map observers
and unregisters all maps from all collections.



### fitToLength

::: ask-about-api fitToLength|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L292

:::

_indexMapper.fitToLength(length)_

Trim/extend the mappers to fit the desired length.


| Param | Type | Description |
| --- | --- | --- |
| length | `number` | New mapper length. |



### getIndexesSequence

::: ask-about-api getIndexesSequence|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L307

:::

_indexMapper.getIndexesSequence() ⇒ Array_

Get sequence of indexes.


**Returns**: `Array` - Physical indexes.  

### getNearestNotHiddenIndex

::: ask-about-api getNearestNotHiddenIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L240

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

::: ask-about-api getNotHiddenIndexes|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L354

:::

_indexMapper.getNotHiddenIndexes([readFromCache]) ⇒ Array_

Get all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Please keep in mind that index of this native array IS NOT a "visual index".  

### getNotHiddenIndexesLength

::: ask-about-api getNotHiddenIndexesLength|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L367

:::

_indexMapper.getNotHiddenIndexesLength() ⇒ number_

Get length of all NOT hidden indexes.

Note: Indexes marked as hidden are included in a [DataMap](@/api/dataMap.md), but aren't rendered.



### getNotTrimmedIndexes

::: ask-about-api getNotTrimmedIndexes|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L331

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

::: ask-about-api getNotTrimmedIndexesLength|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L344

:::

_indexMapper.getNotTrimmedIndexesLength() ⇒ number_

Get length of all NOT trimmed indexes.

Note: Indexes marked as trimmed aren't included in a [DataMap](@/api/dataMap.md) and aren't rendered.



### getNumberOfIndexes

::: ask-about-api getNumberOfIndexes|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L394

:::

_indexMapper.getNumberOfIndexes() ⇒ number_

Get number of all indexes.



### getPhysicalFromRenderableIndex

::: ask-about-api getPhysicalFromRenderableIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L193

:::

_indexMapper.getPhysicalFromRenderableIndex(renderableIndex) ⇒ null | number_

Get a physical index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### getPhysicalFromVisualIndex

::: ask-about-api getPhysicalFromVisualIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L180

:::

_indexMapper.getPhysicalFromVisualIndex(visualIndex) ⇒ number | null_

Get a physical index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |


**Returns**: `number` | `null` - Returns translated index mapped by passed visual index.  

### getRenderableFromVisualIndex

::: ask-about-api getRenderableFromVisualIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L224

:::

_indexMapper.getRenderableFromVisualIndex(visualIndex) ⇒ null | number_

Get a renderable index corresponding to the given visual index.


| Param | Type | Description |
| --- | --- | --- |
| visualIndex | `number` | Visual index. |



### getRenderableIndexes

::: ask-about-api getRenderableIndexes|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L376

:::

_indexMapper.getRenderableIndexes([readFromCache]) ⇒ Array_

Get list of physical indexes (respecting the sequence of indexes) which may be rendered (when they are in a viewport).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read indexes from cache. |


**Returns**: `Array` - List of physical indexes. Index of this native array is a "renderable index",
value of this native array is a "physical index".  

### getRenderableIndexesLength

::: ask-about-api getRenderableIndexesLength|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L387

:::

_indexMapper.getRenderableIndexesLength() ⇒ number_

Get length of all NOT trimmed and NOT hidden indexes.



### getVisualFromPhysicalIndex

::: ask-about-api getVisualFromPhysicalIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L206

:::

_indexMapper.getVisualFromPhysicalIndex(physicalIndex) ⇒ number | null_

Get a visual index corresponding to the given physical index.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index to search. |


**Returns**: `number` | `null` - Returns a visual index of the index mapper.  

### getVisualFromRenderableIndex

::: ask-about-api getVisualFromRenderableIndex|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L216

:::

_indexMapper.getVisualFromRenderableIndex(renderableIndex) ⇒ null | number_

Get a visual index corresponding to the given renderable index.


| Param | Type | Description |
| --- | --- | --- |
| renderableIndex | `number` | Renderable index. |



### initToLength

::: ask-about-api initToLength|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L267

:::

_indexMapper.initToLength([length])_

Set default values for all indexes in registered index maps.


| Param | Type | Description |
| --- | --- | --- |
| [length] | `number` | `optional` Destination length for all stored index maps. |



### isHidden

::: ask-about-api isHidden|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L440

:::

_indexMapper.isHidden(physicalIndex) ⇒ boolean_

Get whether index is hidden. Index marked as hidden is included in a [DataMap](@/api/dataMap.md), but isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### isTrimmed

::: ask-about-api isTrimmed|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L432

:::

_indexMapper.isTrimmed(physicalIndex) ⇒ boolean_

Get whether index is trimmed. Index marked as trimmed isn't included in a [DataMap](@/api/dataMap.md) and isn't rendered.


| Param | Type | Description |
| --- | --- | --- |
| physicalIndex | `number` | Physical index. |



### moveIndexes

::: ask-about-api moveIndexes|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L402

:::

_indexMapper.moveIndexes(movedIndexes, finalIndex)_

Move indexes in the index mapper.


| Param | Type | Description |
| --- | --- | --- |
| movedIndexes | `number` <br/> `Array` | Visual index(es) to move. |
| finalIndex | `number` | Visual index being a start index for the moved elements. |



### observeMapChange

::: ask-about-api observeMapChange|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L491

:::

_indexMapper.observeMapChange(map, callback) ⇒ function_

Registers an observer for batched changes on a specific index map. During batched
operations ([IndexMapper#suspendOperations](@/api/indexMapper.md#suspendoperations)/[IndexMapper#resumeOperations](@/api/indexMapper.md#resumeoperations)),
changes are coalesced and the callback fires once when the batch completes. Outside of
batching, the callback fires immediately on each change.

Works with maps registered in the various maps collection.


| Param | Type | Description |
| --- | --- | --- |
| map | `IndexMap` | The map instance to observe. |
| callback | `function` | Called when the observed map's values change (coalesced during batches). |


**Returns**: `function` - Disposer function that removes the observer.  

### registerMap

::: ask-about-api registerMap|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L136

:::

_indexMapper.registerMap(uniqueName, indexMap) ⇒ [IndexMap](@/api/indexMap.md)_

Register map which provide some index mappings. Type of map determining to which collection it will be added.


| Param | Type | Description |
| --- | --- | --- |
| uniqueName | `string` | Name of the index map. It should be unique. |
| indexMap | `IndexMap` | Registered index map updated on items removal and insertion. |



### resumeOperations

::: ask-about-api resumeOperations|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L109

:::

_indexMapper.resumeOperations()_

Resumes the cache update for this map. It recalculates the cache and restores the
default behavior where each map modification updates the cache.



### setIndexesSequence

::: ask-about-api setIndexesSequence|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L314

:::

_indexMapper.setIndexesSequence(indexes)_

Set completely new indexes sequence.


| Param | Type | Description |
| --- | --- | --- |
| indexes | `Array` | Physical indexes. |



### suspendOperations

::: ask-about-api suspendOperations|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L103

:::

_indexMapper.suspendOperations()_

Suspends the cache update for this map. The method is helpful to group multiple
operations, which affects the cache. In this case, the cache will be updated once after
calling the `resumeOperations` method.



### unregisterAll

::: ask-about-api unregisterAll|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L170

:::

_indexMapper.unregisterAll()_

Unregisters all collected index map instances from all map collection types.



### unregisterMap

::: ask-about-api unregisterMap|IndexMapper

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/translations/indexMapper.ts#L163

:::

_indexMapper.unregisterMap(name)_

Unregister a map with given name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Name of the index map. |


