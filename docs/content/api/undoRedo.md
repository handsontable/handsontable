---
title: UndoRedo
metaTitle: UndoRedo - JavaScript Data Grid | Handsontable
permalink: /api/undo-redo
canonicalUrl: /api/undo-redo
searchCategory: API Reference
hotPlugin: true
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

# Plugin: UndoRedo

[[toc]]

## Description

Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.

__Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.

**Example**  
```js
undo: true
```

## Options

### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L5069

:::

_undoRedo.undo : boolean_

The `undo` option configures the [`UndoRedo`](@/api/undoRedo.md) plugin.

You can set the `undo` option to one of the following:

| Setting | Description                                        |
| ------- | -------------------------------------------------- |
| `true`  | Enable the [`UndoRedo`](@/api/undoRedo.md) plugin  |
| `false` | Disable the [`UndoRedo`](@/api/undoRedo.md) plugin |

By default, the `undo` option is set to `true`,
To disable the [`UndoRedo`](@/api/undoRedo.md) plugin completely,
set the `undo` option to `false`.

Read more:
- [Undo and redo](@/guides/accessories-and-menus/undo-redo/undo-redo.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `UndoRedo` plugin
undo: true,
```

## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L303

:::

_undoRedo.clear()_

Clears undo and redo history.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L406

:::

_undoRedo.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L102

:::

_undoRedo.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### done
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L160

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange)  

| Param | Type | Description |
| --- | --- | --- |
| wrappedAction | `function` | The action descriptor wrapped in a closure. |
| [source] | `string` | `optional` Source of the action. It is defined just for more general actions (not related to plugins). |



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L87

:::

_undoRedo.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L80

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [UndoRedo#enablePlugin](@/api/undoRedo.md#enableplugin) method is called.



### isRedoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L296

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L287

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L246

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/hooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/hooks.md#afterredo)  


### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/undoRedo/undoRedo.js#L201

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/hooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/hooks.md#afterundo)  

