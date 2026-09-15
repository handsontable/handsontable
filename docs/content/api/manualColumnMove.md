---
title: ManualColumnMove
metaTitle: ManualColumnMove - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-move
canonicalUrl: /api/manual-column-move
searchCategory: API Reference
hotPlugin: false
editLink: false
id: bck95e73
description: Use the ManualColumnMove plugin with its API options and methods (e.g., moveColumn(), moveColumns(), dragColumn()), to change the order of columns.
react:
  id: 41x190ra
  metaTitle: ManualColumnMove - React Data Grid | Handsontable
angular:
  id: w7p2y0kl
  metaTitle: ManualColumnMove - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### manualColumnMove

::: ask-about-api manualColumnMove|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3881

:::

_manualColumnMove.manualColumnMove : boolean | Array&lt;number&gt;_

The `manualColumnMove` option configures the `ManualColumnMove` plugin.

You can set the `manualColumnMove` option to one of the following:

| Setting  | Description                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `true`   | Enable the `ManualColumnMove` plugin                                                  |
| `false`  | Disable the `ManualColumnMove` plugin                                                 |
| An array | - Enable the `ManualColumnMove` plugin<br>- Move individual columns at initialization |

Read more:
- [Column moving](@/guides/columns/column-moving/column-moving.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualColumnMove` plugin
manualColumnMove: true,

// enable the `ManualColumnMove` plugin
// at initialization, move column 0 to 1
// at initialization, move column 1 to 4
// at initialization, move column 2 to 6
manualColumnMove: [1, 4, 6],
```

## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L199

:::

_ManualColumnMove.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L204

:::

_ManualColumnMove.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L510

:::

_manualColumnMove.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L246

:::

_manualColumnMove.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### dragColumn

::: ask-about-api dragColumn|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L300

:::

_manualColumnMove.dragColumn(column, dropIndex) ⇒ boolean_

Drag a single column to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### dragColumns

::: ask-about-api dragColumns|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L314

:::

_manualColumnMove.dragColumns(columns, dropIndex) ⇒ boolean_

Drag multiple columns to drop index position.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be dragged. |
| dropIndex | `number` | Visual column index, being a drop index for the moved columns. Points to where we are going to drop the moved elements. To check visualization of drop index please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### enablePlugin

::: ask-about-api enablePlugin|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L218

:::

_manualColumnMove.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isDragging

::: ask-about-api isDragging|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L327

:::

_manualColumnMove.isDragging() ⇒ boolean_

Checks whether a column drag is in progress - the header is held down and the pointer has
travelled far enough to count as a drag rather than a click.

`ColumnSorting` asks this on release to tell a click apart from a drag, so the two plugins
cannot disagree about where that line is.



### isEnabled

::: ask-about-api isEnabled|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L213

:::

_manualColumnMove.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnMove#enablePlugin](@/api/manualColumnMove.md#enableplugin) method is called.
When [[Options#dataProvider]] is a complete server-backed configuration, the DataProvider plugin blocks this plugin from enabling.



### isMovePossible

::: ask-about-api isMovePossible|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L338

:::

_manualColumnMove.isMovePossible(movedColumns, finalIndex) ⇒ boolean_

Indicates if it's possible to move columns to the desired position. Some of the actions aren't
possible, i.e. You can’t move more than one element to the last position.


| Param | Type | Description |
| --- | --- | --- |
| movedColumns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumn

::: ask-about-api moveColumn|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L262

:::

_manualColumnMove.moveColumn(column, finalIndex) ⇒ boolean_

Moves a single column.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### moveColumns

::: ask-about-api moveColumns|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L276

:::

_manualColumnMove.moveColumns(columns, finalIndex) ⇒ boolean_

Moves a multiple columns.

**Emits**: [`Hooks#event:beforeColumnMove`](@/api/hooks.md#beforecolumnmove), [`Hooks#event:afterColumnMove`](@/api/hooks.md#aftercolumnmove)  

| Param | Type | Description |
| --- | --- | --- |
| columns | `Array` | Array of visual column indexes to be moved. |
| finalIndex | `number` | Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action. To check the visualization of the final index, please take a look at [documentation](@/guides/columns/column-moving/column-moving.md#drag-and-move-actions-of-manualcolumnmove-plugin). |



### updatePlugin

::: ask-about-api updatePlugin|ManualColumnMove

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnMove/manualColumnMove.ts#L238

:::

_manualColumnMove.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnMove`](@/api/options.md#manualcolumnmove)


