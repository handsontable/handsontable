---
title: EditorManager
metaTitle: EditorManager - API Reference - Handsontable Documentation
permalink: /10.0/api/editor-manager
canonicalUrl: /api/editor-manager
hotPlugin: false
editLink: false
---

# EditorManager

[[toc]]

## Members

### cellProperties
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L70

:::

_editorManager.cellProperties : object_

Keeps a reference to the cell's properties object.



### lastKeyCode
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L76

:::

_editorManager.lastKeyCode : number_

Keeps last keyCode pressed from the keydown event.


## Methods

### closeEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L234

:::

_editorManager.closeEditor(restoreOriginalValue, isCtrlPressed, callback)_

Close editor, finish editing cell.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If `true`, then closes editor without saving value from the editor into a cell. |
| isCtrlPressed | `boolean` | If `true`, then editor will save value to each cell in the last selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### closeEditorAndRestoreOriginalValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L257

:::

_editorManager.closeEditorAndRestoreOriginalValue(isCtrlPressed)_

Close editor and restore original value.


| Param | Type | Description |
| --- | --- | --- |
| isCtrlPressed | `boolean` | Indication of whether the CTRL button is pressed. |



### closeEditorAndSaveChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L248

:::

_editorManager.closeEditorAndSaveChanges(isCtrlPressed)_

Close editor and save changes.


| Param | Type | Description |
| --- | --- | --- |
| isCtrlPressed | `boolean` | If `true`, then editor will save value to each cell in the last selected range. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L581

:::

_editorManager.destroy()_

Destroy the instance.



### destroyEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L124

:::

_editorManager.destroyEditor(revertOriginal)_

Destroy current editor, if exists.


| Param | Type | Description |
| --- | --- | --- |
| revertOriginal | `boolean` | If `false` and the cell using allowInvalid option,                                 then an editor won't be closed until validation is passed. |



### getActiveEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L135

:::

_editorManager.getActiveEditor() ⇒ \*_

Get active editor.



### getInstance
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L595

:::

_EditorManager.getInstance(hotInstance, tableMeta, selection) ⇒ [EditorManager](@/api/editorManager.md)_


| Param | Type | Description |
| --- | --- | --- |
| hotInstance | `Core` | The Handsontable instance. |
| tableMeta | `TableMeta` | The table meta class instance. |
| selection | `Selection` | The selection instance. |



### isEditorOpened
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L209

:::

_editorManager.isEditorOpened() ⇒ boolean_

Check is editor is opened/showed.



### lockEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L106

:::

_editorManager.lockEditor()_

Lock the editor from being prepared and closed. Locking the editor prevents its closing and
reinitialized after selecting the new cell. This feature is necessary for a mobile editor.



### openEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L219

:::

_editorManager.openEditor(newInitialValue, event)_

Open editor with initial value.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `null` <br/> `string` | New value from which editor will start if handled property it's not the `null`. |
| event | `Event` | The event object. |



### prepareEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L142

:::

_editorManager.prepareEditor()_

Prepare text input to be displayed at given grid cell.



### unlockEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/editorManager.js#L114

:::

_editorManager.unlockEditor()_

Unlock the editor from being prepared and closed. This method restores the original behavior of
the editors where for every new selection its instances are closed.


