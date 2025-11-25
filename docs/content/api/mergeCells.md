---
title: MergeCells
metaTitle: MergeCells - JavaScript Data Grid | Handsontable
permalink: /api/merge-cells
canonicalUrl: /api/merge-cells
searchCategory: API Reference
hotPlugin: true
editLink: false
id: cs07c3ly
description: Use the MergeCells plugin with its API options and methods to merge adjacent cells, using the "Ctrl + M" shortcut or the context menu.
react:
  id: 62cv5ecx
  metaTitle: MergeCells - React Data Grid | Handsontable
angular:
  id: a3t6c4st
  metaTitle: MergeCells - Angular Data Grid | Handsontable
---

# Plugin: MergeCells

[[toc]]

## Description

Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).

**Example**  
::: only-for javascript
```js
const hot = new Handsontable(document.getElementById('example'), {
 data: getData(),
 mergeCells: [
   {row: 0, col: 3, rowspan: 3, colspan: 3},
   {row: 2, col: 6, rowspan: 2, colspan: 2},
   {row: 4, col: 8, rowspan: 3, colspan: 3}
 ],
```
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  // enable plugin
  mergeCells={[
   {row: 0, col: 3, rowspan: 3, colspan: 3},
   {row: 2, col: 6, rowspan: 2, colspan: 2},
   {row: 4, col: 8, rowspan: 3, colspan: 3}
  ]}
/>
```
:::

::: only-for angular
```ts
settings = {
  data: getData(),
  // Enable plugin
  mergeCells: [
    { row: 0, col: 3, rowspan: 3, colspan: 3 },
    { row: 2, col: 6, rowspan: 2, colspan: 2 },
    { row: 4, col: 8, rowspan: 3, colspan: 3 },
  ],
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

## Options

### mergeCells
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/dataMap/metaManager/metaSchema.js#L3490

:::

_mergeCells.mergeCells : boolean | Array&lt;object&gt;_

The `mergeCells` option configures the [`MergeCells`](@/api/mergeCells.md) plugin.

You can set the `mergeCells` option to one of the following:

| Setting               | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `true`                | Enable the [`MergeCells`](@/api/mergeCells.md) plugin                                               |
| `false`               | Disable the [`MergeCells`](@/api/mergeCells.md) plugin                                              |
| An array of objects   | - Enable the [`MergeCells`](@/api/mergeCells.md) plugin<br>- Merge specific cells at initialization |
| { virtualized: true } | Enable the [`MergeCells`](@/api/mergeCells.md) plugin with enabled virtualization mode              |


To merge specific cells at Handsontable's initialization,
set the `mergeCells` option to an array of objects, with the following properties:

| Property  | Description                                                |
| --------- | ---------------------------------------------------------- |
| `row`     | The row index of the merged section's beginning            |
| `col`     | The column index of the merged section's beginning         |
| `rowspan` | The width (as a number of rows) of the merged section      |
| `colspan` | The height (as a number of columns ) of the merged section |

Read more:
- [Merge cells](@/guides/cell-features/merge-cells/merge-cells.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `MergeCells` plugin
mergeCells: true,

// enable the `MergeCells` plugin
// and merge specific cells at initialization
mergeCells: [
  // merge cells from cell (1,1) to cell (3,3)
  {row: 1, col: 1, rowspan: 3, colspan: 3},
  // merge cells from cell (3,4) to cell (2,2)
  {row: 3, col: 4, rowspan: 2, colspan: 2},
  // merge cells from cell (5,6) to cell (3,3)
  {row: 5, col: 6, rowspan: 3, colspan: 3}
],

// enable the `MergeCells` plugin with enabled virtualization mode
// and merge specific cells at initialization
mergeCells: {
  virtualized: true,
  cells: [
    // merge cells from cell (1,1) to cell (3,3)
    {row: 1, col: 1, rowspan: 3, colspan: 3},
    // merge cells from cell (3,4) to cell (2,2)
    {row: 3, col: 4, rowspan: 2, colspan: 2},
    // merge cells from cell (5,6) to cell (3,3)
    {row: 5, col: 6, rowspan: 3, colspan: 3}
  ],
},
```

## Methods

### clearCollections
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L376

:::

_mergeCells.clearCollections()_

Clears the merged cells from the merged cell container.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L218

:::

_mergeCells.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L164

:::

_mergeCells.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L157

:::

_mergeCells.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MergeCells#enablePlugin](@/api/mergeCells.md#enableplugin) method is called.



### merge
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L572

:::

_mergeCells.merge(startRow, startColumn, endRow, endColumn)_

Merges the specified range.

**Emits**: [`Hooks#event:beforeMergeCells`](@/api/hooks.md#beforemergecells), [`Hooks#event:afterMergeCells`](@/api/hooks.md#aftermergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### mergeSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L397

:::

_mergeCells.mergeSelection([cellRange])_

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### unmerge
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L589

:::

_mergeCells.unmerge(startRow, startColumn, endRow, endColumn)_

Unmerges the merged cell in the provided range.

**Emits**: [`Hooks#event:beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells), [`Hooks#event:afterUnmergeCells`](@/api/hooks.md#afterunmergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Start row of the merged cell. |
| startColumn | `number` | Start column of the merged cell. |
| endRow | `number` | End row of the merged cell. |
| endColumn | `number` | End column of the merged cell. |



### unmergeSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L416

:::

_mergeCells.unmergeSelection([cellRange])_

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/mergeCells/mergeCells.js#L232

:::

_mergeCells.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
following configuration options:
 - [`mergeCells`](@/api/options.md#mergecells)


