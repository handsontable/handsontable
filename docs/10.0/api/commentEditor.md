---
title: CommentEditor
metaTitle: CommentEditor - Plugin - Handsontable Documentation
permalink: /10.0/api/comment-editor
canonicalUrl: /api/comment-editor
hotPlugin: true
editLink: false
---

# CommentEditor

[[toc]]

## Description

Comment editor for the Comments plugin.


## Methods

### createEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L150

:::

_commentEditor.createEditor() ⇒ HTMLElement_

Create the `textarea` to be used as a comments editor.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L179

:::

_commentEditor.destroy()_

Destroy the comments editor.



### focus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L141

:::

_commentEditor.focus()_

Focus the comments input element.



### getInputElement
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L172

:::

_commentEditor.getInputElement() ⇒ HTMLElement_

Get the input element.



### getValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L125

:::

_commentEditor.getValue() ⇒ string_

Get the comment value.



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L95

:::

_commentEditor.hide()_

Hide the comments editor.



### isFocused
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L134

:::

_commentEditor.isFocused() ⇒ boolean_

Checks if the comment input element is focused.



### isVisible
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L105

:::

_commentEditor.isVisible() ⇒ boolean_

Checks if the editor is visible.



### resetSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L66

:::

_commentEditor.resetSize()_

Reset the editor size to its initial state.



### setPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L43

:::

_commentEditor.setPosition(x, y)_

Set position of the comments editor according to the  provided x and y coordinates.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | X position (in pixels). |
| y | `number` | Y position (in pixels). |



### setReadOnlyState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L78

:::

_commentEditor.setReadOnlyState(state)_

Set the read-only state for the comments editor.


| Param | Type | Description |
| --- | --- | --- |
| state | `boolean` | The new read only state. |



### setSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L54

:::

_commentEditor.setSize(width, height)_

Set the editor size according to the provided arguments.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | Width in pixels. |
| height | `number` | Height in pixels. |



### setValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L114

:::

_commentEditor.setValue([value])_

Set the comment value.


| Param | Type | Description |
| --- | --- | --- |
| [value] | `string` | `optional` The value to use. |



### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/commentEditor.js#L87

:::

_commentEditor.show()_

Show the comments editor.


