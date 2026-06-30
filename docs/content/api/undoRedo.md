---
title: UndoRedo
metaTitle: UndoRedo - JavaScript Data Grid | Handsontable
permalink: /api/undo-redo
canonicalUrl: /api/undo-redo
searchCategory: API Reference
hotPlugin: false
editLink: false
id: coyq5h6m
description: Use the UndoRedo plugin with its API options and methods to revert and restore your changes.
react:
  id: t5lpzjly
  metaTitle: UndoRedo - React Data Grid | Handsontable
angular:
  id: i5b4k2ij
  metaTitle: UndoRedo - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and registers all built-in undo/redo action handlers for the given Handsontable instance.


## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L82

:::

_UndoRedo.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L87

:::

_UndoRedo.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L92

:::

_UndoRedo.SETTING\_KEYS_

Returns whether the plugin handles its own settings keys without a dedicated key list.


## Methods

### clear

::: ask-about-api clear|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L287

:::

_undoRedo.clear()_

Clears undo and redo history.



### destroy

::: ask-about-api destroy|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L293

:::

_undoRedo.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L115

:::

_undoRedo.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### done

::: ask-about-api done|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L184

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange)  

| Param | Type | Description |
| --- | --- | --- |
| wrappedAction | `function` | The action descriptor wrapped in a closure. |
| [source] | `string` | `optional` Source of the action. It is defined just for more general actions (not related to plugins). |



### enablePlugin

::: ask-about-api enablePlugin|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L105

:::

_undoRedo.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L100

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [UndoRedo#enablePlugin](@/api/undoRedo.md#enableplugin) method is called.



### isRedoAvailable

::: ask-about-api isRedoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L282

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable

::: ask-about-api isUndoAvailable|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L275

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo

::: ask-about-api redo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L248

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/hooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/hooks.md#afterredo)  


### undo

::: ask-about-api undo|UndoRedo

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/undoRedo/undoRedo.ts#L216

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/hooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/hooks.md#afterundo)  

