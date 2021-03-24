---
title: UndoRedo
permalink: /next/api/undo-redo
canonicalUrl: /api/undo-redo
editLink: false
---

# UndoRedo

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

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L257)

Clears undo history.



### destroy

_undoRedo.destroy()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L319)

Destroys the instance.



### disable

_undoRedo.disable()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L299)

Disables the plugin.



### done

_undoRedo.done(action)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L166)


| Param | Type | Description |
| --- | --- | --- |
| action | `object` | The action desciptor. |



### enable

_undoRedo.enable()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L279)

Enables the plugin.



### isEnabled

_undoRedo.isEnabled() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L268)

Checks if the plugin is enabled.



### isRedoAvailable

_undoRedo.isRedoAvailable() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L246)

Checks if redo action is available.


**Returns**: `boolean` - Return `true` if redo can be performed, `false` otherwise.  

### isUndoAvailable

_undoRedo.isUndoAvailable() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L235)

Checks if undo action is available.


**Returns**: `boolean` - Return `true` if undo can be performed, `false` otherwise.  

### redo

_undoRedo.redo()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L204)

Redo the previous action performed to the table (used to reverse an undo).

**Emits**: <code>Hooks#event:beforeRedo</code>, <code>Hooks#event:afterRedo</code>  


### undo

_undoRedo.undo()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/undoRedo/undoRedo.js#L173)

Undo the last action performed to the table.

**Emits**: <code>Hooks#event:beforeUndo</code>, <code>Hooks#event:afterUndo</code>  


