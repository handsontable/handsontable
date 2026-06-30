---
title: CopyableRangesFactory
metaTitle: CopyableRangesFactory API reference – JavaScript Data Grid | Handsontable
permalink: /api/copyable-ranges-factory
canonicalUrl: /api/copyable-ranges-factory
searchCategory: API Reference
hotPlugin: false
editLink: false
id: s3n7w2qe
react:
  id: l4d8y6pf
angular:
  id: h1m9r5ug
---

[[toc]]

## Description


## Methods

### getAllColumnHeadersRange

::: ask-about-api getAllColumnHeadersRange|CopyableRangesFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyableRanges.ts#L158

:::

_copyableRangesFactory.getAllColumnHeadersRange() ⇒ Object | null_

Returns a new coords object within all column headers layers (including nested headers) range with
`startRow`, `startCol`, `endRow` and `endCol` keys.



### getCellsRange

::: ask-about-api getCellsRange|CopyableRangesFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyableRanges.ts#L109

:::

_copyableRangesFactory.getCellsRange() ⇒ Object | null_

Returns a new coords object within the dataset range (cells) with `startRow`, `startCol`, `endRow`
and `endCol` keys.



### getMostBottomColumnHeadersRange

::: ask-about-api getMostBottomColumnHeadersRange|CopyableRangesFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyableRanges.ts#L134

:::

_copyableRangesFactory.getMostBottomColumnHeadersRange() ⇒ Object | null_

Returns a new coords object within the most-bottom column headers range with `startRow`,
`startCol`, `endRow` and `endCol` keys.



### setSelectedRange

::: ask-about-api setSelectedRange|CopyableRangesFactory

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/copyPaste/copyableRanges.ts#L101

:::

_copyableRangesFactory.setSelectedRange(selectedRange)_

Sets the selection range to be processed.


| Param | Type | Description |
| --- | --- | --- |
| selectedRange | `CellRange` | The selection range represented by the CellRange class. |


