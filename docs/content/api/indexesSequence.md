---
title: IndexesSequence
metaTitle: IndexesSequence - JavaScript Data Grid | Handsontable
permalink: /api/indexes-sequence
canonicalUrl: /api/indexes-sequence
searchCategory: API Reference
hotPlugin: false
editLink: false
id: huuybcbn
description: Options, members, and methods of Handsontable's IndexesSequence API.
react:
  id: 5nrvua89
  metaTitle: IndexesSequence - React Data Grid | Handsontable
angular:
  id: v2o7x5ij
  metaTitle: IndexesSequence - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the sequence map with an identity function so each index maps to its own physical value.

The sequence stores physical indexes (numbers), so a write of an unchanged index is provably a
no-op — `skipUnchangedWrites` is always on, which also preserves the compact identity
representation when an identity value is re-written.


## Methods

### destroy

::: ask-about-api destroy|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L216

:::

_indexesSequence.destroy()_

Destroys the map instance.



### getLength

::: ask-about-api getLength|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L131

:::

_indexesSequence.getLength() ⇒ number_

Get length of the sequence.



### getValueAtIndex

::: ask-about-api getValueAtIndex|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L118

:::

_indexesSequence.getValueAtIndex(index) ⇒ T | undefined_

Get the physical index at the given position.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Position in the sequence. |



### getValues

::: ask-about-api getValues|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L103

:::

_indexesSequence.getValues() ⇒ Array&lt;number&gt;_

Get sequence of physical indexes.


**Returns**: `Array<number>` - Physical indexes.  

### setValueAtIndex

::: ask-about-api setValueAtIndex|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L155

:::

_indexesSequence.setValueAtIndex(index, value) ⇒ boolean_

Set the physical index at a single position. Materializes the sequence first.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | The position. |
| value | `*` | The physical index to store. |



### setValues

::: ask-about-api setValues|IndexesSequence

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/indexesSequence.ts#L138

:::

_indexesSequence.setValues(values)_

Set a completely new sequence. Detects the identity case to keep the compact representation.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of physical indexes. |


