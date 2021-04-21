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
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L257


_undoRedo.clear()_

Clears undo history.



### destroy
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L319


_undoRedo.destroy()_

Destroys the instance.



### disable
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L299


_undoRedo.disable()_

Disables the plugin.



### done
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L166


_undoRedo.done(action)_


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action desciptor. |



### enable
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L279


_undoRedo.enable()_

Enables the plugin.



### isEnabled
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L268


_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled.



### isRedoAvailable
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L246


_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L235


_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L204


_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: <code>Hooks#event:beforeRedo</code>, <code>Hooks#event:afterRedo</code>  


### undo
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L173


_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: <code>Hooks#event:beforeUndo</code>, <code>Hooks#event:afterUndo</code>  


