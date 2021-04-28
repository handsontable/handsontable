---
title: UndoRedo
permalink: /next/api/undo-redo
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L268

:::

_undoRedo.clear()_

Clears undo history.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L330

:::

_undoRedo.destroy()_

Destroys the instance.



### disable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L310

:::

_undoRedo.disable()_

Disables the plugin.



### done
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L175

:::

_undoRedo.done(action)_


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action desciptor. |



### enable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L290

:::

_undoRedo.enable()_

Enables the plugin.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L279

:::

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled.



### isRedoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L257

:::

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L246

:::

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L214

:::

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: [`Hooks#event:beforeRedo`](./hooks/#beforeRedo), [`Hooks#event:afterRedo`](./hooks/#afterRedo)  


### undo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L182

:::

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: [`Hooks#event:beforeUndo`](./hooks/#beforeUndo), [`Hooks#event:afterUndo`](./hooks/#afterUndo)  


