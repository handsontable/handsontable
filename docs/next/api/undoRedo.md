---
title: UndoRedo
permalink: /next/api/undo-redo
canonicalUrl: /api/undo-redo
editLink: false
---

# UndoRedo

[[toc]]
## Methods
## Methods

## Description

Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.

__Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.

**Example**  
```js
undo: true
```

## Methods

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L266

:::

`undoRedo.clear()`

Clears undo history.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L328

:::

`undoRedo.destroy()`

Destroys the instance.



### disable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L308

:::

`undoRedo.disable()`

Disables the plugin.



### done
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L173

:::

`undoRedo.done(action)`


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action desciptor. |



### enable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L288

:::

`undoRedo.enable()`

Enables the plugin.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L277

:::

`undoRedo.isEnabled() ⇒ boolean`

Checks if the plugin is enabled.



### isRedoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L255

:::

`undoRedo.isRedoAvailable() ⇒ boolean`

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L244

:::

`undoRedo.isUndoAvailable() ⇒ boolean`

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L212

:::

`undoRedo.redo()`

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeRedo`](./hooks/#beforeRedo), [`Hooks#event:afterRedo`](./hooks/#afterRedo)  


### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L180

:::

`undoRedo.undo()`

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndo`](./hooks/#beforeUndo), [`Hooks#event:afterUndo`](./hooks/#afterUndo)  


