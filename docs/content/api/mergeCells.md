---
title: MergeCells
metaTitle: MergeCells | Handsontable DataGrid for JavaScript
permalink: /api/merge-cells
canonicalUrl: /api/merge-cells
searchCategory: API Reference
hotPlugin: false
editLink: false
id: cs07c3ly
description: Use the MergeCells plugin with its API options and methods to merge adjacent cells, using the "Ctrl + M" shortcut or the context menu.
react:
  id: 62cv5ecx
  metaTitle: MergeCells | Handsontable DataGrid for React
angular:
  id: a3t6c4st
  metaTitle: MergeCells | Handsontable DataGrid for Angular
---

[[toc]]

See the [Merge cells](@/guides/cell-features/merge-cells/merge-cells.md) guide for examples and configuration details.

## Options

### mergeCells
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api mergeCells|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5558

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

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

A merged range clears the cells it covers. Re-applying the same value through
[`updateSettings()`](@/api/core.md#updatesettings) clears only the cells that still hold a
value, so a range that is already empty fires no `beforeChange` or `afterChange` event. Values
that come back into a covered range — through new `data`, a sort, a filter, or a row move — are
cleared on the next re-apply, as before. This assumes the clearing write reaches the data:
cancel it (a `beforeChange` returning `false`, or a validator rejecting `null`) and every
re-apply tries again.

While a filter hides rows, a re-applied range that fits the rows on screen is applied to those
rows. A range that reaches past them can't be applied, so if it was applied before and its
merged cell still covers the rows it was merged on, that merged cell is kept, with its values,
until the filter is cleared.

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1286

:::

_MergeCells.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1281

:::

_MergeCells.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1270

:::

_MergeCells.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1275

:::

_MergeCells.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearCollections

::: ask-about-api clearCollections|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1648

:::

_mergeCells.clearCollections()_

Clears the merged cells from the merged cell container.



### destroy

::: ask-about-api destroy|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1385

:::

_mergeCells.destroy()_

Destroys the plugin instance. Removes the row index mapper local hook explicitly, because
`BasePlugin#destroy` only clears `addHook`-managed hooks, not raw `addLocalHook` registrations,
and releases the per-paste state, which `BasePlugin#destroy` cannot reach either - its
`objectEach` sweep only sees enumerable own properties, never `#` fields.



### disablePlugin

::: ask-about-api disablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1363

:::

_mergeCells.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1304

:::

_mergeCells.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1299

:::

_mergeCells.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [MergeCells#enablePlugin](@/api/mergeCells.md#enableplugin) method is called.



### merge

::: ask-about-api merge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L2022

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1832

:::

_mergeCells.mergeSelection([cellRange])_

Merges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### unmerge

::: ask-about-api unmerge|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L2036

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

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1856

:::

_mergeCells.unmergeSelection([cellRange])_

Unmerges the selection provided as a cell range.


| Param | Type | Description |
| --- | --- | --- |
| [cellRange] | `CellRange` | `optional` Selection cell range. |



### updatePlugin

::: ask-about-api updatePlugin|MergeCells

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/mergeCells/mergeCells.ts#L1404

:::

_mergeCells.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the
following configuration options:
 - [`mergeCells`](@/api/options.md#mergecells)


