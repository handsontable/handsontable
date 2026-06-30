---
title: CommentEditor
metaTitle: CommentEditor API reference – JavaScript Data Grid | Handsontable
permalink: /api/comment-editor
canonicalUrl: /api/comment-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
id: r2v8z4mg
react:
  id: p6x3c7na
angular:
  id: k9b5t1od
---

[[toc]]

## Description

Comment editor for the Comments plugin.



## Description

Initializes the comment editor, builds its DOM structure, and attaches the resize observer.


## Members

### CLASS_CELL

::: ask-about-api CLASS_CELL|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L100

:::

_CommentEditor.CLASS\_CELL_

Returns the CSS class name applied to cells that have comments attached.



### CLASS_EDITOR

::: ask-about-api CLASS_EDITOR|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L90

:::

_CommentEditor.CLASS\_EDITOR_

Returns the CSS class name applied to the comment editor element.



### CLASS_EDITOR_CONTAINER

::: ask-about-api CLASS_EDITOR_CONTAINER|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L85

:::

_CommentEditor.CLASS\_EDITOR\_CONTAINER_

Returns the CSS class name applied to the outer comments container element.



### CLASS_INPUT

::: ask-about-api CLASS_INPUT|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L95

:::

_CommentEditor.CLASS\_INPUT_

Returns the CSS class name applied to the comment textarea input element.


## Methods

### createEditor

::: ask-about-api createEditor|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L213

:::

_commentEditor.createEditor() ⇒ HTMLElement_

Create the `textarea` to be used as a comments editor.



### destroy

::: ask-about-api destroy|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L244

:::

_commentEditor.destroy()_

Destroy the comments editor.



### focus

::: ask-about-api focus|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L206

:::

_commentEditor.focus()_

Focus the comments input element.



### getEditorElement

::: ask-about-api getEditorElement|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L239

:::

_commentEditor.getEditorElement() ⇒ HTMLElement_

Get the editor element.


**Returns**: `HTMLElement` - The editor element.  

### getInputElement

::: ask-about-api getInputElement|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L232

:::

_commentEditor.getInputElement() ⇒ HTMLTextAreaElement | null_

Get the input element.



### getSize

::: ask-about-api getSize|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L130

:::

_commentEditor.getSize() ⇒ Object_

Returns the size of the comments editor.



### getValue

::: ask-about-api getValue|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L194

:::

_commentEditor.getValue() ⇒ string_

Get the comment value.



### hide

::: ask-about-api hide|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L166

:::

_commentEditor.hide()_

Hide the comments editor.



### isFocused

::: ask-about-api isFocused|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L201

:::

_commentEditor.isFocused() ⇒ boolean_

Checks if the comment input element is focused.



### isVisible

::: ask-about-api isVisible|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L179

:::

_commentEditor.isVisible() ⇒ boolean_

Checks if the editor is visible.



### observeSize

::: ask-about-api observeSize|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L138

:::

_commentEditor.observeSize()_

Starts observing the editor size.



### resetSize

::: ask-about-api resetSize|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L143

:::

_commentEditor.resetSize()_

Reset the editor size to its initial state.



### setPosition

::: ask-about-api setPosition|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L108

:::

_commentEditor.setPosition(x, y)_

Set position of the comments editor according to the  provided x and y coordinates.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | X position (in pixels). |
| y | `number` | Y position (in pixels). |



### setReadOnlyState

::: ask-about-api setReadOnlyState|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L152

:::

_commentEditor.setReadOnlyState(state)_

Set the read-only state for the comments editor.


| Param | Type | Description |
| --- | --- | --- |
| state | `boolean` | The new read only state. |



### setSize

::: ask-about-api setSize|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L119

:::

_commentEditor.setSize(width, height)_

Set the editor size according to the provided arguments.


| Param | Type | Description |
| --- | --- | --- |
| width | `number` | Width in pixels. |
| height | `number` | Height in pixels. |



### setValue

::: ask-about-api setValue|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L186

:::

_commentEditor.setValue([value])_

Set the comment value.


| Param | Type | Description |
| --- | --- | --- |
| [value] | `string` | `optional` The value to use. |



### show

::: ask-about-api show|CommentEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/comments/commentEditor.ts#L158

:::

_commentEditor.show()_

Show the comments editor.


