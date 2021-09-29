---
title: Comments
metaTitle: Comments - Plugin - Handsontable Documentation
permalink: /10.0/api/comments
canonicalUrl: /api/comments
hotPlugin: true
editLink: false
---

# Comments

[[toc]]

## Description

This plugin allows setting and managing cell comments by either an option in the context menu or with the use of
the API.

To enable the plugin, you'll need to set the comments property of the config object to `true`:
```js
comments: true
```

or an object with extra predefined plugin config:

```js
comments: {
  displayDelay: 1000,
  readOnly: true,
  style: {
    width: 300,
    height: 100
  }
}
```

To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.

**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  comments: true,
  cell: [
    {row: 1, col: 1, comment: {value: 'Foo'}},
    {row: 2, col: 2, comment: {value: 'Bar'}}
  ]
});

// Access to the Comments plugin instance:
const commentsPlugin = hot.getPlugin('comments');

// Manage comments programmatically:
commentsPlugin.setCommentAtCell(1, 6, 'Comment contents');
commentsPlugin.showAtCell(1, 6);
commentsPlugin.removeCommentAtCell(1, 6);

// You can also set range once and use proper methods:
commentsPlugin.setRange({from: {row: 1, col: 6}});
commentsPlugin.setComment('Comment contents');
commentsPlugin.show();
commentsPlugin.removeComment();
```

## Options

### comments
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L500

:::

_comments.comments : boolean | Array&lt;object&gt;_

If `true`, enables the [Comments](#comments) plugin, which enables an option to apply cell comments through the context menu
(configurable with context menu keys `commentsAddEdit`, `commentsRemove`).

To initialize Handsontable with predefined comments, provide cell coordinates and comment text values in a form of
an array.

See [Comments](@/guides/cell-features/comments.md) demo for examples.

**Default**: <code>false</code>  
**Example**  
```js
// enable comments plugin
comments: true,

// or an object with extra predefined plugin config:

comments: {
  displayDelay: 1000
}

// or
// enable comments plugin and add predefined comments
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  comments: true,
  cell: [
    { row: 1, col: 1, comment: { value: 'Foo' } },
    { row: 2, col: 2, comment: { value: 'Bar' } }
  ]
});
```

## Members

### range
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L123

:::

_comments.range : object_

Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).


## Methods

### clearRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L239

:::

_comments.clearRange()_

Clears the currently selected cell.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L859

:::

_comments.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L205

:::

_comments.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L159

:::

_comments.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L344

:::

_comments.getComment() ⇒ string | undefined_

Gets comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L358

:::

_comments.getCommentAtCell(row, column) ⇒ string | undefined_

Gets comment from a cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L542

:::

_comments.getCommentMeta(row, column, property) ⇒ Mixed_

Gets the comment related meta information.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| property | `string` | Cell meta property. |



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L409

:::

_comments.hide()_

Hides the comment editor.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L152

:::

_comments.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Comments#enablePlugin](@/api/comments.md#enableplugin) method is called.



### refreshEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L420

:::

_comments.refreshEditor([force])_

Refreshes comment editor position and styling.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` If `true` then recalculation will be forced. |



### removeComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L311

:::

_comments.removeComment([forceRender])_

Removes a comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceRender] | `boolean` | <code>true</code> | `optional` If set to `true`, the table will be re-rendered at the end of the operation. |



### removeCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L332

:::

_comments.removeCommentAtCell(row, column, [forceRender])_

Removes a comment from a specified cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [forceRender] | `boolean` | <code>true</code> | `optional` If `true`, the table will be re-rendered at the end of the operation. |



### setComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L272

:::

_comments.setComment(value)_

Sets a comment for a cell according to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | Comment contents. |



### setCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L299

:::

_comments.setCommentAtCell(row, column, value)_

Sets a comment for a specified cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| value | `string` | Comment contents. |



### setRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L232

:::

_comments.setRange(range)_

Sets the current cell range to be able to use general methods like [Comments#setComment](@/api/comments.md#setcomment), [Comments#removeComment](@/api/comments.md#removecomment), [Comments#show](@/api/comments.md#show).


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Object with `from` property, each with `row` and `col` properties. |



### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L367

:::

_comments.show() ⇒ boolean_

Shows the comment editor accordingly to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### showAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L398

:::

_comments.showAtCell(row, column) ⇒ boolean_

Shows comment editor according to cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### updateCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L520

:::

_comments.updateCommentMeta(row, column, metaObject)_

Sets or update the comment-related cell meta.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| metaObject | `object` | Object defining all the comment-related meta information. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/comments/comments.js#L194

:::

_comments.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.


