---
title: MergeCells
permalink: /next/api/merge-cells
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).


**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
 data: getData(),
 mergeCells: [
   {row: 0, col: 3, rowspan: 3, colspan: 3},
   {row: 2, col: 6, rowspan: 2, colspan: 2},
   {row: 4, col: 8, rowspan: 3, colspan: 3}
 ],
```

## Members
### isEnabled
`mergeCells.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#MergeCells+enablePlugin) method is called.



### enablePlugin
`mergeCells.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`mergeCells.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### updatePlugin
`mergeCells.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### clearCollections
`mergeCells.clearCollections()`

Clears the merged cells from the merged cell container.



### mergeSelection
`mergeCells.mergeSelection([cellRange])`

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | <code>CellRange</code> | `optional` Selection cell range. |



### unmergeSelection
`mergeCells.unmergeSelection([cellRange])`

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | <code>CellRange</code> | `optional` Selection cell range. |



### merge
`mergeCells.merge(startRow, startColumn, endRow, endColumn)`

Merges the specified range.

**Emits**: <code>Hooks#event:beforeMergeCells</code>, <code>Hooks#event:afterMergeCells</code>  

| Param | Type | Description |
| --- | --- | --- |
| startRow | <code>number</code> | Start row of the merged cell. |
| startColumn | <code>number</code> | Start column of the merged cell. |
| endRow | <code>number</code> | End row of the merged cell. |
| endColumn | <code>number</code> | End column of the merged cell. |



### unmerge
`mergeCells.unmerge(startRow, startColumn, endRow, endColumn)`

Unmerges the merged cell in the provided range.

**Emits**: <code>Hooks#event:beforeUnmergeCells</code>, <code>Hooks#event:afterUnmergeCells</code>  

| Param | Type | Description |
| --- | --- | --- |
| startRow | <code>number</code> | Start row of the merged cell. |
| startColumn | <code>number</code> | Start column of the merged cell. |
| endRow | <code>number</code> | End row of the merged cell. |
| endColumn | <code>number</code> | End column of the merged cell. |



