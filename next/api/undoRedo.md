---
title: UndoRedo
permalink: /next/api/undo-redo
canonicalUrl: /api/undo-redo
---

# {{ $frontmatter.title }}

[[toc]]
## Methods:
## Methods:

## Description


Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.

__Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.

**Example**  
```js
undo: true
```

## Methods:

### clear

_undoRedo.clear()_

Clears undo history.



### destroy

_undoRedo.destroy()_

Destroys the instance.



### disable

_undoRedo.disable()_

Disables the plugin.



### done

_undoRedo.done(action)_


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action desciptor. |



### enable

_undoRedo.enable()_

Enables the plugin.



### isEnabled

_undoRedo.isEnabled() ⇒ boolean_

Checks if the plugin is enabled.



### isRedoAvailable

_undoRedo.isRedoAvailable() ⇒ boolean_

Checks if redo action is available.


**Returns**: boolean - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable

_undoRedo.isUndoAvailable() ⇒ boolean_

Checks if undo action is available.


**Returns**: boolean - Return `true` if undo can be performed, `false` otherwise.  

### redo

_undoRedo.redo()_

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: <code>Hooks#event:beforeRedo</code>, <code>Hooks#event:afterRedo</code>  


### undo

_undoRedo.undo()_

Undo the last action performed to the table.

**Emits**: <code>Hooks#event:beforeUndo</code>, <code>Hooks#event:afterUndo</code>  


