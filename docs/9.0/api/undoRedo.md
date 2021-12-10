---
title: UndoRedo
metaTitle: UndoRedo - Plugin - Handsontable Documentation
permalink: /9.0/api/undo-redo
canonicalUrl: /api/undo-redo
editLink: false
---

# UndoRedo

[[toc]]
## Description

Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.

__Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.

**Example**  
```js
undo: true
```

## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L326

:::

_undoRedo.clear()_

Clears undo history.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L388

:::

_undoRedo.destroy()_

Destroys the instance.



### disable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L368

:::

_undoRedo.disable()_

Disables the plugin.



### done
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L167

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/pluginHooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/pluginHooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/pluginHooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/pluginHooks.md#afterredostackchange)  

| Param | Type | Description |
| --- | --- | --- |
| wrappedAction | `function` | The action descriptor wrapped in a closure. |
| [source] | `string` | `optional` Source of the action. It is defined just for more general actions (not related to plugins). |



### enable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L348

:::

_undoRedo.enable()_

Enables the plugin.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L337

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled.



### isRedoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L315

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L304

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L257

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/pluginHooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/pluginHooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/pluginHooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/pluginHooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/pluginHooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/pluginHooks.md#afterredo)  


### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/undoRedo/undoRedo.js#L210

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/pluginHooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/pluginHooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/pluginHooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/pluginHooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/pluginHooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/pluginHooks.md#afterundo)  


