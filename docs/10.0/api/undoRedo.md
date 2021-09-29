---
title: UndoRedo
metaTitle: UndoRedo - Plugin - Handsontable Documentation
permalink: /10.0/api/undo-redo
canonicalUrl: /api/undo-redo
hotPlugin: true
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

## Options

### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1836

:::

_undoRedo.undo : boolean_

If `true`, undo/redo functionality is enabled.
Note: `undefined` by default but it acts as enabled.
You need to switch it to `false` to disable it completely.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable undo and redo
undo: true,
```

## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L326

:::

_undoRedo.clear()_

Clears undo history.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L388

:::

_undoRedo.destroy()_

Destroys the instance.



### disable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L368

:::

_undoRedo.disable()_

Disables the plugin.



### done
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L167

:::

_undoRedo.done(wrappedAction, [source])_

Stash information about performed actions.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange)  

| Param | Type | Description |
| --- | --- | --- |
| wrappedAction | `function` | The action descriptor wrapped in a closure. |
| [source] | `string` | `optional` Source of the action. It is defined just for more general actions (not related to plugins). |



### enable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L348

:::

_undoRedo.enable()_

Enables the plugin.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L337

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled.



### isRedoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L315

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L304

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L257

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeRedo`](@/api/hooks.md#beforeredo), [`Hooks#event:afterRedo`](@/api/hooks.md#afterredo)  


### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/undoRedo/undoRedo.js#L210

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`Hooks#event:afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`Hooks#event:beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), [`Hooks#event:afterRedoStackChange`](@/api/hooks.md#afterredostackchange), [`Hooks#event:beforeUndo`](@/api/hooks.md#beforeundo), [`Hooks#event:afterUndo`](@/api/hooks.md#afterundo)  

