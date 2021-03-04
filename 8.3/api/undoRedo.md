---
title: UndoRedo
permalink: /8.3/api/undo-redo
canonicalUrl: /api/undo-redo
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.

__Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.


**Example**  
```js
undo: true
```
## Functions:

### done
`undoRedo.done(action)`


| Param | Type | Description |
| --- | --- | --- |
| action | <code>object</code> | The action desciptor. |



### undo
`undoRedo.undo()`

Undo the last action performed to the table.

**Emits**: <code>Hooks#event:beforeUndo</code>, <code>Hooks#event:afterUndo</code>  


### redo
`undoRedo.redo()`

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: <code>Hooks#event:beforeRedo</code>, <code>Hooks#event:afterRedo</code>  


### isUndoAvailable
`undoRedo.isUndoAvailable() ⇒ boolean`

Checks if undo action is available.


**Returns**: <code>boolean</code> - Return `true` if undo can be performed, `false` otherwise.  

### isRedoAvailable
`undoRedo.isRedoAvailable() ⇒ boolean`

Checks if redo action is available.


**Returns**: <code>boolean</code> - Return `true` if redo can be performed, `false` otherwise.  

### clear
`undoRedo.clear()`

Clears undo history.



