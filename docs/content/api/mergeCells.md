---
title: MergeCells
metaTitle: MergeCells - JavaScript Data Grid | Handsontable
permalink: /api/merge-cells
canonicalUrl: /api/merge-cells
searchCategory: API Reference
hotPlugin: false
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

[[toc]]
## Options

### mergeCells

::: ask-about-api mergeCells|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4119

:::

_mergeCells.mergeCells : boolean | Array&lt;object&gt;_

The `mergeCells` option configures the `MergeCells` plugin.

You can set the `mergeCells` option to one of the following:

| Setting               | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `true`                | Enable the `MergeCells` plugin                                               |
| `false`               | Disable the `MergeCells` plugin                                              |
| An array of objects   | - Enable the `MergeCells` plugin<br>- Merge specific cells at initialization |
| { virtualized: true } | Enable the `MergeCells` plugin with enabled virtualization mode              |


To merge specific cells at Handsontable's initialization,
set the `mergeCells` option to an array of objects, with the following properties:

| Property  | Description                                                |
| --------- | ---------------------------------------------------------- |
| `row`     | The visual row index of the merged section's beginning     |
| `col`     | The visual column index of the merged section's beginning  |
| `rowspan` | The width (as a number of rows) of the merged section      |
| `colspan` | The height (as a number of columns ) of the merged section |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L405

:::

_MergeCells.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L395

:::

_MergeCells.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L400

:::

_MergeCells.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearCollections

::: ask-about-api clearCollections|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L621

:::

_mergeCells.clearCollections()_

Clears the merged cells from the merged cell container.



### destroy

::: ask-about-api destroy|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L493

:::

_mergeCells.destroy()_

Destroys the plugin instance. Removes the row index mapper local hook explicitly, because
`BasePlugin#destroy` only clears `addHook`-managed hooks, not raw `addLocalHook` registrations.



### disablePlugin

::: ask-about-api disablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L482

:::

_mergeCells.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L423

:::

_mergeCells.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L418

:::

_mergeCells.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MergeCells#enablePlugin](@/api/mergeCells.md#enableplugin) method is called.



### merge

::: ask-about-api merge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L781

:::

_mergeCells.merge(startRow, startColumn, endRow, endColumn)_

Merges the specified range.

**Emits**: [`Hooks#event:beforeMergeCells`](@/api/hooks.md#beforemergecells), [`Hooks#event:afterMergeCells`](@/api/hooks.md#aftermergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Visual start row of the merged cell. |
| startColumn | `number` | Visual start column of the merged cell. |
| endRow | `number` | Visual end row of the merged cell. |
| endColumn | `number` | Visual end column of the merged cell. |



### mergeSelection

::: ask-about-api mergeSelection|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L641

:::

_mergeCells.mergeSelection([cellRange])_

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### unmerge

::: ask-about-api unmerge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L795

:::

_mergeCells.unmerge(startRow, startColumn, endRow, endColumn)_

Unmerges the merged cell in the provided range.

**Emits**: [`Hooks#event:beforeUnmergeCells`](@/api/hooks.md#beforeunmergecells), [`Hooks#event:afterUnmergeCells`](@/api/hooks.md#afterunmergecells)  

| Param | Type | Description |
| --- | --- | --- |
| startRow | `number` | Visual start row of the merged cell. |
| startColumn | `number` | Visual start column of the merged cell. |
| endRow | `number` | Visual end row of the merged cell. |
| endColumn | `number` | Visual end column of the merged cell. |



### unmergeSelection

::: ask-about-api unmergeSelection|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L657

:::

_mergeCells.unmergeSelection([cellRange])_

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### updatePlugin

::: ask-about-api updatePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L503

:::

_mergeCells.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
following configuration options:
 - [`mergeCells`](@/api/options.md#mergecells)


